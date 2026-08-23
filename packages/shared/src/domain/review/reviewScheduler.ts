/**
 * 复习调度器 —— 跨端共享纯函数
 *
 * 负责惰性生成复习任务：录入学习内容时只生成第 1 个复习任务；
 * 每完成一个节点，按「已完成次数」查下一个间隔再生成下一个任务。
 *
 * 参考 ARCHITECTURE.md 第 4.1a 节「遗忘曲线复习任务生成流程」
 * 及第 7 节「复习间隔语义」。
 */

import type { ISODate, ReviewItem, ReviewTask } from '../models';
import { genId } from '../../core/utils/id';
import { computeDueDate } from './intervals';

/**
 * 创建第一个复习任务
 *
 * 当家长录入学习内容（ReviewItem）时调用。
 * dueDate = learnDate + intervals[0]
 *
 * @param item 复习项（已持久化，含 id）
 * @param learnDate 学习日期（YYYY-MM-DD），通常等于 item.learnDate
 * @returns 第一个复习任务（intervalIndex=0, status='pending'）
 */
export function createFirstReviewTask(
  item: ReviewItem,
  learnDate: ISODate
): ReviewTask {
  if (!item.intervals || item.intervals.length === 0) {
    throw new Error('复习项的间隔序列不能为空');
  }

  const now = Date.now();
  const dueDate = computeDueDate(learnDate, item.intervals, 0);

  return {
    id: genId(),
    childId: item.childId,
    createdAt: now,
    updatedAt: now,
    reviewItemId: item.id,
    intervalIndex: 0,
    dueDate,
    status: 'pending',
  };
}

/**
 * 惰性生成下一个复习任务
 *
 * 当某个复习任务完成（status='done'）时调用。
 * 检查当前 intervalIndex 之后是否还有下一个间隔节点，
 * 如果有则生成下一个 pending 任务。
 *
 * dueDate = max(learnDate + intervals[intervalIndex + 1], today)
 * 防止逾期后立即再到期堆积（参考 ARCHITECTURE_DELTA 第 7 节）。
 *
 * @param item 复习项（含 intervals 和 learnDate）
 * @param completedTask 已完成的复习任务
 * @returns 下一个复习任务，若已无后续节点则返回 null
 */
export function createNextReviewTask(
  item: ReviewItem,
  completedTask: ReviewTask
): ReviewTask | null {
  const nextIndex = completedTask.intervalIndex + 1;

  // 已无后续间隔节点
  if (nextIndex >= item.intervals.length) {
    return null;
  }

  const now = Date.now();
  const today = new Date();
  const todayStr = toISODateString(today);

  // 理论到期日 = learnDate + intervals[nextIndex]
  const theoreticalDueDate = computeDueDate(item.learnDate, item.intervals, nextIndex);

  // 取理论到期日与今天较大者，防止逾期堆积
  const dueDate = theoreticalDueDate > todayStr ? theoreticalDueDate : todayStr;

  return {
    id: genId(),
    childId: item.childId,
    createdAt: now,
    updatedAt: now,
    reviewItemId: item.id,
    intervalIndex: nextIndex,
    dueDate,
    status: 'pending',
  };
}

/**
 * 判断复习任务是否到期
 *
 * 到期条件：task.dueDate <= today（YYYY-MM-DD 字符串直接比较）
 *
 * @param task 复习任务
 * @param today 当前日期（YYYY-MM-DD）
 * @returns 是否已到期
 */
export function isReviewDue(task: ReviewTask, today: ISODate): boolean {
  return task.dueDate <= today;
}

/**
 * 计算指定复习项的总轮次数
 *
 * @param item 复习项
 * @returns 总轮次数（即 intervals 长度）
 */
export function getTotalRounds(item: ReviewItem): number {
  return item.intervals.length;
}

/**
 * 内部辅助：将 Date 转为 YYYY-MM-DD
 * 避免循环依赖 date.ts（此处为纯函数内部使用）
 */
function toISODateString(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
