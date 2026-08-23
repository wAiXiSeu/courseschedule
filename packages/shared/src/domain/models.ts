/**
 * 领域模型类型定义 —— 跨端共享
 *
 * 定义课程、学习计划、打卡、错题等核心领域对象的类型。
 * Web 管理后台与微信小程序共用。
 * 参考 ARCHITECTURE.md 第 3.1 节。
 */

/* ─── 通用类型 ─── */

/** 本地日期，一律 'YYYY-MM-DD'（不带时区） */
export type ISODate = string;

/** 本地时间，一律 'HH:mm'（24 小时制） */
export type HHmm = string;

/** 星期枚举：0=周日, 1=周一 … 6=周六（展示时周一起始） */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 基础实体：所有持久化对象均包含这些字段 */
export interface BaseEntity {
  /** 唯一标识（客户端生成 UUID / nanoid） */
  id: string;
  /** 归属孩子档案；首发单孩子也必填（固定为 DEFAULT_CHILD_ID） */
  childId: string;
  /** 创建时间（epoch ms） */
  createdAt: number;
  /** 更新时间（epoch ms） */
  updatedAt: number;
}

/* ─── 孩子档案（P1 多孩子，首发固定一条默认档案） ─── */

export interface ChildProfile extends BaseEntity {
  /** 孩子姓名 */
  name: string;
  /** 头像 emoji，如 '🧒' */
  avatarEmoji: string;
  /** 年级，如 '二年级' */
  gradeLevel?: string;
}

/* ─── 课程与排课 ─── */

/** 课程类型：校内 / 校外 */
export type CourseType = 'school' | 'extracurricular';

/** 科目（Course）：一门课程的基本信息 */
export interface Course extends BaseEntity {
  /** 课程名称，如 "钢琴课" */
  name: string;
  /** 课程类型 */
  type: CourseType;
  /** 上课地点（可选） */
  location?: string;
  /** 色板 key，对应 SUBJECT_COLORS */
  color: string;
  /** 备注（可选） */
  note?: string;
}

/** 排课规则（ScheduleRule）：描述某门课在每周固定时段的重复安排 */
export interface ScheduleRule extends BaseEntity {
  /** 关联课程 ID */
  courseId: string;
  /** 星期几（0=周日） */
  weekday: Weekday;
  /** 开始时间 "HH:mm" */
  startTime: HHmm;
  /** 结束时间 "HH:mm" */
  endTime: HHmm;
  /** 重复类型（P2 预留 'once'） */
  repeatType: 'weekly';
  /** 生效起始日期（含） */
  effectiveFrom: ISODate;
  /** 生效截止日期（含），空 = 长期有效 */
  effectiveUntil?: ISODate;
  /** 是否启用（暂停开关，软操作） */
  isActive: boolean;
  /** 上课地点（可选冗余） */
  location?: string;
  /** 备注（可选） */
  note?: string;
}

/** 课程实例（CourseOccurrence）：由规则按日期展开的派生对象（不落库） */
export interface CourseOccurrence {
  /** 关联排课规则 ID */
  ruleId: string;
  /** 关联课程 ID */
  courseId: string;
  /** 课程名称（来自 Course） */
  courseName: string;
  /** 课程类型（来自 Course） */
  courseType: CourseType;
  /** 上课地点 */
  location?: string;
  /** 颜色（来自 Course） */
  color: string;
  /** 日期 YYYY-MM-DD */
  date: ISODate;
  /** 开始时间 HH:mm */
  startTime: HHmm;
  /** 结束时间 HH:mm */
  endTime: HHmm;
}

/* ─── 学习计划 ─── */

/** 学习计划状态 */
export type PlanStatus = 'active' | 'completed' | 'archived';

/** 学习计划（LearningPlan）：围绕某门课程制定的阶段性学习计划 */
export interface LearningPlan extends BaseEntity {
  /** 计划标题，如 "本月背完乘法口诀" */
  title: string;
  /** 计划描述 */
  description?: string;
  /** 关联科目 */
  subject: string;
  /** 计划开始日期 YYYY-MM-DD */
  startDate: ISODate;
  /** 计划结束日期 YYYY-MM-DD */
  endDate: ISODate;
  /** 计划状态 */
  status: PlanStatus;
}

/** 任务频率 */
export type PlanTaskFrequency = 'daily' | 'weekly' | 'once';

/** 计划任务（PlanTask）：学习计划中的单个任务节点 */
export interface PlanTask extends BaseEntity {
  /** 所属计划 ID */
  planId: string;
  /** 任务标题 */
  title: string;
  /** 任务描述 */
  description?: string;
  /** 任务频率：每日 / 每周某几天 / 指定单日 */
  frequency: PlanTaskFrequency;
  /** frequency='weekly' 时必填，指定周几执行 */
  weekdays?: Weekday[];
  /** frequency='once' 时必填，指定具体日期 */
  specificDate?: ISODate;
  /** 建议时长（分钟），可选 */
  durationMin?: number;
  /** 是否启用 */
  isActive: boolean;
}

