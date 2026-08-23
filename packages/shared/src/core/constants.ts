/**
 * 常量定义 —— 跨端共享
 *
 * 包含科目色板、复习间隔等全局常量。
 */

/** 科目色板：key → hex 颜色 */
export const SUBJECT_COLORS: Record<string, string> = {
  chinese: '#E53935',
  math: '#1E88E5',
  english: '#43A047',
  physics: '#FB8C00',
  chemistry: '#8E24AA',
  biology: '#00ACC1',
  music: '#F4511E',
  art: '#D81B60',
  pe: '#7CB342',
  science: '#3949AB',
  other: '#757575',
};

/** 默认复习间隔天数（D1/D2/D4/D7/D15） */
export const REVIEW_INTERVALS: readonly number[] = [1, 2, 4, 7, 15] as const;

/** 最大复习轮次 */
export const MAX_REVIEW_ROUND: number = REVIEW_INTERVALS.length;

/** 星期名称映射（1=周一 … 7=周日） */
export const WEEKDAY_LABELS: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
};

/** 错误原因标签列表 */
export const REASON_TAGS: readonly string[] = [
  '粗心大意',
  '概念不清',
  '计算错误',
  '审题不清',
  '方法不对',
] as const;

/** 科目中文名映射 */
export const SUBJECT_LABELS: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  music: '音乐',
  art: '美术',
  pe: '体育',
  science: '科学',
  other: '其他',
};

/** 日期格式化辅助 */
export const DATE_FORMAT = 'YYYY-MM-DD';

/** 时间格式辅助 */
export const TIME_FORMAT = 'HH:mm';
