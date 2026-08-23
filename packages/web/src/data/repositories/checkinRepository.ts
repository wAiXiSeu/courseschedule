/**
 * 打卡 Repository —— Web 端内存实现
 *
 * TODO: 后续替换为 CloudRepository（云数据库实现）
 */

import type { CheckInRecord, ISODate, CheckinRefType } from '@courseschedule/shared';
import { MemoryRepository } from './base';

/**
 * 打卡 Repository
 *
 * 管理打卡记录的 CRUD 操作，支持按日期、范围、引用类型查询。
 * 当前使用内存实现，后续替换为云数据库。
 */
export class CheckinRepository extends MemoryRepository<CheckInRecord> {
  /**
   * 按日期查询打卡记录
   */
  async listByDate(childId: string, date: ISODate): Promise<CheckInRecord[]> {
    return this.filter(
      (r) => r.childId === childId && r.date === date
    );
  }

  /**
   * 按日期范围查询打卡记录
   */
  async listByDateRange(
    childId: string,
    startDate: ISODate,
    endDate: ISODate
  ): Promise<CheckInRecord[]> {
    return this.filter(
      (r) => r.childId === childId && r.date >= startDate && r.date <= endDate
    );
  }

  /**
   * 按引用类型和引用 ID 查询
   */
  async listByRef(
    childId: string,
    refType: CheckinRefType,
    refId: string
  ): Promise<CheckInRecord[]> {
    return this.filter(
      (r) => r.childId === childId && r.refType === refType && r.refId === refId
    );
  }

  /**
   * 查找指定日期、指定引用的打卡记录（用于 upsert）
   */
  async findByDateAndRef(
    childId: string,
    refType: CheckinRefType,
    refId: string,
    date: ISODate
  ): Promise<CheckInRecord | undefined> {
    for (const entity of this.store.values()) {
      if (
        entity.childId === childId &&
        entity.refType === refType &&
        entity.refId === refId &&
        entity.date === date
      ) {
        return entity;
      }
    }
    return undefined;
  }

  /**
   * 查询孩子所有打卡记录（用于统计）
   */
  async listAllByChild(childId: string): Promise<CheckInRecord[]> {
    return this.listByChild(childId);
  }
}
