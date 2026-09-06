/**
 * 家长手工加减积分流水 Repository —— 后端由 factory 决定（Supabase / 内存回退）
 *
 * 派生积分不落库，本表只存家长手动增删的那几条，排序交给积分账本纯函数。
 */

import type { PointAdjustment } from '@courseschedule/shared';
import { TableRepository } from './factory';

export class PointAdjustmentRepository extends TableRepository<PointAdjustment> {
  constructor() {
    super('pointAdjustments');
  }
}
