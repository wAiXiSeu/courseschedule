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
      <Box
        sx={{
          bgcolor: 'success.main',
          color: 'white',
          px: 3,
          py: 3,
          borderRadius: '0 0 24px 24px',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          ⭐ 今日打卡
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
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
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          ▍今日任务
        </Typography>

        {checkinData.loading && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            加载中...
          </Typography>
        )}

        {!checkinData.loading && checkinData.todayTasks.length === 0 && (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h4" sx={{ mb: 1 }}>🎉</Typography>
            <Typography color="text.secondary">今日暂无任务</Typography>
          </Paper>
        )}

        {!checkinData.loading && checkinData.todayTasks.length > 0 && (
          <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <List disablePadding>
              {checkinData.todayTasks.map((task, index) => (
                <React.Fragment key={task.key}>
                  <ListItem
                    sx={{
                      bgcolor: task.done ? 'success.50' : 'transparent',
                      transition: 'background-color 0.3s',
                      py: 2,
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={task.done}
                        onChange={() => handleToggleCheckin(task)}
                        icon={<StarBorderIcon sx={{ fontSize: 32 }} />}
                        checkedIcon={
                          <StarIcon
                            sx={{
                              fontSize: 32,
                              color: '#FFD700',
                              filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))',
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
                              fontWeight: 600,
                              textDecoration: task.done ? 'line-through' : 'none',
                              color: task.done ? 'text.secondary' : 'text.primary',
                            }}
                          >
                            {task.title}
                          </Typography>
                          <Chip
                            label={task.sourceLabel}
                            size="small"
                            color={task.sourceLabel === '学习计划' ? 'primary' : 'secondary'}
                            sx={{ fontSize: '0.7rem' }}
                          />
                          {task.due && (
                            <Chip
                              label="到期"
                              size="small"
                              color="warning"
                              sx={{ fontSize: '0.7rem' }}
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
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default CheckinPage;
