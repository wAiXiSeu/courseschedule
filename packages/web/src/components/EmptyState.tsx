/**
 * 空列表引导插画区
 *
 * 当列表为空时显示友好的引导提示，鼓励用户添加内容
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { T, BORDER, SHADOW_SM } from '../app/tokens';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * 空状态占位组件
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji,
  title,
  description,
  action,
}) => {
  return (
    <Box
      sx={{
        mx: 2,
        mt: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 3,
        textAlign: 'center',
        bgcolor: T.paper,
        border: BORDER,
        borderRadius: '14px',
        boxShadow: SHADOW_SM,
      }}
    >
      {/* emoji 收进黄色贴纸圆底，保持品牌感 */}
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: T.yellow,
          border: BORDER,
          boxShadow: `3px 3px 0 0 ${T.ink}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2.5,
          transform: 'rotate(-6deg)',
        }}
      >
        <Typography sx={{ fontSize: '1.75rem', lineHeight: 1 }}>{emoji}</Typography>
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: T.ink }}>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{ color: T.textMuted, fontWeight: 600, mt: 0.5, mb: 2.5, maxWidth: 300 }}
        >
          {description}
        </Typography>
      )}
      {action && <Box>{action}</Box>}
    </Box>
  );
};
