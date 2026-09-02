/**
 * 登录状态管理（zustand）
 *
 * 邮箱 + 密码，走 Supabase Auth；数据行级隔离由 RLS 按 auth.uid() 保证。
 * 未配置 Supabase 时视为「本地试玩」：init() 直接置为已登录，仓储层回退内存实现。
 */

import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/** 鉴权状态：未初始化 / 已登录 / 未登录 */
export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthState {
  session: Session | null;
  status: AuthStatus;
  /** 读取当前会话并订阅后续变更（应用入口调用一次） */
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  status: 'loading',

  init: async () => {
    if (!isSupabaseConfigured) {
      set({ session: null, status: 'signedIn' });
      return;
    }
    // 重复调用时不重复订阅
    if (get().status !== 'loading') return;

    const {
      data: { session },
    } = await supabase!.auth.getSession();
    set({ session, status: session ? 'signedIn' : 'signedOut' });

    supabase!.auth.onAuthStateChange((_event, nextSession) => {
      set({ session: nextSession, status: nextSession ? 'signedIn' : 'signedOut' });
    });
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`登录失败：${error.message}`);
  },

  signUp: async (email, password) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase!.auth.signUp({ email, password });
    if (error) throw new Error(`注册失败：${error.message}`);
    const {
      data: { session },
    } = await supabase!.auth.getSession();
    if (!session) {
      throw new Error(
        '注册成功，但项目开启了邮箱确认：请到邮箱确认后再登录，或在 Supabase 后台关闭 Authentication → Providers → Email → Confirm email'
      );
    }
  },

  signOut: async () => {
    if (!isSupabaseConfigured) return;
    await supabase!.auth.signOut();
  },
}));
