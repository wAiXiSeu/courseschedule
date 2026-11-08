/**
 * MCP 工具的业务逻辑层
 *
 * 全部打分/排课/统计口径复用 shared 纯函数，与 web 端保持一致：
 * - 补卡与正常打卡同分，但不计入连续天数与里程碑（collectGenuineDates）
 * - 派生积分不落库，撤销打卡即自动回冲（buildPointLedger）
 * - 复习任务打卡联动完成本轮并惰性生成下一轮（同 CheckinPage + useReviewStore）
 */

import {
  COLLECTIONS,
  COURSE_TYPE_LABELS,
  POINT_ENTRY_KIND_LABELS,
  addDays,
  buildPointLedger,
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateTotalCheckinDays,
  computeBalance,
  createNextReviewTask,
  expandForDate,
  expandRulesToOccurrences,
  genId,
  getTodayISODate,
  getWeekday,
  getWeekdayLabel,
  isPlanTaskDueOn,
  isReviewDue,
  nextMilestone,
  parseISODate,
  pointsForCheckin,
  taskExistedOn,
  toISODate,
  type CheckInRecord,
  type CheckinRefType,
  type Course,
  type CourseCancellation,
  type ISODate,
  type Mistake,
  type PlanTask,
  type PointAdjustment,
  type Redemption,
  type ReviewItem,
  type ReviewTask,
  type Reward,
  type ScheduleRule,
  type Subject,
} from '@courseschedule/shared';
import type { FamilyDb, FamilyRef } from './db';

/** 与 web 端 MakeupCheckinDialog 相同的补卡窗口（不含今天） */
const MAKEUP_WINDOW_DAYS = 7;

const CANCELLATIONS_TABLE = 'courseCancellations';

export interface DomainCtx {
  db: FamilyDb;
  family: FamilyRef;
  userId: string;
  defaultChildId: string;
}

function childOf(ctx: DomainCtx, childId?: string): string {
  return childId?.trim() || ctx.defaultChildId;
}

function assertISODate(value: string): ISODate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`日期格式应为 YYYY-MM-DD：${value}`);
  }
  const parsed = parseISODate(value);
  if (Number.isNaN(parsed.getTime()) || toISODate(parsed) !== value) {
    throw new Error(`无效日期：${value}`);
  }
  return value;
}

/* ─── 积分账本（与 usePointsStore.load 相同的输入与算法） ─── */

async function loadPoints(ctx: DomainCtx, childId: string) {
  const [records, planTasks, reviewTasks, reviewItems, mistakes, adjustments, redemptions] =
    await Promise.all([
      ctx.db.list<CheckInRecord>(COLLECTIONS.CHECKIN_RECORDS, childId),
      ctx.db.list<PlanTask>(COLLECTIONS.PLAN_TASKS, childId),
      ctx.db.list<ReviewTask>(COLLECTIONS.REVIEW_TASKS, childId),
      ctx.db.list<ReviewItem>(COLLECTIONS.REVIEW_ITEMS, childId),
      ctx.db.list<Mistake>(COLLECTIONS.MISTAKES, childId),
      ctx.db.list<PointAdjustment>(COLLECTIONS.POINT_ADJUSTMENTS, childId),
      ctx.db.list<Redemption>(COLLECTIONS.REDEMPTIONS, childId),
    ]);

  const today = getTodayISODate();
  const ledger = buildPointLedger({
    today,
    records,
    planTasks,
    reviewTasks,
    reviewItemTitles: Object.fromEntries(reviewItems.map((i) => [i.id, i.title])),
    mistakes,
    adjustments,
    redemptions,
  });

  return {
    ledger,
    balance: computeBalance(ledger),
    records,
    redemptions,
    currentStreak: calculateCurrentStreak(records, today),
    longestStreak: calculateLongestStreak(records),
    totalCheckinDays: calculateTotalCheckinDays(records),
  };
}

/* ─── 家庭与课程 ─── */

export async function familyInfo(ctx: DomainCtx) {
  const [courses, planTasks, records] = await Promise.all([
    ctx.db.list<Course>(COLLECTIONS.COURSES),
    ctx.db.list<PlanTask>(COLLECTIONS.PLAN_TASKS),
    ctx.db.list<CheckInRecord>(COLLECTIONS.CHECKIN_RECORDS),
  ]);
  const childIds = Array.from(
    new Set([ctx.defaultChildId, ...courses.map((c) => c.childId), ...planTasks.map((t) => t.childId), ...records.map((r) => r.childId)])
  ).sort();
  return { family: ctx.family, defaultChildId: ctx.defaultChildId, childIds, today: getTodayISODate() };
}

