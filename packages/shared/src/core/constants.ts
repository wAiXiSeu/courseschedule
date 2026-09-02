/**
 * 常量定义 —— 跨端共享
 *
 * 包含科目（含分类与色板）、复习间隔等全局常量。
 */

import type { Subject, SubjectCategory } from '../domain/models';

/** 科目类别中文名映射 */
export const SUBJECT_CATEGORY_LABELS: Record<SubjectCategory, string> = {
  basic: '基础课程',
  general: '通识类',
  art: '美术类',
  sports: '运动类',
  chess: '棋类',
};

/** 科目类别展示顺序 */
export const SUBJECT_CATEGORY_ORDER: readonly SubjectCategory[] = [
  'basic',
  'general',
  'art',
  'sports',
  'chess',
] as const;

/**
 * 内置默认科目表 —— 科目 store 的初始数据，
 * 也是「恢复默认」的目标。id 保持稳定，Course.color / *.subject 直接引用。
 */
export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'math', name: '数学', category: 'basic', color: '#1E88E5' },
  { id: 'chinese', name: '语文', category: 'basic', color: '#E53935' },
  { id: 'english', name: '英语', category: 'basic', color: '#43A047' },
  { id: 'reading', name: '阅读', category: 'general', color: '#8E24AA' },
  { id: 'listening', name: '听力', category: 'general', color: '#00ACC1' },
  { id: 'art', name: '画画', category: 'art', color: '#D81B60' },
  { id: 'writing', name: '写字', category: 'art', color: '#F4511E' },
  { id: 'pingpong', name: '乒乓球', category: 'sports', color: '#FB8C00' },
  { id: 'badminton', name: '羽毛球', category: 'sports', color: '#7CB342' },
  { id: 'basketball', name: '篮球', category: 'sports', color: '#3949AB' },
  { id: 'go', name: '围棋', category: 'chess', color: '#455A64' },
  { id: 'gomoku', name: '五子棋', category: 'chess', color: '#6D4C41' },
  { id: 'other', name: '其他', category: 'general', color: '#757575' },
];

/**
 * 科目色板：id → hex（遗留回退映射，含旧版英文科目）
 *
 * 新代码请通过科目 store 解析颜色；此表仅用于历史数据兜底。
 */
export const SUBJECT_COLORS: Record<string, string> = {
  chinese: '#E53935',
  math: '#1E88E5',
  english: '#43A047',
  reading: '#8E24AA',
  listening: '#00ACC1',
  art: '#D81B60',
  writing: '#F4511E',
  pingpong: '#FB8C00',
  badminton: '#7CB342',
  basketball: '#3949AB',
  go: '#455A64',
  gomoku: '#6D4C41',
  physics: '#FB8C00',
  chemistry: '#8E24AA',
  biology: '#00ACC1',
  music: '#F4511E',
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

/** 科目中文名映射（遗留回退映射，新代码请通过科目 store 解析） */
export const SUBJECT_LABELS: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  reading: '阅读',
  listening: '听力',
  art: '画画',
  writing: '写字',
  pingpong: '乒乓球',
  badminton: '羽毛球',
  basketball: '篮球',
  go: '围棋',
  gomoku: '五子棋',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  music: '音乐',
  pe: '体育',
  science: '科学',
  other: '其他',
};

/** 日期格式化辅助 */
export const DATE_FORMAT = 'YYYY-MM-DD';

/** 时间格式辅助 */
export const TIME_FORMAT = 'HH:mm';
