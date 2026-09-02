/**
 * 打卡页面入口
 *
 * 显示今日任务列表，可勾选打卡。
 * 包含统计面板（累计打卡天数、本周打卡格子、今日完成率）。
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useCheckinData } from './useCheckinData';
import { useCheckinStore } from '../../stores/useCheckinStore';
import { useAppStore } from '../../stores/useAppStore';
import { StatsPanel } from './StatsPanel';
import { T, BORDER, pageHeadingSx, sectionTitleSx } from '../../app/tokens';
import type { TaskView, CheckinRefType, ISODate } from '@courseschedule/shared';

/**
 * 打卡页面
 */
export const CheckinPage: React.FC = () => {
  const checkinData = useCheckinData();
  const checkin = useCheckinStore((s) => s.checkin);
  const uncheckin = useCheckinStore((s) => s.uncheckin);
  const currentDate = useAppStore((s) => s.currentDate);

  // 处理打卡/取消打卡
  const handleToggleCheckin = async (task: TaskView) => {
    if (task.done) {
      // 取消打卡
      await uncheckin(task.refType, task.refId, currentDate);
    } else {
      // 打卡
      await checkin(task.refType, task.refId, currentDate);
    }
    // 刷新数据
    await checkinData.refresh();
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}月${parseInt(day)}日`;
  };

  return (
    <Box sx={{ pb: 2 }}>
      {/* 页面标题区 */}
      <Box sx={{ px: 2.5, pt: 3, pb: 1 }}>
        <Typography sx={pageHeadingSx}>
          今日打卡
        </Typography>
        <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600, mt: 1 }}>
          {formatDate(currentDate)}
        </Typography>
      </Box>

      {/* 统计面板 */}
      <Box sx={{ px: 2, mt: 2 }}>
        <StatsPanel
          totalDays={checkinData.totalDays}
          weekStrip={checkinData.weekStrip}
          completionRate={checkinData.completionRate}
        />
      </Box>

      {/* 今日任务列表 */}
      <Box sx={{ px: 2, mt: 3 }}>
        <Typography sx={{ ...sectionTitleSx, fontSize: '1.0625rem', mb: 1.5 }}>
          今日任务
        </Typography>

        {checkinData.loading && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            加载中...
          </Typography>
        )}

        {!checkinData.loading && checkinData.todayTasks.length === 0 && (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 3.5,
              bgcolor: T.paper,
              border: BORDER,
              boxShadow: `3px 3px 0 0 ${T.ink}`,
            }}
          >
            <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600 }}>今日暂无任务</Typography>
          </Box>
        )}

        {!checkinData.loading && checkinData.todayTasks.length > 0 && (
          <Box sx={{ borderRadius: 3.5, overflow: 'hidden', bgcolor: T.paper, border: BORDER, boxShadow: `3px 3px 0 0 ${T.ink}` }}>
            <List disablePadding>
              {checkinData.todayTasks.map((task, index) => (
                <React.Fragment key={task.key}>
                  <ListItem
                    sx={{
                      bgcolor: task.done ? '#EAF8F0' : 'transparent',
                      transition: 'background-color 0.2s',
                      py: 2,
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={task.done}
                        onChange={() => handleToggleCheckin(task)}
                        icon={<StarBorderIcon sx={{ fontSize: 28, color: '#C9C1AF' }} />}
                        checkedIcon={
                          <StarIcon
                            sx={{
                              fontSize: 28,
                              color: T.yellow,
                              stroke: T.ink,
                              strokeWidth: 1,
                            }}
                          />
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              textDecoration: task.done ? 'line-through' : 'none',
                              color: task.done ? T.textMuted : T.ink,
                            }}
                          >
                            {task.title}
                          </Typography>
                          <Chip
                            label={task.sourceLabel}
                            size="small"
                            color={task.sourceLabel === '学习计划' ? 'primary' : 'secondary'}
                            sx={{ fontSize: '0.7rem', height: 22 }}
                          />
                          {task.due && (
                            <Chip
                              label="到期"
                              size="small"
                              color="warning"
                              sx={{ fontSize: '0.7rem', height: 22 }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < checkinData.todayTasks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CheckinPage;
