/**
 * 设置页
 *
 * 从底部导航进入，收纳原先散在顶栏的三样东西：使用模式切换、家庭空间、退出登录，
 * 并把「科目管理」降为二级页。
 *
 * 切到孩子模式会回到「今日」首页：设置页属于家长侧，孩子不该停在这里。
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Badge, Chip, Typography } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CategoryIcon from '@mui/icons-material/Category';
import GroupsIcon from '@mui/icons-material/Groups';
import LogoutIcon from '@mui/icons-material/Logout';
import ParentIcon from '@mui/icons-material/Person';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import { useAppStore, type UserMode } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { isSupabaseConfigured } from '../../lib/supabase';
import { T, BORDER, cardSx, pageHeadingSx, sectionTitleSx } from '../../app/tokens';

/** 可点击的设置行 */
const SettingsRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  hint?: string;
  badge?: number;
  onClick: () => void;
}> = ({ icon, label, hint, badge = 0, onClick }) => (
  <Box
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      px: 2,
      py: 1.75,
      cursor: 'pointer',
      color: T.ink,
      '&:active': { bgcolor: T.gray },
    }}
  >
    <Box sx={{ color: T.textMuted, display: 'flex' }}>{icon}</Box>
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{label}</Typography>
      {hint && (
        <Typography sx={{ fontSize: '0.75rem', color: T.textMuted, fontWeight: 600 }}>
          {hint}
        </Typography>
      )}
    </Box>
    {badge > 0 && (
      <Badge badgeContent={badge} color="error" sx={{ '& .MuiBadge-badge': { border: BORDER } }} />
    )}
    <ArrowForwardIosIcon sx={{ fontSize: 15, color: T.textMuted }} />
  </Box>
);

/**
 * 设置页面
 */
export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const signOut = useAuthStore((s) => s.signOut);
  const pendingInvites = useFamilyStore((s) => s.invites.length);

  const isParent = mode === 'parent';

  const handleModeChange = (next: UserMode) => {
    setMode(next);
    // 孩子模式统一落在「今日」首页，与原先顶栏切换按钮的行为一致
    if (next === 'child') navigate('/today');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ px: 2.5, pt: 3, pb: 1 }}>
        <Typography sx={pageHeadingSx}>设置</Typography>
        <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600, mt: 1 }}>
          切换使用模式，管理科目与家庭空间
        </Typography>
      </Box>

      {/* 使用模式 */}
      <Box sx={{ px: 2, mt: 2 }}>
        <Typography sx={{ ...sectionTitleSx, mb: 1 }}>使用模式</Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {(
            [
              { value: 'parent', label: '家长模式', icon: <ParentIcon />, color: T.blue, hint: '可增删改全部内容' },
              { value: 'child', label: '孩子模式', icon: <ChildCareIcon />, color: T.green, hint: '只读 + 打卡兑换' },
            ] as const
          ).map((option) => {
            const active = mode === option.value;

            return (
              <Box
                key={option.value}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                onClick={() => handleModeChange(option.value)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleModeChange(option.value)}
                sx={{
                  ...cardSx,
                  flexGrow: 1,
                  p: 2,
                  cursor: 'pointer',
                  bgcolor: active ? option.color : T.paper,
                  color: active ? '#fff' : T.textMuted,
                  boxShadow: active ? `3px 3px 0 0 ${T.ink}` : 'none',
                  transition: 'background-color 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease',
                  '&:active': active
                    ? { transform: 'translate(2px, 2px)', boxShadow: `0 0 0 0 ${T.ink}` }
                    : undefined,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {option.icon}
                  <Typography sx={{ fontWeight: 800 }}>{option.label}</Typography>
                </Box>
                <Typography
                  sx={{
                    mt: 0.75,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: active ? 'rgba(255,255,255,0.9)' : T.textMuted,
                  }}
                >
                  {option.hint}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* 空间与账户 */}
      <Box sx={{ px: 2, mt: 4 }}>
        <Typography sx={{ ...sectionTitleSx, mb: 1 }}>空间与账户</Typography>
        <Box sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
          <SettingsRow
            icon={<CategoryIcon fontSize="small" />}
            label="科目管理"
            hint="增删科目、改类别与颜色"
            onClick={() => navigate('/subjects')}
          />
          {isParent && (
            <Box sx={{ borderTop: `2px solid ${T.gray}` }}>
              <SettingsRow
                icon={<GroupsIcon fontSize="small" />}
                label="家庭空间"
                hint="成员邀请与空间切换"
                badge={pendingInvites}
                onClick={() => navigate('/family')}
              />
            </Box>
          )}
          {isSupabaseConfigured && (
            <Box sx={{ borderTop: `2px solid ${T.gray}` }}>
              <SettingsRow
                icon={<LogoutIcon fontSize="small" />}
                label="退出登录"
                hint="换账号或清理本机登录态"
                onClick={() => void handleSignOut()}
              />
            </Box>
          )}
        </Box>
      </Box>

      {isSupabaseConfigured && (
        <Box sx={{ px: 2.5, mt: 2 }}>
          <Chip
            label="已连接云端，数据在家庭空间内共享"
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: T.gray, color: T.textMuted }}
          />
        </Box>
      )}
    </Box>
  );
};

export default SettingsPage;
