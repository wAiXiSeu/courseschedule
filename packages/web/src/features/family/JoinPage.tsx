/**
 * 受邀加入页 —— 家长转发的邀请链接落到这里（/join?m=<邀请ID>）
 *
 * 未登录 → 跳登录页并记住本链接，注册/登录成功后自动回到这里；
 * 已登录 → 在「发到本邮箱的待确认邀请」中定位该邀请，提供 接受 / 拒绝。
 * 受邀人也可以不点链接，登录后在「家庭空间」页直接处理待确认邀请。
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useAuthStore } from '../../stores/useAuthStore';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { T, BORDER, SHADOW_SM, RADIUS, cardSx, sectionTitleSx } from '../../app/tokens';

const JoinPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const memberId = params.get('m');

  const status = useAuthStore((state) => state.status);
  const myEmail = useAuthStore((state) => state.session?.user.email?.toLowerCase() ?? '');
  const bootstrapFamily = useFamilyStore((state) => state.bootstrap);
  const invites = useFamilyStore((state) => state.invites);
  const acceptInvite = useFamilyStore((state) => state.acceptInvite);
  const declineInvite = useFamilyStore((state) => state.declineInvite);
  const familyError = useFamilyStore((state) => state.error);

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === 'signedIn') void bootstrapFamily();
  }, [status, bootstrapFamily]);

  const target = memberId
    ? invites.find((i) => i.id === memberId)
    : invites[0];

  const shell = (children: React.ReactNode) => (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: T.cream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          bgcolor: T.paper,
          border: BORDER,
          borderRadius: RADIUS,
          boxShadow: SHADOW_SM,
          p: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );

  if (status === 'loading') {
    return shell(
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'signedOut') {
    return shell(
      <>
        <Typography sx={sectionTitleSx}>你收到了一份家庭空间邀请</Typography>
        <Typography sx={{ color: T.textMuted, my: 2 }}>
          请用受邀邮箱注册或登录，成功后会自动回到这里确认加入。
        </Typography>
        <Button
          fullWidth
          variant="contained"
          onClick={() =>
            navigate('/login', {
              state: { from: `${window.location.pathname}${window.location.search}` },
            })
          }
        >
          去注册 / 登录
        </Button>
      </>
    );
  }

  if (familyError) {
    return shell(
      <>
        <Typography sx={{ color: T.textMuted, mb: 2 }}>{familyError}</Typography>
        <Button fullWidth variant="outlined" onClick={() => navigate('/today')}>
          返回应用
        </Button>
      </>
    );
  }

  if (!target) {
    return shell(
      <>
        <Typography sx={sectionTitleSx}>邀请已处理或不属于当前账号</Typography>
        <Typography sx={{ color: T.textMuted, my: 2 }}>
          当前账号：{myEmail || '未知'}。若这是别人收到的邀请，请用受邀邮箱登录后重新打开链接。
        </Typography>
        <Button fullWidth variant="contained" onClick={() => navigate('/today')}>
          进入应用
        </Button>
      </>
    );
  }

  return shell(
    <Box sx={{ ...cardSx, p: 0, border: 'none', boxShadow: 'none' }}>
      <Typography sx={sectionTitleSx}>邀请你加入家庭空间</Typography>
      <Typography sx={{ color: T.textMuted, my: 1.5 }}>
        邀请发至 <b>{target.email}</b>（当前账号）。接受后你们将共同管理该空间下的课程、计划与错题。
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
        <Button
          fullWidth
          variant="contained"
          disabled={processing}
          onClick={async () => {
            setProcessing(true);
            try {
              await acceptInvite(target.id);
              navigate('/today', { replace: true });
            } finally {
              setProcessing(false);
            }
          }}
        >
          接受并加入
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          disabled={processing}
          onClick={async () => {
            setProcessing(true);
            try {
              await declineInvite(target.id);
              navigate('/today', { replace: true });
            } finally {
              setProcessing(false);
            }
          }}
        >
          暂不加入
        </Button>
      </Box>
    </Box>
  );
};

export default JoinPage;
