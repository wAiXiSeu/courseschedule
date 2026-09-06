/**
 * 复习状态管理（zustand）
 *
 * 管理 ReviewItem 和 ReviewTask 的 CRUD，调用 reviewRepository 持久化。
 * 使用 reviewScheduler 惰性生成复习任务。
 * 参考 ARCHITECTURE.md 第 4.1a 节。
 */

import { create } from 'zustand';
import {
  type ReviewItem,
  type ReviewTask,
  type ISODate,
  type ReviewSourceType,
  genId,
  createFirstReviewTask,
  createNextReviewTask,
} from '@courseschedule/shared';
import { ReviewItemRepository, ReviewTaskRepository } from '../data/repositories/reviewRepository';
import { useAppStore } from './useAppStore';
import { usePointsStore } from './usePointsStore';

/** 复习项表单数据 */
export interface ReviewItemFormData {
  title: string;
  subject: string;
  learnDate: ISODate;
  intervals: number[];
  sourceType: ReviewSourceType;
  sourceId?: string;
}

/** 复习 Store 状态接口 */
interface ReviewState {
  /** 复习项列表 */
  items: ReviewItem[];
  /** 复习任务列表 */
  tasks: ReviewTask[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;

  /** 加载所有复习项和任务 */
  loadAll: () => Promise<void>;
  /** 创建复习项（自动生成第一个复习任务） */
  createItem: (data: ReviewItemFormData) => Promise<void>;
  /** 更新复习项 */
  updateItem: (item: ReviewItem, data: ReviewItemFormData) => Promise<void>;
  /** 删除复习项（同时删除其所有任务） */
  deleteItem: (itemId: string) => Promise<void>;
  /** 完成复习任务（惰性生成下一个） */
  completeTask: (taskId: string) => Promise<void>;
  /** 跳过复习任务 */
  skipTask: (taskId: string) => Promise<void>;
}

/** Repository 实例 */
export const reviewItemRepo = new ReviewItemRepository();
export const reviewTaskRepo = new ReviewTaskRepository();

/**
 * 复习 Store
 */
export const useReviewStore = create<ReviewState>((set, get) => ({
  items: [],
  tasks: [],
  loading: false,
  error: null,

  loadAll: async () => {
    const childId = useAppStore.getState().childId;
    set({ loading: true, error: null });
    try {
      const [items, tasks] = await Promise.all([
        reviewItemRepo.listByChild(childId),
        reviewTaskRepo.listByChild(childId),
      ]);
      set({ items, tasks, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createItem: async (data) => {
    const childId = useAppStore.getState().childId;
    const now = Date.now();
    const item: ReviewItem = {
      id: genId(),
      childId,
      createdAt: now,
      updatedAt: now,
      title: data.title,
      subject: data.subject,
      learnDate: data.learnDate,
      intervals: data.intervals,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
    };
    await reviewItemRepo.create(item);

    // 自动生成第一个复习任务
    const firstTask = createFirstReviewTask(item, data.learnDate);
    await reviewTaskRepo.create(firstTask);

    await get().loadAll();
  },

  updateItem: async (item, data) => {
    const updated: ReviewItem = {
      ...item,
      title: data.title,
      subject: data.subject,
      learnDate: data.learnDate,
      intervals: data.intervals,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      updatedAt: Date.now(),
    };
    await reviewItemRepo.update(updated);
    await get().loadAll();
  },

  deleteItem: async (itemId) => {
    // 删除该复习项的所有任务
    const childId = useAppStore.getState().childId;
    const tasks = await reviewTaskRepo.listByReviewItem(childId, itemId);
    for (const task of tasks) {
      await reviewTaskRepo.remove(task.id);
    }
    // 删除复习项本身
    await reviewItemRepo.remove(itemId);
    await get().loadAll();
  },

  completeTask: async (taskId) => {
    const childId = useAppStore.getState().childId;
    // 完成复习任务
    const completedTask = await reviewTaskRepo.complete(taskId, Date.now());

    // 查找关联的复习项
    const item = await reviewItemRepo.getById(completedTask.reviewItemId);
    if (item) {
      // 惰性生成下一个复习任务
      const nextTask = createNextReviewTask(item, completedTask);
      if (nextTask) {
        await reviewTaskRepo.create(nextTask);
      }
    }

    await get().loadAll();
    // 完成或跳过都会改变「当天到期任务」集合，满额奖要跟着重算
    await usePointsStore.getState().load();
  },

  skipTask: async (taskId) => {
    const task = await reviewTaskRepo.getById(taskId);
    if (task) {
      await reviewTaskRepo.update({
        ...task,
        status: 'skipped',
        updatedAt: Date.now(),
      });
      await get().loadAll();
      await usePointsStore.getState().load();
    }
  },
}));
