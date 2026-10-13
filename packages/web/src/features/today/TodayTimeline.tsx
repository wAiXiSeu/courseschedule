/**
 * 今日课程时间轴组件
 *
 * 按时间排列显示今日的课程色块
 */

import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { COURSE_TYPE_LABELS } from '@courseschedule/shared';
import type { CourseOccurrence } from '@courseschedule/shared';
import { T, BORDER, BORDER_SOFT, SHADOW_SM } from '../../app/tokens';
import { useSubjectResolver } from '../../stores/useSubjectStore';

interface TodayTimelineProps {
  courses: CourseOccurrence[];
}

/**
 * 今日课程时间轴
 */
export const TodayTimeline: React.FC<TodayTimelineProps> = ({ courses }) => {
  const resolve = useSubjectResolver();

  if (courses.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 4,
          borderRadius: 3.5,
          border: BORDER_SOFT,
          bgcolor: T.paper,
        }}
      >
        <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600 }}>
          今天没有课程，好好休息吧～
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {courses.map((occ, index) => {
        const subject = resolve(occ.color);

        return (
          <Paper
            key={`${occ.ruleId}-${occ.date}`}
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'stretch',
              borderRadius: 3,
              overflow: 'hidden',
              border: BORDER,
              boxShadow: SHADOW_SM,
              bgcolor: 'background.paper',
              transition: 'transform 0.12s ease, box-shadow 0.12s ease',
              '&:hover': {
                transform: 'translate(-2px, -2px)',
                boxShadow: `6px 6px 0 0 ${T.ink}`,
              },
            }}
          >
            {/* 左侧时间色条 */}
            <Box
              sx={{
                width: 8,
                bgcolor: subject.color,
                flexShrink: 0,
              }}
            />

            {/* 时间区域 */}
            <Box
              sx={{
                width: 80,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                py: 1.5,
                borderRight: BORDER_SOFT,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 800, color: T.ink, lineHeight: 1.2 }}
              >
                {occ.startTime}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: T.textMuted, lineHeight: 1.2, fontWeight: 600 }}
              >
                {occ.endTime}
              </Typography>
            </Box>

            {/* 课程信息 */}
            <Box sx={{ flex: 1, p: 1.5, pl: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 700, color: T.ink }}
                >
                  {subject.name}
                </Typography>
                <Chip
                  label={COURSE_TYPE_LABELS[occ.courseType]}
                  size="small"
                  sx={{
                    bgcolor: subject.color,
                    color: '#fff',
                    fontSize: '0.7rem',
                    height: 22,
                    border: BORDER,
                  }}
                />
              </Box>

              {occ.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: 14, color: T.textMuted }} />
                  <Typography variant="caption" sx={{ color: T.textMuted, fontWeight: 600 }}>
                    {occ.location}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};
