/**
 * 课程 Repository —— 小程序端云数据库实现
 */

import type { Course } from '@courseschedule/shared';
import { COLLECTIONS } from '@courseschedule/shared/src/cloud/collections';
import { getDatabase } from './cloud';

/**
 * 课程 Repository（云数据库）
 */
export class CourseRepository {
  private db = getDatabase();
  private collection = this.db.collection(COLLECTIONS.COURSES);

  /**
   * 根据 ID 获取课程
   */
  async getById(id: string): Promise<Course | undefined> {
    const res = await this.doc(id).get();
    return res.data as Course | undefined;
  }

  /**
   * 按 childId 列出所有课程
   */
  async listByChild(childId: string): Promise<Course[]> {
    const res = await this.collection
      .where({ childId })
      .get();
    return res.data as Course[];
  }

  /**
   * 创建课程
   */
  async create(course: Course): Promise<Course> {
    await this.collection.add({
      data: course,
    });
    return course;
  }

  /**
   * 更新课程
   */
  async update(course: Course): Promise<Course> {
    await this.doc(course.id).update({
      data: course,
    });
    return course;
  }

  /**
   * 删除课程
   */
  async remove(id: string): Promise<void> {
    await this.doc(id).remove();
  }

  /**
   * 按课程类型筛选
   */
  async listByType(childId: string, type: Course['type']): Promise<Course[]> {
    const res = await this.collection
      .where({ childId, type })
      .get();
    return res.data as Course[];
  }

  private doc(id: string) {
    return this.db.collection(COLLECTIONS.COURSES).doc(id);
  }
}
