/**
 * 错题卡片组件
 *
 * 显示单条错题的详细信息，支持编辑、删除、标记掌握状态
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import type { Mistake } from '@courseschedule/shared';
import { useSubjectResolver } from '../../stores/useSubjectStore';

interface MistakeCardProps {
  mistake: Mistake;
  /** 点击编辑；未传则不渲染该按钮 */
  onEdit?: (mistake: Mistake) => void;
  /** 点击删除；未传则不渲染该按钮 */
  onDelete?: (mistakeId: string) => void;
  /** 切换掌握状态（非破坏性，孩子模式亦可操作） */
  onToggleMastery: (mistakeId: string) => void;
}

/**
 * 错题卡片
 */
export const MistakeCard: React.FC<MistakeCardProps> = ({
  mistake,
  onEdit,
  onDelete,
  onToggleMastery,
}) => {
  const resolve = useSubjectResolver();
  const subject = resolve(mistake.subject);
  const isMastered = mistake.masteryStatus === 'mastered';

  return (
    <Card sx={{ mb: 2, borderLeft: `4px solid ${subject.color}` }}>
      <CardContent>
        {/* 头部：科目 + 掌握状态 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ color: subject.color, fontWeight: 600 }}>
            {subject.name}
          </Typography>
          <Chip
            icon={isMastered ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
            label={isMastered ? '已掌握' : '未掌握'}
            color={isMastered ? 'success' : 'default'}
            size="small"
            onClick={() => onToggleMastery(mistake.id)}
            sx={{ cursor: 'pointer' }}
          />
        </Box>

        {/* 知识点标签 */}
        {mistake.knowledgePoints.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            {mistake.knowledgePoints.map((point) => (
              <Chip key={point} label={point} size="small" variant="outlined" />
            ))}
          </Box>
        )}

        {/* 题目文字 */}
        <Typography variant="body1" sx={{ mb: 1 }}>
          {mistake.questionText}
        </Typography>

        {/* 图片缩略图（TODO: 实际图片展示） */}
        {mistake.imageIds.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            📷 附带 {mistake.imageIds.length} 张图片
          </Typography>
        )}

        {/* 错误原因标签 */}
        {mistake.reasonTags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            {mistake.reasonTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                color="error"
                variant="outlined"
              />
            ))}
          </Box>
        )}

        {/* 出错日期 */}
        <Typography variant="caption" color="text.secondary">
          出错日期：{mistake.mistakeDate}
        </Typography>
      </CardContent>

      {(onEdit || onDelete) && (
        <CardActions>
          {onEdit && (
            <IconButton onClick={() => onEdit(mistake)} color="primary">
              <EditIcon />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              onClick={() => onDelete(mistake.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </CardActions>
      )}
    </Card>
  );
};
