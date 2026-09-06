/**
 * 打卡统计工具 —— 跨端共享纯函数
 *
 * 提供累计打卡天数、当前 / 最长连续天数、本周打卡格子、今日完成率。
 * 「连续打卡天数」曾按 D5 决策移除，积分系统需要里程碑奖励，已恢复。
 */

import type { ISODate, CheckInRecord, TaskView } from '../models';

/**
 * 计算累计打卡天数
 *
 * 统计所有打卡记录中有多少个不同的日期（去重后计数）。
 * 注意：同一天多条打卡记录只算 1 天。
 *
 * @param records 打卡记录列表
 * @returns 累计打卡天数（新需求，替代连续天数）
 */
export function calculateTotalCheckinDays(records: CheckInRecord[]): number {
  if (!records || records.length === 0) {
    return 0;
  }

  // 提取所有日期并去重
  const uniqueDates = new Set<string>();
  for (const record of records) {
    uniqueDates.add(record.date);
  }

  return uniqueDates.size;
}

/**
 * 计算本周 7 天的打卡状态
 *
 * 返回一个长度为 7 的布尔数组（周一起始），表示每天是否有打卡记录。
 * 不强调连续性，仅标记哪些天有打卡。
 *
 * @param records 打卡记录列表
 * @param weekStart 本周一日期（YYYY-MM-DD）
 * @returns 7 天打卡状态数组（周一到周日）
 */
export function calculateWeekStrip(
  records: CheckInRecord[],
  weekStart: ISODate
): boolean[] {
  const weekStatus: boolean[] = [false, false, false, false, false, false, false];

  if (!records || records.length === 0) {
    return weekStatus;
  }

  // 提取所有日期（去重）
  const checkinDates = new Set<string>();
  for (const record of records) {
    checkinDates.add(record.date);
  }

  // 遍历本周 7 天
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    weekStatus[i] = checkinDates.has(date);
  }

  return weekStatus;
}

/**
 * 计算任务完成率
 *
 * @param tasks 今日任务列表
 * @param records 打卡记录列表
 * @returns 完成率对象 { done: 已完成数, total: 总数 }
 */
export function calculateCompletionRate(
  tasks: TaskView[],
  records: CheckInRecord[]
): { done: number; total: number } {
  if (!tasks || tasks.length === 0) {
    return { done: 0, total: 0 };
  }

  // 构建今日已打卡的 refId 集合
  const doneRefIds = new Set<string>();
  for (const record of records) {
    doneRefIds.add(`${record.refType}:${record.refId}`);
  }

  // 统计完成数
  let done = 0;
  for (const task of tasks) {
    if (doneRefIds.has(task.key)) {
      done++;
    }
  }

  return { done, total: tasks.length };
}

export function calculateCurrentStreak(records: CheckInRecord[], today: ISODate): number {
  const dates = toCheckinDateSet(records);
  if (dates.size === 0) return 0;

  // 今天还没打卡不算断：从昨天起往回数
  let cursor = dates.has(today) ? today : addDays(today, -1);
  if (!dates.has(cursor)) return 0;

  let streak = 0;
  while (dates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * 计算历史最长连续打卡天数
 *
 * 里程碑奖励按此发放：一旦达到某档，之后即使断签也不会收回（只降不升不符合直觉）。
 *
 * @param records 打卡记录列表
 */
export function calculateLongestStreak(records: CheckInRecord[]): number {
  const dates = Array.from(toCheckinDateSet(records)).sort();
  if (dates.length === 0) return 0;

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    run = addDays(dates[i - 1], 1) === dates[i] ? run + 1 : 1;
    if (run > longest) longest = run;
  }
  return longest;
}

/** 有打卡记录的日期集合（同日多条只留一个日期） */
function toCheckinDateSet(records: CheckInRecord[]): Set<string> {
  const dates = new Set<string>();
  for (const record of records ?? []) {
    dates.add(record.date);
  }
  return dates;
}

/**
 * 内部辅助：在 ISODate 上加减天数
 * 避免循环依赖
 */
function addDays(date: ISODate, days: number): ISODate {
  const parts = date.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + days);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
