/**
 * 排课规则 Repository —— Web 端内存实现
 *
 * TODO: 后续替换为 CloudRepository（云数据库实现）
 */

import type { ScheduleRule, ISODate, Weekday } from '@courseschedule/shared';
import { MemoryRepository } from './base';

/**
 * 排课规则 Repository
 *
 * 管理排课规则的 CRUD 操作。
 * 当前使用内存实现，后续替换为云数据库。
 */
export class ScheduleRuleRepository extends MemoryRepository<ScheduleRule> {
  /**
   * 按课程 ID 查询规则
   */
  async listByCourse(childId: string, courseId: string): Promise<ScheduleRule[]> {
    return this.filter(
      (r) => r.childId === childId && r.courseId === courseId
    );
  }

  /**
   * 按星期几查询规则
   */
  async listByWeekday(childId: string, weekday: Weekday): Promise<ScheduleRule[]> {
    return this.filter(
      (r) => r.childId === childId && r.weekday === weekday && r.isActive
    );
  }

  /**
   * 查询指定日期区间内生效的规则
   */
  async listEffectiveInRange(
    childId: string,
    dateRange: { start: ISODate; end: ISODate }
  ): Promise<ScheduleRule[]> {
    return this.filter((r) => {
      if (r.childId !== childId) return false;
      if (!r.isActive) return false;
      // 规则生效区间与查询区间有交集
      if (r.effectiveUntil && r.effectiveUntil < dateRange.start) return false;
      if (r.effectiveFrom > dateRange.end) return false;
      return true;
    });
  }

  /**
   * 删除某课程的所有规则
   */
  async removeByCourse(courseId: string): Promise<void> {
    const toRemove: string[] = [];
    for (const entity of this.store.values()) {
      if (entity.courseId === courseId) {
        toRemove.push(entity.id);
      }
    }
    for (const id of toRemove) {
      this.store.delete(id);
    }
  }
}
