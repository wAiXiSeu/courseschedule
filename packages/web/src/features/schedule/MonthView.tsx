/**
 * 月视图日历组件
 *
 * 7 列（周一到周日）× 若干周的日历网格，
 * 每个日期格内以彩色小条显示当日课程。
 * 支持左右切换月份。
 */

import React from 'react';
import { Box, Typography, IconButton, Chip, Tooltip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import type { CourseCancellation, CourseOccurrence, ISODate } from '@courseschedule/shared';
import { getTodayISODate } from '@courseschedule/shared';
import { T, BORDER, BORDER_SOFT } from '../../app/tokens';
import { useSubjectResolver } from '../../stores/useSubjectStore';
import { cancellationKey } from '../../data/repositories/courseCancellationRepository';
import type { MonthGridDay } from './useScheduleData';

/** 星期展示标签（周一在前） */
const WEEKDAY_HEADERS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/** 每个日期格最多直接显示的课程条数，超出显示 +N */
const MAX_VISIBLE_COURSES = 3;

interface MonthViewProps {
  /** 当前月份首日（YYYY-MM-01） */
  monthStart: ISODate;
  /** 月网格（按周排列，首尾补齐） */
  gridDays: MonthGridDay[];
  /** 切换操作 */
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onThisMonth: () => void;
  /** 点击课程条 */
  onCourseClick?: (occurrence: CourseOccurrence) => void;
  /** 课程取消记录（键 ruleId|date） */
  cancellations: ReadonlyMap<string, CourseCancellation>;
}

/**
 * 月视图日历
 */
export const MonthView: React.FC<MonthViewProps> = ({
  monthStart,
  gridDays,
  onPrevMonth,
  onNextMonth,
  onThisMonth,
  onCourseClick,
  cancellations,
}) => {
  const today = getTodayISODate();
  const resolve = useSubjectResolver();

  // 是否为本月（按年-月比较）
  const isThisMonth = monthStart.slice(0, 7) === today.slice(0, 7);

  // 月份标题
  const year = parseInt(monthStart.slice(0, 4), 10);
  const month = parseInt(monthStart.slice(5, 7), 10);

  return (
    <Box>
      {/* 月切换栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
        }}
      >
        <IconButton onClick={onPrevMonth} size="small">
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {year}年{month}月
          </Typography>
          {!isThisMonth && (
            <Chip
              icon={<TodayIcon />}
              label="回到本月"
              size="small"
              onClick={onThisMonth}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        <IconButton onClick={onNextMonth} size="small">
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* 日历网格 */}
      <Box
        sx={{
          mx: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.75,
          p: 1.5,
          overflowX: 'auto',
          bgcolor: T.paper,
          border: BORDER,
          borderRadius: '14px',
          boxShadow: `3px 3px 0 0 ${T.ink}`,
        }}
      >
        {/* 表头：星期 */}
        {WEEKDAY_HEADERS.map((label) => (
          <Typography
            key={label}
            variant="body2"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              color: T.textMuted,
              py: 0.5,
            }}
          >
            {label}
          </Typography>
        ))}

        {/* 日期格 */}
        {gridDays.map((day) => {
          const isToday = day.date === today;
          const dayNum = parseInt(day.date.slice(8, 10), 10);
          const visible = day.occurrences.slice(0, MAX_VISIBLE_COURSES);
          const overflowCount = day.occurrences.length - visible.length;

          return (
            <Box
              key={day.date}
              sx={{
                minHeight: 88,
                p: 0.5,
                borderRadius: 2,
                border: isToday ? BORDER : BORDER_SOFT,
                bgcolor: isToday
                  ? '#FFF3C4'
                  : day.inMonth
                    ? T.paper
                    : T.gray,
                opacity: day.inMonth ? 1 : 0.6,
              }}
            >
              {/* 日期数字 */}
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: isToday ? 800 : 600,
                  fontSize: '0.75rem',
                  lineHeight: 1.3,
                  mb: 0.25,
                  color: isToday ? T.ink : T.textMuted,
                  textAlign: 'right',
                  pr: 0.25,
                }}
              >
                {isToday ? `今天 ${dayNum}` : dayNum}
              </Typography>

              {/* 课程条 */}
              {visible.map((occ) => {
                const subject = resolve(occ.color);
                const cancellation = cancellations.get(cancellationKey(occ.ruleId, occ.date));
                const canceled = Boolean(cancellation);
                return (
                  <Tooltip
                    key={`${occ.ruleId}-${occ.date}`}
                    title={
                      canceled
                        ? `已取消：${cancellation!.reason}`
                        : `${subject.name} ${occ.startTime}-${occ.endTime}${occ.location ? ` · ${occ.location}` : ''}`
                    }
                    arrow
                  >
                    <Box
                      onClick={() => onCourseClick?.(occ)}
                      sx={{
                        bgcolor: subject.color,
                        color: 'white',
                        borderRadius: 1,
                        border: `1.5px solid ${T.ink}`,
                        boxShadow: `1px 1px 0 0 ${T.ink}`,
                        px: 0.5,
                        mb: 0.25,
                        opacity: canceled ? 0.55 : 1,
                        cursor: onCourseClick ? 'pointer' : 'default',
                        transition: 'transform 0.12s ease',
                        '&:hover': onCourseClick
                          ? { transform: 'translate(-1px, -1px)' }
                          : {},
                        overflow: 'hidden',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          lineHeight: 1.5,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textDecoration: canceled ? 'line-through' : 'none',
                        }}
                      >
                        {subject.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.55rem',
                          fontWeight: 600,
                          lineHeight: 1.4,
                          opacity: 0.9,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textDecoration: canceled ? 'line-through' : 'none',
                        }}
                      >
                        {occ.startTime} - {occ.endTime}
                      </Typography>
                      {canceled && (
                        <Typography
                          sx={{
                            fontSize: '0.5rem',
                            fontWeight: 700,
                            lineHeight: 1.3,
                            bgcolor: 'rgba(0,0,0,0.45)',
                            borderRadius: 0.5,
                            px: 0.4,
                            display: 'inline-block',
                          }}
                        >
                          已取消
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                );
              })}

              {/* 溢出提示 */}
              {overflowCount > 0 && (
                <Typography
                  sx={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: T.textMuted,
                    textAlign: 'center',
                  }}
                >
                  +{overflowCount} 门
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
