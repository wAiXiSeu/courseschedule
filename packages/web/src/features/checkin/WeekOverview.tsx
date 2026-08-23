/**
 * 本周概览组件
 *
 * 显示 7 个格子，标记每天的打卡状态。
 */

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface WeekOverviewProps {
  /** 本周打卡状态（周一起始，7 天） */
  weekStrip: boolean[];
}

/**
 * 本周概览组件
 */
export const WeekOverview: React.FC<WeekOverviewProps> = ({ weekStrip }) => {
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'grey.50' }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
        📅 本周打卡
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-around' }}>
        {weekDays.map((day, i) => (
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
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: weekStrip[i] ? 'success.main' : 'grey.300',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
                boxShadow: weekStrip[i] ? 2 : 0,
              }}
            >
              {weekStrip[i] && (
                <CheckCircleIcon sx={{ fontSize: 22, color: 'white' }} />
              )}
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
              {day}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
