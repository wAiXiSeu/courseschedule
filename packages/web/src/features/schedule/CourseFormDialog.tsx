/**
 * 课程表单弹窗
 *
 * 支持添加/编辑课程及其排课规则。
 * 课程不单独命名，标题即所选科目；字段：科目、类型(校内/校外)、地点、排课规则(星期+时间+生效区间)。
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
  type SubjectCategory,
  SUBJECT_CATEGORY_LABELS,
  SUBJECT_CATEGORY_ORDER,
  getTodayISODate,
  addDays,
} from '@courseschedule/shared';
import { useNavigate } from 'react-router-dom';
import type { CourseFormData, ScheduleRuleFormData } from '../../stores/useScheduleStore';
import { useSubjectStore } from '../../stores/useSubjectStore';

interface CourseFormDialogProps {
  open: boolean;
  /** 编辑模式时传入已有课程 */
  course?: Course;
  /** 编辑模式时传入该课程的排课规则 */
  existingRules?: ScheduleRuleFormData[];
  onSave: (data: CourseFormData) => Promise<void>;
  onClose: () => void;
  /** 删除课程（仅编辑模式显示入口） */
  onDelete?: (course: Course) => Promise<void>;
}

/** 表单默认值 */
const getDefaultRule = (): ScheduleRuleFormData => ({
  weekday: 1,
  startTime: '09:00',
  endTime: '10:00',
  effectiveFrom: getTodayISODate(),
});

const defaultFormData: CourseFormData = {
  type: 'extracurricular',
  location: '',
  color: 'math',
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
  onDelete,
}) => {
  const [formData, setFormData] = useState<CourseFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subjects = useSubjectStore((s) => s.subjects);
  const navigate = useNavigate();

  // 按类别分组（跳过空组）
  const subjectGroups = SUBJECT_CATEGORY_ORDER.map((category: SubjectCategory) => ({
    category,
    items: subjects.filter((s) => s.category === category),
  })).filter((g) => g.items.length > 0);

  // 打开时初始化表单
  useEffect(() => {
    if (open) {
      if (course && existingRules) {
        setFormData({
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
    if (!formData.color) {
      newErrors.color = '请选择科目';
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

  // 删除课程
  const handleDelete = async () => {
    if (!course || !onDelete) return;
    const subjectOf = subjects.find((s) => s.id === course.color)?.name ?? course.color;
    if (!window.confirm(`确定删除「${subjectOf}」这门课程吗？它的排课时间会一并删除。`)) return;
    setDeleting(true);
    try {
      await onDelete(course);
      onClose();
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setDeleting(false);
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
        {/* 课程类型 + 地点 */}
        <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 2 }}>
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
              <MenuItem value="school">校内</MenuItem>
              <MenuItem value="extracurricular">校外</MenuItem>
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

        {/* 科目选择（按类别分组，中文名） */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
            选择科目
          </Typography>
          <Button
            size="small"
            onClick={() => {
              onClose();
              navigate('/subjects');
            }}
          >
            管理科目
          </Button>
        </Box>
        <Box sx={{ mb: 2 }}>
          {subjectGroups.map((group) => (
            <Box key={group.category} sx={{ mb: 1.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                {SUBJECT_CATEGORY_LABELS[group.category]}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                {group.items.map((subject) => {
                  const selected = formData.color === subject.id;
                  return (
                    <Chip
                      key={subject.id}
                      label={subject.name}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, color: subject.id }))
                      }
                      sx={{
                        bgcolor: selected ? subject.color : subject.color + '33',
                        color: selected ? '#fff' : subject.color,
                        fontWeight: selected ? 700 : 400,
                        border: selected
                          ? `2px solid ${subject.color}`
                          : '2px solid transparent',
                        cursor: 'pointer',
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>

        {errors.color && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: -1 }}>
            {errors.color}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* 排课规则 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
            排课时间
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
        {course && onDelete && (
          <Button
            onClick={handleDelete}
            color="error"
            disabled={saving || deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : undefined}
            sx={{ mr: 'auto' }}
          >
            {deleting ? '删除中…' : '删除课程'}
          </Button>
        )}
        <Button onClick={onClose} color="inherit" disabled={saving || deleting}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving || deleting}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {saving ? '保存中…' : course ? '更新' : '添加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
