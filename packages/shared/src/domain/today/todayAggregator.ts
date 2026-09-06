/**
 * 今日视图聚合器 —— 跨端共享纯函数
 *
 * 聚合今日的课程、计划任务、复习任务、打卡状态，生成完整的 TodayViewData。
 * 参考 ARCHITECTURE.md 第 1.1 节 C3「今日视图的聚合」及第 4.1b 节流程。
 */

import type {
  ISODate,
  Weekday,
  Course,
  ScheduleRule,
  PlanTask,
  ReviewTask,
  CheckInRecord,
  CourseOccurrence,
  TaskView,
  TodayViewData,
} from '../models';
import { expandForDate } from '../schedule/occurrence';
import { isReviewDue } from '../review/reviewScheduler';
import {
  calculateCurrentStreak,
  calculateWeekStrip,
} from '../checkin/streak';

/** 今日视图输入参数 */
export interface TodayAggregatorParams {
  /** 今日日期（YYYY-MM-DD） */
  date: ISODate;
  /** 课程定义列表 */
  courses: Course[];
  /** 排课规则列表 */
  rules: ScheduleRule[];
  /** 活跃的计划任务列表 */
  planTasks: PlanTask[];
  /** 复习任务列表（含 pending 和 done） */
  reviewTasks: ReviewTask[];
  /** 打卡记录列表 */
  checkinRecords: CheckInRecord[];
}

/**
 * 聚合今日视图数据
 *
 * 处理逻辑：
 * 1. 展开今日课程实例（调用 expandForDate）
 * 2. 过滤今日应执行的计划任务（daily/weekly/once）
 * 3. 筛选今日到期的复习任务（dueDate <= today 且 status='pending'）
 * 4. 合并计划任务和复习任务为 TaskView 列表
 * 5. 用打卡记录标记任务完成状态
 * 6. 计算累计打卡天数和本周打卡格子
 *
 * @param params 聚合参数
 * @returns 今日视图数据
 */
export function aggregateTodayView(params: TodayAggregatorParams): TodayViewData {
  const { date, courses, rules, planTasks, reviewTasks, checkinRecords } = params;

  // 1. 展开今日课程
  const coursesToday: CourseOccurrence[] = expandForDate(rules, courses, date);

  // 2. 获取星期几（用于过滤 weekly 任务）
  const weekday = getWeekday(date);

  // 3. 过滤今日应执行的计划任务
  const todayPlanTasks = planTasks.filter((task) => {
    if (!task.isActive) return false;

    switch (task.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return task.weekdays?.includes(weekday as Weekday) ?? false;
      case 'once':
        return task.specificDate === date;
      default:
        return false;
    }
  });

  // 4. 筛选今日到期的复习任务
  const dueReviewTasks = reviewTasks.filter(
    (task) => task.status === 'pending' && isReviewDue(task, date)
  );

  // 5. 构建已打卡的 refId 集合（用于标记 done）
  const doneRefIds = new Set<string>();
  for (const record of checkinRecords) {
    if (record.date === date) {
      doneRefIds.add(`${record.refType}:${record.refId}`);
    }
  }

  // 6. 合并为 TaskView 列表
  const tasks: TaskView[] = [];

  // 添加计划任务
  for (const task of todayPlanTasks) {
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

  // 添加复习任务
  for (const task of dueReviewTasks) {
    const key = `review_task:${task.id}`;
    tasks.push({
      key,
      title: `复习任务 #${task.intervalIndex + 1}`,
      sourceLabel: '复习计划',
      refType: 'review_task',
      refId: task.id,
      done: doneRefIds.has(key),
      due: true,
    });
  }

  // 7. 计算统计数据
  const todayDone = tasks.filter((t) => t.done).length;
  const todayTotal = tasks.length;

  // 当前连续打卡天数
  const streak = calculateCurrentStreak(checkinRecords, date);

  // 本周打卡格子（周一起始）
  const weekStart = getMondayOfWeek(date);
  const weekStrip = calculateWeekStrip(checkinRecords, weekStart);

  return {
    date,
    weekdayLabel: getWeekdayLabel(weekday),
    courses: coursesToday,
    tasks,
    todayDone,
    todayTotal,
    streak,
    weekStrip,
  };
}

/**
 * 内部辅助：获取星期几（0=周日）
 */
function getWeekday(date: ISODate): Weekday {
  const parts = date.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return d.getDay() as Weekday;
}

/**
 * 内部辅助：获取星期标签
 */
function getWeekdayLabel(weekday: Weekday): string {
  const labels: Record<number, string> = {
    0: '周日',
    1: '周一',
    2: '周二',
    3: '周三',
    4: '周四',
    5: '周五',
    6: '周六',
  };
  return labels[weekday] || '';
}

/**
 * 内部辅助：获取本周一日期
 */
function getMondayOfWeek(date: ISODate): ISODate {
  const parts = date.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);

  const weekday = d.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  d.setDate(d.getDate() + offset);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
