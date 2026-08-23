/**
 * 计划任务表单弹窗
 *
 * 用于新建/编辑计划任务。
 * 表单字段：标题、描述、频率、weekdays（weekly时）、specificDate（once时）、时长
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
  Checkbox,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import type { PlanTask, PlanTaskFrequency, ISODate, Weekday } from '@courseschedule/shared';
import type { PlanTaskFormData } from '../../stores/usePlanStore';

interface PlanTaskFormDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 所属计划 ID */
  planId: string;
  /** 编辑模式时传入现有任务 */
  task?: PlanTask | null;
  /** 关闭弹窗 */
  onClose: () => void;
  /** 提交表单 */
  onSubmit: (data: PlanTaskFormData) => Promise<void>;
}

/**
 * 计划任务表单弹窗
 */
export const PlanTaskFormDialog: React.FC<PlanTaskFormDialogProps> = ({
  open,
  planId,
  task,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<PlanTaskFormData>({
    planId,
    title: '',
    description: '',
    frequency: 'daily',
    weekdays: [],
    specificDate: '',
    durationMin: 30,
  });

  // 编辑模式时初始化数据
  useEffect(() => {
    if (task) {
      setFormData({
        planId: task.planId,
        title: task.title,
        description: task.description || '',
        frequency: task.frequency,
        weekdays: task.weekdays || [],
        specificDate: task.specificDate || '',
        durationMin: task.durationMin || 30,
      });
    } else {
      // 新建模式，重置表单
      setFormData({
        planId,
        title: '',
        description: '',
        frequency: 'daily',
        weekdays: [],
        specificDate: '',
        durationMin: 30,
      });
    }
  }, [task, planId, open]);

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.title) {
      alert('请填写任务标题');
      return;
    }
    if (formData.frequency === 'weekly' && (!formData.weekdays || formData.weekdays.length === 0)) {
      alert('请选择至少一个星期');
      return;
    }
    if (formData.frequency === 'once' && !formData.specificDate) {
      alert('请选择具体日期');
      return;
    }
    await onSubmit(formData);
    onClose();
  };

  // 处理星期选择
  const handleWeekdayChange = (weekday: Weekday) => {
    const currentWeekdays = formData.weekdays || [];
    const newWeekdays = currentWeekdays.includes(weekday)
      ? currentWeekdays.filter((d) => d !== weekday)
      : [...currentWeekdays, weekday];
    setFormData({ ...formData, weekdays: newWeekdays });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? '编辑计划任务' : '新建计划任务'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="任务标题"
          fullWidth
          variant="outlined"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="任务描述"
          fullWidth
          variant="outlined"
          multiline
          rows={2}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>频率</InputLabel>
          <Select
            value={formData.frequency}
            label="频率"
            onChange={(e) =>
              setFormData({ ...formData, frequency: e.target.value as PlanTaskFrequency })
            }
          >
            <MenuItem value="daily">每日</MenuItem>
            <MenuItem value="weekly">每周</MenuItem>
            <MenuItem value="once">单次</MenuItem>
          </Select>
        </FormControl>

        {/* 每周频率时显示星期选择 */}
        {formData.frequency === 'weekly' && (
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormGroup row>
              {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((weekday) => (
                <FormControlLabel
                  key={weekday}
                  control={
                    <Checkbox
                      checked={(formData.weekdays || []).includes(weekday)}
                      onChange={() => handleWeekdayChange(weekday)}
                    />
                  }
                  label={['周一', '周二', '周三', '周四', '周五', '周六', '周日'][
                    weekday === 0 ? 6 : weekday - 1
                  ]}
                />
              ))}
            </FormGroup>
          </FormControl>
        )}

        {/* 单次频率时显示日期选择 */}
        {formData.frequency === 'once' && (
          <TextField
            margin="dense"
            label="具体日期"
            type="date"
            fullWidth
            variant="outlined"
            value={formData.specificDate}
            onChange={(e) => setFormData({ ...formData, specificDate: e.target.value as ISODate })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        )}

        <TextField
          margin="dense"
          label="建议时长（分钟）"
          type="number"
          fullWidth
          variant="outlined"
          value={formData.durationMin}
          onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) })}
          sx={{ mb: 2 }}
        />
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
