/**
 * 打卡数据 Hook
 *
 * 聚合「今日任务 + 今日课程到课 + 打卡统计」。
 * 任务判定复用 shared 的 isPlanTaskDueOn，与积分「当日满额」同一口径；
 * 课程实例由排课规则展开，已被取消的时段标灰且不给勾、不加分。
 */

import { useEffect, useMemo, useState } from 'react';
import {
  type CheckInRecord,
  type TaskView,
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateTotalCheckinDays,
  calculateWeekStrip,
  calculateCompletionRate,
  expandForDate,
  getMondayOfWeek,
  getTodayISODate,
  isPlanTaskDueOn,
  isReviewDue,
} from '@courseschedule/shared';
import { cancellationKey } from '../../data/repositories/courseCancellationRepository';
import { useAppStore } from '../../stores/useAppStore';
import { useCheckinStore, checkinRepo } from '../../stores/useCheckinStore';
import { planTaskRepo } from '../../stores/usePlanStore';
import { reviewTaskRepo, reviewItemRepo } from '../../stores/useReviewStore';
import { useScheduleStore } from '../../stores/useScheduleStore';

/** 今日一节课程的到课打卡视图 */
export interface AttendanceView {
  /** 唯一键：course_rule:${ruleId} */
  key: string;
  ruleId: string;
  courseName: string;
  startTime: string;
  endTime: string;
  color: string;
  /** 当日这节课被家长取消：不加分，也不给勾 */
  cancelled: boolean;
  cancelledReason?: string;
  /** 已勾「到课」 */
  done: boolean;
}

/** Hook 返回值 */
interface CheckinDataResult {
  /** 今日任务列表 */
  todayTasks: TaskView[];
  /** 今日课程到课列表（按开始时间排序，含已取消项） */
  todayCourses: AttendanceView[];
  /** 打卡记录列表 */
  records: CheckInRecord[];
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 累计打卡天数 */
  totalDays: number;
  /** 当前连续打卡天数 */
  currentStreak: number;
  /** 历史最长连续打卡天数 */
  longestStreak: number;
  /** 本周打卡格子（周一起始） */
  weekStrip: boolean[];
  /** 今日完成率 */
  completionRate: { done: number; total: number };
}

/**
 * 打卡数据 Hook
 */
export const useCheckinData = (): CheckinDataResult => {
  const childId = useAppStore((s) => s.childId);
  const currentDate = useAppStore((s) => s.currentDate);
  const records = useCheckinStore((s) => s.records);
  const loading = useCheckinStore((s) => s.loading);
  const error = useCheckinStore((s) => s.error);
  const loadAll = useCheckinStore((s) => s.loadAll);

  const courses = useScheduleStore((s) => s.courses);
  const rules = useScheduleStore((s) => s.rules);
  const cancellations = useScheduleStore((s) => s.cancellations);
  const loadSchedule = useScheduleStore((s) => s.loadAll);

  // 本地状态：今日任务列表
  const [todayTasks, setTodayTasks] = useState<TaskView[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // 加载今日任务
  const refreshTasks = async () => {
    setTasksLoading(true);
    try {
      // 并行查询计划任务、复习任务、打卡记录
      const [allPlanTasks, allReviewTasks, todayCheckins, allReviewItems] = await Promise.all([
        planTaskRepo.listByChild(childId),
        reviewTaskRepo.listByChild(childId),
        checkinRepo.listByDate(childId, currentDate),
        reviewItemRepo.listByChild(childId),
      ]);

      // 构建已打卡的 refId 集合
      const doneRefIds = new Set<string>();
      for (const record of todayCheckins) {
        doneRefIds.add(`${record.refType}:${record.refId}`);
      }

      // 筛选今日到期的复习任务
      const dueReviewTasks = allReviewTasks.filter(
        (task) => task.status === 'pending' && isReviewDue(task, currentDate)
      );

      // 构建 TaskView 列表
      const tasks: TaskView[] = [];

      for (const task of allPlanTasks.filter((t) => isPlanTaskDueOn(t, currentDate))) {
        const key = `plan_task:${task.id}`;
        tasks.push({
          key,
          title: task.title,
          sourceLabel: '学习计划',
          refType: 'plan_task',
          refId: task.id,
          done: doneRefIds.has(key),
        });
      }

      for (const task of dueReviewTasks) {
        const key = `review_task:${task.id}`;
        const reviewItem = allReviewItems.find((i) => i.id === task.reviewItemId);
        tasks.push({
          key,
          title: reviewItem
            ? `${reviewItem.title} #${task.intervalIndex + 1}`
            : `复习任务 #${task.intervalIndex + 1}`,
          sourceLabel: '复习计划',
          refType: 'review_task',
          refId: task.id,
          done: doneRefIds.has(key),
          due: true,
        });
      }

      setTodayTasks(tasks);
    } catch (err) {
      console.error('加载今日任务失败:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  // 初始加载 + 日期变化时刷新
  useEffect(() => {
    void loadAll();
    void loadSchedule();
    void refreshTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, currentDate]);

  // 今日课程到课视图：规则展开 → 剔除校内课程 → 标记已取消与已勾
  // 校内课程由校方统一管理，不进家庭打卡清单、不计积分
  const todayCourses = useMemo<AttendanceView[]>(() => {
    const cancelledBy = new Map(
      cancellations
        .filter((c) => c.date === currentDate)
        .map((c) => [cancellationKey(c.ruleId, c.date), c.reason])
    );
    const doneRuleIds = new Set(
      records
        .filter((r) => r.date === currentDate && r.refType === 'course_rule')
        .map((r) => r.refId)
    );

    return expandForDate(rules, courses, currentDate)
      .filter((occurrence) => occurrence.courseType !== 'school')
      .map((occurrence) => {
        const cancelKey = cancellationKey(occurrence.ruleId, occurrence.date);
        return {
          key: `course_rule:${occurrence.ruleId}`,
          ruleId: occurrence.ruleId,
          courseName: occurrence.courseName,
          startTime: occurrence.startTime,
          endTime: occurrence.endTime,
          color: occurrence.color,
          cancelled: cancelledBy.has(cancelKey),
          cancelledReason: cancelledBy.get(cancelKey),
          done: doneRuleIds.has(occurrence.ruleId),
        };
      });
  }, [rules, courses, cancellations, records, currentDate]);

  // 计算统计数据
  const today = getTodayISODate();
  const totalDays = useMemo(() => calculateTotalCheckinDays(records), [records]);
  const currentStreak = useMemo(() => calculateCurrentStreak(records, today), [records, today]);
  const longestStreak = useMemo(() => calculateLongestStreak(records), [records]);
  const weekStrip = useMemo(() => calculateWeekStrip(records, getMondayOfWeek(today)), [records, today]);
  const completionRate = useMemo(() => {
    const todayRecords = records.filter((r) => r.date === currentDate);
    return calculateCompletionRate(todayTasks, todayRecords);
  }, [records, todayTasks, currentDate]);

  return {
    todayTasks,
    todayCourses,
    records,
    loading: loading || tasksLoading,
    error,
    refresh: async () => {
      await loadAll();
      await refreshTasks();
    },
    totalDays,
    currentStreak,
    longestStreak,
    weekStrip,
    completionRate,
  };
};
