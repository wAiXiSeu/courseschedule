/**
 * Repository 的 Supabase 实现
 *
 * 列名与 TS 领域模型 1:1（camelCase，建表时加双引号保留），因此直接透传对象、无需字段映射。
 * 数据隔离键 familyId 由当前家庭空间注入（见 factory.ts），userId（创建人）由
 * 服务端 default auth.uid() 写入：两者都不信任前端实体上的残留值，防止越权改写归属。
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BaseEntity } from '@courseschedule/shared';
import { supabase } from '../../lib/supabase';
import type { Repository } from './base';

/** 取当前家庭空间 ID（尚未就绪时返回 null） */
export type FamilyScope = () => string | null;

const noScope: FamilyScope = () => null;

function fail(table: string, action: string, message: string): never {
  throw new Error(`[Supabase] ${table} ${action}失败：${message}`);
}

/** 剔除服务端托管列，其余字段即为数据列 */
function toColumns(entity: BaseEntity, ...drop: string[]): Record<string, unknown> {
  const columns: Record<string, unknown> = { ...entity };
  for (const key of ['userId', ...drop]) delete columns[key];
  return columns;
}

/**
 * 单表 Supabase Repository
 *
 * 读写的 familyId 过滤与 RLS 双重保险：RLS 限定「我可见的家庭」，
 * 本类再按当前选中的空间过滤，保证多空间数据不串。
 */
export class SupabaseRepository<T extends BaseEntity> implements Repository<T> {
  private readonly client: SupabaseClient;

  constructor(
    private readonly table: string,
    client?: SupabaseClient,
    private readonly scope: FamilyScope = noScope
  ) {
    const resolved = client ?? supabase;
    if (!resolved) {
      throw new Error('[Supabase] 客户端未初始化，无法访问云端数据');
    }
    this.client = resolved;
  }

  async getById(id: string): Promise<T | undefined> {
    const familyId = this.scope();
    if (!familyId) return undefined;
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('familyId', familyId)
      .eq('id', id)
      .maybeSingle();
    if (error) fail(this.table, '查询', error.message);
    return (data ?? undefined) as T | undefined;
  }

  async listByChild(childId: string): Promise<T[]> {
    const familyId = this.scope();
    if (!familyId) return [];
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('familyId', familyId)
      .eq('childId', childId);
    if (error) fail(this.table, '查询', error.message);
    return (data ?? []) as T[];
  }

  async listAll(): Promise<T[]> {
    const familyId = this.scope();
    if (!familyId) return [];
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('familyId', familyId);
    if (error) fail(this.table, '查询', error.message);
    return (data ?? []) as T[];
  }

  async create(entity: T): Promise<T> {
    const { data, error } = await this.client
      .from(this.table)
      .insert({ ...toColumns(entity), familyId: this.requireFamily() })
      .select('*')
      .single();
    if (error) fail(this.table, '写入', error.message);
    return data as T;
  }

  async update(entity: T): Promise<T> {
    const { id, ...columns } = toColumns(entity, 'familyId');
    const { data, error } = await this.client
      .from(this.table)
      .update(columns)
      .eq('id', id)
      .eq('familyId', this.requireFamily())
      .select('*')
      .single();
    if (error) fail(this.table, '更新', error.message);
    return data as T;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.table)
      .delete()
      .eq('id', id)
      .eq('familyId', this.requireFamily());
    if (error) fail(this.table, '删除', error.message);
  }

  private requireFamily(): string {
    const familyId = this.scope();
    if (!familyId) {
      throw new Error(`[Supabase] 当前家庭空间未就绪，无法写入 ${this.table}`);
    }
    return familyId;
  }
}