export async function listCourses(ctx: DomainCtx, args: { childId?: string }) {
  const childId = childOf(ctx, args.childId);
  const [courses, rules, subjects] = await Promise.all([
    ctx.db.list<Course>(COLLECTIONS.COURSES, childId),
    ctx.db.list<ScheduleRule>(COLLECTIONS.SCHEDULE_RULES, childId),
    ctx.db.list<Subject>('subjects'),
  ]);
  const subjectName = new Map(subjects.map((s) => [s.id, s.name]));
  const weekdayOrder = (w: number) => (w === 0 ? 7 : w);

  return {
    childId,
    count: courses.length,
    courses: courses.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      typeLabel: COURSE_TYPE_LABELS[c.type],
      subject: subjectName.get(c.color) ?? c.color,
      location: c.location ?? null,
      note: c.note ?? null,
      rules: rules
        .filter((r) => r.courseId === c.id)
        .sort((a, b) => weekdayOrder(a.weekday) - weekdayOrder(b.weekday) || (a.startTime < b.startTime ? -1 : 1))
        .map((r) => ({
          id: r.id,
          weekday: r.weekday,
          weekdayLabel: getWeekdayLabel(r.weekday),
          startTime: r.startTime,
          endTime: r.endTime,
          effectiveFrom: r.effectiveFrom,
          effectiveUntil: r.effectiveUntil ?? null,
          isActive: r.isActive,
          location: r.location ?? null,
        })),
    })),
  };
}

export async function getSchedule(
  ctx: DomainCtx,
  args: { date?: string; startDate?: string; endDate?: string; childId?: string }
) {
  const childId = childOf(ctx, args.childId);
  const today = getTodayISODate();
  let start: ISODate;
  let end: ISODate;
  if (args.date) {
    start = end = assertISODate(args.date);
  } else if (args.startDate || args.endDate) {
    if (!args.startDate || !args.endDate) throw new Error('startDate 与 endDate 需同时提供');
    start = assertISODate(args.startDate);
    end = assertISODate(args.endDate);
    if (start > end) throw new Error('startDate 不能晚于 endDate');
    if (addDays(start, 30) < end) throw new Error('查询区间最长 31 天');
  } else {
    start = end = today;
  }

  const [courses, rules, cancellations, records] = await Promise.all([
    ctx.db.list<Course>(COLLECTIONS.COURSES, childId),
    ctx.db.list<ScheduleRule>(COLLECTIONS.SCHEDULE_RULES, childId),
    ctx.db.list<CourseCancellation>(CANCELLATIONS_TABLE, childId),
    ctx.db.list<CheckInRecord>(COLLECTIONS.CHECKIN_RECORDS, childId),
  ]);

  const cancelledBy = new Map(
    cancellations.filter((c) => c.date >= start && c.date <= end).map((c) => [`${c.ruleId}|${c.date}`, c.reason])
  );
  const attended = new Set(
    records
      .filter((r) => r.refType === 'course_rule' && r.date >= start && r.date <= end)
      .map((r) => `${r.refId}|${r.date}`)
  );

  const occurrences = expandRulesToOccurrences(rules, courses, { start, end });
  return {
    childId,
    start,
    end,
    today,
    count: occurrences.length,
    occurrences: occurrences.map((o) => {
      const key = `${o.ruleId}|${o.date}`;
      return {
        date: o.date,
        weekdayLabel: getWeekdayLabel(getWeekday(o.date)),
        ruleId: o.ruleId,
        courseId: o.courseId,
        courseName: o.courseName,
        courseType: o.courseType,
        courseTypeLabel: COURSE_TYPE_LABELS[o.courseType],
        startTime: o.startTime,
        endTime: o.endTime,
        location: o.location ?? null,
        cancelled: cancelledBy.has(key),
        cancelReason: cancelledBy.get(key) ?? null,
        attended: attended.has(key),
        checkinEnabled: o.courseType !== 'school',
      };
    }),
  };
}

/* ─── 打卡 ─── */

