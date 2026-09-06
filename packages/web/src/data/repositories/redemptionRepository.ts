/**
 * 兑换单 Repository —— 后端由 factory 决定（Supabase / 内存回退）
 *
 * 兑换单是积分系统唯一的「支出」凭证，状态机 pending → approved / rejected
 * 由 usePointsStore 驱动（approved 才进账本扣分）。
 */

import type { Redemption } from '@courseschedule/shared';
import { TableRepository } from './factory';

export class RedemptionRepository extends TableRepository<Redemption> {
  constructor() {
    super('redemptions');
  }
}
