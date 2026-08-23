/**
 * 排课展开器 —— 跨端共享纯函数
 *
 * 将 ScheduleRule（排课规则）按日期范围展开为 CourseOccurrence（课程实例）。
 * 核心逻辑：遍历日期范围，对每一天匹配有效的排课规则，生成当日课程实例。
 *
 * 参考 ARCHITECTURE.md 第 1.1 节 C1「周期重复课程的展开」
 * 及第 3.1 节 CourseOccurrence 定义。
 */

import type {
  ISODate,
  Weekday,
  ScheduleRule,
  Course,
  CourseOccurrence,
} from '../models';

/**
 * 将排课规则按日期范围展开为课程实例列表
 *
 * 处理逻辑：
 * 1. 遍历 dateRange 中每一天
 * 2. 获取当天星期几（0=周日）
 * 3. 匹配 weekday 相同、isActive=true、且在生效区间内的规则
 * 4. 通过 courseId 关联 Course，组装 CourseOccurrence
 * 5. 结果按 date + startTime 排序
 *
 * @param rules 排课规则列表
 * @param courses 课程定义列表
 * @param dateRange 日期范围 { start, end }（含端点）
 * @returns 展开后的课程实例数组（按日期+时间排序）
 */
export function expandRulesToOccurrences(
  rules: ScheduleRule[],
  courses: Course[],
  dateRange: { start: ISODate; end: ISODate }
): CourseOccurrence[] {
  const occurrences: CourseOccurrence[] = [];

  // 构建 courseId → Course 映射（O(1) 查找）
  const courseMap = new Map<string, Course>();
  for (const course of courses) {
    courseMap.set(course.id, course);
  }

  // 过滤出活跃的规则（减少内层循环）
  const activeRules = rules.filter((r) => r.isActive);

  // 遍历日期范围
  let currentDate = dateRange.start;
  while (currentDate <= dateRange.end) {
    // 获取当天星期几（0=周日, 1=周一 ... 6=周六）
    const weekday = getWeekday(currentDate);

    // 匹配当天有效的规则
    for (const rule of activeRules) {
      if (rule.weekday !== weekday) continue;
      if (!isRuleEffectiveOnDate(rule, currentDate)) continue;

      // 查找关联课程
      const course = courseMap.get(rule.courseId);
      if (!course) continue;

      // 组装课程实例
      occurrences.push({
        ruleId: rule.id,
        courseId: course.id,
        courseName: course.name,
        courseType: course.type,
        location: rule.location || course.location,
        color: course.color,
        date: currentDate,
        startTime: rule.startTime,
        endTime: rule.endTime,
      });
    }

    // 下一天
    currentDate = addDays(currentDate, 1);
  }

  // 按日期 + 开始时间排序
  occurrences.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0;
  });

  return occurrences;
}

/**
 * 展开指定单日的课程实例
 *
 * @param rules 排课规则列表
 * @param courses 课程定义列表
 * @param date 目标日期（YYYY-MM-DD）
 * @returns 当日课程实例（按开始时间排序）
 */
export function expandForDate(
  rules: ScheduleRule[],
  courses: Course[],
  date: ISODate
): CourseOccurrence[] {
  return expandRulesToOccurrences(rules, courses, { start: date, end: date });
}

/**
 * 展开指定一周（周一到周日）的课程实例
 *
 * @param rules 排课规则列表
 * @param courses 课程定义列表
 * @param weekStart 周一日期（YYYY-MM-DD）
 * @returns 7 天的课程实例数组（二维数组，每天一个子数组）
 */
export function expandForWeek(
  rules: ScheduleRule[],
  courses: Course[],
  weekStart: ISODate
): CourseOccurrence[][] {
  const weekEnd = addDays(weekStart, 6);
  const allOccurrences = expandRulesToOccurrences(rules, courses, {
    start: weekStart,
    end: weekEnd,
  });

  // 按日期分组
  const weekDays: CourseOccurrence[][] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    weekDays.push(allOccurrences.filter((o) => o.date === date));
  }

  return weekDays;
}

/**
 * 判断规则在指定日期是否生效
 *
 * @param rule 排课规则
 * @param date 目标日期（YYYY-MM-DD）
 * @returns 是否生效
 */
function isRuleEffectiveOnDate(rule: ScheduleRule, date: ISODate): boolean {
  // 必须在 effectiveFrom 之后（含）
  if (date < rule.effectiveFrom) return false;

  // 如果有截止日期，必须在 effectiveUntil 之前（含）
  if (rule.effectiveUntil && date > rule.effectiveUntil) return false;

  return true;
}

/**
 * 获取日期对应的星期几（0=周日）
 * 内部辅助函数，避免循环依赖
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
 * 在 ISODate 上加减天数
 * 内部辅助函数，避免循环依赖
 */
function addDays(date: ISODate, days: number): ISODate {
  const parts = date.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + days);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