export async function getCheckinTasks(ctx: DomainCtx, args: { date?: string; childId?: string }) {
  const childId = childOf(ctx, args.childId);
  const today = getTodayISODate();
  const date = args.date ? assertISODate(args.date) : today;

  const [planTasks, reviewTasks, reviewItems, courses, rules, cancellations, records] =
    await Promise.all([
      ctx.db.list<PlanTask>(COLLECTIONS.PLAN_TASKS, childId),
      ctx.db.list<ReviewTask>(COLLECTIONS.REVIEW_TASKS, childId),
      ctx.db.list<ReviewItem>(COLLECTIONS.REVIEW_ITEMS, childId),
      ctx.db.list<Course>(COLLECTIONS.COURSES, childId),
      ctx.db.list<ScheduleRule>(COLLECTIONS.SCHEDULE_RULES, childId),
      ctx.db.list<CourseCancellation>(CANCELLATIONS_TABLE, childId),
      ctx.db.list<CheckInRecord>(COLLECTIONS.CHECKIN_RECORDS, childId),
    ]);

  const doneKeys = new Set(
    records.filter((r) => r.date === date).map((r) => `${r.refType}:${r.refId}`)
  );
  const itemTitle = new Map(reviewItems.map((i) => [i.id, i.title]));

  const tasks = [
    ...planTasks
      .filter((t) => isPlanTaskDueOn(t, date) && taskExistedOn(t.createdAt, date))
      .map((t) => ({
        key: `plan_task:${t.id}`,
        refType: 'plan_task' as const,
        refId: t.id,
        title: t.title,
        sourceLabel: '学习计划',
        done: doneKeys.has(`plan_task:${t.id}`),
        points: pointsForCheckin('plan_task'),
      })),
    ...reviewTasks
      .filter((t) => t.status === 'pending' && isReviewDue(t, date) && taskExistedOn(t.createdAt, date))
      .map((t) => ({
        key: `review_task:${t.id}`,
        refType: 'review_task' as const,
        refId: t.id,
        title: itemTitle.has(t.reviewItemId)
          ? `${itemTitle.get(t.reviewItemId)} 第${t.intervalIndex + 1}轮`
          : `复习任务 第${t.intervalIndex + 1}轮`,
        sourceLabel: '复习计划',
        dueDate: t.dueDate,
        done: doneKeys.has(`review_task:${t.id}`),
        points: pointsForCheckin('review_task'),
      })),
  ];

  const cancelledBy = new Map(
    cancellations.filter((c) => c.date === date).map((c) => [c.ruleId, c.reason])
  );
  const attendance = expandForDate(rules, courses, date)
    .filter((o) => o.courseType !== 'school')
    .map((o) => ({
      key: `course_rule:${o.ruleId}`,
      refType: 'course_rule' as const,
      refId: o.ruleId,
      courseName: o.courseName,
      courseType: o.courseType,
      courseTypeLabel: COURSE_TYPE_LABELS[o.courseType],
      startTime: o.startTime,
      endTime: o.endTime,
      cancelled: cancelledBy.has(o.ruleId),
      cancelReason: cancelledBy.get(o.ruleId) ?? null,
      done: doneKeys.has(`course_rule:${o.ruleId}`),
      points: pointsForCheckin('course_rule'),
    }));

  const makeupWindowStart = addDays(today, -MAKEUP_WINDOW_DAYS);
  return {
    childId,
    date,
    today,
    isToday: date === today,
    makeup: date < today ? { allowed: date >= makeupWindowStart, windowStart: makeupWindowStart } : null,
    tasks,
    attendance,
    taskCompletion: { done: tasks.filter((t) => t.done).length, total: tasks.length },
    attendanceCompletion: {
      done: attendance.filter((a) => a.done && !a.cancelled).length,
      total: attendance.filter((a) => !a.cancelled).length,
    },
  };
}

