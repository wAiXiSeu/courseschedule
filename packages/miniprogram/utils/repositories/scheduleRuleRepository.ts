/**
 * 排课规则 Repository —— 小程序端云数据库实现
 */

import type { ScheduleRule, ISODate, Weekday } from '@courseschedule/shared';
import { COLLECTIONS } from '@courseschedule/shared/src/cloud/collections';
import { getDatabase } from './cloud';

/**
 * 排课规则 Repository（云数据库）
 */
export class ScheduleRuleRepository {
  private db = getDatabase();
  private collection = this.db.collection(COLLECTIONS.SCHEDULE_RULES);

  async getById(id: string): Promise<ScheduleRule | undefined> {
    const res = await this.doc(id).get();
    return res.data as ScheduleRule | undefined;
  }

  async listByChild(childId: string): Promise<ScheduleRule[]> {
    const res = await this.collection
      .where({ childId })
      .get();
    return res.data as ScheduleRule[];
  }

  async create(rule: ScheduleRule): Promise<ScheduleRule> {
    await this.collection.add({
      data: rule,
    });
    return rule;
  }

  async update(rule: ScheduleRule): Promise<ScheduleRule> {
    await this.doc(rule.id).update({
      data: rule,
    });
    return rule;
  }

  async remove(id: string): Promise<void> {
    await this.doc(id).remove();
  }

  async listByCourse(childId: string, courseId: string): Promise<ScheduleRule[]> {
    const res = await this.collection
      .where({ childId, courseId })
      .get();
    return res.data as ScheduleRule[];
  }

  async listByWeekday(childId: string, weekday: Weekday): Promise<ScheduleRule[]> {
    const res = await this.collection
      .where({ childId, weekday, isActive: true })
      .get();
    return res.data as ScheduleRule[];
  }

  async listEffectiveInRange(
    childId: string,
    dateRange: { start: ISODate; end: ISODate }
  ): Promise<ScheduleRule[]> {
    // 云数据库查询需要手动过滤生效区间
    const res = await this.collection
      .where({
        childId,
        isActive: true,
      })
      .get();

    const rules = res.data as ScheduleRule[];
    return rules.filter((r) => {
      if (r.effectiveUntil && r.effectiveUntil < dateRange.start) return false;
      if (r.effectiveFrom > dateRange.end) return false;
      return true;
    });
  }

  async removeByCourse(courseId: string): Promise<void> {
    const res = await this.collection
      .where({ courseId })
      .get();

    for (const rule of res.data) {
      await this.doc(rule._id).remove();
    }
  }

  private doc(id: string) {
    return this.db.collection(COLLECTIONS.SCHEDULE_RULES).doc(id);
  }
}
