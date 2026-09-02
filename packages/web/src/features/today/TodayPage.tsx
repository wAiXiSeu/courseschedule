/**
 * 今日视图页面
 *
 * 孩子首页 P0-3：显示今日日期、课程时间轴、任务清单、本周打卡情况
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useTodayData } from './useTodayData';
import { TodayTimeline } from './TodayTimeline';
import { TodayTaskList } from './TodayTaskList';
import { useCheckinStore } from '../../stores/useCheckinStore';
import { useAppStore } from '../../stores/useAppStore';
import { T, cardSx, pageHeadingSx, sectionTitleSx, BORDER } from '../../app/tokens';
import type { TaskView } from '@courseschedule/shared';

/**
 * 今日视图页面
 */
export const TodayPage: React.FC = () => {
  const { todayData, loading, refresh } = useTodayData();
  const currentDate = useAppStore((s) => s.currentDate);
  const checkin = useCheckinStore((s) => s.checkin);

  const handleCheckin = async (task: TaskView) => {
    await checkin(task.refType, task.refId, currentDate);
    await refresh();
  };

  if (loading || !todayData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <Typography color="text.secondary">加载中...</Typography>
      </Box>
    );
  }

  const { date, weekdayLabel, courses, tasks, todayDone, todayTotal, streak, weekStrip } = todayData;

  // 格式化日期显示
  const formatDateDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}月${parseInt(day)}日`;
  };

  return (
    <Box sx={{ pb: 2 }}>
      {/* 页面标题区：荧光笔标题 */}
      <Box sx={{ px: 2.5, pt: 3, pb: 1 }}>
        <Typography sx={pageHeadingSx}>
          今天是 {formatDateDisplay(date)}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: T.textMuted, mt: 1, fontWeight: 600 }}
        >
          {weekdayLabel} · 已打卡 {streak} 天 · 今日任务 {todayDone}/{todayTotal}
        </Typography>
      </Box>

      {/* 本周打卡格子 */}
      <Box sx={{ px: 2, mt: 2 }}>
        <Box sx={{ ...cardSx, p: 2 }}>
          <Typography sx={{ ...sectionTitleSx, mb: 1.5 }}>
            本周打卡
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-around' }}>
            {['一', '二', '三', '四', '五', '六', '日'].map((day, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    bgcolor: weekStrip[i] ? T.green : T.paper,
                    border: BORDER,
                    boxShadow: weekStrip[i] ? `2px 2px 0 0 ${T.ink}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {weekStrip[i] && (
                    <CheckIcon sx={{ fontSize: 20, color: '#fff', strokeWidth: 3 }} />
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: weekStrip[i] ? T.ink : T.textMuted, fontWeight: 700 }}
                >
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* 今日课程 */}
      <Box sx={{ px: 2, mt: 4 }}>
        <Typography sx={{ ...sectionTitleSx, fontSize: '1.0625rem', mb: 1.5 }}>
          今天的课程
        </Typography>
        <TodayTimeline courses={courses} />
      </Box>

      {/* 今日任务 */}
      <Box sx={{ px: 2, mt: 4 }}>
        <Typography sx={{ ...sectionTitleSx, fontSize: '1.0625rem', mb: 1.5 }}>
          今天的任务
        </Typography>
        <TodayTaskList tasks={tasks} onCheckin={handleCheckin} />
      </Box>
    </Box>
  );
};

export default TodayPage;
