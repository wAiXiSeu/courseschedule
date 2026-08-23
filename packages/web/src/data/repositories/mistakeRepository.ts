/**
 * 错题 Repository —— Web 端内存实现
 *
 * TODO: 后续替换为 CloudRepository（云数据库实现）
 */

import type { Mistake, ISODate, MasteryStatus } from '@courseschedule/shared';
import { MemoryRepository } from './base';

/**
 * 错题 Repository
 *
 * 管理错题记录的 CRUD 操作，支持按科目、日期、掌握状态筛选。
 * 当前使用内存实现，后续替换为云数据库。
 */
export class MistakeRepository extends MemoryRepository<Mistake> {
  /**
   * 按科目筛选
   */
  async listBySubject(childId: string, subject: string): Promise<Mistake[]> {
    return this.filter(
      (m) => m.childId === childId && m.subject === subject
    );
  }

  /**
   * 按日期范围筛选（按出错日期降序）
   */
  async listByDateRange(
    childId: string,
    startDate: ISODate,
    endDate: ISODate
  ): Promise<Mistake[]> {
    const result = await this.filter(
      (m) => m.childId === childId && m.mistakeDate >= startDate && m.mistakeDate <= endDate
    );
    // 按出错日期降序排列
    result.sort((a, b) => (a.mistakeDate < b.mistakeDate ? 1 : a.mistakeDate > b.mistakeDate ? -1 : 0));
    return result;
  }

  /**
   * 按掌握状态筛选
   */
  async listByMastery(
    childId: string,
    status: MasteryStatus
  ): Promise<Mistake[]> {
    return this.filter(
      (m) => m.childId === childId && m.masteryStatus === status
    );
  }

  /**
   * 按知识点筛选
   */
  async listByKnowledgePoint(
    childId: string,
    knowledgePoint: string
  ): Promise<Mistake[]> {
    return this.filter(
      (m) => m.childId === childId && m.knowledgePoints.includes(knowledgePoint)
    );
  }

  /**
   * 列出所有错题（按出错日期降序）
   */
  async listAllSorted(childId: string): Promise<Mistake[]> {
    const all = await this.listByChild(childId);
    all.sort((a, b) => (a.mistakeDate < b.mistakeDate ? 1 : a.mistakeDate > b.mistakeDate ? -1 : 0));
    return all;
  }
}
