/**
 * 今日任务清单组件
 *
 * 显示学习计划任务 + 到期复习任务，支持打卡勾选。
 * 打卡逻辑在 T04 中完善，此处先调用约定的 action 签名。
 */

import React from 'react';
import { Box, Typography, Checkbox, Chip, Paper, Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { TaskView } from '@courseschedule/shared';

interface TodayTaskListProps {
  tasks: TaskView[];
  /** 打卡回调（T04 接入 useCheckinStore） */
  onCheckin?: (task: TaskView) => void;
}

/**
 * 今日任务清单
 */
export const TodayTaskList: React.FC<TodayTaskListProps> = ({ tasks, onCheckin }) => {
  if (tasks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography sx={{ fontSize: '2rem', mb: 1 }}>📝</Typography>
        <Typography variant="body2" color="text.secondary">
          今天没有待办任务
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {tasks.map((task) => (
        <Paper
          key={task.key}
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: task.done ? 'success.light' : 'divider',
            bgcolor: task.done ? 'success.main' + '08' : 'background.paper',
            transition: 'all 0.2s',
            opacity: task.done ? 0.7 : 1,
          }}
        >
          {/* 打卡勾选框 */}
          <Checkbox
            checked={task.done}
            onChange={() => {
              if (!task.done && onCheckin) {
                onCheckin(task);
              }
            }}
            disabled={task.done}
            icon={<RadioButtonUncheckedIcon />}
            checkedIcon={<CheckCircleOutlineIcon sx={{ color: 'success.main' }} />}
            sx={{
              p: 0.5,
              '& .MuiSvgIcon-root': { fontSize: 28 },
            }}
          />

          {/* 任务内容 */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                textDecoration: task.done ? 'line-through' : 'none',
                color: task.done ? 'text.secondary' : 'text.primary',
                lineHeight: 1.3,
              }}
            >
              {task.title}
            </Typography>
          </Box>

          {/* 来源标签 */}
          <Chip
            label={task.sourceLabel}
            size="small"
            variant="outlined"
            sx={{
              flexShrink: 0,
              fontSize: '0.7rem',
              borderColor: task.sourceLabel === '复习计划' ? 'warning.main' : 'info.main',
              color: task.sourceLabel === '复习计划' ? 'warning.main' : 'info.main',
            }}
          />

          {/* 到期提醒标记 */}
          {task.due && !task.done && (
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
              label="到期"
              size="small"
              color="warning"
              sx={{
                flexShrink: 0,
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            />
          )}
        </Paper>
      ))}
    </Box>
  );
};
