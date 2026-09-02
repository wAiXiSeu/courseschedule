/**
 * 科目 Repository
 *
 * 科目挂在家庭空间名下（无 childId），且 Subject 不含时间戳字段，
 * 与通用 Repository<T> 的形状不同，故单独实现；未配置 Supabase 时回退内存。
 * familyId 由构造时注入的作用域函数提供（空间未就绪时云端读写被拒绝）。
 */

import type { Subject } from '@courseschedule/shared';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { FamilyScope } from './supabaseRepository';

/** 内存回退：进程内共享一份科目表 */
const memorySubjects = new Map<string, Subject>();

function fail(action: string, message: string): never {
  throw new Error(`[Supabase] subjects ${action}失败：${message}`);
}

export class SubjectRepository {
  constructor(private readonly scope: FamilyScope = () => null) {}

  /** 当前空间就绪则返回 familyId；云端未就绪返回 null（读=空、写=拒绝） */
  private familyOrNull(): string | null {
    return isSupabaseConfigured ? this.scope() : 'local';
  }

  private requireFamily(): string {
    const familyId = this.familyOrNull();
    if (!familyId) throw new Error('[Supabase] 当前家庭空间未就绪，无法读写科目');
    return familyId;
  }

  async list(): Promise<Subject[]> {
    const familyId = this.familyOrNull();
    if (!familyId) return [];
    if (!isSupabaseConfigured) {
      return Array.from(memorySubjects.values());
    }
    const { data, error } = await supabase!
      .from('subjects')
      .select('id, name, category, color')
      .eq('familyId', familyId);
    if (error) fail('查询', error.message);
    return (data ?? []) as Subject[];
  }

  async create(subject: Subject): Promise<Subject> {
    if (!isSupabaseConfigured) {
      memorySubjects.set(subject.id, { ...subject });
      return subject;
    }
    const { error } = await supabase!
      .from('subjects')
      .insert({ ...subject, familyId: this.requireFamily() });
    if (error) fail('写入', error.message);
    return subject;
  }

  async update(subject: Subject): Promise<Subject> {
    const { id, ...columns } = subject;
    if (!isSupabaseConfigured) {
      memorySubjects.set(id, { id, ...columns });
      return subject;
    }
    const { error } = await supabase!
      .from('subjects')
      .update({ ...columns, updatedAt: Date.now() })
      .eq('id', id)
      .eq('familyId', this.requireFamily());
    if (error) fail('更新', error.message);
    return subject;
  }

  async remove(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      memorySubjects.delete(id);
      return;
    }
    const { error } = await supabase!
      .from('subjects')
      .delete()
      .eq('id', id)
      .eq('familyId', this.requireFamily());
    if (error) fail('删除', error.message);
  }

  /** 批量写入（新空间铺默认科目 / 旧版 localStorage 迁移） */
  async createMany(subjects: Subject[]): Promise<void> {
    if (subjects.length === 0) return;
    if (!isSupabaseConfigured) {
      for (const subject of subjects) {
        memorySubjects.set(subject.id, { ...subject });
      }
      return;
    }
    const familyId = this.requireFamily();
    const { error } = await supabase!
      .from('subjects')
      .insert(subjects.map((s) => ({ ...s, familyId })));
    if (error) fail('批量写入', error.message);
  }
}
