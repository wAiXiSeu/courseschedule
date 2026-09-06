/**
 * 兑换品 Repository —— 后端由 factory 决定（Supabase / 内存回退）
 *
 * 兑换品由家长自定义并定价；isActive=false 只是下架，历史兑换单仍留在库里。
 */

import type { Reward } from '@courseschedule/shared';
import { TableRepository } from './factory';

export class RewardRepository extends TableRepository<Reward> {
  constructor() {
    super('rewards');
  }

  /** 商城在售清单：按所需积分从低到高，孩子一眼能看到「够得着」的目标 */
  async listActive(childId: string): Promise<Reward[]> {
    return (await this.listByChild(childId))
      .filter((r) => r.isActive)
      .sort((a, b) => a.cost - b.cost);
  }
}
