/**
 * Supabase 客户端单例
 *
 * 环境变量缺失时导出 null，数据层自动回退到内存实现（本地试玩）。
 * 配置见 packages/web/.env.example，建表脚本见仓库根 supabase/schema.sql。
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** 是否已配置云端（两个 env 均非空） */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    '[courseschedule] 未配置 Supabase，数据仅存于内存、刷新即丢。' +
      '请参考 packages/web/.env.example 创建 packages/web/.env，' +
      '并在 Supabase SQL Editor 执行 supabase/schema.sql。'
  );
}
