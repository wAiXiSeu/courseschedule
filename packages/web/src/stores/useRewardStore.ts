/**
 * 兑换品状态管理（zustand）
 *
 * 兑换品由家长在积分页自定义并定价；数据归属当前家庭空间。
 * 空间内首次载入若一条都没有，铺内置默认兑换品（与科目 store 同一策略）。
 */

import { create } from 'zustand';
import { type Reward, DEFAULT_REWARDS, genId } from '@courseschedule/shared';
import { RewardRepository } from '../data/repositories/rewardRepository';
import { useAppStore } from './useAppStore';

/** Repository 实例 */
export const rewardRepo = new RewardRepository();

/** 新增/修改兑换品的输入 */
export interface RewardInput {
  title: string;
  emoji: string;
  description?: string;
  cost: number;
  isActive: boolean;
}

interface RewardState {
  rewards: Reward[];
  loading: boolean;
  error: string | null;

  /** 载入本空间兑换品（为空时铺默认值） */
  loadAll: () => Promise<void>;
  addReward: (input: RewardInput) => Promise<void>;
  updateReward: (id: string, patch: Partial<RewardInput>) => Promise<void>;
  removeReward: (id: string) => Promise<void>;
}

/** 同一时刻只发一次载入请求 */
let pendingLoad: Promise<void> | null = null;

export const useRewardStore = create<RewardState>((set, get) => ({
  rewards: [],
  loading: false,
  error: null,

  loadAll: async () => {
    if (pendingLoad) return pendingLoad;

    pendingLoad = (async () => {
      const childId = useAppStore.getState().childId;
      set({ loading: true, error: null });
      try {
        const rewards = await rewardRepo.listByChild(childId);
        if (rewards.length > 0) {
          set({ rewards, loading: false });
          return;
        }
        // 新空间首次进入积分页：铺默认兑换品，家长可随意改删
        const now = Date.now();
        const seeded: Reward[] = DEFAULT_REWARDS.map((seed, i) => ({
          ...seed,
          id: genId(),
          childId,
          createdAt: now + i,
          updatedAt: now + i,
        }));
        for (const reward of seeded) {
          await rewardRepo.create(reward);
        }
        set({ rewards: seeded, loading: false });
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      } finally {
        pendingLoad = null;
      }
    })();

    return pendingLoad;
  },

  addReward: async (input) => {
    const childId = useAppStore.getState().childId;
    const now = Date.now();
    const reward: Reward = { id: genId(), childId, createdAt: now, updatedAt: now, ...input };
    await rewardRepo.create(reward);
    set({ rewards: [...get().rewards, reward] });
  },

  updateReward: async (id, patch) => {
    const current = get().rewards.find((r) => r.id === id);
    if (!current) return;
    const next: Reward = { ...current, ...patch, updatedAt: Date.now() };
    await rewardRepo.update(next);
    set({ rewards: get().rewards.map((r) => (r.id === id ? next : r)) });
  },

  removeReward: async (id) => {
    await rewardRepo.remove(id);
    set({ rewards: get().rewards.filter((r) => r.id !== id) });
  },
}));
