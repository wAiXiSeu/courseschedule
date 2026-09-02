/**
 * 排课规则 Repository —— 业务查询层（后端由 factory 决定：Supabase / 内存回退）
 */

import type { ScheduleRule, ISODate, Weekday } from '@courseschedule/shared';
import { TableRepository } from './factory';

/**
 * 排课规则 Repository
 *
 * 管理排课规则的 CRUD 操作。
 */
export class ScheduleRuleRepository extends TableRepository<ScheduleRule> {
  constructor() {
    super('scheduleRules');
  }

  /**
   * 按课程 ID 查询规则
   */
  async listByCourse(childId: string, courseId: string): Promise<ScheduleRule[]> {
    return (await this.listByChild(childId)).filter((r) => r.courseId === courseId);
  }

  /**
   * 按星期几查询规则
   */
  async listByWeekday(childId: string, weekday: Weekday): Promise<ScheduleRule[]> {
    return (await this.listByChild(childId)).filter(
      (r) => r.weekday === weekday && r.isActive
    );
  }

  /**
   * 查询指定日期区间内生效的规则
   */
  async listEffectiveInRange(
    childId: string,
    dateRange: { start: ISODate; end: ISODate }
  ): Promise<ScheduleRule[]> {
    return (await this.listByChild(childId)).filter((r) => {
      if (!r.isActive) return false;
      // 规则生效区间与查询区间有交集
      if (r.effectiveUntil && r.effectiveUntil < dateRange.start) return false;
      if (r.effectiveFrom > dateRange.end) return false;
      return true;
    });
  }

  /**
   * 删除某课程的所有规则（跨孩子，按 courseId 归属）
   */
  async removeByCourse(courseId: string): Promise<void> {
    await this.removeMany(
      (await this.listAll()).filter((r) => r.courseId === courseId)
    );
  }
}
