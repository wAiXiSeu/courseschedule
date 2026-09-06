/**
 * 云数据库集合名常量 —— 跨端共享
 *
 * 定义微信云开发中所有数据库集合的名称。
 * Web 端和小程序端共用同一份集合名，确保数据访问一致。
 */

export const COLLECTIONS = {
  /** 孩子档案 */
  CHILDREN: 'children',
  /** 课程定义 */
  COURSES: 'courses',
  /** 排课规则 */
  SCHEDULE_RULES: 'scheduleRules',
  /** 学习计划 */
  LEARNING_PLANS: 'learningPlans',
  /** 计划任务 */
  PLAN_TASKS: 'planTasks',
  /** 学习内容（复习对象） */
  REVIEW_ITEMS: 'reviewItems',
  /** 复习任务（惰性生成） */
  REVIEW_TASKS: 'reviewTasks',
  /** 打卡记录 */
  CHECKIN_RECORDS: 'checkinRecords',
  /** 错题 */
  MISTAKES: 'mistakes',
  /** 图片（云存储 fileID） */
  IMAGES: 'images',
  /** 复习间隔模板（P1 预留） */
  INTERVAL_TEMPLATES: 'intervalTemplates',
  /** 家长手工加减积分流水 */
  POINT_ADJUSTMENTS: 'pointAdjustments',
  /** 兑换品（家长自定义并定价） */
  REWARDS: 'rewards',
  /** 兑换单（孩子下单、家长确认） */
  REDEMPTIONS: 'redemptions',
} as const;

/** 集合名类型 */
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
