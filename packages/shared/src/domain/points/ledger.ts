/**
 * 积分账本 —— 跨端共享纯函数
 *
 * 设计要点：积分分两类来源
 *
 * 1. **派生条目**（打卡 / 到课 / 错题 / 当日满额 / 连续里程碑）不落库，
 *    每次由 CheckInRecord、Mistake 等业务记录实时算出。
 *    这样「撤销打卡即回冲积分」零成本成立 —— 删掉来源记录，对应积分自己消失，
 *    也不给孩子留「反复勾/撤刷分」的空间。
 * 2. **落库条目**（家长手工加减 PointAdjustment、已通过兑换 Redemption）是真实发生的账。
 *
 * 余额 = 派生积分 + 手工积分 − 已通过兑换，**可以为负**（撤销回冲导致），
 * 负值在 UI 上表达为「透支」；余额不足时不允许下单兑换、家长也无法审批通过。
 */

import {
  type CheckInRecord,
  type CheckinRefType,
  type ISODate,
  type Mistake,
  type PlanTask,
  type PointAdjustment,
  type PointEntry,
  type Redemption,
  type ReviewTask,
  type Weekday,
} from '../models';
import { POINT_RULES, STREAK_MILESTONES } from '../../core/constants';
import { addDays, getWeekday, parseISODate, toISODate } from '../../core/utils/date';
import { calculateLongestStreak } from '../checkin/streak';

/** 当日满额与复习任务判定所需的输入 */
export interface PointLedgerParams {
  /** 今天（连续天数、未完成任务的归属判断锚点） */
  today: ISODate;
  /** 该孩子全部打卡记录（含课程到课） */
  records: CheckInRecord[];
  /** 该孩子全部计划任务 */
  planTasks: PlanTask[];
  /** 该孩子全部复习任务 */
  reviewTasks: ReviewTask[];
  /** reviewItemId → 复习项标题（仅供流水文案，缺失时回退「复习任务」） */
  reviewItemTitles?: Record<string, string>;
  /** 该孩子全部错题 */
  mistakes: Mistake[];
  /** 家长手工加减流水 */
  adjustments: PointAdjustment[];
  /** 兑换单（仅 approved 进账本） */
  redemptions: Redemption[];
}

/** 余额汇总 */
export interface PointBalance {
  /** 可为负：撤销打卡回冲后低于已花掉的部分 */
  balance: number;
  /** 累计获得（不含兑换与家长扣分） */
  earned: number;
  /** 已兑换花掉 */
  spent: number;
  /** 家长手工扣掉 */
  penalty: number;
}

/** 下一档里程碑进度 */
export interface MilestoneProgress {
  days: number;
  points: number;
  label: string;
  /** 距离达成还差几天 */
  remaining: number;
}

/**
 * 单次打卡的分值（补卡减半，向下取整）
 *
 * 也供打卡页即时反馈取数，保证弹给孩子的数字与流水一致。
 */
export function pointsForCheckin(refType: CheckinRefType, isMakeup: boolean): number {
  const base =
    refType === 'plan_task'
      ? POINT_RULES.planTask
      : refType === 'review_task'
        ? POINT_RULES.reviewTask
        : POINT_RULES.attendance;

  return isMakeup ? Math.floor(base * POINT_RULES.makeupMultiplier) : base;
}

/**
 * 计划任务在指定日期是否「应完成」
 *
 * 与打卡页今日任务列表用同一判定，避免出现两套口径。
 */
export function isPlanTaskDueOn(task: PlanTask, date: ISODate): boolean {
  if (!task.isActive) return false;
  switch (task.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return task.weekdays?.includes(getWeekday(date) as Weekday) ?? false;
    case 'once':
      return task.specificDate === date;
    default:
      return false;
  }
}

/** epoch ms → 归属日（本地日历日） */
function dateOf(epochMs: number): ISODate {
  return toISODate(new Date(epochMs));
}

/** 该任务在 date 当天是否已经存在（避免新建任务追溯性地改写历史） */
function existedOn(createdAt: number, date: ISODate): boolean {
  return createdAt < parseISODate(date).getTime() + 86_400_000;
}

