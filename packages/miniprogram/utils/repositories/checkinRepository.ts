/**
 * 打卡 Repository —— 小程序端云数据库实现
 */

import type { CheckInRecord, ISODate, CheckinRefType } from '@courseschedule/shared';
import { COLLECTIONS } from '@courseschedule/shared/src/cloud/collections';
import { getDatabase } from './cloud';

/**
 * 打卡 Repository（云数据库）
 */
export class CheckinRepository {
  private db = getDatabase();
  private collection = this.db.collection(COLLECTIONS.CHECKIN_RECORDS);

  async getById(id: string): Promise<CheckInRecord | undefined> {
    const res = await this.doc(id).get();
    return res.data as CheckInRecord | undefined;
  }

  async listByChild(childId: string): Promise<CheckInRecord[]> {
    const res = await this.collection
      .where({ childId })
      .get();
    return res.data as CheckInRecord[];
  }

  async create(record: CheckInRecord): Promise<CheckInRecord> {
    await this.collection.add({
      data: record,
    });
    return record;
  }

  async update(record: CheckInRecord): Promise<CheckInRecord> {
    await this.doc(record.id).update({
      data: record,
    });
    return record;
  }

  async remove(id: string): Promise<void> {
    await this.doc(id).remove();
  }

  async listByDate(childId: string, date: ISODate): Promise<CheckInRecord[]> {
    const res = await this.collection
      .where({ childId, date })
      .get();
    return res.data as CheckInRecord[];
  }

  async listByDateRange(
    childId: string,
    startDate: ISODate,
    endDate: ISODate
  ): Promise<CheckInRecord[]> {
    const res = await this.collection
      .where({
        childId,
        date: this.db.command.gte(startDate).and(this.db.command.lte(endDate)),
      })
      .get();
    return res.data as CheckInRecord[];
  }

  async listByRef(
    childId: string,
    refType: CheckinRefType,
    refId: string
  ): Promise<CheckInRecord[]> {
    const res = await this.collection
      .where({ childId, refType, refId })
      .get();
    return res.data as CheckInRecord[];
  }

  async findByDateAndRef(
    childId: string,
    refType: CheckinRefType,
    refId: string,
    date: ISODate
  ): Promise<CheckInRecord | undefined> {
    const res = await this.collection
      .where({ childId, refType, refId, date })
      .get();
    return res.data.length > 0 ? (res.data[0] as CheckInRecord) : undefined;
  }

  async listAllByChild(childId: string): Promise<CheckInRecord[]> {
    return this.listByChild(childId);
  }

  private doc(id: string) {
    return this.db.collection(COLLECTIONS.CHECKIN_RECORDS).doc(id);
  }
}
