/**
 * 课程 Repository —— 业务查询层（后端由 factory 决定：Supabase / 内存回退）
 */

import type { Course } from '@courseschedule/shared';
import { TableRepository } from './factory';

/**
 * 课程 Repository
 *
 * 管理课程定义的 CRUD 操作。
 */
export class CourseRepository extends TableRepository<Course> {
  constructor() {
    super('courses');
  }

  /**
   * 按课程类型筛选
   */
  async listByType(childId: string, type: Course['type']): Promise<Course[]> {
    return (await this.listByChild(childId)).filter((c) => c.type === type);
  }
}
