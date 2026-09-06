/**
 * 家长手工加减积分弹窗
 *
 * 计划外的表现（主动多练琴、帮忙做家务、该罚的小动作）由家长直接落成一条流水，
 * 原因是必填项 —— 孩子看流水时要能看懂这笔分为什么加减。
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { getTodayISODate } from '@courseschedule/shared';
import { T } from '../../app/tokens';

interface ManualAdjustDialogProps {
  open: boolean;
  onSubmit: (input: { points: number; reason: string; date: string }) => Promise<void>;
  onClose: () => void;
}

export const ManualAdjustDialog: React.FC<ManualAdjustDialogProps> = ({
  open,
  onSubmit,
  onClose,
}) => {
  const [direction, setDirection] = useState<'add' | 'sub'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(getTodayISODate());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setDirection('add');
    setAmount('');
    setReason('');
    setDate(getTodayISODate());
    setError('');
  }, [open]);

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setError('积分请填写正整数');
      return;
    }
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('写一句原因，孩子看流水时才知道为什么');
      return;
    }

    await onSubmit({ points: direction === 'add' ? value : -value, reason: trimmed, date });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>手工调整积分</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ToggleButtonGroup
          exclusive
          value={direction}
          onChange={(_, next) => next && setDirection(next)}
          size="small"
        >
          <ToggleButton value="add" sx={{ fontWeight: 800 }}>
            奖励加分
          </ToggleButton>
          <ToggleButton value="sub" sx={{ fontWeight: 800 }}>
            扣分
          </ToggleButton>
        </ToggleButtonGroup>

        <TextField
          label="积分"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          inputProps={{ min: 1, step: 1 }}
          helperText={direction === 'add' ? '如主动练琴 20 分钟：15' : '如未按约定完成：10'}
        />
        <TextField
          label="原因"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          minRows={2}
          placeholder={direction === 'add' ? '今天自己主动练了 20 分钟琴' : '说好练琴却偷偷看电视'}
        />
        <TextField
          label="归属日期"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        {error && (
          <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 700 }}>
            {error}
          </Typography>
        )}
        <Typography variant="caption" sx={{ color: T.textMuted, fontWeight: 600 }}>
          手工流水可以随时删除，删除后余额同步回退。
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2 }}>
          取消
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          sx={{ borderRadius: 2, fontWeight: 800 }}
        >
          记一笔
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManualAdjustDialog;
