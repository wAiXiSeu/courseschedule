/**
 * 单节课操作弹窗
 *
 * 点击某一节课程后弹出：查看该节信息；
 * 未取消 → 输入原因并「取消本节课」；已取消 → 显示原因并可「恢复本节课」。
 * 另提供「编辑课程」入口跳转到课程表单。
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import type { CourseCancellation, CourseOccurrence } from '@courseschedule/shared';
import { T, BORDER, RADIUS } from '../../app/tokens';
import { useSubjectResolver } from '../../stores/useSubjectStore';

interface OccurrenceDialogProps {
  open: boolean;
  /** 当前操作的课程实例（null 时只关闭不渲染内容） */
  occurrence: CourseOccurrence | null;
  /** 该节的取消记录（存在即处于已取消态） */
  cancellation?: CourseCancellation;
  onClose: () => void;
  /** 提交取消（reason 已校验非空） */
  onCancel: (reason: string) => Promise<void>;
  /** 恢复本节课 */
  onRestore: () => Promise<void>;
  /** 跳转课程编辑 */
  onEditCourse: () => void;
}

/**
 * 单节课操作弹窗
 */
export const OccurrenceDialog: React.FC<OccurrenceDialogProps> = ({
  open,
  occurrence,
  cancellation,
  onClose,
  onCancel,
  onRestore,
  onEditCourse,
}) => {
  const resolve = useSubjectResolver();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canceled = Boolean(occurrence && cancellation);

  // 每次打开时重置
  useEffect(() => {
    if (open) {
      setReason('');
      setSubmitting(false);
    }
  }, [open]);

  if (!occurrence) return null;

  const subject = resolve(occurrence.color);

  const handleCancel = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onCancel(reason.trim());
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    setSubmitting(true);
    try {
      await onRestore();
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {occurrence.date}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: T.ink }}>
            {subject.name}
          </Typography>
          <Typography variant="body2" sx={{ color: T.textMuted, mt: 0.5 }}>
            {occurrence.startTime} - {occurrence.endTime}
            {occurrence.location ? ` · ${occurrence.location}` : ''}
          </Typography>
        </Box>

        {canceled ? (
          <Box
            sx={{
              p: 1.5,
              borderRadius: RADIUS,
              border: BORDER,
              bgcolor: T.gray,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              已取消，原因：
            </Typography>
            <Typography variant="body2">{cancellation!.reason}</Typography>
          </Box>
        ) : (
          <TextField
            autoFocus
            label="取消原因"
            fullWidth
            multiline
            rows={2}
            placeholder="如：请假、生病、课程冲突"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={submitting && !reason.trim()}
            helperText={submitting && !reason.trim() ? '请填写取消原因' : ' '}
            sx={{ mb: 1 }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onEditCourse} color="primary" sx={{ mr: 'auto' }}>
          编辑课程
        </Button>
        {canceled ? (
          <Button
            onClick={handleRestore}
            variant="contained"
            color="success"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
          >
            恢复本节课
          </Button>
        ) : (
          <Button
            onClick={handleCancel}
            variant="contained"
            color="error"
            disabled={submitting || !reason.trim()}
            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
          >
            取消本节课
          </Button>
        )}
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          关闭
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OccurrenceDialog;