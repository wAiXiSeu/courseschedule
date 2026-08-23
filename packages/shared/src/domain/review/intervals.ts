/**
 * 复习间隔序列工具 —— 跨端共享纯函数
 *
 * 负责间隔序列的归一化与校验。
 * 参考 ARCHITECTURE.md 第 7 节「复习间隔语义」：
 * intervals 为相对学习日期的累计天数（默认 [1,2,4,7,15] 即 D1/D2/D4/D7/D15）。
 */

import { REVIEW_INTERVALS } from '../../core/constants';

/** 默认间隔序列（可变副本） */
export const DEFAULT_INTERVALS: number[] = [...REVIEW_INTERVALS];

/**
 * 归一化间隔序列
 *
 * 处理逻辑：
 * 1. 过滤掉小于 1 的值（间隔至少为 1 天）
 * 2. 去重
 * 3. 升序排列
 *
 * @param intervals 原始间隔数组
 * @returns 归一化后的新数组（不修改入参）
 */
export function normalizeIntervals(intervals: number[]): number[] {
  if (!intervals || intervals.length === 0) {
    return [...DEFAULT_INTERVALS];
  }

  // 过滤：仅保留 >= 1 的整数
  const filtered = intervals.filter(
    (v) => Number.isInteger(v) && v >= 1
  );

  if (filtered.length === 0) {
    return [...DEFAULT_INTERVALS];
  }

  // 去重 + 升序
  const unique = [...new Set(filtered)];
  unique.sort((a, b) => a - b);

  return unique;
}

/**
 * 计算指定间隔节点的到期日期
 *
 * @param learnDate 学习日期（YYYY-MM-DD）
 * @param intervals 间隔序列（已归一化）
 * @param intervalIndex 间隔节点索引（0 起）
 * @returns 到期日期（YYYY-MM-DD）
 */
export function computeDueDate(
  learnDate: string,
  intervals: number[],
  intervalIndex: number
): string {
  if (intervalIndex < 0 || intervalIndex >= intervals.length) {
    throw new Error(
      `intervalIndex ${intervalIndex} 超出范围 [0, ${intervals.length - 1}]`
    );
  }

  const d = new Date(
    parseInt(learnDate.substring(0, 4), 10),
    parseInt(learnDate.substring(5, 7), 10) - 1,
    parseInt(learnDate.substring(8, 10), 10)
  );

  d.setDate(d.getDate() + intervals[intervalIndex]);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
