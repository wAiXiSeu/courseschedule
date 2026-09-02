/**
 * 复习内容卡片组件
 *
 * 显示复习项的标题、科目、学习日期、复习进度（D1/D2/D4/D7/D15 节点）。
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { REVIEW_INTERVALS } from '@courseschedule/shared';
import type { ReviewItem } from '@courseschedule/shared';
import { useSubjectResolver } from '../../stores/useSubjectStore';

interface ReviewCardProps {
  /** 复习项数据 */
  item: ReviewItem;
  /** 已完成轮次 */
  doneRounds: number;
  /** 总轮次 */
  totalRounds: number;
  /** 今日到期任务数 */
  todayDueCount: number;
  /** 点击编辑 */
  onEdit?: (item: ReviewItem) => void;
  /** 点击删除 */
  onDelete?: (item: ReviewItem) => void;
}

/**
 * 复习内容卡片
 */
export const ReviewCard: React.FC<ReviewCardProps> = ({
  item,
  doneRounds,
  totalRounds,
  todayDueCount,
  onEdit,
  onDelete,
}) => {
  // 解析科目（中文名 + 颜色）
  const resolve = useSubjectResolver();
  const subject = resolve(item.subject);
  const subjectColor = subject.color;

  // 计算进度百分比
  const progress = totalRounds > 0 ? Math.round((doneRounds / totalRounds) * 100) : 0;

  // 格式化日期
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
            {item.title}
          </Typography>
          {todayDueCount > 0 && (
            <Chip
              label={`今日 ${todayDueCount} 个待复习`}
              size="small"
              color="warning"
            />
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

        {/* 学习日期 */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          学习日期：{formatDate(item.learnDate)}
        </Typography>

        {/* 复习进度节点 */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            复习进度
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {item.intervals.map((interval, index) => {
              const isDone = index < doneRounds;
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {isDone ? (
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ color: 'grey.400', fontSize: 24 }} />
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                    D{interval}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* 进度条 */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              完成进度
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {doneRounds}/{totalRounds}
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
      </CardContent>

      {(onEdit || onDelete) && (
        <CardActions sx={{ pt: 0 }}>
          {onEdit && (
            <IconButton
              size="small"
              color="primary"
              onClick={() => onEdit(item)}
              title="编辑"
            >
              <EditIcon />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(item)}
              title="删除"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </CardActions>
      )}
    </Card>
  );
};
