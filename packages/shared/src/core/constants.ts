/**
 * 常量定义 —— 跨端共享
 *
 * 包含科目（含分类与色板）、复习间隔、积分规则与内置兑换品等全局常量。
 */

import type { PointEntryKind, Reward, Subject, SubjectCategory } from '../domain/models';

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

/* ─── 积分规则 ─── */

/**
 * 积分分值表 —— 全站单一事实来源
 *
 * 派生类分值由打卡 / 错题记录实时算出（撤销来源记录即自动回冲），
 * 里程碑按最长连续记录发放、每档只发一次。
 */
export const POINT_RULES = {
  /** 学习计划任务打卡 */
  planTask: 10,
  /** 到期复习任务打卡（复习更反人性，略高） */
  reviewTask: 12,
  /** 校外课程到课（校内课程不参与打卡） */
  attendance: 8,
  /** 错题转为已掌握 */
  mistakeMastered: 5,
  /** 当日任务全部完成的满额奖励 */
  dailyGoalBonus: 20,
  /** 补卡的任务分倍率（满额奖不受影响） */
  makeupMultiplier: 0.5,
} as const;

/** 连续打卡里程碑档位：最长连续记录达到 days 时一次性发 points */
export const STREAK_MILESTONES: readonly { days: number; points: number; label: string }[] = [
  { days: 7, points: 50, label: '坚持一周' },
  { days: 21, points: 150, label: '养成习惯' },
  { days: 50, points: 300, label: '半个学期' },
  { days: 100, points: 500, label: '百日打卡' },
] as const;

/** 积分流水来源中文名 */
export const POINT_ENTRY_KIND_LABELS: Record<PointEntryKind, string> = {
  checkin: '打卡',
  attendance: '到课',
  mistake: '错题攻克',
  daily_goal: '今日满额',
  milestone: '里程碑',
  manual: '家长调整',
  redemption: '兑换',
};

/** 内置兑换品：家庭空间首次进入积分页时铺底，家长可随意改删 */
export type RewardSeed = Omit<Reward, 'id' | 'childId' | 'createdAt' | 'updatedAt'>;

export const DEFAULT_REWARDS: RewardSeed[] = [
  { title: '一个冰淇淋', emoji: '🍦', description: '今天想吃哪个口味都行', cost: 30, isActive: true },
  { title: '多一集动画', emoji: '📺', description: '看完这一集再去洗漱', cost: 40, isActive: true },
  { title: '游戏时间 30 分钟', emoji: '🎮', description: '平板自由支配半小时', cost: 50, isActive: true },
  { title: '去游乐场一次', emoji: '🛝', description: '周末挑一天专门去玩', cost: 150, isActive: true },
  { title: '挑一份小礼物', emoji: '🎁', description: '书店或文具店任选一样', cost: 400, isActive: true },
];
