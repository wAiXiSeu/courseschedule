/**
 * 复习 Repository —— Web 端内存实现
 *
 * 同时管理 ReviewItem 和 ReviewTask 的 CRUD。
 * TODO: 后续替换为 CloudRepository（云数据库实现）
 */

import type { ReviewItem, ReviewTask, ISODate } from '@courseschedule/shared';
import { MemoryRepository } from './base';

/**
 * 复习项 Repository
 */
export class ReviewItemRepository extends MemoryRepository<ReviewItem> {
  /**
   * 按来源查询（错题转化）
   */
  async listBySource(childId: string, sourceId: string): Promise<ReviewItem[]> {
    return this.filter(
      (item) => item.childId === childId && item.sourceId === sourceId
    );
  }

  /**
   * 按科目查询
   */
  async listBySubject(childId: string, subject: string): Promise<ReviewItem[]> {
    return this.filter(
      (item) => item.childId === childId && item.subject === subject
    );
  }
}

/**
 * 复习任务 Repository
 */
export class ReviewTaskRepository extends MemoryRepository<ReviewTask> {
  /**
   * 按复习项 ID 查询任务
   */
  async listByReviewItem(childId: string, reviewItemId: string): Promise<ReviewTask[]> {
    return this.filter(
      (t) => t.childId === childId && t.reviewItemId === reviewItemId
    );
  }

  /**
   * 查询到期未完成的任务（dueDate <= today 且 status='pending'）
   */
  async listDueByDate(childId: string, today: ISODate): Promise<ReviewTask[]> {
    return this.filter(
      (t) => t.childId === childId && t.status === 'pending' && t.dueDate <= today
    );
  }

  /**
   * 按状态筛选
   */
  async listByStatus(childId: string, status: ReviewTask['status']): Promise<ReviewTask[]> {
    return this.filter(
      (t) => t.childId === childId && t.status === status
    );
  }

  /**
   * 完成复习任务（更新状态和完成时间）
   */
  async complete(taskId: string, doneAt: number): Promise<ReviewTask> {
    const task = this.store.get(taskId);
    if (!task) {
      throw new Error(`复习任务 ${taskId} 不存在`);
    }
    task.status = 'done';
    task.doneAt = doneAt;
    task.updatedAt = Date.now();
    return task;
  }
}
