/**
 * 日期工具函数 —— 跨端共享
 *
 * 所有日期操作均为纯函数，不依赖平台 API。
 * 日期格式统一为 'YYYY-MM-DD'（ISODate），时间格式为 'HH:mm'（HHmm）。
 */

import type { ISODate, Weekday } from '../../domain/models';

/**
 * 将 Date 对象转为 YYYY-MM-DD 字符串（本地日期，无时区转换）
 */
export function toISODate(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 将 YYYY-MM-DD 字符串解析为 Date 对象（本地午夜时刻）
 */
export function parseISODate(isoDate: ISODate): Date {
  const parts = isoDate.split('-');
  if (parts.length !== 3) {
    throw new Error(`无效的日期格式: ${isoDate}`);
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

/**
 * 在 ISODate 上加减天数，返回新的 ISODate
 * @param date 起始日期
 * @param days 天数（正数加，负数减）
 */
export function addDays(date: ISODate, days: number): ISODate {
  const d = parseISODate(date);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/**
 * 获取某天的星期几（0=周日, 1=周一 … 6=周六）
 */
export function getWeekday(date: ISODate): Weekday {
  const d = parseISODate(date);
  return d.getDay() as Weekday;
}

/**
 * 获取星期标签（中文）
 * @param weekday 0=周日
 */
export function getWeekdayLabel(weekday: number): string {
  const labels: Record<number, string> = {
    0: '周日',
    1: '周一',
    2: '周二',
    3: '周三',
    4: '周四',
    5: '周五',
    6: '周六',
  };
  return labels[weekday] || '';
}

/**
 * 获取某日期所在周的周一日期（周一起始）
 */
export function getMondayOfWeek(date: ISODate): ISODate {
  const d = parseISODate(date);
  const day = d.getDay(); // 0=周日, 1=周一 ...
  // 周一为0偏移，周日为-6偏移
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return toISODate(d);
}

/**
 * 比较两个 ISODate 的先后
 * @returns 负数表示 a < b，0 表示相等，正数表示 a > b
 */
export function compareDates(a: ISODate, b: ISODate): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * 判断 date 是否在 [from, to] 区间内（含端点）
 * 若 to 为空则视为无截止
 */
export function isDateInRange(date: ISODate, from: ISODate, to?: ISODate): boolean {
  if (date < from) return false;
  if (to && date > to) return false;
  return true;
}

/**
 * 获取今天的 ISODate
 * 注意：此函数有副作用（读取系统时间），仅在必要时调用
 */
export function getTodayISODate(): ISODate {
  return toISODate(new Date());
}

/**
 * 比较两个 HHmm 时间的先后
 * @returns 负数表示 a < b，0 表示相等，正数表示 a > b
 */
export function compareTime(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
