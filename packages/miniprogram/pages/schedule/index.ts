/**
 * 课程表页面 —— 周视图网格展示
 *
 * 调用 expandRulesToOccurrences 展开本周课程，支持左右切换周。
 */

import { expandRulesToOccurrences, getMondayOfWeek, addDays, getTodayISODate } from '@courseschedule/shared';
import type { ISODate, CourseOccurrence } from '@courseschedule/shared';
import { CourseRepository } from '../../utils/repositories/courseRepository';
import { ScheduleRuleRepository } from '../../utils/repositories/scheduleRuleRepository';

/** 固定孩子 ID */
const DEFAULT_CHILD_ID = 'default';

/** 星期标签（周一在前） */
const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

Page({
  data: {
    weekStart: '' as string,
    weekEnd: '' as string,
    weekData: [] as any[][],
    weekdayLabels: WEEKDAY_LABELS,
    dayDates: [] as any[],
    today: '' as string,
    loading: true as boolean,
  },

  onLoad() {
    const today = getTodayISODate();
    const monday = getMondayOfWeek(today);
    this.setData({
      today,
      weekStart: monday,
      weekEnd: addDays(monday, 6),
    });
    this.loadWeekData();
  },

  onShow() {
    if (this.data.weekStart) {
      this.loadWeekData();
    }
  },

  /**
   * 加载当前周数据
   */
  async loadWeekData() {
    this.setData({ loading: true });

    try {
      const { weekStart, weekEnd } = this.data;

      const courseRepo = new CourseRepository();
      const ruleRepo = new ScheduleRuleRepository();

      const [courses, rules] = await Promise.all([
        courseRepo.listByChild(DEFAULT_CHILD_ID),
        ruleRepo.listByChild(DEFAULT_CHILD_ID),
      ]);

      const occurrences = expandRulesToOccurrences(
        rules,
        courses,
        { start: weekStart as ISODate, end: weekEnd as ISODate }
      );

      // 按天分组
      const weekData: CourseOccurrence[][] = [];
      const dayDates: any[] = [];

      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart as ISODate, i);
        const dayCourses = occurrences.filter((o) => o.date === date);
        weekData.push(dayCourses);

        const month = parseInt(date.slice(5, 7));
        const day = parseInt(date.slice(8, 10));
        const isToday = date === this.data.today;

        dayDates.push({
          date,
          dayNum: day,
          isToday,
        });
      }

      this.setData({
        weekData: weekData.map((dayCourses) =>
          dayCourses.map((c) => ({
            ruleId: c.ruleId,
            courseId: c.courseId,
            courseName: c.courseName,
            courseType: c.courseType,
            location: c.location || '',
            color: c.color,
            date: c.date,
            startTime: c.startTime,
            endTime: c.endTime,
          }))
        ),
        dayDates,
        loading: false,
      });
    } catch (err) {
      console.error('加载课程表失败:', err);
      this.setData({ loading: false });
    }
  },

  /**
   * 上一周
   */
  onPrevWeek() {
    const newStart = addDays(this.data.weekStart as ISODate, -7);
    this.setData({
      weekStart: newStart,
      weekEnd: addDays(newStart, 6),
    });
    this.loadWeekData();
  },

  /**
   * 下一周
   */
  onNextWeek() {
    const newStart = addDays(this.data.weekStart as ISODate, 7);
    this.setData({
      weekStart: newStart,
      weekEnd: addDays(newStart, 6),
    });
    this.loadWeekData();
  },
});
