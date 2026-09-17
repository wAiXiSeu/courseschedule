/**
 * 打卡统计面板
 *
 * 显示累计与连续打卡天数、历史最长纪录、本周打卡格子、今日完成率。
 */

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { WeekOverview } from './WeekOverview';
import { T, BORDER } from '../../app/tokens';

interface StatsPanelProps {
  /** 累计打卡天数 */
  totalDays: number;
  /** 当前连续打卡天数 */
  currentStreak: number;
  /** 历史最长连续打卡天数 */
  longestStreak: number;
  /** 本周打卡状态 */
  weekStrip: boolean[];
  /** 今日完成率 */
  completionRate: { done: number; total: number };
}

const CHIP_BASE = {
  height: 32,
  fontWeight: 700,
  fontSize: '0.85rem',
  px: 1.5,
} as const;

/**
 * 打卡统计面板
 */
export const StatsPanel: React.FC<StatsPanelProps> = ({
  totalDays,
  currentStreak,
  longestStreak,
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
          label={`累计 ${totalDays} 天`}
          sx={{
            ...CHIP_BASE,
            bgcolor: T.orange,
            color: T.ink,
            '& .MuiChip-icon': { color: T.ink },
            py: 0.5,
          }}
        />

        {/* 当前连续天数：里程碑奖励就靠它 */}
        <Chip
          label={`🔥 连续 ${currentStreak} 天`}
          sx={{
            ...CHIP_BASE,
            fontWeight: 800,
            bgcolor: currentStreak > 0 ? T.yellow : T.gray,
            color: T.ink,
            border: BORDER,
          }}
        />

        {/* 历史最长纪录 */}
        <Chip
          icon={<EmojiEventsIcon />}
          label={`最长 ${longestStreak} 天`}
          sx={{
            ...CHIP_BASE,
            bgcolor: T.gray,
            color: T.ink,
            '& .MuiChip-icon': { color: T.ink },
          }}
        />

        {/* 今日完成率 */}
        <Chip
          icon={<CheckCircleIcon />}
          label={`今日 ${completionRate.done}/${completionRate.total}`}
          sx={{
            ...CHIP_BASE,
            bgcolor: completionPercent === 100 ? T.green : T.gray,
            color: completionPercent === 100 ? '#fff' : T.ink,
            '& .MuiChip-icon': {
              color: completionPercent === 100 ? '#fff' : T.textMuted,
            },
            py: 0.5,
          }}
        />
      </Box>

      {/* 本周打卡概览 */}
      <WeekOverview weekStrip={weekStrip} />

      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 1.5, color: T.textMuted, fontWeight: 600 }}
      >
        补卡计入「累计」与本周格子，但不计入连续天数与里程碑（分值同正常打卡）。
      </Typography>
    </Box>
  );
};
