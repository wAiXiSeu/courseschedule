/**
 * 打卡 Repository —— 业务查询层（后端由 factory 决定：Supabase / 内存回退）
 */

import type { CheckInRecord, ISODate, CheckinRefType } from '@courseschedule/shared';
import { TableRepository } from './factory';

/**
 * 打卡 Repository
 *
 * 管理打卡记录的 CRUD 操作，支持按日期、范围、引用类型查询。
 */
export class CheckinRepository extends TableRepository<CheckInRecord> {
  constructor() {
    super('checkinRecords');
  }

  /**
   * 按日期查询打卡记录
   */
  async listByDate(childId: string, date: ISODate): Promise<CheckInRecord[]> {
    return (await this.listByChild(childId)).filter((r) => r.date === date);
  }

  /**
   * 按日期范围查询打卡记录
   */
  async listByDateRange(
    childId: string,
    startDate: ISODate,
    endDate: ISODate
  ): Promise<CheckInRecord[]> {
    return (await this.listByChild(childId)).filter(
      (r) => r.date >= startDate && r.date <= endDate
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
    return (await this.listByChild(childId)).filter(
      (r) => r.refType === refType && r.refId === refId
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
    return (await this.listByChild(childId)).find(
      (r) => r.refType === refType && r.refId === refId && r.date === date
    );
  }

  /**
   * 查询孩子所有打卡记录（用于统计）
   */
  async listAllByChild(childId: string): Promise<CheckInRecord[]> {
    return this.listByChild(childId);
  }
}
