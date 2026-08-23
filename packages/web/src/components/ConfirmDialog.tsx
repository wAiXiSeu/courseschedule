/**
 * 确认对话框组件
 *
 * 用于删除等危险操作的二次确认，符合 PRD P0-1 要求
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 确认对话框
 *
 * @example
 * <ConfirmDialog
 *   open={showDeleteConfirm}
 *   title="删除课程"
 *   message="确定要删除"钢琴课"吗？此操作不可撤销。"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDeleteConfirm(false)}
 * />
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = '删除',
  cancelText = '取消',
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle
        id="confirm-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'error.main',
        }}
      >
        <WarningAmberIcon />
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit" variant="outlined">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
