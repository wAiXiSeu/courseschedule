/**
 * 学习计划数据 Hook
 *
 * 调用 usePlanStore 获取学习计划和任务数据，提供 UI 层所需的计算属性。
 */

import { useEffect, useMemo } from 'react';
import { usePlanStore } from '../../stores/usePlanStore';
import { useAppStore } from '../../stores/useAppStore';
import type { LearningPlan, PlanTask, ISODate } from '@courseschedule/shared';

/** Hook 返回值 */
interface PlanDataResult {
  /** 所有学习计划 */
  plans: LearningPlan[];
  /** 所有计划任务 */
  tasks: PlanTask[];
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 获取指定计划的任务列表 */
  getTasksByPlan: (planId: string) => PlanTask[];
  /** 计算计划进度百分比 */
  getPlanProgress: (plan: LearningPlan) => number;
  /** 获取今日应执行的任务数（用于卡片角标） */
  getTodayTaskCount: (planId: string) => number;
}

/**
 * 学习计划数据 Hook
 */
export const usePlanData = (): PlanDataResult => {
  const childId = useAppStore((s) => s.childId);
  const currentDate = useAppStore((s) => s.currentDate);
  const plans = usePlanStore((s) => s.plans);
  const tasks = usePlanStore((s) => s.tasks);
  const loading = usePlanStore((s) => s.loading);
  const error = usePlanStore((s) => s.error);
  const loadAll = usePlanStore((s) => s.loadAll);

  // 初始加载
  useEffect(() => {
    loadAll();
  }, [childId]);

  /** 获取指定计划的任务列表 */
  const getTasksByPlan = (planId: string): PlanTask[] => {
    return tasks.filter((t) => t.planId === planId);
  };

  /**
   * 计算计划进度百分比
   * 基于日期区间计算已过天数占比
   */
  const getPlanProgress = (plan: LearningPlan): number => {
    const start = new Date(plan.startDate).getTime();
    const end = new Date(plan.endDate).getTime();
    const now = new Date(currentDate).getTime();

    if (end <= start) return 100;
    const progress = Math.round(((now - start) / (end - start)) * 100);
    return Math.min(100, Math.max(0, progress));
  };

  /**
   * 获取今日应执行的任务数
   * 根据频率（daily/weekly/once）判断任务今日是否应执行
   */
  const getTodayTaskCount = (planId: string): number => {
    const planTasks = getTasksByPlan(planId);
    return planTasks.filter((task) => {
      if (!task.isActive) return false;
      switch (task.frequency) {
        case 'daily':
          return true;
        case 'weekly':
          return task.weekdays?.includes(
            new Date(currentDate).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
          ) ?? false;
        case 'once':
          return task.specificDate === currentDate;
        default:
          return false;
      }
    }).length;
  };

  return {
    plans,
    tasks,
    loading,
    error,
    refresh: loadAll,
    getTasksByPlan,
    getPlanProgress,
    getTodayTaskCount,
  };
};
