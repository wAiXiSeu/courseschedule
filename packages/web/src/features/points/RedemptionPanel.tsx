/**
 * 兑换单列表
 *
 * 孩子提交后进入待确认，家长在这里点「通过」才真正扣分。
 * 家长审批时会重新校验余额：pending 期间积分可能被撤销打卡回冲、
 * 或被另一张兑换单花掉（兑换不预扣），不够就只能拒绝。
 */

import React from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import type { Redemption } from '@courseschedule/shared';
import { T, BORDER, cardSx } from '../../app/tokens';

const STATUS_META: Record<Redemption['status'], { label: string; color: 'warning' | 'success' | 'default' }> = {
  pending: { label: '待家长确认', color: 'warning' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已拒绝', color: 'default' },
};

interface RedemptionPanelProps {
  redemptions: Redemption[];
  isParent: boolean;
  /** 家长审批时可用的余额；不足则通过按钮禁用并说明差多少 */
  balance: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function formatMoment(epochMs: number): string {
  const d = new Date(epochMs);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hh}:${mm}`;
}

export const RedemptionPanel: React.FC<RedemptionPanelProps> = ({
  redemptions,
  isParent,
  balance,
  onApprove,
  onReject,
}) => {
  if (redemptions.length === 0) {
    return (
      <Box sx={{ ...cardSx, p: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600 }}>
          还没有兑换单，攒够积分就能在上面换点想要的
        </Typography>
      </Box>
    );
  }

  const sorted = [...redemptions].sort((a, b) => b.requestedAt - a.requestedAt);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {sorted.map((redemption) => {
        const meta = STATUS_META[redemption.status];
        const shortBy = balance < redemption.cost;

        return (
          <Box
            key={redemption.id}
            sx={{
              ...cardSx,
              p: 2,
              borderColor: redemption.status === 'pending' ? T.ink : '#E5DFCF',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '1.35rem', lineHeight: 1 }}>
                {redemption.rewardEmoji}
              </Typography>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
                  {redemption.rewardTitle}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: T.textMuted, fontWeight: 600 }}>
                  {formatMoment(redemption.requestedAt)} 提交
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, color: T.pink, whiteSpace: 'nowrap' }}>
                −{redemption.cost} ⭐
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
              <Chip
                icon={redemption.status === 'pending' ? <HourglassTopIcon /> : undefined}
                label={meta.label}
                size="small"
                color={meta.color}
                sx={{ fontSize: '0.7rem', fontWeight: 800, border: BORDER }}
              />
              {redemption.status === 'pending' && !isParent && (
                <Typography sx={{ fontSize: '0.75rem', color: T.textMuted, fontWeight: 700 }}>
                  家长确认后才扣分
                </Typography>
              )}

              {redemption.status === 'pending' && isParent && (
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => onReject(redemption.id)}
                    sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.78rem' }}
                  >
                    拒绝
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={shortBy}
                    onClick={() => onApprove(redemption.id)}
                    sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.78rem', bgcolor: T.green }}
                  >
                    通过
                  </Button>
                </Box>
              )}
            </Box>

            {redemption.status === 'pending' && isParent && shortBy && (
              <Typography
                sx={{
                  mt: 1,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'error.main',
                  border: BORDER,
                  borderRadius: 2,
                  bgcolor: '#FFF0F0',
                  px: 1.5,
                  py: 0.75,
                }}
              >
                余额只剩 {balance} ⭐，不够这张 {redemption.cost} ⭐ 的单子，只能先拒绝
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default RedemptionPanel;
