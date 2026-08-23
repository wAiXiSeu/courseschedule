/**
 * Repository 基础接口与内存实现 —— Web 端
 *
 * 定义通用的 Repository<T> 接口，供所有业务 Repository 继承。
 * MemoryRepository 为内存实现（方便开发调试），后续应替换为 CloudRepository。
 *
 * 参考 ARCHITECTURE_DELTA.md 方案 A：双端共用云数据库
 */

import type { BaseEntity } from '@courseschedule/shared';

/**
 * 通用 Repository 接口
 *
 * 所有业务 Repository 均需实现此接口，保证数据访问层的一致性。
 * 组件禁止直接访问 db / repository，必须经 Store action 调用。
 */
export interface Repository<T extends BaseEntity> {
  /** 根据 ID 获取单个实体 */
  getById(id: string): Promise<T | undefined>;

  /** 按 childId 列出所有实体 */
  listByChild(childId: string): Promise<T[]>;

  /** 创建实体（写入并返回） */
  create(entity: T): Promise<T>;

  /** 更新实体（覆盖写入并返回） */
  update(entity: T): Promise<T>;

  /** 根据 ID 删除实体 */
  remove(id: string): Promise<void>;

  /** 清空所有数据（调试用） */
  clear(): Promise<void>;
}

/**
 * 内存 Repository 实现
 *
 * 使用 Map 存储数据，便于开发调试和单测。
 * TODO: 后续替换为 CloudRepository（云数据库实现）。
 */
export class MemoryRepository<T extends BaseEntity> implements Repository<T> {
  /** 内存存储 */
  protected store = new Map<string, T>();

  async getById(id: string): Promise<T | undefined> {
    return this.store.get(id);
  }

  async listByChild(childId: string): Promise<T[]> {
    const result: T[] = [];
    for (const entity of this.store.values()) {
      if (entity.childId === childId) {
        result.push(entity);
      }
    }
    return result;
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

  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * 获取所有数据（调试用）
   */
  getAll(): T[] {
    return Array.from(this.store.values());
  }

  /**
   * 按条件过滤（扩展查询）
   */
  async filter(predicate: (entity: T) => boolean): Promise<T[]> {
    const result: T[] = [];
    for (const entity of this.store.values()) {
      if (predicate(entity)) {
        result.push(entity);
      }
    }
    return result;
  }
}