async function validateCheckinTarget(
  ctx: DomainCtx,
  childId: string,
  refType: CheckinRefType,
  refId: string,
  date: ISODate
): Promise<void> {
  if (refType === 'course_rule') {
    const [rules, courses, cancellations] = await Promise.all([
      ctx.db.list<ScheduleRule>(COLLECTIONS.SCHEDULE_RULES, childId),
      ctx.db.list<Course>(COLLECTIONS.COURSES, childId),
      ctx.db.list<CourseCancellation>(CANCELLATIONS_TABLE, childId),
    ]);
    const rule = rules.find((r) => r.id === refId);
    if (!rule) throw new Error(`排课规则不存在：${refId}`);
    const course = courses.find((c) => c.id === rule.courseId);
    if (!course) throw new Error('排课规则关联的课程不存在');
    if (course.type === 'school') throw new Error('校内课程不参与打卡与积分');
    if (expandForDate([rule], [course], date).length === 0) {
      throw new Error(`「${course.name}」在 ${date} 没有排课（可能未到生效期、已暂停或星期不符）`);
    }
    const cancelled = cancellations.find((c) => c.ruleId === refId && c.date === date);
    if (cancelled) throw new Error(`该课当天已被取消：${cancelled.reason}`);
    return;
  }

  if (refType === 'plan_task') {
    const tasks = await ctx.db.list<PlanTask>(COLLECTIONS.PLAN_TASKS, childId);
    const task = tasks.find((t) => t.id === refId);
    if (!task) throw new Error(`计划任务不存在：${refId}`);
    if (!task.isActive) throw new Error('该任务已停用');
    if (!taskExistedOn(task.createdAt, date)) throw new Error('该任务在当天尚未创建');
    if (!isPlanTaskDueOn(task, date)) throw new Error(`「${task.title}」在 ${date} 不需要完成`);
    return;
  }

  const tasks = await ctx.db.list<ReviewTask>(COLLECTIONS.REVIEW_TASKS, childId);
  const task = tasks.find((t) => t.id === refId);
  if (!task) throw new Error(`复习任务不存在：${refId}`);
  if (task.status !== 'pending') throw new Error('该复习任务已完成或已跳过');
  if (!isReviewDue(task, date)) throw new Error(`该复习任务尚未到期（到期日 ${task.dueDate}）`);
}

/** 与 web 端 useReviewStore.completeTask 相同：完成本轮 + 惰性生成下一轮 */
async function completeReviewTask(ctx: DomainCtx, childId: string, taskId: string, now: number) {
  const tasks = await ctx.db.list<ReviewTask>(COLLECTIONS.REVIEW_TASKS, childId);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  const updated = await ctx.db.update<ReviewTask>(COLLECTIONS.REVIEW_TASKS, taskId, {
    status: 'done',
    doneAt: now,
    updatedAt: now,
  });
  const items = await ctx.db.list<ReviewItem>(COLLECTIONS.REVIEW_ITEMS, childId);
  const item = items.find((i) => i.id === updated.reviewItemId);
  if (!item) return;
  const next = createNextReviewTask(item, updated);
  if (next) await ctx.db.insert(COLLECTIONS.REVIEW_TASKS, { ...next });
}

export async function checkIn(
  ctx: DomainCtx,
  args: { refType: CheckinRefType; refId: string; date?: string; childId?: string }
) {
  const childId = childOf(ctx, args.childId);
  const today = getTodayISODate();
  const date = args.date ? assertISODate(args.date) : today;
  if (date > today) throw new Error('不能给未来日期打卡');
  const isMakeup = date < today;
  const windowStart = addDays(today, -MAKEUP_WINDOW_DAYS);
  if (isMakeup && date < windowStart) {
    throw new Error(`补卡仅支持最近 ${MAKEUP_WINDOW_DAYS} 天（${windowStart} 起）`);
  }

  const records = await ctx.db.list<CheckInRecord>(COLLECTIONS.CHECKIN_RECORDS, childId);
  const existing = records.find(
    (r) => r.refType === args.refType && r.refId === args.refId && r.date === date
  );
  if (existing) {
    return {
      ok: true,
      already: true,
      pointsEarned: 0,
      isMakeup: existing.isMakeup,
      record: existing,
      message: '该事项当天已有打卡记录，无需重复打卡',
    };
  }

  await validateCheckinTarget(ctx, childId, args.refType, args.refId, date);

  const now = Date.now();
  const record: CheckInRecord = {
    id: genId(),
    childId,
    createdAt: now,
    updatedAt: now,
    refType: args.refType,
    refId: args.refId,
    date,
    doneAt: now,
    isMakeup,
  };
  const saved = await ctx.db.insert<CheckInRecord>(COLLECTIONS.CHECKIN_RECORDS, { ...record });

  if (args.refType === 'review_task') {
    await completeReviewTask(ctx, childId, args.refId, now);
  }

  const pointsEarned = pointsForCheckin(args.refType);
  const { balance } = await loadPoints(ctx, childId);
  return {
    ok: true,
    already: false,
    record: saved,
    pointsEarned,
    isMakeup,
    balance: balance.balance,
    message: isMakeup
      ? `补卡成功 +${pointsEarned} 分（补卡不计入连续天数与里程碑）`
      : `打卡成功 +${pointsEarned} 分`,
  };
}

