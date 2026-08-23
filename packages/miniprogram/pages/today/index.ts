/**
 * 今日页面 —— 展示今天的课程时间轴和学习任务清单
 *
 * 调用 aggregateTodayView 聚合今日数据，
 * 从 Repository 加载课程、排课规则、学习计划、复习任务等。
 */

import { aggregateTodayView } from '@courseschedule/shared';
import type { TodayViewData, ISODate, TaskView } from '@courseschedule/shared';
import { CourseRepository } from '../../utils/repositories/courseRepository';
import { ScheduleRuleRepository } from '../../utils/repositories/scheduleRuleRepository';
import { PlanTaskRepository } from '../../utils/repositories/planRepository';
import { ReviewTaskRepository } from '../../utils/repositories/reviewRepository';
import { CheckinRepository } from '../../utils/repositories/checkinRepository';

/** 固定孩子 ID（首发单孩子） */
const DEFAULT_CHILD_ID = 'default';

Page({
  data: {
    todayDate: '' as string,
    weekdayLabel: '' as string,
    courses: [] as any[],
    tasks: [] as any[],
    todayDone: 0 as number,
    todayTotal: 0 as number,
    streak: 0 as number,
    weekStrip: [] as boolean[],
    loading: true as boolean,
    hasData: false as boolean,
  },

  onLoad() {
    this.loadTodayData();
  },

  onShow() {
    this.loadTodayData();
  },

  /**
   * 加载今日数据
   */
  async loadTodayData() {
    this.setData({ loading: true });

    try {
      const today = this.getTodayISO();

      const courseRepo = new CourseRepository();
      const ruleRepo = new ScheduleRuleRepository();
      const planTaskRepo = new PlanTaskRepository();
      const reviewTaskRepo = new ReviewTaskRepository();
      const checkinRepo = new CheckinRepository();

      const [courses, rules, planTasks, reviewTasks, checkinRecords] = await Promise.all([
        courseRepo.listByChild(DEFAULT_CHILD_ID),
        ruleRepo.listByChild(DEFAULT_CHILD_ID),
        planTaskRepo.listActive(DEFAULT_CHILD_ID),
        reviewTaskRepo.listByChild(DEFAULT_CHILD_ID),
        checkinRepo.listByChild(DEFAULT_CHILD_ID),
      ]);

      const todayData: TodayViewData = aggregateTodayView({
        date: today as ISODate,
        courses,
        rules,
        planTasks,
        reviewTasks,
        checkinRecords,
      });

      this.setData({
        todayDate: this.formatDisplayDate(todayData.date),
        weekdayLabel: todayData.weekdayLabel,
        courses: todayData.courses.map((c) => ({
          ruleId: c.ruleId,
          courseId: c.courseId,
          courseName: c.courseName,
          courseType: c.courseType,
          location: c.location || '',
          color: c.color,
          date: c.date,
          startTime: c.startTime,
          endTime: c.endTime,
        })),
        tasks: todayData.tasks.map((t) => ({
          key: t.key,
          title: t.title,
          sourceLabel: t.sourceLabel,
          refType: t.refType,
          refId: t.refId,
          done: t.done,
          due: t.due || false,
        })),
        todayDone: todayData.todayDone,
        todayTotal: todayData.todayTotal,
        streak: todayData.streak,
        weekStrip: todayData.weekStrip,
        loading: false,
        hasData: true,
      });
    } catch (err) {
      console.error('加载今日数据失败:', err);
      this.setData({ loading: false, hasData: false });
    }
  },

  /**
   * 获取今日 YYYY-MM-DD
   */
  getTodayISO(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  /**
   * 格式化日期为 M月D日
   */
  formatDisplayDate(dateStr: string): string {
    const month = parseInt(dateStr.slice(5, 7));
    const day = parseInt(dateStr.slice(8, 10));
    return `${month}月${day}日`;
  },

  /**
   * 勾选/取消勾选任务
   */
  onToggleTask(e: any) {
    const dataset = e.currentTarget.dataset;
    const refType = dataset.refType;
    const refId = dataset.refId;
    const currentDone = dataset.done;

    console.log('toggle task:', refType, refId, 'done:', !currentDone);
    // T04: 调用 CheckinRepository 完成打卡或取消
  },
});
