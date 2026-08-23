/**
 * 错题录入/编辑弹窗
 *
 * 支持新建和编辑两种模式。
 * 编辑模式下自动回填已有数据。
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
  Chip,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Checkbox,
  InputAdornment,
  IconButton,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  SUBJECT_COLORS,
  SUBJECT_LABELS,
  REASON_TAGS,
} from '@courseschedule/shared';
import type { Mistake, ISODate } from '@courseschedule/shared';
import type { MistakeFormData } from '../../stores/useMistakeStore';

/* ─── Props 接口 ─── */

interface MistakeFormDialogProps {
  /** 弹窗是否打开 */
  open: boolean;
  /** 编辑时传入错题对象，为空则为新建模式 */
  mistake?: Mistake | null;
  /** 提交回调 */
  onSubmit: (data: MistakeFormData) => void;
  /** 关闭回调 */
  onClose: () => void;
}

/** 科目选项列表 */
const SUBJECTS = Object.keys(SUBJECT_COLORS);

/** 获取当天日期 YYYY-MM-DD */
function getTodayStr(): ISODate {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}` as ISODate;
}

/** 表单默认值 */
const DEFAULT_FORM_DATA: MistakeFormData = {
  subject: '',
  knowledgePoints: [],
  questionText: '',
  imageIds: [],
  reasonTags: [],
  mistakeDate: '',
  masteryStatus: 'pending',
};

/**
 * 错题录入/编辑弹窗
 */
export const MistakeFormDialog: React.FC<MistakeFormDialogProps> = ({
  open,
  mistake,
  onSubmit,
  onClose,
}) => {
  const isEditMode = !!mistake;

  /* ─── 表单状态 ─── */
  const [formData, setFormData] = useState<MistakeFormData>({
    ...DEFAULT_FORM_DATA,
    mistakeDate: getTodayStr(),
  });
  const [knowledgeInput, setKnowledgeInput] = useState('');
  const [errors, setErrors] = useState<{ subject?: string; questionText?: string }>({});

  /** 弹窗打开时初始化/回填表单 */
  useEffect(() => {
    if (!open) return;

    if (mistake) {
      // 编辑模式：回填数据
      setFormData({
        subject: mistake.subject,
        knowledgePoints: [...mistake.knowledgePoints],
        questionText: mistake.questionText,
        imageIds: [...mistake.imageIds],
        reasonTags: [...mistake.reasonTags],
        mistakeDate: mistake.mistakeDate,
        masteryStatus: mistake.masteryStatus,
      });
    } else {
      // 新建模式：重置为默认值
      setFormData({ ...DEFAULT_FORM_DATA, mistakeDate: getTodayStr() });
    }
    setKnowledgeInput('');
    setErrors({});
  }, [open, mistake]);

  /* ─── 表单校验 ─── */
  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.subject) {
      newErrors.subject = '请选择科目';
    }
    if (!formData.questionText.trim()) {
      newErrors.questionText = '请输入题目内容';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ─── 提交 ─── */
  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(formData);
    onClose();
  };

  /* ─── 知识点标签操作 ─── */
  const handleAddKnowledgePoint = () => {
    const tag = knowledgeInput.trim();
    if (!tag) return;
    if (formData.knowledgePoints.includes(tag)) return;
    setFormData((prev) => ({
      ...prev,
      knowledgePoints: [...prev.knowledgePoints, tag],
    }));
    setKnowledgeInput('');
  };

  const handleRemoveKnowledgePoint = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      knowledgePoints: prev.knowledgePoints.filter((t) => t !== tag),
    }));
  };

  /** Enter 键快捷添加知识点 */
  const handleKnowledgeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKnowledgePoint();
    }
  };

  /* ─── 错误原因多选 ─── */
  const handleReasonToggle = (reason: string) => {
    setFormData((prev) => {
      const has = prev.reasonTags.includes(reason);
      return {
        ...prev,
        reasonTags: has
          ? prev.reasonTags.filter((r) => r !== reason)
          : [...prev.reasonTags, reason],
      };
    });
  };

  /* ─── 图片上传（占位） ─── */
  const handleImageUpload = () => {
    // TODO: 待接入云存储，当前仅做 UI 占位
    console.log('图片上传功能待接入云存储');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      {/* 弹窗标题 */}
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEditMode ? '✏️ 编辑错题' : '➕ 添加错题'}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          {/* 科目选择 */}
          <FormControl fullWidth required error={!!errors.subject}>
            <InputLabel>科目</InputLabel>
            <Select
              value={formData.subject}
              label="科目"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
            >
              {SUBJECTS.map((key) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: SUBJECT_COLORS[key],
                      }}
                    />
                    {SUBJECT_LABELS[key] || key}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {errors.subject && (
              <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                {errors.subject}
              </Typography>
            )}
          </FormControl>

          {/* 知识点标签 */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
              知识点标签
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {formData.knowledgePoints.map((point) => (
                <Chip
                  key={point}
                  label={point}
                  onDelete={() => handleRemoveKnowledgePoint(point)}
                  color="primary"
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              size="small"
              placeholder="输入知识点后按 Enter 或点击添加"
              value={knowledgeInput}
              onChange={(e) => setKnowledgeInput(e.target.value)}
              onKeyDown={handleKnowledgeKeyDown}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={handleAddKnowledgePoint}
                    >
                      <AddCircleOutlineIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* 题目文字 */}
          <TextField
            fullWidth
            required
            multiline
            minRows={3}
            maxRows={6}
            label="题目内容"
            placeholder="请输入错题的题目内容"
            value={formData.questionText}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, questionText: e.target.value }))
            }
            error={!!errors.questionText}
            helperText={errors.questionText}
          />

          {/* 出错日期 */}
          <TextField
            label="出错日期"
            type="date"
            value={formData.mistakeDate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                mistakeDate: e.target.value as ISODate,
              }))
            }
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          {/* 错误原因（多选） */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
              错误原因
            </Typography>
            <FormGroup row>
              {REASON_TAGS.map((reason) => (
                <FormControlLabel
                  key={reason}
                  control={
                    <Checkbox
                      checked={formData.reasonTags.includes(reason)}
                      onChange={() => handleReasonToggle(reason)}
                      size="small"
                    />
                  }
                  label={reason}
                  sx={{ mr: 1 }}
                />
              ))}
            </FormGroup>
          </Box>

          {/* 图片上传区域（占位） */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
              题目图片
            </Typography>
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={handleImageUpload}
              sx={{ borderRadius: 2 }}
            >
              上传图片（待接入云存储）
            </Button>
            {formData.imageIds.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                已上传 {formData.imageIds.length} 张
              </Typography>
            )}
          </Box>

          {/* 掌握状态（编辑模式下可切换） */}
          {isEditMode && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.masteryStatus === 'mastered'}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      masteryStatus: e.target.checked ? 'mastered' : 'pending',
                    }))
                  }
                  color="success"
                />
              }
              label={
                formData.masteryStatus === 'mastered' ? '✅ 已掌握' : '⏳ 未掌握'
              }
            />
          )}
        </Box>
      </DialogContent>

      {/* 底部操作按钮 */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2 }}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {isEditMode ? '保存修改' : '添加错题'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MistakeFormDialog;
