/**
 * 打卡统计面板
 *
 * 显示累计打卡天数、本周打卡格子、今日完成率。
 */

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { WeekOverview } from './WeekOverview';
import { T, BORDER } from '../../app/tokens';

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
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3.5,
        bgcolor: T.paper,
        border: BORDER,
        boxShadow: `3px 3px 0 0 ${T.ink}`,
      }}
    >
      {/* 统计标题 */}
      <Typography sx={{ fontWeight: 700, mb: 2, color: T.ink }}>
        打卡统计
      </Typography>

      {/* 统计卡片 */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        {/* 累计打卡天数 */}
        <Chip
          icon={<LocalFireDepartmentIcon />}
          label={`累计打卡 ${totalDays} 天`}
          sx={{
            bgcolor: T.orange,
            color: T.ink,
            fontWeight: 700,
            fontSize: '0.85rem',
            '& .MuiChip-icon': { color: T.ink },
            px: 1.5,
            py: 0.5,
            height: 32,
          }}
        />

        {/* 今日完成率 */}
        <Chip
          icon={<CheckCircleIcon />}
          label={`今日完成 ${completionRate.done}/${completionRate.total}`}
          sx={{
            bgcolor: completionPercent === 100 ? T.green : T.gray,
            color: completionPercent === 100 ? '#fff' : T.ink,
            fontWeight: 700,
            fontSize: '0.85rem',
            '& .MuiChip-icon': {
              color: completionPercent === 100 ? '#fff' : T.textMuted,
            },
            px: 1.5,
            py: 0.5,
            height: 32,
          }}
        />
      </Box>

      {/* 本周打卡概览 */}
      <WeekOverview weekStrip={weekStrip} />
    </Box>
  );
};
