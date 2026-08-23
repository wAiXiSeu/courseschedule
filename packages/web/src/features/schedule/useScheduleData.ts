/**
 * 课程表数据 Hook
 *
 * 调用 Repository 获取课程和排课规则，调用 expandRulesToOccurrences 展开
 */

import { useEffect, useState, useCallback } from 'react';
import {
  type CourseOccurrence,
  type ISODate,
  getMondayOfWeek,
  addDays,
  expandRulesToOccurrences,
} from '@courseschedule/shared';
import { useScheduleStore } from '../../stores/useScheduleStore';
import { useAppStore } from '../../stores/useAppStore';

/** Hook 返回值接口 */
interface ScheduleDataResult {
  /** 当前周周一日期 */
  weekStart: ISODate;
  /** 当前周周日日期 */
  weekEnd: ISODate;
  /** 本周课程实例（7 天分组） */
  weekOccurrences: CourseOccurrence[][];
  /** 本周全部课程实例（扁平） */
  flatOccurrences: CourseOccurrence[];
  /** 是否正在加载 */
  loading: boolean;
  /** 前进一周 */
  goNextWeek: () => void;
  /** 后退一周 */
  goPrevWeek: () => void;
  /** 回到本周 */
  goThisWeek: () => void;
}

/**
 * 课程表数据 Hook
 */
export const useScheduleData = (): ScheduleDataResult => {
  const courses = useScheduleStore((state) => state.courses);
  const rules = useScheduleStore((state) => state.rules);
  const loading = useScheduleStore((state) => state.loading);
  const loadAll = useScheduleStore((state) => state.loadAll);
  const currentDate = useAppStore((state) => state.currentDate);

  // 当前查看的周一
  const [weekStart, setWeekStart] = useState<ISODate>(() => getMondayOfWeek(currentDate));

  // 初始化和 currentDate 变化时同步
  useEffect(() => {
    setWeekStart(getMondayOfWeek(currentDate));
  }, [currentDate]);

  // 首次加载数据
  useEffect(() => {
    if (courses.length === 0 && rules.length === 0) {
      loadAll();
    }
  }, [courses.length, rules.length, loadAll]);

  // 计算本周周日
  const weekEnd = addDays(weekStart, 6);

  // 展开课程实例
  const flatOccurrences = expandRulesToOccurrences(rules, courses, {
    start: weekStart,
    end: weekEnd,
  });

  // 按天分组（7 个子数组，周一到周日）
  const weekOccurrences: CourseOccurrence[][] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    weekOccurrences.push(
      flatOccurrences.filter((o) => o.date === date)
    );
  }

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
    setWeekStart(getMondayOfWeek(new Date().toISOString().slice(0, 10)));
  }, []);

  return {
    weekStart,
    weekEnd,
    weekOccurrences,
    flatOccurrences,
    loading,
    goNextWeek,
    goPrevWeek,
    goThisWeek,
  };
};
