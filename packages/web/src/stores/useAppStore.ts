/**
 * 全局 UI 状态管理（zustand）
 *
 * 管理当前孩子 ID、家长/孩子模式、当前日期等全局 UI 状态。
 * 使用 persist 中间件持久化到 localStorage。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTodayISODate, addDays } from '@courseschedule/shared';

/** 用户模式：家长可编辑，孩子只读+打卡 */
export type UserMode = 'parent' | 'child';

/** 全局 UI 状态接口 */
interface AppState {
  /** 当前孩子 ID（首发固定默认值） */
  childId: string;
  /** 家长/孩子模式 */
  mode: UserMode;
  /** 当前查看日期（YYYY-MM-DD） */
  currentDate: string;
  /** 设置孩子 ID */
  setChildId: (id: string) => void;
  /** 切换模式 */
  setMode: (mode: UserMode) => void;
  /** 设置当前日期 */
  setCurrentDate: (date: string) => void;
  /** 回到今天 */
  goToday: () => void;
  /** 前进一天 */
  goNextDay: () => void;
  /** 后退一天 */
  goPrevDay: () => void;
}

/** 默认孩子 ID（与 db 种子数据对应） */
export const DEFAULT_CHILD_ID = 'default-child';

/**
 * 全局 UI Store
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      childId: DEFAULT_CHILD_ID,
      mode: 'parent',
      currentDate: getTodayISODate(),

      setChildId: (id: string) => set({ childId: id }),
      setMode: (mode: UserMode) => set({ mode }),
      setCurrentDate: (date: string) => set({ currentDate: date }),

      goToday: () => set({ currentDate: getTodayISODate() }),

      goNextDay: () =>
        set((state) => ({ currentDate: addDays(state.currentDate, 1) })),

      goPrevDay: () =>
        set((state) => ({ currentDate: addDays(state.currentDate, -1) })),
    }),
    {
      name: 'courseschedule-app-store',
      partialize: (state) => ({
        childId: state.childId,
        mode: state.mode,
      }),
    }
  )
);
