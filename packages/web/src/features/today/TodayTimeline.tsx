/**
 * 今日课程时间轴组件
 *
 * 按时间排列显示今日的课程色块
 */

import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { CourseOccurrence } from '@courseschedule/shared';
import { SUBJECT_COLORS } from '@courseschedule/shared';

interface TodayTimelineProps {
  courses: CourseOccurrence[];
}

/**
 * 今日课程时间轴
 */
export const TodayTimeline: React.FC<TodayTimelineProps> = ({ courses }) => {
  if (courses.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🎉</Typography>
        <Typography variant="body1" color="text.secondary">
          今天没有课程，好好休息吧！
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {courses.map((occ, index) => {
        const colorHex = SUBJECT_COLORS[occ.color] || '#757575';

        return (
          <Paper
            key={`${occ.ruleId}-${occ.date}`}
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'stretch',
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: 2 },
            }}
          >
            {/* 左侧时间色条 */}
            <Box
              sx={{
                width: 6,
                bgcolor: colorHex,
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
                borderRight: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}
              >
                {occ.startTime}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', lineHeight: 1.2 }}
              >
                {occ.endTime}
              </Typography>
            </Box>

            {/* 课程信息 */}
            <Box sx={{ flex: 1, p: 1.5, pl: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 600, color: colorHex }}
                >
                  {occ.courseType === 'school' ? '🏫' : '🎹'} {occ.courseName}
                </Typography>
                <Chip
                  label={occ.courseType === 'school' ? '校内' : '校外'}
                  size="small"
                  sx={{
                    bgcolor: colorHex + '20',
                    color: colorHex,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>

              {occ.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
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
