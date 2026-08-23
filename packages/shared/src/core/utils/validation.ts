/**
 * 表单校验工具 —— 跨端共享
 *
 * 提供通用的表单校验函数，包括必填检查、时间先后、日期区间等。
 * 纯函数，无副作用，可在 Web 和小程序端复用。
 */

import type { ISODate, HHmm } from '../../domain/models';
import { compareDates, parseISODate } from './date';

/** 校验结果 */
export interface ValidationResult {
  /** 是否通过校验 */
  valid: boolean;
  /** 错误消息（valid=false 时有值） */
  message?: string;
}

/** 成功结果 */
export function validResult(): ValidationResult {
  return { valid: true };
}

/** 失败结果 */
export function invalidResult(message: string): ValidationResult {
  return { valid: false, message };
}

/**
 * 校验必填字段
 */
export function requireField(value: unknown, fieldName: string): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return invalidResult(`${fieldName}不能为空`);
  }
  return validResult();
}

/**
 * 校验字符串长度
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength: number = 0,
  maxLength: number = Infinity
): ValidationResult {
  if (value.length < minLength) {
    return invalidResult(`${fieldName}至少需要${minLength}个字符`);
  }
  if (value.length > maxLength) {
    return invalidResult(`${fieldName}不能超过${maxLength}个字符`);
  }
  return validResult();
}

/**
 * 校验时间格式（HH:mm）
 */
export function validateTimeFormat(time: string): ValidationResult {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    return invalidResult('时间格式应为 HH:mm（24小时制）');
  }
  return validResult();
}

/**
 * 校验时间先后顺序（startTime 应早于 endTime）
 */
export function validateTimeOrder(startTime: HHmm, endTime: HHmm): ValidationResult {
  const startResult = validateTimeFormat(startTime);
  if (!startResult.valid) return startResult;

  const endResult = validateTimeFormat(endTime);
  if (!endResult.valid) return endResult;

  if (startTime >= endTime) {
    return invalidResult('开始时间应早于结束时间');
  }
  return validResult();
}

/**
 * 校验日期格式（YYYY-MM-DD）
 */
export function validateDateFormat(date: string): ValidationResult {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return invalidResult('日期格式应为 YYYY-MM-DD');
  }

  // 进一步验证日期是否合法
  const parsed = parseISODate(date);
  if (isNaN(parsed.getTime())) {
    return invalidResult('日期格式无效');
  }
  return validResult();
}

/**
 * 校验日期先后顺序（startDate 应早于或等于 endDate）
 */
export function validateDateOrder(startDate: ISODate, endDate: ISODate): ValidationResult {
  const startResult = validateDateFormat(startDate);
  if (!startResult.valid) return startResult;

  const endResult = validateDateFormat(endDate);
  if (!endResult.valid) return endResult;

  if (compareDates(startDate, endDate) > 0) {
    return invalidResult('开始日期应早于或等于结束日期');
  }
  return validResult();
}

/**
 * 校验日期是否在区间内
 */
export function validateDateInRange(
  date: ISODate,
  fromDate: ISODate,
  toDate?: ISODate
): ValidationResult {
  const dateResult = validateDateFormat(date);
  if (!dateResult.valid) return dateResult;

  const fromResult = validateDateFormat(fromDate);
  if (!fromResult.valid) return fromResult;

  if (compareDates(date, fromDate) < 0) {
    return invalidResult(`日期不能早于${fromDate}`);
  }

  if (toDate) {
    const toResult = validateDateFormat(toDate);
    if (!toResult.valid) return toResult;

    if (compareDates(date, toDate) > 0) {
      return invalidResult(`日期不能晚于${toDate}`);
    }
  }
  return validResult();
}

/**
 * 校验间隔序列（用于复习间隔）
 * - 必须是非空数组
 * - 元素必须是正整数
 * - 必须严格递增
 */
export function validateIntervals(intervals: number[]): ValidationResult {
  if (!Array.isArray(intervals) || intervals.length === 0) {
    return invalidResult('间隔序列不能为空');
  }

  for (let i = 0; i < intervals.length; i++) {
    const val = intervals[i];
    if (!Number.isInteger(val) || val < 1) {
      return invalidResult('间隔天数必须是正整数');
    }

    if (i > 0 && intervals[i] <= intervals[i - 1]) {
      return invalidResult('间隔序列必须严格递增');
    }
  }
  return validResult();
}

/**
 * 校验数字范围
 */
export function validateNumberRange(
  value: number,
  fieldName: string,
  min: number,
  max: number
): ValidationResult {
  if (value < min || value > max) {
    return invalidResult(`${fieldName}应在${min}到${max}之间`);
  }
  return validResult();
}

/**
 * 批量校验（按顺序执行，遇到第一个错误即返回）
 */
export function validateAll(...checks: Array<() => ValidationResult>): ValidationResult {
  for (const check of checks) {
    const result = check();
    if (!result.valid) return result;
  }
  return validResult();
}
