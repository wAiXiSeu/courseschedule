/**
 * 课程表状态管理（zustand）
 *
 * 管理课程和排课规则的 CRUD，调用 Repository 持久化。
 */

import { create } from 'zustand';
import {
  type Course,
  type ScheduleRule,
  type CourseCancellation,
  type ISODate,
  genId,
  expandRulesToOccurrences,
} from '@courseschedule/shared';
import { CourseRepository } from '../data/repositories/courseRepository';
import { ScheduleRuleRepository } from '../data/repositories/scheduleRuleRepository';
import { CourseCancellationRepository } from '../data/repositories/courseCancellationRepository';
import { useAppStore } from './useAppStore';
import { useSubjectStore } from './useSubjectStore';

/** 课程表单数据（用于创建/编辑） */
export interface CourseFormData {
  type: Course['type'];
  location?: string;
  /** 科目 id（Course.color），课程标题即该科目名 */
  color: string;
  note?: string;
  rules: ScheduleRuleFormData[];
}

/** 按科目 id 取中文名；科目被删除时退回原 id，保证历史数据可读 */
const subjectName = (subjectId: string): string =>
  useSubjectStore.getState().subjects.find((s) => s.id === subjectId)?.name ?? subjectId;

/** 排课规则表单数据 */
export interface ScheduleRuleFormData {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  effectiveFrom: ISODate;
  effectiveUntil?: ISODate;
}

/** 课程表状态接口 */
interface ScheduleState {
  /** 课程列表 */
  courses: Course[];
  /** 排课规则列表 */
  rules: ScheduleRule[];
  /** 课程取消记录（某节课在某天被取消） */
  cancellations: CourseCancellation[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;

  /** 加载所有课程和规则 */
  loadAll: () => Promise<void>;
  /** 创建课程（含多条排课规则） */
  createCourse: (data: CourseFormData) => Promise<void>;
  /** 更新课程 */
  updateCourse: (course: Course, data: CourseFormData) => Promise<void>;
  /** 删除课程（同时删除其所有规则） */
  deleteCourse: (courseId: string) => Promise<void>;
  /** 切换课程启用状态 */
  toggleCourseActive: (courseId: string) => Promise<void>;
  /** 取消某节课：备注原因（已存在则更新原因） */
  cancelOccurrence: (
    courseId: string,
    ruleId: string,
    date: ISODate,
    reason: string
  ) => Promise<void>;
  /** 恢复某节课（删除其取消记录） */
  uncancelOccurrence: (ruleId: string, date: ISODate) => Promise<void>;
}

/** Repository 实例 */
const courseRepo = new CourseRepository();
const ruleRepo = new ScheduleRuleRepository();
const cancellationRepo = new CourseCancellationRepository();

// 导出供其他模块使用
export { courseRepo, ruleRepo, cancellationRepo };

/**
 * 课程表 Store
 */
export const useScheduleStore = create<ScheduleState>((set, get) => ({
  courses: [],
  rules: [],
  cancellations: [],
  loading: false,
  error: null,

  loadAll: async () => {
    const childId = useAppStore.getState().childId;
    set({ loading: true, error: null });
    try {
      const [courses, rules, cancellations] = await Promise.all([
        courseRepo.listByChild(childId),
        ruleRepo.listByChild(childId),
        cancellationRepo.listByChild(childId),
      ]);
      set({ courses, rules, cancellations, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createCourse: async (data) => {
    const childId = useAppStore.getState().childId;
    const now = Date.now();

    // 创建课程
    const course: Course = {
      id: genId(),
      childId,
      createdAt: now,
      updatedAt: now,
      name: subjectName(data.color),
      type: data.type,
      location: data.location,
      color: data.color,
      note: data.note,
    };

    await courseRepo.create(course);

    // 创建关联的排课规则
    const rules: ScheduleRule[] = data.rules.map((ruleData) => ({
      id: genId(),
      childId,
      createdAt: now,
      updatedAt: now,
      courseId: course.id,
      weekday: ruleData.weekday,
      startTime: ruleData.startTime,
      endTime: ruleData.endTime,
      repeatType: 'weekly' as const,
      effectiveFrom: ruleData.effectiveFrom,
      effectiveUntil: ruleData.effectiveUntil,
      isActive: true,
    }));

    for (const rule of rules) {
      await ruleRepo.create(rule);
    }

    // 刷新状态
    await get().loadAll();
  },

  updateCourse: async (course, data) => {
    const now = Date.now();

    // 更新课程基本信息
    const updatedCourse: Course = {
      ...course,
      name: subjectName(data.color),
      type: data.type,
      location: data.location,
      color: data.color,
      note: data.note,
      updatedAt: now,
    };
    await courseRepo.update(updatedCourse);

    // 删除旧规则，创建新规则
    await ruleRepo.removeByCourse(course.id);

    const childId = useAppStore.getState().childId;
    for (const ruleData of data.rules) {
      const rule: ScheduleRule = {
        id: genId(),
        childId,
        createdAt: now,
        updatedAt: now,
        courseId: course.id,
        weekday: ruleData.weekday,
        startTime: ruleData.startTime,
        endTime: ruleData.endTime,
        repeatType: 'weekly',
        effectiveFrom: ruleData.effectiveFrom,
        effectiveUntil: ruleData.effectiveUntil,
        isActive: true,
      };
      await ruleRepo.create(rule);
    }

    await get().loadAll();
  },

  deleteCourse: async (courseId) => {
    // 先删除关联的规则与取消记录
    await ruleRepo.removeByCourse(courseId);
    await cancellationRepo.removeByCourse(courseId);
    // 再删除课程
    await courseRepo.remove(courseId);
    await get().loadAll();
  },

  toggleCourseActive: async (courseId) => {
    const childId = useAppStore.getState().childId;
    // 切换该课程所有规则的 isActive 状态
    const rules = await ruleRepo.listByCourse(childId, courseId);
    for (const rule of rules) {
      await ruleRepo.update({
        ...rule,
        isActive: !rule.isActive,
        updatedAt: Date.now(),
      });
    }
    await get().loadAll();
  },

  cancelOccurrence: async (courseId, ruleId, date, reason) => {
    const childId = useAppStore.getState().childId;
    const existing = await cancellationRepo.findByRuleAndDate(childId, ruleId, date);
    if (existing) {
      await cancellationRepo.update({ ...existing, reason, updatedAt: Date.now() });
    } else {
      const now = Date.now();
      await cancellationRepo.create({
        id: genId(),
        childId,
        courseId,
        ruleId,
        date,
        reason,
        createdAt: now,
        updatedAt: now,
      });
    }
    await get().loadAll();
  },

  uncancelOccurrence: async (ruleId, date) => {
    await cancellationRepo.removeByRuleAndDate(ruleId, date);
    await get().loadAll();
  },
}));

/**
 * 获取指定周区间的课程实例（供组件调用）
 */
export function getWeekOccurrences(weekStart: ISODate) {
  const { courses, rules } = useScheduleStore.getState();
  // 计算周日（weekStart + 6）
  const parts = weekStart.split('-');
  const d = new Date(
    parseInt(parts[0]),
    parseInt(parts[1]) - 1,
    parseInt(parts[2])
  );
  d.setDate(d.getDate() + 6);
  const weekEnd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`;

  return expandRulesToOccurrences(rules, courses, {
    start: weekStart,
    end: weekEnd,
  });
}
