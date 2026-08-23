/**
 * 错题 Repository —— 小程序端云数据库实现
 */

import type { Mistake, ISODate, MasteryStatus } from '@courseschedule/shared';
import { COLLECTIONS } from '@courseschedule/shared/src/cloud/collections';
import { getDatabase } from './cloud';

/**
 * 错题 Repository（云数据库）
 */
export class MistakeRepository {
  private db = getDatabase();
  private collection = this.db.collection(COLLECTIONS.MISTAKES);

  async getById(id: string): Promise<Mistake | undefined> {
    const res = await this.doc(id).get();
    return res.data as Mistake | undefined;
  }

  async listByChild(childId: string): Promise<Mistake[]> {
    const res = await this.collection
      .where({ childId })
      .get();
    return res.data as Mistake[];
  }

  async create(mistake: Mistake): Promise<Mistake> {
    await this.collection.add({
      data: mistake,
    });
    return mistake;
  }

  async update(mistake: Mistake): Promise<Mistake> {
    await this.doc(mistake.id).update({
      data: mistake,
    });
    return mistake;
  }

  async remove(id: string): Promise<void> {
    await this.doc(id).remove();
  }

  async listBySubject(childId: string, subject: string): Promise<Mistake[]> {
    const res = await this.collection
      .where({ childId, subject })
      .get();
    return res.data as Mistake[];
  }

  async listByDateRange(
    childId: string,
    startDate: ISODate,
    endDate: ISODate
  ): Promise<Mistake[]> {
    const res = await this.collection
      .where({
        childId,
        mistakeDate: this.db.command.gte(startDate).and(this.db.command.lte(endDate)),
      })
      .get();

    const mistakes = res.data as Mistake[];
    // 按出错日期降序排列
    mistakes.sort((a, b) => (a.mistakeDate < b.mistakeDate ? 1 : a.mistakeDate > b.mistakeDate ? -1 : 0));
    return mistakes;
  }

  async listByMastery(
    childId: string,
    status: MasteryStatus
  ): Promise<Mistake[]> {
    const res = await this.collection
      .where({ childId, masteryStatus: status })
      .get();
    return res.data as Mistake[];
  }

  async listByKnowledgePoint(
    childId: string,
    knowledgePoint: string
  ): Promise<Mistake[]> {
    const res = await this.collection
      .where({
        childId,
        knowledgePoints: knowledgePoint,
      })
      .get();
    return res.data as Mistake[];
  }

  async listAllSorted(childId: string): Promise<Mistake[]> {
    const all = await this.listByChild(childId);
    all.sort((a, b) => (a.mistakeDate < b.mistakeDate ? 1 : a.mistakeDate > b.mistakeDate ? -1 : 0));
    return all;
  }

  private doc(id: string) {
    return this.db.collection(COLLECTIONS.MISTAKES).doc(id);
  }
}
