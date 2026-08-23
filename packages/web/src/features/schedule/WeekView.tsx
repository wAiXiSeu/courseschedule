/**
 * 周视图网格组件
 *
 * 7 列（周一到周日）× 时间段行，显示课程色块。
 * 支持左右切换周。
 */

import React from 'react';
import { Box, Typography, IconButton, Paper, Chip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import type { CourseOccurrence, ISODate } from '@courseschedule/shared';
import { addDays, getTodayISODate } from '@courseschedule/shared';
import { CourseSlot } from './CourseSlot';

/** 星期展示标签（周一在前） */
const WEEKDAY_HEADERS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface WeekViewProps {
  /** 本周一日期 */
  weekStart: ISODate;
  /** 7 天的课程实例（每天一个子数组） */
  weekOccurrences: CourseOccurrence[][];
  /** 切换操作 */
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
  /** 点击课程色块 */
  onCourseClick?: (occurrence: CourseOccurrence) => void;
}

/**
 * 周视图网格
 */
export const WeekView: React.FC<WeekViewProps> = ({
  weekStart,
  weekOccurrences,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
  onCourseClick,
}) => {
  const today = getTodayISODate();

  // 是否为本周
  const isThisWeek = (() => {
    const thisMonday = (() => {
      const d = new Date();
      const day = d.getDay();
      const offset = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    return weekStart === thisMonday;
  })();

  // 获取 7 天的日期和星期标签
  const dayHeaders = WEEKDAY_HEADERS.map((label, i) => {
    const date = addDays(weekStart, i);
    const dayNum = date.slice(8); // DD
    const isToday = date === today;
    return { label, date, dayNum, isToday };
  });

  return (
    <Box>
      {/* 周切换栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
        }}
      >
        <IconButton onClick={onPrevWeek} size="small">
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {weekStart.slice(0, 4)}年{parseInt(weekStart.slice(5, 7))}月{parseInt(weekStart.slice(8, 10))}日
            {' — '}
            {(() => {
              const end = addDays(weekStart, 6);
              return `${parseInt(end.slice(5, 7))}月${parseInt(end.slice(8, 10))}日`;
            })()}
          </Typography>
          {!isThisWeek && (
            <Chip
              icon={<TodayIcon />}
              label="回到本周"
              size="small"
              onClick={onThisWeek}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        <IconButton onClick={onNextWeek} size="small">
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* 网格 */}
      <Paper
        elevation={0}
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
          p: 1.5,
          overflowX: 'auto',
        }}
      >
        {/* 表头：星期 + 日期 */}
        {dayHeaders.map((h) => (
          <Box
            key={h.date}
            sx={{
              textAlign: 'center',
              py: 1,
              borderRadius: 2,
              bgcolor: h.isToday ? 'primary.main' : 'transparent',
              color: h.isToday ? 'white' : 'text.secondary',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {h.label}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: h.isToday ? 700 : 400,
                lineHeight: 1.2,
              }}
            >
              {h.dayNum}日
            </Typography>
          </Box>
        ))}

        {/* 7 列课程 */}
        {weekOccurrences.map((dayCourses, i) => (
          <Box
            key={dayHeaders[i].date}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              minHeight: 160,
              border: dayHeaders[i].isToday ? '2px solid' : '1px solid',
              borderColor: dayHeaders[i].isToday ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 0.5,
              bgcolor: dayHeaders[i].isToday ? 'primary.main' + '08' : 'transparent',
            }}
          >
            {dayCourses.length === 0 ? (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.disabled',
                  textAlign: 'center',
                  pt: 2,
                  fontSize: '0.7rem',
                }}
              >
                无课程
              </Typography>
            ) : (
              dayCourses.map((occ) => (
                <CourseSlot
                  key={`${occ.ruleId}-${occ.date}`}
                  occurrence={occ}
                  onClick={onCourseClick}
                  compact
                />
              ))
            )}
          </Box>
        ))}
      </Paper>
    </Box>
  );
};
