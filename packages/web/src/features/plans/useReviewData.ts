/**
 * 复习数据 Hook
 *
 * 调用 useReviewStore 获取复习项和任务数据，提供 UI 层所需的计算属性。
 */

import { useEffect, useMemo } from 'react';
import { useReviewStore } from '../../stores/useReviewStore';
import { useAppStore } from '../../stores/useAppStore';
import type { ReviewItem, ReviewTask, ISODate } from '@courseschedule/shared';

/** Hook 返回值 */
interface ReviewDataResult {
  /** 所有复习项 */
  items: ReviewItem[];
  /** 所有复习任务 */
  tasks: ReviewTask[];
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 获取指定复习项的任务列表 */
  getTasksByItem: (itemId: string) => ReviewTask[];
  /** 计算复习进度（已完成轮次 / 总轮次） */
  getReviewProgress: (itemId: string) => { done: number; total: number };
  /** 获取今日到期的复习任务数 */
  getTodayDueCount: (itemId: string) => number;
}

/**
 * 复习数据 Hook
 */
export const useReviewData = (): ReviewDataResult => {
  const childId = useAppStore((s) => s.childId);
  const currentDate = useAppStore((s) => s.currentDate);
  const items = useReviewStore((s) => s.items);
  const tasks = useReviewStore((s) => s.tasks);
  const loading = useReviewStore((s) => s.loading);
  const error = useReviewStore((s) => s.error);
  const loadAll = useReviewStore((s) => s.loadAll);

  // 初始加载
  useEffect(() => {
    loadAll();
  }, [childId]);

  /** 获取指定复习项的任务列表 */
  const getTasksByItem = (itemId: string): ReviewTask[] => {
    return tasks.filter((t) => t.reviewItemId === itemId);
  };

  /**
   * 计算复习进度
   * 返回已完成轮次和总轮次
   */
  const getReviewProgress = (itemId: string): { done: number; total: number } => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return { done: 0, total: 0 };

    const itemTasks = getTasksByItem(itemId);
    const done = itemTasks.filter((t) => t.status === 'done').length;
    const total = item.intervals.length;

    return { done, total };
  };

  /**
   * 获取今日到期的复习任务数
   * 到期条件：dueDate <= currentDate 且 status='pending'
   */
  const getTodayDueCount = (itemId: string): number => {
    const itemTasks = getTasksByItem(itemId);
    return itemTasks.filter((t) => t.status === 'pending' && t.dueDate <= currentDate).length;
  };

  return {
    items,
    tasks,
    loading,
    error,
    refresh: loadAll,
    getTasksByItem,
    getReviewProgress,
    getTodayDueCount,
  };
};
