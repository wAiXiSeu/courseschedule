/**
 * 录入学习内容弹窗
 *
 * 表单字段：标题、科目、学习日期、间隔序列（默认 [1,2,4,7,15]，可自定义）
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { REVIEW_INTERVALS } from '@courseschedule/shared';
import type { ReviewItemFormData } from '../../stores/useReviewStore';
import { SubjectSelect } from '../../components/SubjectSelect';

interface ReviewItemFormDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭弹窗 */
  onClose: () => void;
  /** 提交表单 */
  onSubmit: (data: ReviewItemFormData) => Promise<void>;
}

/**
 * 录入学习内容弹窗
 */
export const ReviewItemFormDialog: React.FC<ReviewItemFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<ReviewItemFormData>({
    title: '',
    subject: 'chinese',
    learnDate: '',
    intervals: [...REVIEW_INTERVALS],
    sourceType: 'manual',
  });

  const [customIntervals, setCustomIntervals] = useState<string>('');
  const [useCustom, setUseCustom] = useState(false);

  // 重置表单
  useEffect(() => {
    if (open) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      setFormData({
        title: '',
        subject: 'chinese',
        learnDate: `${y}-${m}-${d}`,
        intervals: [...REVIEW_INTERVALS],
        sourceType: 'manual',
      });
      setCustomIntervals('1,2,4,7,15');
      setUseCustom(false);
    }
  }, [open]);

  // 处理自定义间隔
  const handleCustomIntervalsChange = (value: string) => {
    setCustomIntervals(value);
    // 解析为数组
    const parsed = value
      .split(/[,，\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1)
      .sort((a, b) => a - b);
    if (parsed.length > 0) {
      setFormData({ ...formData, intervals: parsed });
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.title || !formData.learnDate) {
      alert('请填写必要字段');
      return;
    }
    await onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>录入学习内容</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="内容标题"
          fullWidth
          variant="outlined"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          sx={{ mb: 2 }}
          placeholder="例如：乘法口诀表、Unit 3 单词"
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>科目</InputLabel>
          <SubjectSelect
            label="科目"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
        </FormControl>

        <TextField
          margin="dense"
          label="学习日期"
          type="date"
          fullWidth
          variant="outlined"
          value={formData.learnDate}
          onChange={(e) => setFormData({ ...formData, learnDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          复习间隔序列
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant={!useCustom ? 'contained' : 'outlined'}
            size="small"
            onClick={() => {
              setUseCustom(false);
              setFormData({ ...formData, intervals: [...REVIEW_INTERVALS] });
            }}
          >
            默认（D1/D2/D4/D7/D15）
          </Button>
          <Button
            variant={useCustom ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setUseCustom(true)}
          >
            自定义
          </Button>
        </Box>

        {useCustom && (
          <TextField
            margin="dense"
            label="间隔天数（用逗号分隔）"
            fullWidth
            variant="outlined"
            value={customIntervals}
            onChange={(e) => handleCustomIntervalsChange(e.target.value)}
            helperText="例如：1,2,4,7,15 表示第1天、第2天、第4天、第7天、第15天复习"
            sx={{ mb: 2 }}
          />
        )}

        {/* 预览间隔 */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            当前间隔序列：
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
            {formData.intervals.map((interval, index) => (
              <Chip
                key={index}
                label={`D${interval}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} variant="contained">
          确定
        </Button>
      </DialogActions>
    </Dialog>
  );
};
