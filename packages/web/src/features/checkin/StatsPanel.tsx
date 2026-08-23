/**
 * 打卡统计面板
 *
 * 显示累计打卡天数、本周打卡格子、今日完成率。
 */

import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { WeekOverview } from './WeekOverview';

interface StatsPanelProps {
  /** 累计打卡天数 */
  totalDays: number;
  /** 本周打卡状态 */
  weekStrip: boolean[];
  /** 今日完成率 */
  completionRate: { done: number; total: number };
}

/**
 * 打卡统计面板
 */
export const StatsPanel: React.FC<StatsPanelProps> = ({
  totalDays,
  weekStrip,
  completionRate,
}) => {
  // 计算完成率百分比
  const completionPercent = completionRate.total > 0
    ? Math.round((completionRate.done / completionRate.total) * 100)
    : 0;

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
      {/* 统计标题 */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        📊 打卡统计
      </Typography>

      {/* 统计卡片 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {/* 累计打卡天数 */}
        <Chip
          icon={<LocalFireDepartmentIcon />}
          label={`累计打卡 ${totalDays} 天`}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.9rem',
            '& .MuiChip-icon': { color: '#FFD700' },
            px: 2,
            py: 0.5,
          }}
        />

        {/* 今日完成率 */}
        <Chip
          icon={<CheckCircleIcon />}
          label={`今日完成 ${completionRate.done}/${completionRate.total}`}
          sx={{
            bgcolor: completionPercent === 100 ? 'success.main' : 'grey.200',
            color: completionPercent === 100 ? 'white' : 'text.primary',
            fontWeight: 600,
            fontSize: '0.9rem',
            px: 2,
            py: 0.5,
          }}
        />
      </Box>

      {/* 本周打卡概览 */}
      <WeekOverview weekStrip={weekStrip} />
    </Paper>
  );
};
