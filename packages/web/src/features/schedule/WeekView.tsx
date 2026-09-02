/**
 * 周视图网格组件
 *
 * 7 列（周一到周日）× 时间段行，显示课程色块。
 * 支持左右切换周。
 */

import React from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import type { CourseCancellation, CourseOccurrence, ISODate } from '@courseschedule/shared';
import { addDays, getTodayISODate } from '@courseschedule/shared';
import { CourseSlot } from './CourseSlot';
import { cancellationKey } from '../../data/repositories/courseCancellationRepository';
import { T, BORDER, BORDER_SOFT } from '../../app/tokens';

/** 星期展示标签（周一在前） */
const WEEKDAY_HEADERS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/** 时段：上午 / 下午 / 晚上 */
type DayPeriod = '上午' | '下午' | '晚上';

/** 按开始时间（HH:mm）归入时段 */
const periodOf = (hhmm: string): DayPeriod => {
  const h = parseInt(hhmm.slice(0, 2), 10);
  if (h < 12) return '上午';
  if (h < 18) return '下午';
  return '晚上';
};

/** 时段标签配色 */
const PERIOD_STYLE: Record<DayPeriod, { bgcolor: string; color: string }> = {
  上午: { bgcolor: T.yellow, color: T.ink },
  下午: { bgcolor: T.blue, color: '#fff' },
  晚上: { bgcolor: T.pink, color: '#fff' },
};

interface WeekViewProps {
  /** 本周一日期 */
  weekStart: ISODate;
  /** 7 天的课程实例（每天一个子数组） */
  weekOccurrences: CourseOccurrence[][];
  /** 课程取消记录（键 ruleId|date） */
  cancellations: ReadonlyMap<string, CourseCancellation>;
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
  cancellations,
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

  // 本周出现过的时间段（去重 + 按开始、结束时间升序），用于时间行对齐
  const slotKey = (o: CourseOccurrence) => `${o.startTime}|${o.endTime}`;
  const slotSeen = new Map<string, { start: string; end: string }>();
  for (const day of weekOccurrences) {
    for (const o of day) {
      const k = slotKey(o);
      if (!slotSeen.has(k)) slotSeen.set(k, { start: o.startTime, end: o.endTime });
    }
  }
  const slots = [...slotSeen.entries()]
    .map(([key, t]) => ({ key, ...t, period: periodOf(t.start) }))
    .sort(
      (a, b) =>
        a.start.localeCompare(b.start) || a.end.localeCompare(b.end)
    );

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
      <Box
        sx={{
          mx: 2,
          p: 1.5,
          overflowX: 'auto',
          bgcolor: T.paper,
          border: BORDER,
          borderRadius: '14px',
          boxShadow: `3px 3px 0 0 ${T.ink}`,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '52px repeat(7, minmax(84px, 1fr))',
            gap: 0.75,
            minWidth: 640,
          }}
        >
          {/* 表头行：左上角 + 星期 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.textMuted,
              fontSize: '0.62rem',
              fontWeight: 700,
            }}
          >
            时间
          </Box>
          {dayHeaders.map((h) => (
            <Box
              key={h.date}
              sx={{
                textAlign: 'center',
                py: 1,
                borderRadius: 2,
                bgcolor: h.isToday ? T.yellow : 'transparent',
                border: h.isToday ? BORDER : '2px solid transparent',
                color: h.isToday ? T.ink : T.textMuted,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {h.label}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: h.isToday ? 800 : 600, lineHeight: 1.2 }}>
                {h.dayNum}日
              </Typography>
            </Box>
          ))}

          {/* 时间行 */}
          {slots.length === 0 ? (
            <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', color: '#C9C1AF', fontWeight: 600, py: 4, fontSize: '0.8rem' }}>
              本周无课程
            </Box>
          ) : (
            slots.map((slot, si) => {
              const showDivider = si === 0 || slots[si - 1].period !== slot.period;
              const ps = PERIOD_STYLE[slot.period];
              return (
              <React.Fragment key={slot.key}>
                {showDivider && (
                  <Box
                    sx={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: si === 0 ? 0 : 1,
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: ps.color,
                        bgcolor: ps.bgcolor,
                        border: BORDER,
                        borderRadius: '999px',
                        px: 1.25,
                        py: 0.2,
                        boxShadow: `2px 2px 0 0 ${T.ink}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {slot.period}
                    </Box>
                    <Box sx={{ flex: 1, borderTop: `2px dashed ${T.gray}`, height: 0 }} />
                  </Box>
                )}
                {/* 时间轴标签 */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: T.textMuted,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    lineHeight: 1.25,
                    textAlign: 'center',
                  }}
                >
                  <Box component="span">{slot.start}</Box>
                  <Box component="span" sx={{ opacity: 0.6 }}>
                    {slot.end}
                  </Box>
                </Box>

                {/* 7 天在该时段的单元格 */}
                {weekOccurrences.map((dayCourses, i) => {
                  const cell = dayCourses.filter((o) => slotKey(o) === slot.key);
                  return (
                    <Box
                      key={`${slot.key}-${i}`}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        minHeight: 46,
                        p: 0.5,
                        borderRadius: 2,
                        border: dayHeaders[i].isToday ? BORDER : BORDER_SOFT,
                        bgcolor: dayHeaders[i].isToday ? '#FFF3C4' : T.paper,
                      }}
                    >
                      {cell.map((occ) => (
                        <CourseSlot
                          key={`${occ.ruleId}-${occ.date}`}
                          occurrence={occ}
                          onClick={onCourseClick}
                          compact
                          cancellation={cancellations.get(cancellationKey(occ.ruleId, occ.date))}
                        />
                      ))}
                    </Box>
                  );
                })}
              </React.Fragment>
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
};
