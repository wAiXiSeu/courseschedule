/**
 * 积分奖励页
 *
 * 余额 / 连续里程碑 / 兑换商城 / 兑换单 / 积分流水 五段。
 * 家长模式额外可配置兑换品、手工加减积分、审核待确认的兑换单；
 * 孩子模式只读规则、可下单兑换，看不到审核与配置入口。
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Snackbar,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import {
  POINT_RULES,
  STREAK_MILESTONES,
  nextMilestone,
  type Redemption,
  type Reward,
} from '@courseschedule/shared';
import { useAppStore, useIsParent } from '../../stores/useAppStore';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { usePointsStore } from '../../stores/usePointsStore';
import { useRewardStore, type RewardInput } from '../../stores/useRewardStore';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { RewardFormDialog } from './RewardFormDialog';
import { ManualAdjustDialog } from './ManualAdjustDialog';
import { RedemptionPanel } from './RedemptionPanel';
import { LedgerList } from './LedgerList';
import { T, BORDER, SHADOW, cardSx, pageHeadingSx, sectionTitleSx } from '../../app/tokens';

/** 一次性提示条 */
interface Toast {
  severity: 'success' | 'error' | 'info';
  text: string;
}

export const PointsPage: React.FC = () => {
  const isParent = useIsParent();
  const childId = useAppStore((s) => s.childId);
  const currentFamilyId = useFamilyStore((s) => s.currentFamilyId);

  const loadPoints = usePointsStore((s) => s.load);
  const ledger = usePointsStore((s) => s.ledger);
  const balance = usePointsStore((s) => s.balance);
  const currentStreak = usePointsStore((s) => s.currentStreak);
  const longestStreak = usePointsStore((s) => s.longestStreak);
  const redemptions = usePointsStore((s) => s.redemptions);
  const pointsLoading = usePointsStore((s) => s.loading);
  const pointsError = usePointsStore((s) => s.error);
  const redeem = usePointsStore((s) => s.redeem);
  const addAdjustment = usePointsStore((s) => s.addAdjustment);
  const removeAdjustment = usePointsStore((s) => s.removeAdjustment);
  const approveRedemption = usePointsStore((s) => s.approveRedemption);
  const rejectRedemption = usePointsStore((s) => s.rejectRedemption);

  const loadRewards = useRewardStore((s) => s.loadAll);
  const rewards = useRewardStore((s) => s.rewards);
  const rewardsLoading = useRewardStore((s) => s.loading);
  const addReward = useRewardStore((s) => s.addReward);
  const updateReward = useRewardStore((s) => s.updateReward);
  const removeReward = useRewardStore((s) => s.removeReward);

  const [toast, setToast] = useState<Toast | null>(null);
  const [rewardDialog, setRewardDialog] = useState<{ open: boolean; reward: Reward | null }>({
    open: false,
    reward: null,
  });
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);

  // 换孩子档案或换家庭空间 = 换数据边界，账本与商城都要重拉
  useEffect(() => {
    void loadPoints();
    void loadRewards();
  }, [childId, currentFamilyId, loadPoints, loadRewards]);

  const loading = pointsLoading || rewardsLoading;
  const next = nextMilestone(longestStreak);
  const shopItems = isParent ? rewards : rewards.filter((r) => r.isActive);
  const pendingRewardIds = new Set(
    redemptions.filter((r) => r.status === 'pending').map((r) => r.rewardId)
  );

  const handleRedeem = async (reward: Reward) => {
    const outcome = await redeem(reward);
    setToast({
      severity: outcome.ok ? 'success' : 'error',
      text: outcome.message ?? '已提交，等家长确认',
    });
  };

  const handleApprove = async (id: string) => {
    const outcome = await approveRedemption(id);
    if (!outcome.ok) {
      setToast({ severity: 'error', text: outcome.message ?? '无法通过' });
      return;
    }
    setToast({ severity: 'success', text: '已通过，积分已扣除' });
  };

  const handleReject = async (id: string) => {
    await rejectRedemption(id);
    setToast({ severity: 'info', text: '已拒绝这张兑换单，积分没有变动' });
  };

  const handleSaveReward = async (input: RewardInput) => {
    if (rewardDialog.reward) {
      await updateReward(rewardDialog.reward.id, input);
    } else {
      await addReward(input);
    }
    setToast({ severity: 'success', text: '兑换品已保存' });
  };

  return (
    <Box sx={{ pb: 2 }}>
      {/* 页头 */}
      <Box sx={{ px: 2.5, pt: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={pageHeadingSx}>积分奖励</Typography>
          {isParent && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<ControlPointIcon />}
                onClick={() => setAdjustOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 800, border: BORDER, bgcolor: T.paper }}
              >
                手工调分
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setRewardDialog({ open: true, reward: null })}
                sx={{ borderRadius: 2, fontWeight: 800, bgcolor: T.yellow, color: T.ink }}
              >
                添加兑换品
              </Button>
            </Box>
          )}
        </Box>
        <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600, mt: 1 }}>
          打卡攒星星，攒够了换想要的
        </Typography>
      </Box>

      {pointsError && (
        <Box sx={{ px: 2, mt: 1 }}>
          <Alert severity="error" sx={{ fontWeight: 700 }}>
            积分载入失败：{pointsError}
          </Alert>
        </Box>
      )}

      {loading && ledger.length === 0 && (
        <Typography sx={{ textAlign: 'center', py: 6, color: T.textMuted, fontWeight: 700 }}>
          加载中...
        </Typography>
      )}

      {/* 余额卡 */}
      <Box sx={{ px: 2, mt: 2 }}>
        <Box
          sx={{
            ...cardSx,
            p: 3,
            bgcolor: T.yellow,
            boxShadow: SHADOW,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography sx={{ fontSize: '2.5rem', lineHeight: 1 }}>⭐</Typography>
          <Box sx={{ flexGrow: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: T.ink, opacity: 0.7 }}>
              当前可用
            </Typography>
            {balance.balance >= 0 ? (
              <Typography sx={{ fontWeight: 800, fontSize: '2.25rem', lineHeight: 1.1, color: T.ink }}>
                {balance.balance}
                <Box component="span" sx={{ fontSize: '1rem', fontWeight: 800, ml: 0.5 }}>
                  ⭐
                </Box>
              </Typography>
            ) : (
              <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1.2, color: 'error.dark' }}>
                透支 {-balance.balance} ⭐
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
              <StatChip label="累计获得" value={balance.earned} />
              <StatChip label="已兑换" value={balance.spent} />
              <StatChip label="家长扣分" value={balance.penalty} />
            </Box>
          </Box>
        </Box>
        {balance.balance < 0 && (
          <Typography
            sx={{
              mt: 1,
              px: 1.5,
              py: 1,
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'error.main',
              border: BORDER,
              borderRadius: 2,
              bgcolor: '#FFF0F0',
            }}
          >
            有打卡被撤销，积分被回冲到了负数。多打几天卡就能补回来，这期间不能兑换。
          </Typography>
        )}
      </Box>

      {/* 连续打卡与里程碑 */}
      <Box sx={{ px: 2, mt: 3 }}>
        <Typography sx={{ ...sectionTitleSx, fontSize: '1.0625rem', mb: 1.5 }}>连续打卡</Typography>
        <Box sx={{ ...cardSx, p: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: T.ink }}>
              🔥 连续 {currentStreak} 天
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: T.textMuted }}>
              最长纪录 {longestStreak} 天
            </Typography>
          </Box>
          {next && (
            <Typography sx={{ mt: 1, fontWeight: 700, fontSize: '0.85rem', color: T.textMuted }}>
              再坚持 {next.remaining} 天可得 {next.label} · +{next.points} ⭐
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            {STREAK_MILESTONES.map((m) => {
              const achieved = longestStreak >= m.days;
              return (
                <Chip
                  key={m.days}
                  icon={<LocalOfferIcon />}
                  label={`${m.days}天 +${m.points}⭐`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    border: BORDER,
                    bgcolor: achieved ? T.green : T.gray,
                    color: achieved ? '#fff' : T.textMuted,
                    '& .MuiChip-icon': { color: achieved ? '#fff' : T.textMuted },
                  }}
                />
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* 兑换商城 */}
      <Box sx={{ px: 2, mt: 4 }}>
        <Typography sx={{ ...sectionTitleSx, fontSize: '1.0625rem', mb: 1.5 }}>
          想换点什么
        </Typography>
        {shopItems.length === 0 ? (
          <EmptyState
            emoji="🎁"
            title="还没有兑换品"
            description={
              isParent ? '点击右上角「添加兑换品」，给孩子定个小目标' : '请家长先设置好可以兑换的东西'
            }
          />
        ) : (
          <Grid container spacing={2}>
            {shopItems.map((reward) => {
              const affordable = balance.balance >= reward.cost;
              const pending = pendingRewardIds.has(reward.id);

              return (
                <Grid item xs={12} sm={6} key={reward.id}>
                  <Box
                    sx={{
                      ...cardSx,
                      height: '100%',
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      opacity: reward.isActive ? 1 : 0.55,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '1.75rem', lineHeight: 1 }}>
                        {reward.emoji}
                      </Typography>
                      <Typography sx={{ flexGrow: 1, fontWeight: 800, fontSize: '1rem' }}>
                        {reward.title}
                      </Typography>
                      {isParent && (
                        <Box>
                          <IconButton
                            size="small"
                            aria-label="编辑兑换品"
                            onClick={() => setRewardDialog({ open: true, reward })}
                          >
                            <EditIcon fontSize="small" sx={{ color: T.textMuted }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label="删除兑换品"
                            onClick={() => setDeleteTarget(reward)}
                          >
                            <DeleteOutlineIcon fontSize="small" sx={{ color: T.textMuted }} />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                    {reward.description && (
                      <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600 }}>
                        {reward.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
                      <Typography
                        sx={{
                          flexGrow: 1,
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          color: affordable ? T.ink : T.textMuted,
                        }}
                      >
                        {reward.cost} ⭐
                      </Typography>
                      {!reward.isActive && (
                        <Chip label="已下架" size="small" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
                      )}
                      {pending ? (
                        <Chip
                          label="待确认"
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 800, fontSize: '0.75rem', border: BORDER }}
                        />
                      ) : (
                        reward.isActive && (
                          <Button
                            size="small"
                            variant="contained"
                            disabled={!affordable}
                            onClick={() => void handleRedeem(reward)}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 800,
                              bgcolor: affordable ? T.green : T.gray,
                              color: affordable ? '#fff' : T.textMuted,
                              border: BORDER,
                              boxShadow: affordable ? `2px 2px 0 0 ${T.ink}` : 'none',
                            }}
                          >
                            {affordable ? '兑换' : '还差一点'}
                          </Button>
                        )
                      )}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* 兑换单 */}
      <Box sx={{ px: 2, mt: 4 }}>
        <Typography sx={{ ...sectionTitleSx, fontSize: '1.0625rem', mb: 1.5 }}>
          {isParent ? '待确认与历史兑换' : '我的兑换单'}
        </Typography>
        <RedemptionPanel
          redemptions={redemptions}
          isParent={isParent}
          balance={balance.balance}
          onApprove={(id) => void handleApprove(id)}
          onReject={(id) => void handleReject(id)}
        />
      </Box>

      {/* 积分怎么算 */}
      <Box sx={{ px: 2, mt: 4 }}>
        <Typography sx={{ ...sectionTitleSx, fontSize: '1.0625rem', mb: 1.5 }}>
          积分怎么算
        </Typography>
        <Box sx={{ ...cardSx, p: 2.5 }}>
          {RULE_ROWS.map((row) => (
            <Box key={row.label} sx={{ display: 'flex', py: 0.5 }}>
              <Typography sx={{ flexGrow: 1, fontWeight: 600, fontSize: '0.85rem', color: T.ink }}>
                {row.label}
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: T.ink }}>
                {row.value}
              </Typography>
            </Box>
          ))}
          <Typography sx={{ mt: 1.5, fontSize: '0.78rem', color: T.textMuted, fontWeight: 600 }}>
            补卡的任务分减半，且不计入连续天数与里程碑；撤销打卡时对应的积分会原路退回。
          </Typography>
        </Box>
      </Box>

      {/* 积分流水 */}
      <Box sx={{ px: 2, mt: 4 }}>
        <Typography sx={{ ...sectionTitleSx, fontSize: '1.0625rem', mb: 1.5 }}>
          积分流水
        </Typography>
        <LedgerList
          entries={ledger}
          onDeleteAdjustment={isParent ? (id) => void removeAdjustment(id) : undefined}
        />
      </Box>

      {/* 弹窗与提示 */}
      <RewardFormDialog
        open={rewardDialog.open}
        reward={rewardDialog.reward}
        onSave={handleSaveReward}
        onClose={() => setRewardDialog({ open: false, reward: null })}
      />
      <ManualAdjustDialog
        open={adjustOpen}
        onSubmit={addAdjustment}
        onClose={() => setAdjustOpen(false)}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除兑换品"
        message={`确定删除「${deleteTarget?.title ?? ''}」吗？已经提交的兑换单不受影响。`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void removeReward(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3200}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast?.severity ?? 'info'}
          variant="filled"
          onClose={() => setToast(null)}
          sx={{ fontWeight: 800, border: BORDER, borderRadius: 2 }}
        >
          {toast?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

/** 余额卡上的三个小统计 */
const StatChip: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <Box
    sx={{
      px: 1.25,
      py: 0.5,
      borderRadius: 2,
      bgcolor: T.paper,
      border: BORDER,
      fontSize: '0.75rem',
      fontWeight: 800,
      color: T.ink,
    }}
  >
    {label} {value}
  </Box>
);

/** 规则说明行，直接读积分常量，避免与算分口径脱节 */
const RULE_ROWS = [
  { label: '完成一项学习计划任务', value: `+${POINT_RULES.planTask} ⭐` },
  { label: '完成一项到期复习任务', value: `+${POINT_RULES.reviewTask} ⭐` },
  { label: '校外课程按时到课', value: `+${POINT_RULES.attendance} ⭐` },
  { label: '一道错题变成已掌握', value: `+${POINT_RULES.mistakeMastered} ⭐` },
  { label: '当天到期任务全部完成', value: `+${POINT_RULES.dailyGoalBonus} ⭐` },
];

export default PointsPage;
