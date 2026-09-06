/**
 * 错题本状态管理（zustand）
 *
 * 管理错题的 CRUD、筛选与掌握状态切换。
 * 调用 MistakeRepository 持久化，与 useScheduleStore 保持一致的写法。
 */

import { create } from 'zustand';
import {
  type Mistake,
  type ISODate,
  type MasteryStatus,
  genId,
} from '@courseschedule/shared';
import { MistakeRepository } from '../data/repositories/mistakeRepository';
import { useAppStore } from './useAppStore';
import { usePointsStore } from './usePointsStore';

/* ─── 筛选条件 ─── */

/** 错题筛选条件 */
export interface MistakeFilter {
  /** 按科目筛选（空 = 全部） */
  subject: string;
  /** 按知识点筛选（空 = 全部） */
  knowledgePoint: string;
  /** 筛选起始日期 YYYY-MM-DD（空 = 不限） */
  startDate: ISODate;
  /** 筛选截止日期 YYYY-MM-DD（空 = 不限） */
  endDate: ISODate;
}

/** 默认筛选条件 */
const DEFAULT_FILTER: MistakeFilter = {
  subject: '',
  knowledgePoint: '',
  startDate: '',
  endDate: '',
};

/* ─── 错题表单数据 ─── */

/** 错题表单数据（用于创建/编辑） */
export interface MistakeFormData {
  /** 科目 */
  subject: string;
  /** 知识点列表 */
  knowledgePoints: string[];
  /** 题目文字 */
  questionText: string;
  /** 图片 ID 列表（云存储 fileID；当前暂用 base64 占位） */
  imageIds: string[];
  /** 错误原因标签 */
  reasonTags: string[];
  /** 出错日期 YYYY-MM-DD（默认当天） */
  mistakeDate: ISODate;
  /** 掌握状态 */
  masteryStatus: MasteryStatus;
}

/* ─── Store 接口 ─── */

/** 错题本状态接口 */
interface MistakeState {
  /** 错题列表（已按出错日期降序） */
  mistakes: Mistake[];
  /** 筛选条件 */
  filter: MistakeFilter;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;

  /** 加载错题列表 */
  loadAll: () => Promise<void>;
  /** 新增错题 */
  addMistake: (data: MistakeFormData) => Promise<void>;
  /** 更新错题 */
  updateMistake: (mistake: Mistake, data: MistakeFormData) => Promise<void>;
  /** 删除错题 */
  deleteMistake: (mistakeId: string) => Promise<void>;
  /** 切换掌握状态 */
  toggleMastery: (mistakeId: string) => Promise<void>;
  /** 设置筛选条件（整体替换） */
  applyFilter: (filter: Partial<MistakeFilter>) => void;
  /** 重置筛选条件 */
  resetFilter: () => void;
}

/** Repository 实例 */
const mistakeRepo = new MistakeRepository();

/** 导出供其他模块使用 */
export { mistakeRepo };

/**
 * 根据筛选条件在内存中过滤错题列表
 * 由于 MistakeRepository 的内存实现，我们在 store 层做多条件组合筛选
 */
function applyFilterToMistakes(
  mistakes: Mistake[],
  filter: MistakeFilter
): Mistake[] {
  let result = [...mistakes];

  // 按科目筛选
  if (filter.subject) {
    result = result.filter((m) => m.subject === filter.subject);
  }

  // 按知识点筛选
  if (filter.knowledgePoint) {
    result = result.filter((m) =>
      m.knowledgePoints.includes(filter.knowledgePoint)
    );
  }

  // 按起始日期筛选（mistakeDate >= startDate）
  if (filter.startDate) {
    result = result.filter((m) => m.mistakeDate >= filter.startDate);
  }

  // 按截止日期筛选（mistakeDate <= endDate）
  if (filter.endDate) {
    result = result.filter((m) => m.mistakeDate <= filter.endDate);
  }

  return result;
}

/**
 * 错题本 Store
 */
export const useMistakeStore = create<MistakeState>((set, get) => ({
  mistakes: [],
  filter: { ...DEFAULT_FILTER },
  loading: false,
  error: null,

  loadAll: async () => {
    const childId = useAppStore.getState().childId;
    set({ loading: true, error: null });
    try {
      const allMistakes = await mistakeRepo.listAllSorted(childId);
      // 应用筛选
      const filtered = applyFilterToMistakes(allMistakes, get().filter);
      set({ mistakes: filtered, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  addMistake: async (data) => {
    const childId = useAppStore.getState().childId;
    const now = Date.now();

    const mistake: Mistake = {
      id: genId(),
      childId,
      createdAt: now,
      updatedAt: now,
      subject: data.subject,
      knowledgePoints: data.knowledgePoints,
      questionText: data.questionText,
      imageIds: data.imageIds,
      reasonTags: data.reasonTags,
      mistakeDate: data.mistakeDate,
      masteryStatus: data.masteryStatus,
    };

    await mistakeRepo.create(mistake);
    await get().loadAll();
  },

  updateMistake: async (mistake, data) => {
    const now = Date.now();

    const updated: Mistake = {
      ...mistake,
      subject: data.subject,
      knowledgePoints: data.knowledgePoints,
      questionText: data.questionText,
      imageIds: data.imageIds,
      reasonTags: data.reasonTags,
      mistakeDate: data.mistakeDate,
      masteryStatus: data.masteryStatus,
      updatedAt: now,
    };

    await mistakeRepo.update(updated);
    await get().loadAll();
  },

  deleteMistake: async (mistakeId) => {
    await mistakeRepo.remove(mistakeId);
    await get().loadAll();
    await usePointsStore.getState().load();
  },

  toggleMastery: async (mistakeId) => {
    const childId = useAppStore.getState().childId;
    const mistake = await mistakeRepo.getById(mistakeId);
    if (!mistake) return;

    const newStatus: MasteryStatus =
      mistake.masteryStatus === 'pending' ? 'mastered' : 'pending';

    await mistakeRepo.update({
      ...mistake,
      masteryStatus: newStatus,
      updatedAt: Date.now(),
    });

    await get().loadAll();
    // 掌握状态即积分开关：来回切换会同步加减那笔分
    await usePointsStore.getState().load();
  },

  applyFilter: (partial) => {
    const currentFilter = get().filter;
    const newFilter = { ...currentFilter, ...partial };
    set({ filter: newFilter });
    // 筛选条件变化后重新加载（触发过滤）
    get().loadAll();
  },

  resetFilter: () => {
    set({ filter: { ...DEFAULT_FILTER } });
    get().loadAll();
  },
}));
