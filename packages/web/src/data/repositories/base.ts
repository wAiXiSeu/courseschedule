/**
 * Repository 基础接口与内存回退实现 —— Web 端
 *
 * 定义通用的 Repository<T> 接口，供所有业务 Repository 实现。
 * 组件禁止直接访问 repository，必须经 Store action 调用。
 *
 * MemoryRepository 为未配置 Supabase 时的本地回退（数据刷新即丢）；
 * 云端实现见 supabaseRepository.ts，后端选择见 factory.ts。
 */

import type { BaseEntity } from '@courseschedule/shared';

/**
 * 通用 Repository 接口
 *
 * 内存回退与 Supabase 后端各自实现一份，业务 Repository 只依赖这组原语，
 * 差异全部收敛在 factory.ts。
 */
export interface Repository<T extends BaseEntity> {
  /** 根据 ID 获取单个实体 */
  getById(id: string): Promise<T | undefined>;

  /** 按 childId 列出所有实体 */
  listByChild(childId: string): Promise<T[]>;

  /** 列出当前可见的全部实体（云端由 RLS 限定到当前登录用户） */
  listAll(): Promise<T[]>;

  /** 创建实体（写入并返回） */
  create(entity: T): Promise<T>;

  /** 更新实体（覆盖写入并返回） */
  update(entity: T): Promise<T>;

  /** 根据 ID 删除实体 */
  remove(id: string): Promise<void>;
}

/**
 * 内存 Repository（本地回退实现）
 *
 * 表名在进程内共享一份 Map，等价于一个只有本次会话存在的库。
 */
export class MemoryRepository<T extends BaseEntity> implements Repository<T> {
  private store = new Map<string, T>();

  async getById(id: string): Promise<T | undefined> {
    return this.store.get(id);
  }

  async listByChild(childId: string): Promise<T[]> {
    return Array.from(this.store.values()).filter((e) => e.childId === childId);
  }

  async listAll(): Promise<T[]> {
    return Array.from(this.store.values());
  }

  async create(entity: T): Promise<T> {
    this.store.set(entity.id, { ...entity });
    return entity;
  }

  async update(entity: T): Promise<T> {
    if (!this.store.has(entity.id)) {
      throw new Error(`实体 ${entity.id} 不存在，无法更新`);
    }
    this.store.set(entity.id, { ...entity });
    return entity;
  }

  async remove(id: string): Promise<void> {
    this.store.delete(id);
  }
}

/** 进程内共享的内存表，键为表名 */
const memoryBackends = new Map<string, MemoryRepository<BaseEntity>>();

/** 取指定表的内存后端（同名表复用同一份数据） */
export function getMemoryBackend<T extends BaseEntity>(table: string): Repository<T> {
  let backend = memoryBackends.get(table);
  if (!backend) {
    backend = new MemoryRepository<BaseEntity>();
    memoryBackends.set(table, backend);
  }
  return backend as unknown as Repository<T>;
}
