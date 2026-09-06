/**
 * 兑换品新增 / 编辑弹窗（仅家长模式入口）
 *
 * 标题 + 贴纸图标 + 说明 + 所需积分；价格必须是正整数。
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type { Reward } from '@courseschedule/shared';
import { T, BORDER } from '../../app/tokens';
import type { RewardInput } from '../../stores/useRewardStore';

/** 预设贴纸图标，也允许直接填别的 emoji */
const EMOJI_PRESETS = ['🍦', '📺', '🎮', '🛝', '🎁', '📚', '🍭', '🎈', '🚲', '🏰', '🍕', '⏰'];

interface RewardFormDialogProps {
  open: boolean;
  /** 编辑时传入现有兑换品 */
  reward?: Reward | null;
  onSave: (input: RewardInput) => Promise<void>;
  onClose: () => void;
}

export const RewardFormDialog: React.FC<RewardFormDialogProps> = ({
  open,
  reward,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎁');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(reward?.title ?? '');
    setEmoji(reward?.emoji ?? '🎁');
    setDescription(reward?.description ?? '');
    setCost(reward ? String(reward.cost) : '');
    setIsActive(reward?.isActive ?? true);
    setError('');
  }, [open, reward]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('请写清楚兑换品是什么，孩子才知道攒积分为了啥');
      return;
    }
    const price = Number(cost);
    if (!Number.isInteger(price) || price <= 0) {
      setError('所需积分得是正整数');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: trimmedTitle,
        emoji: emoji.trim() || '🎁',
        description: description.trim() || undefined,
        cost: price,
        isActive,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>{reward ? '编辑兑换品' : '添加兑换品'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
          <TextField
            label="贴纸图标"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            sx={{ width: 96 }}
            inputProps={{ style: { fontSize: '1.5rem', textAlign: 'center' } }}
          />
          <TextField
            label="兑换品名称"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            placeholder="如：游戏时间 30 分钟"
          />
        </Box>

        {/* 图标预设：点一下就换，省得孩子和家长去搜 emoji */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {EMOJI_PRESETS.map((preset) => (
            <Box
              key={preset}
              role="button"
              tabIndex={0}
              onClick={() => setEmoji(preset)}
              onKeyDown={(e) => e.key === 'Enter' && setEmoji(preset)}
              sx={{
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                cursor: 'pointer',
                borderRadius: 2,
                bgcolor: emoji === preset ? T.yellow : T.paper,
                border: BORDER,
                boxShadow: emoji === preset ? `2px 2px 0 0 ${T.ink}` : 'none',
              }}
            >
              {preset}
            </Box>
          ))}
        </Box>

        <TextField
          label="说明（可选）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={2}
          placeholder="如：周末挑一天专门去玩"
        />
        <TextField
          label="所需积分"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          type="number"
          inputProps={{ min: 1, step: 1 }}
          helperText="建议一天打卡满额约 30 ⭐，按几天能攒到定价"
        />
        <FormControlLabel
          control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
          label={<Typography sx={{ fontWeight: 700 }}>在商城在售</Typography>}
        />
        {error && (
          <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 700 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2 }}>
          取消
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          disabled={saving}
          sx={{ borderRadius: 2, fontWeight: 800 }}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RewardFormDialog;
