/**
 * 积分状态管理（zustand）
 *
 * 账本的唯一持有者：自己拉取全部输入（打卡 / 计划任务 / 复习任务 / 错题 /
 * 手工流水 / 兑换单），交给 shared 的积分纯函数算出流水与余额。
 * 打卡、错题、复习等页面在改动会影响分数的记录后调用 load() 刷新，
 * 保证顶栏余额与实际账本同源。
 */

import { create } from 'zustand';
import {
  buildPointLedger,
  calculateCurrentStreak,
  calculateLongestStreak,
  computeBalance,
  genId,
  getTodayISODate,
  type CheckInRecord,
  type ISODate,
  type Mistake,
  type PlanTask,
  type PointAdjustment,
  type PointBalance,
  type PointEntry,
  type Redemption,
  type Reward,
  type ReviewItem,
  type ReviewTask,
} from '@courseschedule/shared';
import { CheckinRepository } from '../data/repositories/checkinRepository';
import { MistakeRepository } from '../data/repositories/mistakeRepository';
import { PlanTaskRepository } from '../data/repositories/planRepository';
import { PointAdjustmentRepository } from '../data/repositories/pointAdjustmentRepository';
import { RedemptionRepository } from '../data/repositories/redemptionRepository';
import { ReviewItemRepository, ReviewTaskRepository } from '../data/repositories/reviewRepository';
import { useAppStore } from './useAppStore';
import { useAuthStore } from './useAuthStore';

/**
 * 自建仓储实例（不复用各业务 store 导出的单例）
 *
 * 避免「业务 store 刷新积分 → 积分 store 引入业务 store」的循环依赖；
 * 内存回退按表名共享同一份数据，云端本就无状态，多实例读到的仍是同一份。
 */
const checkinRepo = new CheckinRepository();
const planTaskRepo = new PlanTaskRepository();
const reviewTaskRepo = new ReviewTaskRepository();
const reviewItemRepo = new ReviewItemRepository();
const mistakeRepo = new MistakeRepository();
const adjustmentRepo = new PointAdjustmentRepository();
const redemptionRepo = new RedemptionRepository();

/** 操作结果：兑换与家长审批需要把「为什么不行」直接讲给孩子听 */
export interface PointsActionOutcome {
  ok: boolean;
  message?: string;
}

interface PointsState {
  records: CheckInRecord[];
  planTasks: PlanTask[];
  reviewTasks: ReviewTask[];
  reviewItems: ReviewItem[];
  mistakes: Mistake[];
  adjustments: PointAdjustment[];
  redemptions: Redemption[];

  /** 完整流水（已排序） */
  ledger: PointEntry[];
  balance: PointBalance;
  currentStreak: number;
  longestStreak: number;
  loading: boolean;
  error: string | null;

  load: () => Promise<void>;
  addAdjustment: (input: { points: number; reason: string; date?: ISODate }) => Promise<void>;
  removeAdjustment: (id: string) => Promise<void>;
  /** 孩子/家长提交兑换单：余额不足直接拒绝下单 */
  redeem: (reward: Reward) => Promise<PointsActionOutcome>;
  /** 家长通过：再次校验余额，pending 期间积分可能已被回冲或被别的兑换占用 */
  approveRedemption: (id: string) => Promise<PointsActionOutcome>;
  rejectRedemption: (id: string) => Promise<void>;
}

const EMPTY_BALANCE: PointBalance = { balance: 0, earned: 0, spent: 0, penalty: 0 };

/** 同一时刻只发一次载入请求 */
let pendingLoad: Promise<void> | null = null;

