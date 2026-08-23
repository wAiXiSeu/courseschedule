/**
 * 今日视图页面
 *
 * 孩子首页 P0-3：显示今日日期、课程时间轴、任务清单、本周打卡情况
 */

import React from 'react';
import { Box, Typography, Paper, Chip, Divider } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTodayData } from './useTodayData';
import { TodayTimeline } from './TodayTimeline';
import { TodayTaskList } from './TodayTaskList';
import { useAppStore } from '../../stores/useAppStore';
import type { TaskView } from '@courseschedule/shared';

/**
 * 今日视图页面
 */
export const TodayPage: React.FC = () => {
  const { todayData, loading } = useTodayData();
  const currentDate = useAppStore((s) => s.currentDate);

  // 打卡处理（T04 完善）
  const handleCheckin = (task: TaskView) => {
    console.log('打卡任务:', task);
    // T04: 调用 useCheckinStore.checkIn()
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
      {/* 页面标题区 */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          px: 3,
          py: 3,
          borderRadius: '0 0 24px 24px',
        }}
      >
        {/* 日期 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CalendarTodayIcon />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            今天是 {formatDateDisplay(date)} {weekdayLabel}
          </Typography>
        </Box>

        {/* 统计信息 */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            icon={<LocalFireDepartmentIcon />}
            label={`累计打卡 ${streak} 天`}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 600,
              '& .MuiChip-icon': { color: '#FFD700' },
            }}
          />
          <Chip
            icon={<CheckCircleIcon />}
            label={`今日任务 ${todayDone}/${todayTotal}`}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 600,
            }}
          />
        </Box>
      </Box>

      {/* 本周打卡格子 */}
      <Box sx={{ px: 2, mt: 2 }}>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
            📅 本周打卡
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
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: weekStrip[i] ? 'success.main' : 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}
                >
                  {weekStrip[i] && (
                    <CheckCircleIcon sx={{ fontSize: 20, color: 'white' }} />
                  )}
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* 今日课程 */}
      <Box sx={{ px: 2, mt: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          ▍今天的课程
        </Typography>
        <TodayTimeline courses={courses} />
      </Box>

      <Divider sx={{ my: 3, mx: 2 }} />

      {/* 今日任务 */}
      <Box sx={{ px: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          ▍今天的任务
        </Typography>
        <TodayTaskList tasks={tasks} onCheckin={handleCheckin} />
      </Box>
    </Box>
  );
};

export default TodayPage;
