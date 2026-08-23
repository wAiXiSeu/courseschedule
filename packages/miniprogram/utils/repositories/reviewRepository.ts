/**
 * 复习 Repository —— 小程序端云数据库实现
 */

import type { ReviewItem, ReviewTask, ISODate } from '@courseschedule/shared';
import { COLLECTIONS } from '@courseschedule/shared/src/cloud/collections';
import { getDatabase } from './cloud';

/**
 * 复习项 Repository（云数据库）
 */
export class ReviewItemRepository {
  private db = getDatabase();
  private collection = this.db.collection(COLLECTIONS.REVIEW_ITEMS);

  async getById(id: string): Promise<ReviewItem | undefined> {
    const res = await this.doc(id).get();
    return res.data as ReviewItem | undefined;
  }

  async listByChild(childId: string): Promise<ReviewItem[]> {
    const res = await this.collection
      .where({ childId })
      .get();
    return res.data as ReviewItem[];
  }

  async create(item: ReviewItem): Promise<ReviewItem> {
    await this.collection.add({
      data: item,
    });
    return item;
  }

  async update(item: ReviewItem): Promise<ReviewItem> {
    await this.doc(item.id).update({
      data: item,
    });
    return item;
  }

  async remove(id: string): Promise<void> {
    await this.doc(id).remove();
  }

  async listBySource(childId: string, sourceId: string): Promise<ReviewItem[]> {
    const res = await this.collection
      .where({ childId, sourceId })
      .get();
    return res.data as ReviewItem[];
  }

  async listBySubject(childId: string, subject: string): Promise<ReviewItem[]> {
    const res = await this.collection
      .where({ childId, subject })
      .get();
    return res.data as ReviewItem[];
  }

  private doc(id: string) {
    return this.db.collection(COLLECTIONS.REVIEW_ITEMS).doc(id);
  }
}

/**
 * 复习任务 Repository（云数据库）
 */
export class ReviewTaskRepository {
  private db = getDatabase();
  private collection = this.db.collection(COLLECTIONS.REVIEW_TASKS);

  async getById(id: string): Promise<ReviewTask | undefined> {
    const res = await this.doc(id).get();
    return res.data as ReviewTask | undefined;
  }

  async listByChild(childId: string): Promise<ReviewTask[]> {
    const res = await this.collection
      .where({ childId })
      .get();
    return res.data as ReviewTask[];
  }

  async create(task: ReviewTask): Promise<ReviewTask> {
    await this.collection.add({
      data: task,
    });
    return task;
  }

  async update(task: ReviewTask): Promise<ReviewTask> {
    await this.doc(task.id).update({
      data: task,
    });
    return task;
  }

  async remove(id: string): Promise<void> {
    await this.doc(id).remove();
  }

  async listByReviewItem(childId: string, reviewItemId: string): Promise<ReviewTask[]> {
    const res = await this.collection
      .where({ childId, reviewItemId })
      .get();
    return res.data as ReviewTask[];
  }

  async listDueByDate(childId: string, today: ISODate): Promise<ReviewTask[]> {
    const res = await this.collection
      .where({
        childId,
        status: 'pending',
        dueDate: this.db.command.lte(today),
      })
      .get();
    return res.data as ReviewTask[];
  }

  async listByStatus(childId: string, status: ReviewTask['status']): Promise<ReviewTask[]> {
    const res = await this.collection
      .where({ childId, status })
      .get();
    return res.data as ReviewTask[];
  }

  async complete(taskId: string, doneAt: number): Promise<ReviewTask> {
    const task = await this.getById(taskId);
    if (!task) {
      throw new Error(`复习任务 ${taskId} 不存在`);
    }
    task.status = 'done';
    task.doneAt = doneAt;
    task.updatedAt = Date.now();
    await this.update(task);
    return task;
  }

  private doc(id: string) {
    return this.db.collection(COLLECTIONS.REVIEW_TASKS).doc(id);
  }
}
