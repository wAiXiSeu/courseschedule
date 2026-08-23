/**
 * 打卡数据 Hook
 *
 * 聚合今日任务列表、打卡记录、统计数据。
 * 调用 checkinRepository + 打卡纯函数。
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  type TaskView,
  type CheckInRecord,
  type PlanTask,
  type ReviewTask,
  getTodayISODate,
  getMondayOfWeek,
  calculateTotalCheckinDays,
  calculateWeekStrip,
  calculateCompletionRate,
  isReviewDue,
} from '@courseschedule/shared';
import { useAppStore } from '../../stores/useAppStore';
import { useCheckinStore, checkinRepo } from '../../stores/useCheckinStore';
import { planTaskRepo } from '../../stores/usePlanStore';
import { reviewTaskRepo, reviewItemRepo } from '../../stores/useReviewStore';

/** Hook 返回值 */
interface CheckinDataResult {
  /** 今日任务列表 */
  todayTasks: TaskView[];
  /** 打卡记录列表 */
  records: CheckInRecord[];
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 累计打卡天数 */
  totalDays: number;
  /** 本周打卡格子（周一起始） */
  weekStrip: boolean[];
  /** 今日完成率 */
  completionRate: { done: number; total: number };
}

/**
 * 打卡数据 Hook
 */
export const useCheckinData = (): CheckinDataResult => {
  const childId = useAppStore((s) => s.childId);
  const currentDate = useAppStore((s) => s.currentDate);
  const records = useCheckinStore((s) => s.records);
  const loading = useCheckinStore((s) => s.loading);
  const error = useCheckinStore((s) => s.error);
  const loadAll = useCheckinStore((s) => s.loadAll);

  // 本地状态：今日任务列表
  const [todayTasks, setTodayTasks] = useState<TaskView[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // 加载今日任务
  const refreshTasks = async () => {
    setTasksLoading(true);
    try {
      // 并行查询计划任务、复习任务、打卡记录
      const [activePlanTasks, allReviewTasks, todayCheckins, allReviewItems] = await Promise.all([
        planTaskRepo.listActive(childId),
        reviewTaskRepo.listByChild(childId),
        checkinRepo.listByDate(childId, currentDate),
        reviewItemRepo.listByChild(childId),
      ]);

      // 构建已打卡的 refId 集合
      const doneRefIds = new Set<string>();
      for (const record of todayCheckins) {
        doneRefIds.add(`${record.refType}:${record.refId}`);
      }

      // 过滤今日计划任务
      const weekday = new Date(currentDate).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const todayPlanTasks = activePlanTasks.filter((task) => {
        if (!task.isActive) return false;
        switch (task.frequency) {
          case 'daily':
            return true;
          case 'weekly':
            return task.weekdays?.includes(weekday) ?? false;
          case 'once':
            return task.specificDate === currentDate;
          default:
            return false;
        }
      });

      // 筛选今日到期的复习任务
      const dueReviewTasks = allReviewTasks.filter(
        (task) => task.status === 'pending' && isReviewDue(task, currentDate)
      );

      // 构建 TaskView 列表
      const tasks: TaskView[] = [];

      for (const task of todayPlanTasks) {
        const key = `plan_task:${task.id}`;
        tasks.push({
          key,
          title: task.title,
          sourceLabel: '学习计划',
          refType: 'plan_task',
          refId: task.id,
          done: doneRefIds.has(key),
        });
      }

      for (const task of dueReviewTasks) {
        const key = `review_task:${task.id}`;
        const reviewItem = allReviewItems.find((i) => i.id === task.reviewItemId);
        tasks.push({
          key,
          title: reviewItem ? `${reviewItem.title} #${task.intervalIndex + 1}` : `复习任务 #${task.intervalIndex + 1}`,
          sourceLabel: '复习计划',
          refType: 'review_task',
          refId: task.id,
          done: doneRefIds.has(key),
          due: true,
        });
      }

      setTodayTasks(tasks);
    } catch (err) {
      console.error('加载今日任务失败:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  // 初始加载 + 日期变化时刷新
  useEffect(() => {
    loadAll();
    refreshTasks();
  }, [childId, currentDate]);

  // 计算统计数据
  const totalDays = useMemo(() => calculateTotalCheckinDays(records), [records]);
  const weekStrip = useMemo(() => {
    const weekStart = getMondayOfWeek(getTodayISODate());
    return calculateWeekStrip(records, weekStart);
  }, [records]);
  const completionRate = useMemo(() => {
    const todayRecords = records.filter((r) => r.date === currentDate);
    return calculateCompletionRate(todayTasks, todayRecords);
  }, [records, todayTasks, currentDate]);

  return {
    todayTasks,
    records,
    loading: loading || tasksLoading,
    error,
    refresh: async () => {
      await loadAll();
      await refreshTasks();
    },
    totalDays,
    weekStrip,
    completionRate,
  };
};
