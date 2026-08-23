/**
 * 课程色块组件
 *
 * 在周视图中显示单个课程实例，包含课程名、时间、地点
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import type { CourseOccurrence } from '@courseschedule/shared';
import { SUBJECT_COLORS } from '@courseschedule/shared';

interface CourseSlotProps {
  occurrence: CourseOccurrence;
  onClick?: (occurrence: CourseOccurrence) => void;
  compact?: boolean;
}

/**
 * 课程色块
 *
 * @example
 * <CourseSlot
 *   occurrence={occurrence}
 *   onClick={(o) => console.log('Clicked:', o)}
 * />
 */
export const CourseSlot: React.FC<CourseSlotProps> = ({
  occurrence,
  onClick,
  compact = false,
}) => {
  // 获取课程颜色（优先使用 color 字段，否则用默认色）
  const colorHex = SUBJECT_COLORS[occurrence.color] || '#757575';

  return (
    <Box
      onClick={() => onClick?.(occurrence)}
      sx={{
        bgcolor: colorHex,
        color: 'white',
        borderRadius: 1.5,
        p: compact ? 0.5 : 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': onClick
          ? {
              transform: 'scale(1.02)',
              boxShadow: 3,
            }
          : {},
        minHeight: compact ? 40 : 56,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* 课程名称 */}
      <Typography
        variant={compact ? 'caption' : 'body2'}
        sx={{
          fontWeight: 600,
          lineHeight: 1.2,
          mb: compact ? 0 : 0.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {occurrence.courseName}
      </Typography>

      {/* 时间 + 地点 */}
      {!compact && (
        <>
          <Typography
            variant="caption"
            sx={{
              opacity: 0.9,
              lineHeight: 1,
              mb: 0.3,
            }}
          >
            {occurrence.startTime} - {occurrence.endTime}
          </Typography>
          {occurrence.location && (
            <Typography
              variant="caption"
              sx={{
                opacity: 0.85,
                lineHeight: 1,
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              📍 {occurrence.location}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};
