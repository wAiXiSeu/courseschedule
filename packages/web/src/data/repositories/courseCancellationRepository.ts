/**
 * 课程取消 Repository —— 业务查询层（后端由 factory 决定：Supabase / 内存回退）
 */

import type { CourseCancellation, ISODate } from '@courseschedule/shared';
import { TableRepository } from './factory';

/** 取消记录定位键：ruleId|date */
export const cancellationKey = (ruleId: string, date: ISODate): string => `${ruleId}|${date}`;

/**
 * 课程取消 Repository
 *
 * 记录某节排课（ruleId）在指定日期被取消及原因。
 */
export class CourseCancellationRepository extends TableRepository<CourseCancellation> {
  constructor() {
    super('courseCancellations');
  }

  /**
   * 按日期范围查询该孩子的取消记录
   */
  async listBetween(
    childId: string,
    startDate: ISODate,
    endDate: ISODate
  ): Promise<CourseCancellation[]> {
    return (await this.listByChild(childId)).filter(
      (c) => c.date >= startDate && c.date <= endDate
    );
  }

  /**
   * 按规则与日期定位取消记录
   */
  async findByRuleAndDate(
    childId: string,
    ruleId: string,
    date: ISODate
  ): Promise<CourseCancellation | undefined> {
    return (await this.listByChild(childId)).find(
      (c) => c.ruleId === ruleId && c.date === date
    );
  }

  /**
   * 删除某课程的所有取消记录（删除课程时清理）
   */
  async removeByCourse(courseId: string): Promise<void> {
    await this.removeMany(
      (await this.listAll()).filter((c) => c.courseId === courseId)
    );
  }

  /**
   * 删除某个规则在指定日期的取消（恢复本节课）
   */
  async removeByRuleAndDate(ruleId: string, date: ISODate): Promise<void> {
    const target = (await this.listAll()).find(
      (c) => c.ruleId === ruleId && c.date === date
    );
    if (target) {
      await this.remove(target.id);
    }
  }
}