export async function undoCheckin(
  ctx: DomainCtx,
  args: { refType: CheckinRefType; refId: string; date?: string; childId?: string }
) {
  const childId = childOf(ctx, args.childId);
  const date = args.date ? assertISODate(args.date) : getTodayISODate();
  const records = await ctx.db.list<CheckInRecord>(COLLECTIONS.CHECKIN_RECORDS, childId);
  const record = records.find(
    (r) => r.refType === args.refType && r.refId === args.refId && r.date === date
  );
  if (!record) {
    return { ok: true, removed: false, pointsReverted: 0, message: '当天没有该事项的打卡记录' };
  }
  await ctx.db.remove(COLLECTIONS.CHECKIN_RECORDS, record.id);
  const pointsReverted = pointsForCheckin(record.refType);
  const { balance } = await loadPoints(ctx, childId);
  return {
    ok: true,
    removed: true,
    pointsReverted,
    balance: balance.balance,
    message:
      `已撤销，退回 ${pointsReverted} 分` +
      (record.refType === 'review_task' ? '（复习任务完成状态不回退，与 web 端一致）' : ''),
  };
}

/* ─── 积分 ─── */

export async function getPoints(ctx: DomainCtx, args: { childId?: string }) {
  const childId = childOf(ctx, args.childId);
  const p = await loadPoints(ctx, childId);
  return {
    childId,
    today: getTodayISODate(),
    balance: p.balance,
    currentStreak: p.currentStreak,
    longestStreak: p.longestStreak,
    totalCheckinDays: p.totalCheckinDays,
    nextMilestone: nextMilestone(p.longestStreak),
    pendingRedemptions: p.redemptions.filter((r) => r.status === 'pending').length,
  };
}

export async function getPointsLedger(ctx: DomainCtx, args: { limit?: number; childId?: string }) {
  const childId = childOf(ctx, args.childId);
  const limit = args.limit ?? 20;
  const p = await loadPoints(ctx, childId);
  return {
    childId,
    total: p.ledger.length,
    showing: Math.min(limit, p.ledger.length),
    entries: p.ledger.slice(0, limit).map((e) => ({
      date: e.date,
      kind: e.kind,
      kindLabel: POINT_ENTRY_KIND_LABELS[e.kind],
      points: e.points,
      title: e.title,
      note: e.note ?? null,
    })),
  };
}

export async function adjustPoints(
  ctx: DomainCtx,
  args: { points: number; reason: string; date?: string; childId?: string }
) {
  const childId = childOf(ctx, args.childId);
  if (!Number.isInteger(args.points) || args.points === 0) {
    throw new Error('points 必须是非零整数（正数奖励、负数扣分）');
  }
  const reason = args.reason?.trim();
  if (!reason) throw new Error('reason 必填，会作为流水展示给孩子看');
  const date = args.date ? assertISODate(args.date) : getTodayISODate();

  const now = Date.now();
  const saved = await ctx.db.insert<PointAdjustment>(COLLECTIONS.POINT_ADJUSTMENTS, {
    id: genId(),
    childId,
    createdAt: now,
    updatedAt: now,
    date,
    points: args.points,
    reason,
  });
  const { balance } = await loadPoints(ctx, childId);
  return {
    ok: true,
    adjustment: saved,
    balance: balance.balance,
    message: `已${args.points > 0 ? '奖励' : '扣除'} ${Math.abs(args.points)} 分`,
  };
}

/* ─── 奖励兑换 ─── */

export async function listRewards(
  ctx: DomainCtx,
  args: { includeInactive?: boolean; childId?: string }
) {
  const childId = childOf(ctx, args.childId);
  const [rewards, p] = await Promise.all([
    ctx.db.list<Reward>(COLLECTIONS.REWARDS, childId),
    loadPoints(ctx, childId),
  ]);
  const pendingByReward = new Map(
    p.redemptions.filter((r) => r.status === 'pending').map((r) => [r.rewardId, r.id])
  );
  return {
    childId,
    balance: p.balance.balance,
    rewards: rewards
      .filter((r) => args.includeInactive || r.isActive)
      .sort((a, b) => a.cost - b.cost)
      .map((r) => ({
        id: r.id,
        title: r.title,
        emoji: r.emoji,
        description: r.description ?? null,
        cost: r.cost,
        isActive: r.isActive,
        affordable: p.balance.balance >= r.cost,
        pendingRedemptionId: pendingByReward.get(r.id) ?? null,
      })),
  };
}