export const usePointsStore = create<PointsState>((set, get) => ({
  records: [],
  planTasks: [],
  reviewTasks: [],
  reviewItems: [],
  mistakes: [],
  adjustments: [],
  redemptions: [],

  ledger: [],
  balance: EMPTY_BALANCE,
  currentStreak: 0,
  longestStreak: 0,
  loading: false,
  error: null,

  load: async () => {
    if (pendingLoad) return pendingLoad;

    pendingLoad = (async () => {
      const childId = useAppStore.getState().childId;
      set({ loading: true, error: null });
      try {
        const [records, planTasks, reviewTasks, reviewItems, mistakes, adjustments, redemptions] =
          await Promise.all([
            checkinRepo.listAllByChild(childId),
            planTaskRepo.listByChild(childId),
            reviewTaskRepo.listByChild(childId),
            reviewItemRepo.listByChild(childId),
            mistakeRepo.listByChild(childId),
            adjustmentRepo.listByChild(childId),
            redemptionRepo.listByChild(childId),
          ]);

        const today = getTodayISODate();
        const ledger = buildPointLedger({
          today,
          records,
          planTasks,
          reviewTasks,
          reviewItemTitles: Object.fromEntries(reviewItems.map((i) => [i.id, i.title])),
          mistakes,
          adjustments,
          redemptions,
        });

        set({
          records,
          planTasks,
          reviewTasks,
          reviewItems,
          mistakes,
          adjustments,
          redemptions,
          ledger,
          balance: computeBalance(ledger),
          currentStreak: calculateCurrentStreak(records, today),
          longestStreak: calculateLongestStreak(records),
          loading: false,
        });
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      } finally {
        pendingLoad = null;
      }
    })();

    return pendingLoad;
  },

  addAdjustment: async ({ points, reason, date }) => {
    const childId = useAppStore.getState().childId;
    const now = Date.now();
    const adjustment: PointAdjustment = {
      id: genId(),
      childId,
      createdAt: now,
      updatedAt: now,
      date: date ?? getTodayISODate(),
      points,
      reason,
    };
    await adjustmentRepo.create(adjustment);
    await get().load();
  },

  removeAdjustment: async (id) => {
    await adjustmentRepo.remove(id);
    await get().load();
  },

  redeem: async (reward) => {
    const { balance, redemptions } = get();

    if (redemptions.some((r) => r.rewardId === reward.id && r.status === 'pending')) {
      return { ok: false, message: `「${reward.title}」已经有一张待确认的兑换单了` };
    }
    if (balance.balance < reward.cost) {
      return {
        ok: false,
        message: `积分不够，还差 ${reward.cost - Math.max(balance.balance, 0)} ⭐`,
      };
    }

    const childId = useAppStore.getState().childId;
    const userId = useAuthStore.getState().session?.user.id ?? '';
    const now = Date.now();
    const redemption: Redemption = {
      id: genId(),
      childId,
      createdAt: now,
      updatedAt: now,
      rewardId: reward.id,
      rewardTitle: reward.title,
      rewardEmoji: reward.emoji,
      cost: reward.cost,
      status: 'pending',
      requestedBy: userId,
      requestedAt: now,
    };
    await redemptionRepo.create(redemption);
    await get().load();
    return { ok: true, message: '已提交，等家长确认' };
  },

  approveRedemption: async (id) => {
    const redemption = get().redemptions.find((r) => r.id === id);
    if (!redemption || redemption.status !== 'pending') {
      return { ok: false, message: '这张兑换单已经处理过了' };
    }

    // 不扣自己：此刻本单还是 pending，balance 尚未包含它
    const { balance } = get();
    if (balance.balance < redemption.cost) {
      return {
        ok: false,
        message: `积分只剩 ${balance.balance} ⭐，不够这张 ${redemption.cost} ⭐ 的兑换单，请拒绝或让孩子再攒攒`,
      };
    }

    const userId = useAuthStore.getState().session?.user.id ?? '';
    const now = Date.now();
    await redemptionRepo.update({
      ...redemption,
      status: 'approved',
      reviewedBy: userId,
      reviewedAt: now,
      updatedAt: now,
    });
    await get().load();
    return { ok: true };
  },

  rejectRedemption: async (id) => {
    const redemption = get().redemptions.find((r) => r.id === id);
    if (!redemption || redemption.status !== 'pending') return;

    const userId = useAuthStore.getState().session?.user.id ?? '';
    const now = Date.now();
    await redemptionRepo.update({
      ...redemption,
      status: 'rejected',
      reviewedBy: userId,
      reviewedAt: now,
      updatedAt: now,
    });
    await get().load();
  },
}));

/** 顶栏余额胶囊用：待家长确认的兑换单数量 */
export const usePendingRedemptionCount = (): number =>
  usePointsStore((s) => s.redemptions.filter((r) => r.status === 'pending').length);
