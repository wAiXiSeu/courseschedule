/**
 * 学习计划表单弹窗
 *
 * 用于新建/编辑学习计划。
 * 表单字段：标题、描述、科目、开始日期、结束日期、状态
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
  Select,
  MenuItem,
} from '@mui/material';
import type { LearningPlan, PlanStatus } from '@courseschedule/shared';
import { SUBJECT_COLORS } from '@courseschedule/shared';
import type { PlanFormData } from '../../stores/usePlanStore';

interface PlanFormDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 编辑模式时传入现有计划 */
  plan?: LearningPlan | null;
  /** 关闭弹窗 */
  onClose: () => void;
  /** 提交表单 */
  onSubmit: (data: PlanFormData) => Promise<void>;
}

/**
 * 学习计划表单弹窗
 */
export const PlanFormDialog: React.FC<PlanFormDialogProps> = ({
  open,
  plan,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<PlanFormData>({
    title: '',
    description: '',
    subject: 'chinese',
    startDate: '',
    endDate: '',
    status: 'active',
  });

  // 编辑模式时初始化数据
  useEffect(() => {
    if (plan) {
      setFormData({
        title: plan.title,
        description: plan.description || '',
        subject: plan.subject,
        startDate: plan.startDate,
        endDate: plan.endDate,
        status: plan.status,
      });
    } else {
      // 新建模式，重置表单
      setFormData({
        title: '',
        description: '',
        subject: 'chinese',
        startDate: '',
        endDate: '',
        status: 'active',
      });
    }
  }, [plan, open]);

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      alert('请填写必要字段');
      return;
    }
    await onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{plan ? '编辑学习计划' : '新建学习计划'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="计划标题"
          fullWidth
          variant="outlined"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="计划描述"
          fullWidth
          variant="outlined"
          multiline
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>科目</InputLabel>
          <Select
            value={formData.subject}
            label="科目"
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          >
            {Object.keys(SUBJECT_COLORS).map((key) => (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          margin="dense"
          label="开始日期"
          type="date"
          fullWidth
          variant="outlined"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="结束日期"
          type="date"
          fullWidth
          variant="outlined"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth>
          <InputLabel>状态</InputLabel>
          <Select
            value={formData.status}
            label="状态"
            onChange={(e) => setFormData({ ...formData, status: e.target.value as PlanStatus })}
          >
            <MenuItem value="active">进行中</MenuItem>
            <MenuItem value="completed">已完成</MenuItem>
            <MenuItem value="archived">已归档</MenuItem>
          </Select>
        </FormControl>
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
