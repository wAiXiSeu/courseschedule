/**
 * 学习计划 Repository —— 小程序端云数据库实现
 */

import type { LearningPlan, PlanTask, PlanStatus } from '@courseschedule/shared';
import { COLLECTIONS } from '@courseschedule/shared/src/cloud/collections';
import { getDatabase } from './cloud';

/**
 * 学习计划 Repository（云数据库）
 */
export class PlanRepository {
  private db = getDatabase();
  private collection = this.db.collection(COLLECTIONS.LEARNING_PLANS);

  async getById(id: string): Promise<LearningPlan | undefined> {
    const res = await this.doc(id).get();
    return res.data as LearningPlan | undefined;
  }

  async listByChild(childId: string): Promise<LearningPlan[]> {
    const res = await this.collection
      .where({ childId })
      .get();
    return res.data as LearningPlan[];
  }

  async create(plan: LearningPlan): Promise<LearningPlan> {
    await this.collection.add({
      data: plan,
    });
    return plan;
  }

  async update(plan: LearningPlan): Promise<LearningPlan> {
    await this.doc(plan.id).update({
      data: plan,
    });
    return plan;
  }

  async remove(id: string): Promise<void> {
    await this.doc(id).remove();
  }

  async listByStatus(childId: string, status: PlanStatus): Promise<LearningPlan[]> {
    const res = await this.collection
      .where({ childId, status })
      .get();
    return res.data as LearningPlan[];
  }

  async listActive(childId: string): Promise<LearningPlan[]> {
    return this.listByStatus(childId, 'active');
  }

  private doc(id: string) {
    return this.db.collection(COLLECTIONS.LEARNING_PLANS).doc(id);
  }
}

/**
 * 计划任务 Repository（云数据库）
 */
export class PlanTaskRepository {
  private db = getDatabase();
  private collection = this.db.collection(COLLECTIONS.PLAN_TASKS);

  async getById(id: string): Promise<PlanTask | undefined> {
    const res = await this.doc(id).get();
    return res.data as PlanTask | undefined;
  }

  async listByChild(childId: string): Promise<PlanTask[]> {
    const res = await this.collection
      .where({ childId })
      .get();
    return res.data as PlanTask[];
  }

  async create(task: PlanTask): Promise<PlanTask> {
    await this.collection.add({
      data: task,
    });
    return task;
  }

  async update(task: PlanTask): Promise<PlanTask> {
    await this.doc(task.id).update({
      data: task,
    });
    return task;
  }

  async remove(id: string): Promise<void> {
    await this.doc(id).remove();
  }

  async listByPlan(childId: string, planId: string): Promise<PlanTask[]> {
    const res = await this.collection
      .where({ childId, planId })
      .get();
    return res.data as PlanTask[];
  }

  async listActive(childId: string): Promise<PlanTask[]> {
    const res = await this.collection
      .where({ childId, isActive: true })
      .get();
    return res.data as PlanTask[];
  }

  async removeByPlan(planId: string): Promise<void> {
    const res = await this.collection
      .where({ planId })
      .get();

    for (const task of res.data) {
      await this.doc(task._id).remove();
    }
  }

  private doc(id: string) {
    return this.db.collection(COLLECTIONS.PLAN_TASKS).doc(id);
  }
}
