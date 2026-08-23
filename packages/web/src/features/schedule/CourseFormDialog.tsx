/**
 * 课程表单弹窗
 *
 * 支持添加/编辑课程及其排课规则。
 * 字段：课程名、类型(校内/校外)、地点、颜色(色板选择)、排课规则(星期+时间+生效区间)。
 * 支持"添加更多排课时间"（同一课程多条 ScheduleRule）。
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
  Box,
  IconButton,
  Typography,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  type Course,
  type ISODate,
  SUBJECT_COLORS,
  getTodayISODate,
  addDays,
} from '@courseschedule/shared';
import type { CourseFormData, ScheduleRuleFormData } from '../../stores/useScheduleStore';

interface CourseFormDialogProps {
  open: boolean;
  /** 编辑模式时传入已有课程 */
  course?: Course;
  /** 编辑模式时传入该课程的排课规则 */
  existingRules?: ScheduleRuleFormData[];
  onSave: (data: CourseFormData) => Promise<void>;
  onClose: () => void;
}

/** 表单默认值 */
const getDefaultRule = (): ScheduleRuleFormData => ({
  weekday: 1,
  startTime: '09:00',
  endTime: '10:00',
  effectiveFrom: getTodayISODate(),
});

const defaultFormData: CourseFormData = {
  name: '',
  type: 'extracurricular',
  location: '',
  color: 'music',
  rules: [getDefaultRule()],
};

/** 星期标签（0=周日） */
const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 课程表单弹窗
 */
export const CourseFormDialog: React.FC<CourseFormDialogProps> = ({
  open,
  course,
  existingRules,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<CourseFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 打开时初始化表单
  useEffect(() => {
    if (open) {
      if (course && existingRules) {
        setFormData({
          name: course.name,
          type: course.type,
          location: course.location || '',
          color: course.color,
          note: course.note,
          rules: existingRules.length > 0 ? [...existingRules] : [getDefaultRule()],
        });
      } else {
        setFormData({
          ...defaultFormData,
          rules: [getDefaultRule()],
        });
      }
      setErrors({});
    }
  }, [open, course, existingRules]);

  // 校验表单
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '请输入课程名称';
    }
    if (formData.rules.length === 0) {
      newErrors.rules = '请至少添加一个排课时间';
    }
    for (let i = 0; i < formData.rules.length; i++) {
      const rule = formData.rules[i];
      if (rule.startTime >= rule.endTime) {
        newErrors[`rule_${i}_time`] = '结束时间须晚于开始时间';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交
  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  // 更新排课规则
  const updateRule = (index: number, field: keyof ScheduleRuleFormData, value: unknown) => {
    setFormData((prev) => {
      const newRules = [...prev.rules];
      newRules[index] = { ...newRules[index], [field]: value };
      return { ...prev, rules: newRules };
    });
  };

  // 添加规则
  const addRule = () => {
    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, getDefaultRule()],
    }));
  };

  // 删除规则
  const removeRule = (index: number) => {
    if (formData.rules.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={saving}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {course ? '编辑课程' : '添加课程'}
      </DialogTitle>

      <DialogContent dividers>
        {/* 课程名称 */}
        <TextField
          fullWidth
          label="课程名称"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          error={!!errors.name}
          helperText={errors.name}
          sx={{ mt: 1, mb: 2 }}
          placeholder="如：钢琴课、语文、数学"
        />

        {/* 课程类型 + 地点 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>类型</InputLabel>
            <Select
              value={formData.type}
              label="类型"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  type: e.target.value as Course['type'],
                }))
              }
            >
              <MenuItem value="school">🏫 校内</MenuItem>
              <MenuItem value="extracurricular">🎹 校外</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="上课地点（可选）"
            value={formData.location}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, location: e.target.value }))
            }
            placeholder="如：音乐教室"
          />
        </Box>

        {/* 颜色选择（色板） */}
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          颜色标签
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {Object.entries(SUBJECT_COLORS).map(([key, hex]) => (
            <Chip
              key={key}
              label={key}
              onClick={() => setFormData((prev) => ({ ...prev, color: key }))}
              sx={{
                bgcolor: formData.color === key ? hex : hex + '33',
                color: formData.color === key ? '#fff' : hex,
                fontWeight: formData.color === key ? 700 : 400,
                border: formData.color === key ? `2px solid ${hex}` : '2px solid transparent',
                cursor: 'pointer',
              }}
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 排课规则 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
            📅 排课时间
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addRule}
            size="small"
            color="primary"
          >
            添加时间
          </Button>
        </Box>

        {formData.rules.map((rule, index) => (
          <Box
            key={index}
            sx={{
              p: 2,
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'grey.50',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
                排课 {index + 1}
              </Typography>
              {formData.rules.length > 1 && (
                <IconButton
                  size="small"
                  onClick={() => removeRule(index)}
                  color="error"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {/* 星期 */}
              <FormControl sx={{ minWidth: 100 }}>
                <InputLabel>星期</InputLabel>
                <Select
                  value={rule.weekday}
                  label="星期"
                  size="small"
                  onChange={(e) => updateRule(index, 'weekday', Number(e.target.value))}
                >
                  {weekdayLabels.map((label, i) => (
                    <MenuItem key={i} value={i}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 开始时间 */}
              <TextField
                label="开始"
                type="time"
                size="small"
                value={rule.startTime}
                onChange={(e) => updateRule(index, 'startTime', e.target.value)}
                error={!!errors[`rule_${index}_time`]}
                sx={{ width: 120 }}
                InputLabelProps={{ shrink: true }}
              />

              {/* 结束时间 */}
              <TextField
                label="结束"
                type="time"
                size="small"
                value={rule.endTime}
                onChange={(e) => updateRule(index, 'endTime', e.target.value)}
                error={!!errors[`rule_${index}_time`]}
                helperText={errors[`rule_${index}_time`]}
                sx={{ width: 120 }}
                InputLabelProps={{ shrink: true }}
              />

              {/* 生效起始 */}
              <TextField
                label="开始日期"
                type="date"
                size="small"
                value={rule.effectiveFrom}
                onChange={(e) =>
                  updateRule(index, 'effectiveFrom', e.target.value as ISODate)
                }
                sx={{ width: 140 }}
                InputLabelProps={{ shrink: true }}
              />

              {/* 生效截止 */}
              <TextField
                label="结束日期（可选）"
                type="date"
                size="small"
                value={rule.effectiveUntil || ''}
                onChange={(e) =>
                  updateRule(
                    index,
                    'effectiveUntil',
                    (e.target.value || undefined) as ISODate | undefined
                  )
                }
                sx={{ width: 160 }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        ))}

        {errors.rules && (
          <Typography color="error" variant="body2">
            {errors.rules}
          </Typography>
        )}
        {errors.form && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {errors.form}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {saving ? '保存中…' : course ? '更新' : '添加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
