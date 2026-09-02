/**
 * 错题 Repository —— 业务查询层（后端由 factory 决定：Supabase / 内存回退）
 */

import type { Mistake, ISODate, MasteryStatus } from '@courseschedule/shared';
import { TableRepository } from './factory';

/** 按出错日期降序 */
function byDateDesc(a: Mistake, b: Mistake): number {
  return a.mistakeDate < b.mistakeDate ? 1 : a.mistakeDate > b.mistakeDate ? -1 : 0;
}

/**
 * 错题 Repository
 *
 * 管理错题记录的 CRUD 操作，支持按科目、日期、掌握状态筛选。
 */
export class MistakeRepository extends TableRepository<Mistake> {
  constructor() {
    super('mistakes');
  }

  /**
   * 按科目筛选
   */
  async listBySubject(childId: string, subject: string): Promise<Mistake[]> {
    return (await this.listByChild(childId)).filter((m) => m.subject === subject);
  }

  /**
   * 按日期范围筛选（按出错日期降序）
   */
  async listByDateRange(
    childId: string,
    startDate: ISODate,
    endDate: ISODate
  ): Promise<Mistake[]> {
    const result = (await this.listByChild(childId)).filter(
      (m) => m.mistakeDate >= startDate && m.mistakeDate <= endDate
    );
    return result.sort(byDateDesc);
  }

  /**
   * 按掌握状态筛选
   */
  async listByMastery(childId: string, status: MasteryStatus): Promise<Mistake[]> {
    return (await this.listByChild(childId)).filter((m) => m.masteryStatus === status);
  }

  /**
   * 按知识点筛选
   */
  async listByKnowledgePoint(
    childId: string,
    knowledgePoint: string
  ): Promise<Mistake[]> {
    return (await this.listByChild(childId)).filter((m) =>
      m.knowledgePoints.includes(knowledgePoint)
    );
  }

  /**
   * 列出所有错题（按出错日期降序）
   */
  async listAllSorted(childId: string): Promise<Mistake[]> {
    return (await this.listByChild(childId)).sort(byDateDesc);
  }
}
