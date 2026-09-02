/**
 * 数据后端工厂
 *
 * 已配置 Supabase → 走云端表（RLS 按家庭空间隔离，成员经邀请并接受后共享数据）；
 * 未配置 → 回退进程内内存（数据刷新即丢，便于本地试玩）。
 *
 * 业务 Repository 只需继承 TableRepository 并实现自己的查询方法，
 * 不感知后端差异。
 */

import type { BaseEntity } from '@courseschedule/shared';
import { isSupabaseConfigured } from '../../lib/supabase';
import { getCurrentFamilyId } from '../../stores/useFamilyStore';
import { getMemoryBackend, type Repository } from './base';
import { SupabaseRepository } from './supabaseRepository';

/** 按环境选择指定表的后端实现 */
export function createBackend<T extends BaseEntity>(table: string): Repository<T> {
  return isSupabaseConfigured
    ? new SupabaseRepository<T>(table, undefined, getCurrentFamilyId)
    : getMemoryBackend<T>(table);
}

/**
 * 业务 Repository 基类
 *
 * 转发通用 CRUD；查询方法一律基于 getById / listByChild / listAll 三个原语在 JS 侧过滤，
 * 保证内存回退与云端行为一致。
 */
export abstract class TableRepository<T extends BaseEntity> implements Repository<T> {
  protected readonly db: Repository<T>;

  constructor(table: string) {
    this.db = createBackend<T>(table);
  }

  getById(id: string): Promise<T | undefined> {
    return this.db.getById(id);
  }

  listByChild(childId: string): Promise<T[]> {
    return this.db.listByChild(childId);
  }

  listAll(): Promise<T[]> {
    return this.db.listAll();
  }

  create(entity: T): Promise<T> {
    return this.db.create(entity);
  }

  update(entity: T): Promise<T> {
    return this.db.update(entity);
  }

  remove(id: string): Promise<void> {
    return this.db.remove(id);
  }

  /** 批量删除（云端为逐行 DELETE，行数极少） */
  protected async removeMany(entities: T[]): Promise<void> {
    for (const entity of entities) {
      await this.remove(entity.id);
    }
  }
}
