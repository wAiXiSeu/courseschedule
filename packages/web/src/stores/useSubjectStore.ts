/**
 * 科目状态管理（zustand）
 *
 * 科目 = 中文名 + 类别 + 颜色，Course.color / 各 *.subject 字段存其 id。
 * 内置默认科目可在「科目管理」中修改、删除，也可手动添加新科目。
 * 数据归属当前家庭空间，存 Supabase subjects 表（未配置云端时为进程内回退）；
 * 空间内首次载入若无科目，优先迁移旧版 localStorage，否则铺内置默认科目。
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import {
  type Subject,
  type SubjectCategory,
  DEFAULT_SUBJECTS,
  SUBJECT_COLORS,
  SUBJECT_LABELS,
  genId,
} from '@courseschedule/shared';
import { SubjectRepository } from '../data/repositories/subjectRepository';
import { getCurrentFamilyId } from './useFamilyStore';

/** 旧版 persist 的 key，用于一次性迁移到云端 */
const LEGACY_STORAGE_KEY = 'courseschedule-subject-store';

const subjectRepo = new SubjectRepository(getCurrentFamilyId);

/** 新增/修改科目的输入 */
export interface SubjectInput {
  name: string;
  category: SubjectCategory;
  color: string;
}

/** 科目状态接口 */
interface SubjectState {
  subjects: Subject[];
  /** 载入当前账号的科目（云端为空时自动铺默认值） */
  load: () => Promise<void>;
  /** 添加科目，返回新科目 */
  addSubject: (input: SubjectInput) => Promise<Subject>;
  /** 修改科目（名称/类别/颜色） */
  updateSubject: (id: string, patch: Partial<SubjectInput>) => Promise<void>;
  /** 删除科目 */
  removeSubject: (id: string) => Promise<void>;
  /** 恢复内置默认科目表 */
  resetDefaults: () => Promise<void>;
}

const cloneDefaults = (): Subject[] => DEFAULT_SUBJECTS.map((s) => ({ ...s }));

/** 读取旧版 localStorage 里的科目（迁移用），没有则返回 null */
function readLegacySubjects(): Subject[] | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { subjects?: Subject[] } };
    const subjects = parsed?.state?.subjects;
    return Array.isArray(subjects) && subjects.length > 0 ? subjects : null;
  } catch {
    return null;
  }
}

/** 同一时刻只发一次载入请求 */
let pendingLoad: Promise<void> | null = null;

/**
 * 科目 Store
 */
export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: cloneDefaults(),

  load: async () => {
    if (!pendingLoad) {
      pendingLoad = (async () => {
        try {
          const cloud = await subjectRepo.list();
          if (cloud.length > 0) {
            set({ subjects: cloud });
          } else {
            const seed = readLegacySubjects() ?? cloneDefaults();
            await subjectRepo.createMany(seed);
            set({ subjects: seed });
          }
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch (err) {
          // 未执行建表脚本 / 网络异常：保留内置默认科目，不阻塞页面
          console.error(
            '[courseschedule] 科目载入失败，请确认已在 Supabase 执行 supabase/schema.sql：',
            err
          );
        }
      })().finally(() => {
        pendingLoad = null;
      });
    }
    return pendingLoad;
  },

  addSubject: async (input) => {
    const subject: Subject = { id: `sub_${genId(10)}`, ...input };
    await subjectRepo.create(subject);
    set((state) => ({ subjects: [...state.subjects, subject] }));
    return subject;
  },

  updateSubject: async (id, patch) => {
    const current = get().subjects.find((s) => s.id === id);
    if (!current) return;
    const next: Subject = { ...current, ...patch };
    await subjectRepo.update(next);
    set((state) => ({ subjects: state.subjects.map((s) => (s.id === id ? next : s)) }));
  },

  removeSubject: async (id) => {
    await subjectRepo.remove(id);
    set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) }));
  },

  resetDefaults: async () => {
    const seed = cloneDefaults();
    for (const subject of get().subjects) {
      await subjectRepo.remove(subject.id);
    }
    await subjectRepo.createMany(seed);
    set({ subjects: seed });
  },
}));

/** 按科目 id 解析中文名/颜色/类别；未命中时回退遗留映射表，保证旧数据可读 */
export const useSubjectResolver = (): ((id: string) => Subject) => {
  const subjects = useSubjectStore((state) => state.subjects);
  return useMemo(() => {
    const byId = new Map(subjects.map((s) => [s.id, s]));
    return (id: string): Subject =>
      byId.get(id) ?? {
        id,
        name: SUBJECT_LABELS[id] || id,
        color: SUBJECT_COLORS[id] || '#757575',
        category: 'general',
      };
  }, [subjects]);
};