/* ─── 复习计划 / 遗忘曲线 ─── */

/** 复习项来源类型 */
export type ReviewSourceType = 'manual' | 'mistake';

/** 复习项（ReviewItem）：需要复习的知识点或题目 */
export interface ReviewItem extends BaseEntity {
  /** 内容标题 */
  title: string;
  /** 关联科目 */
  subject: string;
  /** 学习日期（间隔计算基准） YYYY-MM-DD */
  learnDate: ISODate;
  /** 间隔序列（天），默认 [1,2,4,7,15]，录入时可改（P1-2） */
  intervals: number[];
  /** P1 模板引用（预留） */
  intervalTemplateId?: string;
  /** 来源类型：手动录入 / 错题转化 */
  sourceType: ReviewSourceType;
  /** sourceType='mistake' 时指向 Mistake.id */
  sourceId?: string;
}

/** 复习任务状态 */
export type ReviewTaskStatus = 'pending' | 'done' | 'skipped';

/** 复习任务（ReviewTask）：惰性生成，一个间隔节点一条 */
export interface ReviewTask extends BaseEntity {
  /** 关联复习项 ID */
  reviewItemId: string;
  /** 第几个间隔节点（0 起） */
  intervalIndex: number;
  /** 到期日 = learnDate + intervals[intervalIndex] */
  dueDate: ISODate;
  /** 任务状态 */
  status: ReviewTaskStatus;
  /** 完成时刻（epoch ms） */
  doneAt?: number;
}

/* ─── 打卡 ─── */

/** 打卡引用类型 */
export type CheckinRefType = 'plan_task' | 'review_task';

/** 打卡记录（CheckInRecord）：每日学习打卡 */
export interface CheckInRecord extends BaseEntity {
  /** 引用类型：plan_task 或 review_task */
  refType: CheckinRefType;
  /** 引用 ID（PlanTask.id 或 ReviewTask.id） */
  refId: string;
  /** 打卡归属日 YYYY-MM-DD（补卡时仍是当天） */
  date: ISODate;
  /** 实际操作时刻（epoch ms） */
  doneAt: number;
  /** 是否补卡（当日稍晚补勾） */
  isMakeup: boolean;
}

/* ─── 错题本 ─── */

/** 掌握状态 */
export type MasteryStatus = 'pending' | 'mastered';

/** 错题（Mistake）：错题记录 */
export interface Mistake extends BaseEntity {
  /** 关联科目 */
  subject: string;
  /** 知识点列表 */
  knowledgePoints: string[];
  /** 题目文字 */
  questionText: string;
  /** 图片 ID 列表（云存储 fileID） */
  imageIds: string[];
  /** 错误原因标签 */
  reasonTags: string[];
  /** 出错日期 YYYY-MM-DD（默认录入日） */
  mistakeDate: ISODate;
  /** 掌握状态 */
  masteryStatus: MasteryStatus;
}

/* ─── 复习间隔模板（P1-2 预留） ─── */

export interface IntervalTemplate extends BaseEntity {
  /** 模板名称，如 '默认（艾宾浩斯）' */
  name: string;
  /** 按科目保存，空 = 通用 */
  subject?: string;
  /** 间隔序列（天） */
  intervals: number[];
}

/* ─── 派生视图模型（domain 层输出，供 UI 消费） ─── */

/** 今日任务视图项 */
export interface TaskView {
  /** 唯一键：`${refType}:${refId}` */
  key: string;
  /** 任务标题 */
  title: string;
  /** 来源标签 */
  sourceLabel: '学习计划' | '复习计划';
  /** 引用类型 */
  refType: CheckinRefType;
  /** 引用 ID */
  refId: string;
  /** 当日是否已完成（有对应 CheckInRecord） */
  done: boolean;
  /** 复习任务是否已到期未完成 */
  due?: boolean;
}

/** 今日视图聚合数据 */
export interface TodayViewData {
  /** 日期 YYYY-MM-DD */
  date: ISODate;
  /** 星期标签，如 '星期二' */
  weekdayLabel: string;
  /** 今日课程实例（按开始时间排序） */
  courses: CourseOccurrence[];
  /** 今日任务列表（学习计划任务 + 到期复习任务） */
  tasks: TaskView[];
  /** 今日已完成数 */
  todayDone: number;
  /** 今日总任务数 */
  todayTotal: number;
  /** 连续打卡天数 */
  streak: number;
  /** 本周打卡格子（周一起，7 天） */
  weekStrip: boolean[];
}
