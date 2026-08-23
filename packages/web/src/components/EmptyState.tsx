/**
 * 空列表引导插画区
 *
 * 当列表为空时显示友好的引导提示，鼓励用户添加内容
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Typography sx={{ fontSize: '4rem', mb: 2 }}>{emoji}</Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, maxWidth: 300 }}
        >
          {description}
        </Typography>
      )}
      {action && <Box>{action}</Box>}
    </Box>
  );
};
