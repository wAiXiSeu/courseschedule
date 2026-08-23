/**
 * @courseschedule/shared
 *
 * 跨端共享包 —— 导出领域模型、工具函数与纯函数模块。
 */

// 领域模型
export * from './domain/models';

// 常量定义
export * from './core/constants';

// 工具函数
export * from './core/utils/date';
export * from './core/utils/id';
export * from './core/utils/validation';

// 领域纯函数
export * from './domain/review/intervals';
export * from './domain/review/reviewScheduler';
export * from './domain/schedule/occurrence';
export * from './domain/checkin/streak';
export * from './domain/today/todayAggregator';

// 云数据库集合名常量
export * from './cloud/collections';

// 云数据库常量
export * from './cloud/collections';
