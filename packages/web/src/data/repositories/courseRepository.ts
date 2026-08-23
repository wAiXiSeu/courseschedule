/**
 * 课程 Repository —— Web 端内存实现
 *
 * TODO: 后续替换为 CloudRepository（云数据库实现）
 */

import type { Course } from '@courseschedule/shared';
import { MemoryRepository } from './base';

/**
 * 课程 Repository
 *
 * 管理课程定义的 CRUD 操作。
 * 当前使用内存实现，后续替换为云数据库。
 */
export class CourseRepository extends MemoryRepository<Course> {
  /**
   * 按课程类型筛选
   */
  async listByType(childId: string, type: Course['type']): Promise<Course[]> {
    return this.filter(
      (c) => c.childId === childId && c.type === type
    );
  }
}
