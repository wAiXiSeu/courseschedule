/**
 * 本周概览组件
 *
 * 显示 7 个格子，标记每天的打卡状态。
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { T, BORDER, sectionTitleSx } from '../../app/tokens';

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
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: T.gray }}>
      <Typography sx={{ ...sectionTitleSx, mb: 1.5 }}>
        本周打卡
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
                width: 38,
                height: 38,
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
                <CheckIcon sx={{ fontSize: 22, color: '#fff', strokeWidth: 3 }} />
              )}
            </Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: weekStrip[i] ? T.ink : T.textMuted }}
            >
              {day}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
