/**
 * 学习计划卡片组件
 *
 * 显示学习计划的标题、科目、进度条与今日任务数。
 * 「任务列表」一行可展开，逐条查看频率 / 时长 / 今天是否要做，
 * 家长模式下可就地编辑、停用或删除单条任务。
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Collapse,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Switch,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { LearningPlan, PlanTask } from '@courseschedule/shared';
import { getWeekdayLabel, isPlanTaskDueOn } from '@courseschedule/shared';
import { useSubjectResolver } from '../../stores/useSubjectStore';
import { useAppStore } from '../../stores/useAppStore';
import { T } from '../../app/tokens';

/** 任务频率文案 */
function frequencyLabel(task: PlanTask): string {
  switch (task.frequency) {
    case 'daily':
      return '每日';
    case 'weekly': {
      const days = (task.weekdays ?? []).map((d) => getWeekdayLabel(d).replace('周', '')).join('、');
      return days ? `每周·${days}` : '每周';
    }
    case 'once': {
      if (!task.specificDate) return '指定单日';
      const [, month, day] = task.specificDate.split('-');
      return `${parseInt(month, 10)}/${parseInt(day, 10)} 一次`;
    }
    default:
      return task.frequency;
  }
}

interface PlanCardProps {
  /** 学习计划数据 */
  plan: LearningPlan;
  /** 进度百分比（0-100） */
  progress: number;
  /** 今日任务数 */
  todayTaskCount: number;
  /** 任务总数 */
  totalTaskCount: number;
  /** 该计划下的任务列表（展开时逐条展示） */
  tasks?: PlanTask[];
  /** 点击编辑；未传则不渲染该按钮 */
  onEdit?: (plan: LearningPlan) => void;
  /** 点击删除；未传则不渲染该按钮 */
  onDelete?: (plan: LearningPlan) => void;
  /** 点击添加任务；未传则不渲染该按钮 */
  onAddTask?: (plan: LearningPlan) => void;
  /** 点击编辑单条任务；未传则不渲染该按钮 */
  onEditTask?: (task: PlanTask) => void;
  /** 点击删除单条任务；未传则不渲染该按钮 */
  onDeleteTask?: (task: PlanTask) => void;
  /** 切换任务启用状态；未传则不渲染开关 */
  onToggleTaskActive?: (task: PlanTask) => void;
}

/**
 * 学习计划卡片
 */
export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  progress,
  todayTaskCount,
  totalTaskCount,
  tasks = [],
  onEdit,
  onDelete,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskActive,
}) => {
  // 解析科目（中文名 + 颜色）
  const resolve = useSubjectResolver();
  const subject = resolve(plan.subject);
  const subjectColor = subject.color;
  const currentDate = useAppStore((s) => s.currentDate);
  const [expanded, setExpanded] = useState(false);

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

      {/* 任务列表展开开关 */}
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 2,
          py: 1,
          cursor: 'pointer',
          borderTop: `1px solid ${T.gray}`,
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700, flexGrow: 1 }}>
          任务列表（{tasks.length}）
        </Typography>
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Box>

      <Collapse in={expanded} unmountOnExit>
        <Box sx={{ px: 2, pb: 1 }}>
          {tasks.length === 0 && (
            <Typography variant="body2" sx={{ color: T.textMuted, py: 1.5 }}>
              这个计划还没有任务{onAddTask ? '，点下方「添加任务」加一条' : ''}
            </Typography>
          )}

          {tasks.map((task) => {
            const dueToday = isPlanTaskDueOn(task, currentDate);

            return (
              <Box
                key={task.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1,
                  borderTop: `1px dashed ${T.gray}`,
                  opacity: task.isActive ? 1 : 0.5,
                }}
              >
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      textDecoration: task.isActive ? 'none' : 'line-through',
                    }}
                  >
                    {task.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
                    <Chip label={frequencyLabel(task)} size="small" variant="outlined" />
                    {task.durationMin && (
                      <Chip label={`${task.durationMin} 分钟`} size="small" variant="outlined" />
                    )}
                    {dueToday && (
                      <Chip label="今天要做" size="small" color="primary" sx={{ fontWeight: 700 }} />
                    )}
                    {!task.isActive && <Chip label="已停用" size="small" />}
                  </Box>
                </Box>

                {onToggleTaskActive && (
                  <Switch
                    size="small"
                    checked={task.isActive}
                    onChange={() => onToggleTaskActive(task)}
                    title={task.isActive ? '停用该任务' : '启用该任务'}
                    inputProps={{ 'aria-label': `停用或启用「${task.title}」` }}
                  />
                )}
                {onEditTask && (
                  <IconButton
                    size="small"
                    onClick={() => onEditTask(task)}
                    title="编辑任务"
                    aria-label={`编辑任务「${task.title}」`}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
                {onDeleteTask && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDeleteTask(task)}
                    title="删除任务"
                    aria-label={`删除任务「${task.title}」`}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            );
          })}
        </Box>
      </Collapse>

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
