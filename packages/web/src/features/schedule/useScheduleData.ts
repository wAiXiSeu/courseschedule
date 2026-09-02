/**
 * 课程表数据 Hook
 *
 * 调用 Repository 获取课程和排课规则，调用 expandRulesToOccurrences 展开。
 * 支持周视角（7 天）与月视角（整月日历网格，首尾补齐到完整周）。
 */

import { useEffect, useState, useCallback } from 'react';
import {
  type CourseOccurrence,
  type CourseCancellation,
  type ISODate,
  getMondayOfWeek,
  addDays,
  parseISODate,
  toISODate,
  getTodayISODate,
  expandRulesToOccurrences,
} from '@courseschedule/shared';
import { useScheduleStore } from '../../stores/useScheduleStore';
import { cancellationKey } from '../../data/repositories/courseCancellationRepository';
import { useAppStore } from '../../stores/useAppStore';

/** 视角模式 */
export type ScheduleViewMode = 'week' | 'month';

/** 课程类型筛选：全部 / 校内 / 校外 */
export type ScheduleTypeFilter = 'all' | 'school' | 'extracurricular';

/** 月视图网格中的单个日期格 */
export interface MonthGridDay {
  /** 日期 */
  date: ISODate;
  /** 是否属于当前显示的月份（首尾补位格为 false） */
  inMonth: boolean;
  /** 当日课程实例（按开始时间排序） */
  occurrences: CourseOccurrence[];
}

/** Hook 返回值接口 */
interface ScheduleDataResult {
  /** 视角模式 */
  viewMode: ScheduleViewMode;
  /** 切换视角模式 */
  setViewMode: (mode: ScheduleViewMode) => void;
  /** 课程类型筛选 */
  typeFilter: ScheduleTypeFilter;
  /** 切换课程类型筛选 */
  setTypeFilter: (filter: ScheduleTypeFilter) => void;
  /** 当前周周一日期 */
  weekStart: ISODate;
  /** 当前周周日日期 */
  weekEnd: ISODate;
  /** 本周课程实例（7 天分组） */
  weekOccurrences: CourseOccurrence[][];
  /** 本周全部课程实例（扁平） */
  flatOccurrences: CourseOccurrence[];
  /** 当前显示的月份首日（YYYY-MM-01） */
  monthStart: ISODate;
  /** 月视图网格（按周排列，首尾补齐） */
  monthGridDays: MonthGridDay[];
  /** 课程取消记录（键 ruleId|date → 取消记录） */
  cancellations: ReadonlyMap<string, CourseCancellation>;
  /** 是否正在加载 */
  loading: boolean;
  /** 前进一周 */
  goNextWeek: () => void;
  /** 后退一周 */
  goPrevWeek: () => void;
  /** 回到本周 */
  goThisWeek: () => void;
  /** 前进一月 */
  goNextMonth: () => void;
  /** 后退一月 */
  goPrevMonth: () => void;
  /** 回到本月 */
  goThisMonth: () => void;
}

/** 取某月首日（YYYY-MM-01） */
function getFirstOfMonth(date: ISODate): ISODate {
  return `${date.slice(0, 7)}-01`;
}

/** 在月份首日基础上加一个月 */
function addMonths(firstOfMonth: ISODate, months: number): ISODate {
  const d = parseISODate(firstOfMonth);
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
}

/**
 * 课程表数据 Hook
 */