export async function redeemReward(ctx: DomainCtx, args: { rewardId: string; childId?: string }) {
  const childId = childOf(ctx, args.childId);
  const rewards = await ctx.db.list<Reward>(COLLECTIONS.REWARDS, childId);
  const reward = rewards.find((r) => r.id === args.rewardId);
  if (!reward) throw new Error(`兑换品不存在：${args.rewardId}`);
  if (!reward.isActive) throw new Error('该兑换品已下架');

  const p = await loadPoints(ctx, childId);
  if (p.redemptions.some((r) => r.rewardId === reward.id && r.status === 'pending')) {
    throw new Error(`「${reward.title}」已经有一张待确认的兑换单了`);
  }
  if (p.balance.balance < reward.cost) {
    throw new Error(`积分不够，还差 ${reward.cost - Math.max(p.balance.balance, 0)} 分`);
  }

  const now = Date.now();
  const saved = await ctx.db.insert<Redemption>(COLLECTIONS.REDEMPTIONS, {
    id: genId(),
    childId,
    createdAt: now,
    updatedAt: now,
    rewardId: reward.id,
    rewardTitle: reward.title,
    rewardEmoji: reward.emoji,
    cost: reward.cost,
    status: 'pending',
    requestedBy: ctx.userId,
    requestedAt: now,
  });
  return { ok: true, message: '已提交，等家长确认', redemption: saved, balance: p.balance.balance };
}

export async function listRedemptions(
  ctx: DomainCtx,
  args: { status?: 'pending' | 'approved' | 'rejected'; childId?: string }
) {
  const childId = childOf(ctx, args.childId);
  const list = (await ctx.db.list<Redemption>(COLLECTIONS.REDEMPTIONS, childId))
    .filter((r) => !args.status || r.status === args.status)
    .sort((a, b) => b.requestedAt - a.requestedAt);
  return {
    childId,
    count: list.length,
    redemptions: list.map((r) => ({
      id: r.id,
      rewardId: r.rewardId,
      rewardTitle: r.rewardTitle,
      rewardEmoji: r.rewardEmoji,
      cost: r.cost,
      status: r.status,
      requestedAt: r.requestedAt,
      reviewedAt: r.reviewedAt ?? null,
    })),
  };
}

export async function reviewRedemption(
  ctx: DomainCtx,
  args: { id: string; action: 'approve' | 'reject'; childId?: string }
) {
  const childId = childOf(ctx, args.childId);
  const list = await ctx.db.list<Redemption>(COLLECTIONS.REDEMPTIONS, childId);
  const redemption = list.find((r) => r.id === args.id);
  if (!redemption) throw new Error(`兑换单不存在：${args.id}`);
  if (redemption.status !== 'pending') throw new Error('这张兑换单已经处理过了');

  const now = Date.now();
  if (args.action === 'approve') {
    const p = await loadPoints(ctx, childId);
    if (p.balance.balance < redemption.cost) {
      throw new Error(
        `积分只剩 ${p.balance.balance} 分，不够这张 ${redemption.cost} 分的兑换单，请拒绝或让孩子再攒攒`
      );
    }
    const saved = await ctx.db.update<Redemption>(COLLECTIONS.REDEMPTIONS, args.id, {
      status: 'approved',
      reviewedBy: ctx.userId,
      reviewedAt: now,
      updatedAt: now,
    });
    const after = await loadPoints(ctx, childId);
    return {
      ok: true,
      message: `已确认兑换「${redemption.rewardTitle}」，扣除 ${redemption.cost} 分`,
      redemption: saved,
      balance: after.balance.balance,
    };
  }

  const saved = await ctx.db.update<Redemption>(COLLECTIONS.REDEMPTIONS, args.id, {
    status: 'rejected',
    reviewedBy: ctx.userId,
    reviewedAt: now,
    updatedAt: now,
  });
  return { ok: true, message: `已拒绝「${redemption.rewardTitle}」的兑换申请`, redemption: saved };
}