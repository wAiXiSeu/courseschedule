/**
 * 课程色块组件
 *
 * 在周视图中显示单个课程实例，包含科目名、时间、地点；
 * 传入取消记录时渲染为已取消（降透明 + 删除线，Tooltip 显示原因）。
 */

import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import type { CourseCancellation, CourseOccurrence } from '@courseschedule/shared';
import { T, BORDER } from '../../app/tokens';
import { useSubjectResolver } from '../../stores/useSubjectStore';

interface CourseSlotProps {
  occurrence: CourseOccurrence;
  onClick?: (occurrence: CourseOccurrence) => void;
  compact?: boolean;
  /** 该节课的取消记录（存在即渲染为已取消） */
  cancellation?: CourseCancellation;
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
  cancellation,
}) => {
  // 科目决定色块颜色与标题
  const resolve = useSubjectResolver();
  const subject = resolve(occurrence.color);
  const canceled = Boolean(cancellation);

  const slot = (
    <Box
      onClick={() => onClick?.(occurrence)}
      sx={{
        bgcolor: subject.color,
        color: 'white',
        borderRadius: 2,
        border: BORDER,
        boxShadow: `2px 2px 0 0 ${T.ink}`,
        p: compact ? 0.5 : 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.12s ease',
        opacity: canceled ? 0.55 : 1,
        '&:hover': onClick
          ? {
              transform: 'translate(-1px, -1px)',
            }
          : {},
        minHeight: compact ? 40 : 56,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* 科目名称 */}
      <Typography
        variant={compact ? 'caption' : 'body2'}
        sx={{
          fontWeight: 700,
          lineHeight: 1.2,
          mb: compact ? 0 : 0.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textDecoration: canceled ? 'line-through' : 'none',
        }}
      >
        {subject.name}
      </Typography>

      {/* 时间 */}
      <Typography
        variant="caption"
        sx={{
          opacity: 0.9,
          lineHeight: 1,
          mb: compact ? 0 : 0.3,
          fontSize: compact ? '0.62rem' : undefined,
          textDecoration: canceled ? 'line-through' : 'none',
        }}
      >
        {occurrence.startTime} - {occurrence.endTime}
      </Typography>

      {/* 已取消提示 */}
      {canceled && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            lineHeight: 1,
            fontSize: compact ? '0.58rem' : '0.7rem',
            bgcolor: 'rgba(0,0,0,0.45)',
            borderRadius: 1,
            px: 0.5,
            py: 0.15,
            alignSelf: 'flex-start',
            mt: compact ? 0.25 : 0.5,
          }}
        >
          已取消
        </Typography>
      )}

      {/* 地点（仅非 compact 显示） */}
      {!compact && occurrence.location && (
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
          {occurrence.location}
        </Typography>
      )}
    </Box>
  );

  return cancellation ? (
    <Tooltip title={`已取消：${cancellation.reason}`} arrow>
      {slot}
    </Tooltip>
  ) : (
    slot
  );
};