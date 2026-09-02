/**
 * 学习计划 Repository —— 业务查询层（后端由 factory 决定：Supabase / 内存回退）
 *
 * 同时管理 LearningPlan 和 PlanTask。
 */

import type { LearningPlan, PlanTask, PlanStatus } from '@courseschedule/shared';
import { TableRepository } from './factory';

/**
 * 学习计划 Repository
 */
export class PlanRepository extends TableRepository<LearningPlan> {
  constructor() {
    super('learningPlans');
  }

  /**
   * 按计划状态筛选
   */
  async listByStatus(childId: string, status: PlanStatus): Promise<LearningPlan[]> {
    return (await this.listByChild(childId)).filter((p) => p.status === status);
  }

  /**
   * 查询活跃计划
   */
  async listActive(childId: string): Promise<LearningPlan[]> {
    return this.listByStatus(childId, 'active');
  }
}

/**
 * 计划任务 Repository
 */
export class PlanTaskRepository extends TableRepository<PlanTask> {
  constructor() {
    super('planTasks');
  }

  /**
   * 按计划 ID 查询任务
   */
  async listByPlan(childId: string, planId: string): Promise<PlanTask[]> {
    return (await this.listByChild(childId)).filter((t) => t.planId === planId);
  }

  /**
   * 查询活跃的计划任务
   */
  async listActive(childId: string): Promise<PlanTask[]> {
    return (await this.listByChild(childId)).filter((t) => t.isActive);
  }

  /**
   * 删除某计划的所有任务（跨孩子，按 planId 归属）
   */
  async removeByPlan(planId: string): Promise<void> {
    await this.removeMany(
      (await this.listAll()).filter((t) => t.planId === planId)
    );
  }
}
