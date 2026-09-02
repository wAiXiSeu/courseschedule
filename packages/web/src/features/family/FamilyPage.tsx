/**
 * 家庭空间页 —— 空间切换、成员邀请与确认
 *
 * 空间 = 数据共享边界：业务读写锚定当前空间；
 * 家长按邮箱发出邀请并复制链接转发（云端实例不向浏览器开放发信权限），
 * 对方用该邮箱注册/登录后打开链接确认，即共同管理该空间数据。
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  IconButton,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, PersonRemove as RemoveIcon, ContentCopy as CopyIcon, Close as CloseIcon } from '@mui/icons-material';
import type { Family } from '@courseschedule/shared';
import { useFamilyStore, useIsFamilyOwner } from '../../stores/useFamilyStore';
import { inviteLink } from '../../data/repositories/familyRepository';
import { useSubjectStore } from '../../stores/useSubjectStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';
import { isSupabaseConfigured } from '../../lib/supabase';
import { T, BORDER, RADIUS, RADIUS_SM, cardSx, pageHeadingSx, sectionTitleSx } from '../../app/tokens';

/** 空间卡片点击后需要重载科目（数据归属空间） */
const reloadSubjects = () => void useSubjectStore.getState().load();

const FamilyCard: React.FC<{
  family: Family;
  current: boolean;
  owner: boolean;
  onSwitch: () => void;
}> = ({ family, current, owner, onSwitch }) => (
  <Box
    onClick={current ? undefined : onSwitch}
    sx={{
      ...cardSx,
      p: 2,
      minWidth: 180,
      cursor: current ? 'default' : 'pointer',
      bgcolor: current ? T.yellow : T.paper,
      transition: 'transform 0.12s ease, box-shadow 0.12s ease',
      '&:hover': current ? {} : { transform: 'translate(-1px, -1px)', boxShadow: `4px 4px 0 0 ${T.ink}` },
    }}
  >
    <Typography sx={{ fontWeight: 800, color: T.ink }}>{family.name}</Typography>
    <Box sx={{ display: 'flex', gap: 0.75, mt: 1 }}>
      <Chip size="small" label={owner ? '家长' : '成员'} sx={{ fontWeight: 700, bgcolor: owner ? T.blue : T.green, color: '#fff' }} />
      {current && <Chip size="small" label="当前" variant="outlined" sx={{ fontWeight: 700 }} />}
    </Box>
    {!current && (
      <Typography sx={{ fontSize: '0.75rem', color: T.textMuted, mt: 0.5 }}>点击切换到此空间</Typography>
    )}
  </Box>
);

/** 邀请链接：家长复制到微信/邮件发给对方，对方打开后确认加入 */
const InviteLinkCard: React.FC<{
  email: string;
  link: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}> = ({ email, link, copied, onCopy, onClose }) => (
  <Box sx={{ ...cardSx, p: 2, mt: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography sx={{ fontWeight: 800, color: T.ink, flexGrow: 1 }}>
        已邀请 {email}
      </Typography>
      <IconButton size="small" onClick={onClose} title="关闭">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
    <Typography sx={{ fontSize: '0.8rem', color: T.textMuted, mt: 0.5 }}>
      把下面的链接发给对方（微信、邮件都可以）：对方用该邮箱注册或登录后打开，即可选择加入。
    </Typography>
    <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'center' }}>
      <TextField
        size="small"
        value={link}
        InputProps={{ readOnly: true, onFocus: (e) => (e.target as HTMLInputElement).select() }}
        sx={{
          flexGrow: 1,
          minWidth: 0,
          bgcolor: T.paper,
          borderRadius: `${RADIUS_SM} !important`,
          '& .MuiInputBase-input': { fontSize: '0.8rem', fontWeight: 600 },
        }}
      />
      <Button variant="contained" onClick={onCopy}>
        {copied ? '已复制' : '复制'}
      </Button>
    </Box>
  </Box>
);