/** 单次打卡 → 流水条目 */
function checkinEntry(record: CheckInRecord, titleOf: (r: CheckInRecord) => string): PointEntry {
  const kind = record.refType === 'course_rule' ? 'attendance' : 'checkin';
  return {
    id: `${kind === 'attendance' ? 'att' : 'chk'}:${record.id}`,
    kind,
    date: record.date,
    points: pointsForCheckin(record.refType, record.isMakeup),
    title: titleOf(record),
    note: record.isMakeup ? '补卡（分值减半）' : undefined,
    refId: record.id,
    sortAt: record.doneAt,
  };
}

/**
 * 派生打卡 / 到课流水
 *
 * 撤销打卡即删除 CheckInRecord，条目随之消失，积分自动回冲。
 */
export function deriveCheckinEntries(
  records: CheckInRecord[],
  titles: Record<string, string>
): PointEntry[] {
  return records.map((record) =>
    checkinEntry(record, (r) => titles[`${r.refType}:${r.refId}`] ?? defaultTitle(r.refType))
  );
}

/** 来源记录已被删除时的兜底文案（不打断算分） */
function defaultTitle(refType: CheckinRefType): string {
  if (refType === 'course_rule') return '课程到课';
  return refType === 'review_task' ? '复习任务' : '任务打卡';
}

/**
 * 派生「当日满额」流水
 *
 * 判定口径：**当天到期**的任务全部完成才给奖励。
 * 刻意不含历史逾期复习任务 —— 否则复习一旦积压，孩子再也拿不到满额奖，激励失效。
 * 逾期任务的基础分照常结算，不因口径收窄而少给。
 */
export function deriveDailyGoalEntries(params: PointLedgerParams): PointEntry[] {
  const { records, planTasks, reviewTasks, today } = params;

  // 只算真正有打卡的那些天，不必为整部日历空转
  const dates = Array.from(new Set(records.map((r) => r.date))).sort();
  const entries: PointEntry[] = [];

  for (const date of dates) {
    // 顶栏可切到未来日期打卡；未到的一天不参与满额判定，只结算基础分
    if (date > today) continue;

    const expectedPlan = planTasks.filter(
      (task) => isPlanTaskDueOn(task, date) && existedOn(task.createdAt, date)
    );
    const expectedReview = reviewTasks.filter(
      (task) =>
        task.dueDate === date &&
        task.status !== 'skipped' &&
        existedOn(task.createdAt, date)
    );

    const expected = expectedPlan.length + expectedReview.length;
    if (expected === 0) continue;

    const doneKeys = new Set(
      records.filter((r) => r.date === date).map((r) => `${r.refType}:${r.refId}`)
    );
    const doneCount =
      expectedPlan.filter((t) => doneKeys.has(`plan_task:${t.id}`)).length +
      expectedReview.filter((t) => doneKeys.has(`review_task:${t.id}`)).length;

    if (doneCount < expected) continue;

    const sortAt = parseISODate(date).getTime() + 86_400_000 - 1;
    entries.push({
      id: `goal:${date}`,
      kind: 'daily_goal',
      date,
      points: POINT_RULES.dailyGoalBonus,
      title: `当天 ${expected} 项任务全部完成`,
      sortAt,
    });
  }

  return entries;
}

/**
 * 派生「错题攻克」流水
 *
 * 错题没有独立的「掌握时刻」字段，取 updatedAt 近似 —— 只影响流水展示日期，
 * 不影响分值（分值按「当前是否 mastered」结算）。
 */
export function deriveMistakeEntries(mistakes: Mistake[]): PointEntry[] {
  return mistakes
    .filter((m) => m.masteryStatus === 'mastered')
    .map((m) => ({
      id: `mst:${m.id}`,
      kind: 'mistake' as const,
      date: dateOf(m.updatedAt),
      points: POINT_RULES.mistakeMastered,
      title: `攻克错题：${shorten(m.questionText)}`,
      refId: m.id,
      sortAt: m.updatedAt,
    }));
}

/** 派生「连续里程碑」流水：按最长连续纪录，每档只发一次 */
export function deriveMilestoneEntries(records: CheckInRecord[]): PointEntry[] {
  const longest = calculateLongestStreak(records);
  if (longest === 0) return [];

  const runStart = findLongestRunStart(records);
  if (!runStart) return [];

  return STREAK_MILESTONES.filter((m) => m.days <= longest).map((m) => {
    // 达成日 = 最长连续段的第 days 天
    const achievedOn = addDays(runStart, m.days - 1);
    return {
      id: `ms:${m.days}`,
      kind: 'milestone' as const,
      date: achievedOn,
      points: m.points,
      title: `连续打卡 ${m.days} 天 · ${m.label}`,
      sortAt: parseISODate(achievedOn).getTime() + 43_200_000,
    };
  });
}