export const useScheduleData = (): ScheduleDataResult => {
  const courses = useScheduleStore((state) => state.courses);
  const rules = useScheduleStore((state) => state.rules);
  const cancellations = useScheduleStore((state) => state.cancellations);
  const loading = useScheduleStore((state) => state.loading);
  const loadAll = useScheduleStore((state) => state.loadAll);
  const currentDate = useAppStore((state) => state.currentDate);

  // 视角模式（默认周视角）
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('week');

  // 课程类型筛选（默认全部）
  const [typeFilter, setTypeFilter] = useState<ScheduleTypeFilter>('all');

  // 当前查看的周一
  const [weekStart, setWeekStart] = useState<ISODate>(() => getMondayOfWeek(currentDate));

  // 当前查看的月份首日
  const [monthStart, setMonthStart] = useState<ISODate>(() => getFirstOfMonth(currentDate));

  // 初始化和 currentDate 变化时同步
  useEffect(() => {
    setWeekStart(getMondayOfWeek(currentDate));
    setMonthStart(getFirstOfMonth(currentDate));
  }, [currentDate]);

  // 首次加载数据
  useEffect(() => {
    if (courses.length === 0 && rules.length === 0) {
      loadAll();
    }
  }, [courses.length, rules.length, loadAll]);

  // ===== 周视角 =====

  // 计算本周周日
  const weekEnd = addDays(weekStart, 6);

  // 展开课程实例
  const flatOccurrences = expandRulesToOccurrences(rules, courses, {
    start: weekStart,
    end: weekEnd,
  });

  // 课程类型筛选判定
  const matchType = (o: CourseOccurrence) =>
    typeFilter === 'all' || o.courseType === typeFilter;

  // 按天分组（7 个子数组，周一到周日）
  const weekOccurrences: CourseOccurrence[][] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    weekOccurrences.push(
      flatOccurrences.filter((o) => o.date === date && matchType(o))
    );
  }

  // ===== 月视角 =====

  // 月末日 = 下月首日的前一天
  const nextMonthFirst = addMonths(monthStart, 1);
  const monthEnd = addDays(nextMonthFirst, -1);

  // 网格起点：包含月首的那周的周一；终点：包含月末日的那周的周日
  const gridStart = getMondayOfWeek(monthStart);
  const gridEnd = addDays(getMondayOfWeek(monthEnd), 6);

  // 一次性展开整个网格范围的课程实例
  const monthFlat =
    viewMode === 'month'
      ? expandRulesToOccurrences(rules, courses, { start: gridStart, end: gridEnd }).filter(matchType)
      : [];

  // 组装网格（每天一格，含跨月补位格）
  const monthGridDays: MonthGridDay[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    monthGridDays.push({
      date: cursor,
      inMonth: cursor.slice(0, 7) === monthStart.slice(0, 7),
      occurrences: monthFlat.filter((o) => o.date === cursor),
    });
    cursor = addDays(cursor, 1);
  }

  // ===== 课程取消 =====

  const cancellationMap: ReadonlyMap<string, CourseCancellation> = (() => {
    const map = new Map<string, CourseCancellation>();
    for (const c of cancellations) {
      map.set(cancellationKey(c.ruleId, c.date), c);
    }
    return map;
  })();

  // ===== 导航 =====

  // 前进一周
  const goNextWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, 7));
  }, []);

  // 后退一周
  const goPrevWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, -7));
  }, []);

  // 回到本周
  const goThisWeek = useCallback(() => {
    setWeekStart(getMondayOfWeek(getTodayISODate()));
  }, []);

  // 前进一月
  const goNextMonth = useCallback(() => {
    setMonthStart((prev) => addMonths(prev, 1));
  }, []);

  // 后退一月
  const goPrevMonth = useCallback(() => {
    setMonthStart((prev) => addMonths(prev, -1));
  }, []);

  // 回到本月
  const goThisMonth = useCallback(() => {
    setMonthStart(getFirstOfMonth(getTodayISODate()));
  }, []);

  return {
    viewMode,
    setViewMode,
    typeFilter,
    setTypeFilter,
    weekStart,
    weekEnd,
    weekOccurrences,
    flatOccurrences,
    monthStart,
    monthGridDays,
    cancellations: cancellationMap,
    loading,
    goNextWeek,
    goPrevWeek,
    goThisWeek,
    goNextMonth,
    goPrevMonth,
    goThisMonth,
  };
};
