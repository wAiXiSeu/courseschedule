import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Config } from './config';

export async function signIn(cfg: Config): Promise<{ client: SupabaseClient; userId: string }> {
  const client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { autoRefreshToken: true, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: cfg.email,
    password: cfg.password,
  });
  if (error || !data.user) {
    throw new Error(`Supabase 登录失败：${error?.message ?? '未返回用户'}`);
  }
  return { client, userId: data.user.id };
}

export interface FamilyRef {
  id: string;
  name: string;
}

export async function resolveFamily(client: SupabaseClient, familyId?: string): Promise<FamilyRef> {
  const { data, error } = await client.from('families').select('id, name');
  if (error) throw new Error(`读取家庭空间失败：${error.message}`);
  const families = (data ?? []) as FamilyRef[];

  if (familyId) {
    const picked = families.find((f) => f.id === familyId);
    if (!picked) throw new Error(`家庭空间 ${familyId} 对该账号不可见`);
    return picked;
  }
  if (families.length === 1) return families[0];
  if (families.length === 0) {
    throw new Error('该账号没有可见的家庭空间，请先在 web 端登录一次完成初始化');
  }
  throw new Error(
    `账号可见多个家庭空间，请用 FAMILY_ID 指定其一：${families.map((f) => `${f.name}(${f.id})`).join('、')}`
  );
}

/**
 * 家庭空间作用域的数据访问
 *
 * 与 web 端 SupabaseRepository 同一口径：读写强制带 familyId，叠加 RLS 双重隔离；
 * userId（创建人）由服务端 default auth.uid() 写入，不在客户端传。
 */
export class FamilyDb {
  constructor(
    private readonly client: SupabaseClient,
    readonly familyId: string
  ) {}

  async list<T>(table: string, childId?: string): Promise<T[]> {
    let query = this.client.from(table).select('*').eq('familyId', this.familyId);
    if (childId !== undefined) query = query.eq('childId', childId);
    const { data, error } = await query;
    if (error) throw new Error(`读取 ${table} 失败：${error.message}`);
    return (data ?? []) as T[];
  }

  async insert<T>(table: string, row: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.client
      .from(table)
      .insert({ ...row, familyId: this.familyId })
      .select('*')
      .single();
    if (error) throw new Error(`写入 ${table} 失败：${error.message}`);
    return data as T;
  }

  async update<T>(table: string, id: string, patch: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.client
      .from(table)
      .update(patch)
      .eq('id', id)
      .eq('familyId', this.familyId)
      .select('*')
      .single();
    if (error) throw new Error(`更新 ${table} 失败：${error.message}`);
    return data as T;
  }

  async remove(table: string, id: string): Promise<void> {
    const { error } = await this.client
      .from(table)
      .delete()
      .eq('id', id)
      .eq('familyId', this.familyId);
    if (error) throw new Error(`删除 ${table} 失败：${error.message}`);
  }
}