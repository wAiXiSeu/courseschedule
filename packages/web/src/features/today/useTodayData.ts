/**
 * 今日视图数据 Hook
 *
 * 调用 aggregateTodayView 聚合今日数据
 */

import { useEffect, useState } from 'react';
import {
  type TodayViewData,
  type PlanTask,
  type ReviewTask,
  type CheckInRecord,
  aggregateTodayView,
} from '@courseschedule/shared';
import { useScheduleStore, courseRepo, ruleRepo } from '../../stores/useScheduleStore';
import { cancellationKey } from '../../data/repositories/courseCancellationRepository';
import { useAppStore } from '../../stores/useAppStore';
import { planTaskRepo } from '../../stores/usePlanStore';
import { reviewTaskRepo } from '../../stores/useReviewStore';
import { checkinRepo } from '../../stores/useCheckinStore';

/** Hook 返回值 */
interface TodayDataResult {
  /** 今日视图数据 */
  todayData: TodayViewData | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
}

/**
 * 今日视图数据 Hook
 *
 * 聚合今日课程、计划任务、复习任务、打卡状态
 */
export const useTodayData = (): TodayDataResult => {
  const currentDate = useAppStore((s) => s.currentDate);
  const childId = useAppStore((s) => s.childId);
  const courses = useScheduleStore((s) => s.courses);
  const rules = useScheduleStore((s) => s.rules);
  const loadAll = useScheduleStore((s) => s.loadAll);

  const [todayData, setTodayData] = useState<TodayViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      // 确保课程和规则已加载
      if (courses.length === 0 && rules.length === 0) {
        await loadAll();
      }

      // 并行查询其他数据
      const [planTasks, reviewTasks, checkinRecords] = await Promise.all([
        planTaskRepo.listActive(childId),
        reviewTaskRepo.listByChild(childId),
        checkinRepo.listByDate(childId, currentDate),
      ]);

      // 聚合今日视图
      const data = aggregateTodayView({
        date: currentDate,
        courses: useScheduleStore.getState().courses,
        rules: useScheduleStore.getState().rules,
        planTasks,
        reviewTasks,
        checkinRecords,
      });

      // 当天已取消的课程不再出现在今日时间轴
      const canceledRules = new Set(
        useScheduleStore.getState().cancellations.map((c) =>
          cancellationKey(c.ruleId, c.date)
        )
      );
      data.courses = data.courses.filter(
        (o) => !canceledRules.has(cancellationKey(o.ruleId, o.date))
      );

      setTodayData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 初始化和日期变化时刷新
  useEffect(() => {
    refresh();
  }, [currentDate, childId]);

  return {
    todayData,
    loading,
    error,
    refresh,
  };
};
