/**
 * 复习 Repository —— 业务查询层（后端由 factory 决定：Supabase / 内存回退）
 *
 * 同时管理 ReviewItem 和 ReviewTask。
 */

import type { ReviewItem, ReviewTask, ISODate } from '@courseschedule/shared';
import { TableRepository } from './factory';

/**
 * 复习项 Repository
 */
export class ReviewItemRepository extends TableRepository<ReviewItem> {
  constructor() {
    super('reviewItems');
  }

  /**
   * 按来源查询（错题转化）
   */
  async listBySource(childId: string, sourceId: string): Promise<ReviewItem[]> {
    return (await this.listByChild(childId)).filter((item) => item.sourceId === sourceId);
  }

  /**
   * 按科目查询
   */
  async listBySubject(childId: string, subject: string): Promise<ReviewItem[]> {
    return (await this.listByChild(childId)).filter((item) => item.subject === subject);
  }
}

/**
 * 复习任务 Repository
 */
export class ReviewTaskRepository extends TableRepository<ReviewTask> {
  constructor() {
    super('reviewTasks');
  }

  /**
   * 按复习项 ID 查询任务
   */
  async listByReviewItem(childId: string, reviewItemId: string): Promise<ReviewTask[]> {
    return (await this.listByChild(childId)).filter((t) => t.reviewItemId === reviewItemId);
  }

  /**
   * 查询到期未完成的任务（dueDate <= today 且 status='pending'）
   */
  async listDueByDate(childId: string, today: ISODate): Promise<ReviewTask[]> {
    return (await this.listByChild(childId)).filter(
      (t) => t.status === 'pending' && t.dueDate <= today
    );
  }

  /**
   * 按状态筛选
   */
  async listByStatus(childId: string, status: ReviewTask['status']): Promise<ReviewTask[]> {
    return (await this.listByChild(childId)).filter((t) => t.status === status);
  }

  /**
   * 完成复习任务（落库状态与完成时间）
   */
  async complete(taskId: string, doneAt: number): Promise<ReviewTask> {
    const task = await this.getById(taskId);
    if (!task) {
      throw new Error(`复习任务 ${taskId} 不存在`);
    }
    return this.update({ ...task, status: 'done', doneAt, updatedAt: Date.now() });
  }
}