/** 最长连续段的起始日 */
function findLongestRunStart(records: CheckInRecord[]): ISODate | null {
  const dates = Array.from(new Set(records.map((r) => r.date))).sort();
  if (dates.length === 0) return null;

  let bestRunStart = dates[0];
  let bestLen = 1;
  let runStart = dates[0];
  let runLen = 1;

  for (let i = 1; i < dates.length; i++) {
    if (addDays(dates[i - 1], 1) === dates[i]) {
      runLen++;
    } else {
      runStart = dates[i];
      runLen = 1;
    }
    if (runLen > bestLen) {
      bestLen = runLen;
      bestRunStart = runStart;
    }
  }
  return bestRunStart;
}

/** 家长手工加减 → 流水条目 */
export function deriveAdjustmentEntries(adjustments: PointAdjustment[]): PointEntry[] {
  return adjustments.map((a) => ({
    id: `adj:${a.id}`,
    kind: 'manual' as const,
    date: a.date,
    points: a.points,
    title: a.points >= 0 ? '家长奖励' : '家长扣分',
    note: a.reason,
    refId: a.id,
    sortAt: a.createdAt,
  }));
}

/** 已确认兑换 → 流水条目（pending / rejected 不进账本） */
export function deriveRedemptionEntries(redemptions: Redemption[]): PointEntry[] {
  return redemptions
    .filter((r) => r.status === 'approved')
    .map((r) => {
      const at = r.reviewedAt ?? r.requestedAt;
      return {
        id: `rdm:${r.id}`,
        kind: 'redemption' as const,
        date: dateOf(at),
        points: -r.cost,
        title: `兑换 ${r.rewardEmoji} ${r.rewardTitle}`,
        refId: r.id,
        sortAt: at,
      };
    });
}

/**
 * 汇总完整流水
 *
 * 收入在前按日倒序展示，同日按发生时刻倒序。
 */
export function buildPointLedger(params: PointLedgerParams): PointEntry[] {
  const titles = buildTitleIndex(params);

  const entries = [
    ...deriveCheckinEntries(params.records, titles),
    ...deriveDailyGoalEntries(params),
    ...deriveMistakeEntries(params.mistakes),
    ...deriveMilestoneEntries(params.records),
    ...deriveAdjustmentEntries(params.adjustments),
    ...deriveRedemptionEntries(params.redemptions),
  ];

  return entries.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.sortAt - a.sortAt;
  });
}

/** `${refType}:${refId}` → 展示标题，供打卡条目取文案 */
function buildTitleIndex(params: PointLedgerParams): Record<string, string> {
  const titles: Record<string, string> = {};
  for (const task of params.planTasks) {
    titles[`plan_task:${task.id}`] = task.title;
  }
  for (const task of params.reviewTasks) {
    const itemTitle = params.reviewItemTitles?.[task.reviewItemId];
    titles[`review_task:${task.id}`] = itemTitle
      ? `复习 ${itemTitle} 第 ${task.intervalIndex + 1} 轮`
      : `复习任务 第 ${task.intervalIndex + 1} 轮`;
  }
  return titles;
}

/** 结算余额（负值即「透支」） */
export function computeBalance(entries: PointEntry[]): PointBalance {
  let earned = 0;
  let spent = 0;
  let penalty = 0;

  for (const entry of entries) {
    if (entry.points >= 0) earned += entry.points;
    else if (entry.kind === 'redemption') spent += -entry.points;
    else penalty += -entry.points;
  }

  return { balance: earned - spent - penalty, earned, spent, penalty };
}

/** 下一档里程碑（已达成全部档位时返回 null） */
export function nextMilestone(longestStreak: number): MilestoneProgress | null {
  const next = STREAK_MILESTONES.find((m) => m.days > longestStreak);
  if (!next) return null;
  return { ...next, remaining: next.days - longestStreak };
}

/** 文案截断（错题题干可能很长） */
function shorten(text: string, max = 18): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}
