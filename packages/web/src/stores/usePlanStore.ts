/**
 * 学习计划状态管理（zustand）
 *
 * 管理 LearningPlan 和 PlanTask 的 CRUD，调用 planRepository 持久化。
 * 参考 ARCHITECTURE.md 第 4 节。
 */

import { create } from 'zustand';
import {
  type LearningPlan,
  type PlanTask,
  type PlanStatus,
  type PlanTaskFrequency,
  type ISODate,
  type Weekday,
  genId,
} from '@courseschedule/shared';
import { PlanRepository, PlanTaskRepository } from '../data/repositories/planRepository';
import { useAppStore } from './useAppStore';

/** 学习计划表单数据 */
export interface PlanFormData {
  title: string;
  description?: string;
  subject: string;
  startDate: ISODate;
  endDate: ISODate;
  status: PlanStatus;
}

/** 计划任务表单数据 */
export interface PlanTaskFormData {
  planId: string;
  title: string;
  description?: string;
  frequency: PlanTaskFrequency;
  weekdays?: Weekday[];
  specificDate?: ISODate;
  durationMin?: number;
}

/** 计划 Store 状态接口 */
interface PlanState {
  /** 学习计划列表 */
  plans: LearningPlan[];
  /** 计划任务列表（可按 planId 过滤） */
  tasks: PlanTask[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;

  /** 加载所有学习计划和任务 */
  loadAll: () => Promise<void>;
  /** 创建学习计划 */
  createPlan: (data: PlanFormData) => Promise<string>;
  /** 更新学习计划 */
  updatePlan: (plan: LearningPlan, data: PlanFormData) => Promise<void>;
  /** 删除学习计划（同时删除其所有任务） */
  deletePlan: (planId: string) => Promise<void>;
  /** 创建计划任务 */
  createTask: (data: PlanTaskFormData) => Promise<void>;
  /** 更新计划任务 */
  updateTask: (task: PlanTask, data: PlanTaskFormData) => Promise<void>;
  /** 删除计划任务 */
  deleteTask: (taskId: string) => Promise<void>;
  /** 切换任务启用状态 */
  toggleTaskActive: (taskId: string) => Promise<void>;
}

/** Repository 实例 */
export const planRepo = new PlanRepository();
export const planTaskRepo = new PlanTaskRepository();

/**
 * 学习计划 Store
 */
export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  tasks: [],
  loading: false,
  error: null,

  loadAll: async () => {
    const childId = useAppStore.getState().childId;
    set({ loading: true, error: null });
    try {
      const [plans, tasks] = await Promise.all([
        planRepo.listByChild(childId),
        planTaskRepo.listByChild(childId),
      ]);
      set({ plans, tasks, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createPlan: async (data) => {
    const childId = useAppStore.getState().childId;
    const now = Date.now();
    const plan: LearningPlan = {
      id: genId(),
      childId,
      createdAt: now,
      updatedAt: now,
      title: data.title,
      description: data.description,
      subject: data.subject,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
    };
    await planRepo.create(plan);
    await get().loadAll();
    return plan.id;
  },

  updatePlan: async (plan, data) => {
    const updated: LearningPlan = {
      ...plan,
      title: data.title,
      description: data.description,
      subject: data.subject,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      updatedAt: Date.now(),
    };
    await planRepo.update(updated);
    await get().loadAll();
  },

  deletePlan: async (planId) => {
    // 先删除该计划的所有任务
    await planTaskRepo.removeByPlan(planId);
    // 再删除计划本身
    await planRepo.remove(planId);
    await get().loadAll();
  },

  createTask: async (data) => {
    const childId = useAppStore.getState().childId;
    const now = Date.now();
    const task: PlanTask = {
      id: genId(),
      childId,
      createdAt: now,
      updatedAt: now,
      planId: data.planId,
      title: data.title,
      description: data.description,
      frequency: data.frequency,
      weekdays: data.weekdays,
      specificDate: data.specificDate,
      durationMin: data.durationMin,
      isActive: true,
    };
    await planTaskRepo.create(task);
    await get().loadAll();
  },

  updateTask: async (task, data) => {
    const updated: PlanTask = {
      ...task,
      title: data.title,
      description: data.description,
      frequency: data.frequency,
      weekdays: data.weekdays,
      specificDate: data.specificDate,
      durationMin: data.durationMin,
      updatedAt: Date.now(),
    };
    await planTaskRepo.update(updated);
    await get().loadAll();
  },

  deleteTask: async (taskId) => {
    await planTaskRepo.remove(taskId);
    await get().loadAll();
  },

  toggleTaskActive: async (taskId) => {
    const childId = useAppStore.getState().childId;
    const task = await planTaskRepo.getById(taskId);
    if (task) {
      await planTaskRepo.update({
        ...task,
        isActive: !task.isActive,
        updatedAt: Date.now(),
      });
      await get().loadAll();
    }
  },
}));
