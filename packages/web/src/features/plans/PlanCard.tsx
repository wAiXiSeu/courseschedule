/**
 * 学习计划卡片组件
 *
 * 显示学习计划的标题、科目、进度条、今日任务数。
 * 支持点击查看详情、编辑、删除操作。
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import type { LearningPlan } from '@courseschedule/shared';
import { useSubjectResolver } from '../../stores/useSubjectStore';

interface PlanCardProps {
  /** 学习计划数据 */
  plan: LearningPlan;
  /** 进度百分比（0-100） */
  progress: number;
  /** 今日任务数 */
  todayTaskCount: number;
  /** 任务总数 */
  totalTaskCount: number;
  /** 点击编辑；未传则不渲染该按钮 */
  onEdit?: (plan: LearningPlan) => void;
  /** 点击删除；未传则不渲染该按钮 */
  onDelete?: (plan: LearningPlan) => void;
  /** 点击添加任务；未传则不渲染该按钮 */
  onAddTask?: (plan: LearningPlan) => void;
}

/**
 * 学习计划卡片
 */
export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  progress,
  todayTaskCount,
  totalTaskCount,
  onEdit,
  onDelete,
  onAddTask,
}) => {
  // 解析科目（中文名 + 颜色）
  const resolve = useSubjectResolver();
  const subject = resolve(plan.subject);
  const subjectColor = subject.color;

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const [, month, day] = dateStr.split('-');
    return `${parseInt(month)}/${parseInt(day)}`;
  };

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 3,
        boxShadow: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* 标题行 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
            {plan.title}
          </Typography>
          {/* 状态标签 */}
          {plan.status === 'active' && (
            <Chip label="进行中" size="small" color="success" />
          )}
          {plan.status === 'completed' && (
            <Chip label="已完成" size="small" color="info" />
          )}
          {plan.status === 'archived' && (
            <Chip label="已归档" size="small" color="default" />
          )}
        </Box>

        {/* 科目标签 */}
        <Chip
          label={subject.name}
          size="small"
          sx={{
            bgcolor: subjectColor,
            color: 'white',
            fontWeight: 600,
            mb: 1.5,
          }}
        />

        {/* 日期范围 */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {formatDate(plan.startDate)} ~ {formatDate(plan.endDate)}
        </Typography>

        {/* 进度条 */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              进度
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: subjectColor,
              },
            }}
          />
        </Box>

        {/* 今日任务数 */}
        <Typography variant="body2" color="text.secondary">
          今日任务：
          <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {todayTaskCount}
          </Box>
          / {totalTaskCount} 个任务
        </Typography>
      </CardContent>

      {(onAddTask || onEdit || onDelete) && (
        <CardActions sx={{ pt: 0 }}>
          {onAddTask && (
            <IconButton
              size="small"
              color="primary"
              onClick={() => onAddTask(plan)}
              title="添加任务"
            >
              <AddCircleIcon />
            </IconButton>
          )}
          {onEdit && (
            <IconButton
              size="small"
              color="primary"
              onClick={() => onEdit(plan)}
              title="编辑计划"
            >
              <EditIcon />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(plan)}
              title="删除计划"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </CardActions>
      )}
    </Card>
  );
};