export const FamilyPage: React.FC = () => {
  const families = useFamilyStore((state) => state.families);
  const members = useFamilyStore((state) => state.members);
  const invites = useFamilyStore((state) => state.invites);
  const currentFamilyId = useFamilyStore((state) => state.currentFamilyId);
  const error = useFamilyStore((state) => state.error);
  const lastInvite = useFamilyStore((state) => state.lastInvite);
  const dismissInvite = useFamilyStore((state) => state.dismissInvite);
  const switchFamily = useFamilyStore((state) => state.switchFamily);
  const createFamily = useFamilyStore((state) => state.createFamily);
  const renameFamily = useFamilyStore((state) => state.renameFamily);
  const deleteFamily = useFamilyStore((state) => state.deleteFamily);
  const inviteMember = useFamilyStore((state) => state.inviteMember);
  const acceptInvite = useFamilyStore((state) => state.acceptInvite);
  const declineInvite = useFamilyStore((state) => state.declineInvite);
  const removeMember = useFamilyStore((state) => state.removeMember);
  const leaveFamily = useFamilyStore((state) => state.leaveFamily);
  const myUid = useAuthStore((state) => state.session?.user.id);
  const isOwner = useIsFamilyOwner(currentFamilyId);
  const isParent = useAppStore((state) => state.mode === 'parent');

  const current = families.find((f) => f.id === currentFamilyId);
  const [inviteEmail, setInviteEmail] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyInviteLink = (key: string, link: string) => {
    const manual = () => window.prompt('请手动复制链接', link);
    if (!navigator.clipboard) {
      manual();
      return;
    }
    navigator.clipboard.writeText(link).then(
      () => {
        setCopiedKey(key);
        window.setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 2000);
      },
      manual
    );
  };

  const run = async (fn: () => Promise<void> | void) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const handleSwitch = (familyId: string) => {
    switchFamily(familyId);
    reloadSubjects();
  };

  const handleCreate = () =>
    run(async () => {
      const name = newName.trim();
      if (!name) return;
      await createFamily(name);
      setNewName('');
      setCreateOpen(false);
      reloadSubjects();
    });

  const handleInvite = () =>
    run(async () => {
      const email = inviteEmail.trim();
      if (!email) return;
      await inviteMember(email);
      setInviteEmail('');
    });

  const handleRename = () =>
    run(async () => {
      if (!current) return;
      const name = window.prompt('空间名称', current.name);
      if (name?.trim() && name.trim() !== current.name) {
        await renameFamily(current.id, name);
      }
    });

  const handleDelete = () =>
    run(async () => {
      if (!current) return;
      if (window.confirm(`确定删除空间「${current.name}」？该空间下的课程、计划、错题将全部删除。`)) {
        await deleteFamily(current.id);
        reloadSubjects();
      }
    });

  const handleLeave = () =>
    run(async () => {
      if (!current) return;
      if (window.confirm(`退出空间「${current.name}」？退出后将无法查看该空间的共享数据。`)) {
        await leaveFamily(current.id);
        reloadSubjects();
      }
    });

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 3 }}>
      <Typography component="h1" sx={pageHeadingSx}>
        家庭空间
      </Typography>

      {!isParent && (
        <Alert severity="info" sx={{ mt: 2 }}>
          当前为孩子模式，仅可浏览；切换到家长模式后可邀请成员、管理空间。
        </Alert>
      )}
      {!isSupabaseConfigured && (
        <Alert severity="info" sx={{ mt: 2 }}>
          本地试玩模式：未接入云端，仅有单一空间，无法邀请成员。配置 packages/web/.env 后启用家庭共享。
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* 我的空间 */}
      <Typography sx={{ ...sectionTitleSx, mt: 3, mb: 1.5 }}>我的空间</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {families.map((f) => (
          <FamilyCard
            key={f.id}
            family={f}
            current={f.id === currentFamilyId}
            owner={f.ownerUserId === myUid}
            onSwitch={() => handleSwitch(f.id)}
          />
        ))}
        {isParent && isSupabaseConfigured && (
          <Box
            onClick={() => setCreateOpen(true)}
            sx={{
              ...cardSx,
              p: 2,
              minWidth: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              cursor: 'pointer',
              color: T.textMuted,
              borderStyle: 'dashed',
              '&:hover': { color: T.ink },
            }}
          >
            <AddIcon />
            <Typography sx={{ fontWeight: 700 }}>新建空间</Typography>
          </Box>
        )}
      </Box>

      {/* 当前空间管理 */}
      {current && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4, mb: 1 }}>
            <Typography sx={sectionTitleSx}>「{current.name}」成员</Typography>
            {isParent && isOwner && (
              <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                <IconButton size="small" onClick={handleRename} title="改名">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleDelete} title="删除空间" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
            {isParent && !isOwner && (
              <Button size="small" color="error" sx={{ ml: 'auto', fontWeight: 700 }} onClick={handleLeave} disabled={busy}>
                退出空间
              </Button>
            )}
          </Box>

          <Box sx={{ ...cardSx, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', py: 0.75 }}>
              <Typography sx={{ fontWeight: 700, color: T.ink, flexGrow: 1 }}>
                {current.ownerUserId === myUid ? '我（家长）' : '家长'}
              </Typography>
              <Chip size="small" label="所有者" sx={{ fontWeight: 700, bgcolor: T.blue, color: '#fff' }} />
            </Box>
            {members.map((m) => (
              <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', py: 0.75, borderTop: `2px solid ${T.gray}` }}>
                <Typography sx={{ fontWeight: 600, color: T.ink, flexGrow: 1, wordBreak: 'break-all' }}>{m.email}</Typography>
                <Chip
                  size="small"
                  label={m.status === 'accepted' ? '已加入' : m.status === 'pending' ? '待确认' : '已拒绝'}
                  sx={{
                    fontWeight: 700,
                    mr: isOwner ? 0.5 : 0,
                    bgcolor: m.status === 'accepted' ? T.green : m.status === 'pending' ? T.orange : T.gray,
                    color: m.status === 'declined' ? T.textMuted : '#fff',
                  }}
                />
                {isParent && isOwner && m.status === 'pending' && (
                  <IconButton
                    size="small"
                    onClick={() => copyInviteLink(m.id, inviteLink(m.id))}
                    title={copiedKey === m.id ? '已复制' : '复制邀请链接'}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                )}
                {isParent && isOwner && (
                  <IconButton size="small" onClick={() => run(() => removeMember(m.id))} title="移除" disabled={busy}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>

          {/* 邀请成员（家长模式、家长本人、仅云端） */}
          {isParent && isOwner && isSupabaseConfigured && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ ...cardSx, p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="对方账号邮箱"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  sx={{ flexGrow: 1, bgcolor: T.paper, borderRadius: `${RADIUS_SM} !important` }}
                  InputProps={{
                    sx: {
                      border: BORDER,
                      borderRadius: `${RADIUS_SM} !important`,
                    },
                  }}
                />
                <Button variant="contained" onClick={handleInvite} disabled={busy || !inviteEmail.trim()}>
                  生成邀请
                </Button>
              </Box>
              {lastInvite && (
                <InviteLinkCard
                  email={lastInvite.email}
                  link={lastInvite.link}
                  copied={copiedKey === 'last'}
                  onCopy={() => copyInviteLink('last', lastInvite.link)}
                  onClose={dismissInvite}
                />
              )}
            </Box>
          )}
        </>
      )}

      {/* 待我确认的邀请（家长模式；收到邀请链接时同样落到这里） */}
      {isParent && invites.length > 0 && (
        <>
          <Typography sx={{ ...sectionTitleSx, mt: 4, mb: 1 }}>收到的邀请</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {invites.map((inv) => (
              <Box key={inv.id} sx={{ ...cardSx, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontWeight: 700, color: T.ink, flexGrow: 1 }}>
                  家庭空间邀请（发至 {inv.email}）
                </Typography>
                <Button size="small" variant="contained" onClick={() => run(() => acceptInvite(inv.id))} disabled={busy}>
                  接受
                </Button>
                <Button size="small" color="inherit" onClick={() => run(() => declineInvite(inv.id))} disabled={busy}>
                  拒绝
                </Button>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* 新建空间对话框 */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogTitle>新建家庭空间</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="空间名称"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            helperText="如「小明的家」；新空间会自带一套默认科目"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} color="inherit">
            取消
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={busy || !newName.trim()}>
            创建
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FamilyPage;
