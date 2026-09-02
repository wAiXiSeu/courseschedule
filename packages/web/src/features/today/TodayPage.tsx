/**
 * 今日视图页面
 *
 * 孩子首页：今日日期 + 今日一句（必背古诗词/名言）+ 今日课程时间轴
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTodayData } from './useTodayData';
import { TodayTimeline } from './TodayTimeline';
import { useAppStore } from '../../stores/useAppStore';
import { getDailyRecitation, RECITATION_KIND_LABEL } from '@courseschedule/shared';
import { T, cardSx, pageHeadingSx, sectionTitleSx } from '../../app/tokens';

/**
 * 今日视图页面
 */
export const TodayPage: React.FC = () => {
  const { todayData, loading } = useTodayData();
  const currentDate = useAppStore((s) => s.currentDate);

  if (loading || !todayData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <Typography color="text.secondary">加载中...</Typography>
      </Box>
    );
  }

  const { date, weekdayLabel, courses } = todayData;
  const quote = getDailyRecitation(currentDate);

  // 格式化日期显示
  const formatDateDisplay = (dateStr: string) => {
    const [, month, day] = dateStr.split('-');
    return `${parseInt(month)}月${parseInt(day)}日`;
  };

  return (
    <Box sx={{ pb: 2 }}>
      {/* 页面标题区：荧光笔标题 */}
      <Box sx={{ px: 2.5, pt: 3, pb: 1 }}>
        <Typography sx={pageHeadingSx}>
          今天是 {formatDateDisplay(date)}
        </Typography>
        <Typography variant="body2" sx={{ color: T.textMuted, mt: 1, fontWeight: 600 }}>
          {weekdayLabel}
        </Typography>
      </Box>

      {/* 今日一句：必背古诗词 / 名言警句 */}
      <Box sx={{ px: 2, mt: 2 }}>
        <Box sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1,
              bgcolor: T.pink,
            }}
          >
            <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
              今日一句
            </Typography>
            <Box
              sx={{
                ml: 'auto',
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#fff',
                bgcolor: 'rgba(0,0,0,0.25)',
                px: 1,
                py: 0.25,
                borderRadius: '999px',
              }}
            >
              {RECITATION_KIND_LABEL[quote.kind]}
            </Box>
          </Box>
          <Box sx={{ p: 2.5 }}>
            <Typography
              sx={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: T.ink,
                lineHeight: 1.7,
                textAlign: 'center',
                letterSpacing: 0.5,
              }}
            >
              {quote.text}
            </Typography>
            <Typography
              sx={{
                mt: 1.5,
                color: T.textMuted,
                fontSize: '0.85rem',
                fontWeight: 600,
                textAlign: 'right',
              }}
            >
              —— {quote.source}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 今日课程 */}
      <Box sx={{ px: 2, mt: 4 }}>
        <Typography sx={{ ...sectionTitleSx, fontSize: '1.0625rem', mb: 1.5 }}>
          今天的课程
        </Typography>
        <TodayTimeline courses={courses} />
      </Box>
    </Box>
  );
};

export default TodayPage;
