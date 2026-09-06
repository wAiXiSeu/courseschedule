/**
 * 打卡状态管理（zustand）
 *
 * 管理 CheckInRecord 的 CRUD，调用 checkinRepository 持久化。
 * 使用 streak 纯函数计算统计数据。
 * 参考 ARCHITECTURE.md 第 4.2 节。
 */

import { create } from 'zustand';
import {
  type CheckInRecord,
  type CheckinRefType,
  type ISODate,
  type TaskView,
  genId,
  calculateTotalCheckinDays,
  calculateWeekStrip,
  calculateCompletionRate,
  getMondayOfWeek,
  getTodayISODate,
} from '@courseschedule/shared';
import { CheckinRepository } from '../data/repositories/checkinRepository';
import { useAppStore } from './useAppStore';
import { usePointsStore } from './usePointsStore';

/** 打卡 Store 状态接口 */
interface CheckinState {
  /** 打卡记录列表 */
  records: CheckInRecord[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;

  /** 加载所有打卡记录 */
  loadAll: () => Promise<void>;
  /** 打卡（创建或更新记录） */
  checkin: (refType: CheckinRefType, refId: string, date: ISODate) => Promise<void>;
  /** 取消打卡 */
  uncheckin: (refType: CheckinRefType, refId: string, date: ISODate) => Promise<void>;
  /** 获取统计：累计打卡天数 */
  getTotalDays: () => number;
  /** 获取统计：本周打卡格子 */
  getWeekStrip: () => boolean[];
  /** 获取统计：今日完成率 */
  getCompletionRate: (tasks: TaskView[]) => { done: number; total: number };
}

/** Repository 实例 */
export const checkinRepo = new CheckinRepository();

/**
 * 打卡 Store
 */
export const useCheckinStore = create<CheckinState>((set, get) => ({
  records: [],
  loading: false,
  error: null,

  loadAll: async () => {
    const childId = useAppStore.getState().childId;
    set({ loading: true, error: null });
    try {
      const records = await checkinRepo.listAllByChild(childId);
      set({ records, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  checkin: async (refType, refId, date) => {
    const childId = useAppStore.getState().childId;
    // 检查是否已存在打卡记录
    const existing = await checkinRepo.findByDateAndRef(childId, refType, refId, date);
    if (existing) {
      return; // 已打卡，不重复创建
    }

    const now = Date.now();
    const record: CheckInRecord = {
      id: genId(),
      childId,
      createdAt: now,
      updatedAt: now,
      refType,
      refId,
      date,
      doneAt: now,
      isMakeup: false,
    };
    await checkinRepo.create(record);
    await get().loadAll();
    await usePointsStore.getState().load();
  },

  uncheckin: async (refType, refId, date) => {
    const childId = useAppStore.getState().childId;
    const record = await checkinRepo.findByDateAndRef(childId, refType, refId, date);
    if (record) {
      await checkinRepo.remove(record.id);
      await get().loadAll();
      // 派生积分随打卡记录消失，余额即时回冲
      await usePointsStore.getState().load();
    }
  },

  getTotalDays: () => {
    const { records } = get();
    return calculateTotalCheckinDays(records);
  },

  getWeekStrip: () => {
    const { records } = get();
    const weekStart = getMondayOfWeek(getTodayISODate());
    return calculateWeekStrip(records, weekStart);
  },

  getCompletionRate: (tasks) => {
    const { records } = get();
    const currentDate = useAppStore.getState().currentDate;
    // 过滤出今日的打卡记录
    const todayRecords = records.filter((r) => r.date === currentDate);
    return calculateCompletionRate(tasks, todayRecords);
  },
}));
