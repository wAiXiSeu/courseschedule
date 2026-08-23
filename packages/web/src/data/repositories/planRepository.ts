/**
 * 学习计划 Repository —— Web 端内存实现
 *
 * 同时管理 LearningPlan 和 PlanTask 的 CRUD。
 * TODO: 后续替换为 CloudRepository（云数据库实现）
 */

import type { LearningPlan, PlanTask, PlanStatus } from '@courseschedule/shared';
import { MemoryRepository } from './base';

/**
 * 学习计划 Repository
 */
export class PlanRepository extends MemoryRepository<LearningPlan> {
  /**
   * 按计划状态筛选
   */
  async listByStatus(childId: string, status: PlanStatus): Promise<LearningPlan[]> {
    return this.filter(
      (p) => p.childId === childId && p.status === status
    );
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
export class PlanTaskRepository extends MemoryRepository<PlanTask> {
  /**
   * 按计划 ID 查询任务
   */
  async listByPlan(childId: string, planId: string): Promise<PlanTask[]> {
    return this.filter(
      (t) => t.childId === childId && t.planId === planId
    );
  }

  /**
   * 查询活跃的计划任务
   */
  async listActive(childId: string): Promise<PlanTask[]> {
    return this.filter(
      (t) => t.childId === childId && t.isActive
    );
  }

  /**
   * 删除某计划的所有任务
   */
  async removeByPlan(planId: string): Promise<void> {
    const toRemove: string[] = [];
    for (const entity of this.store.values()) {
      if (entity.planId === planId) {
        toRemove.push(entity.id);
      }
    }
    for (const id of toRemove) {
      this.store.delete(id);
    }
  }
}
