/**
 * 登录 / 注册页
 *
 * 邮箱 + 密码。未配置 Supabase 时页面会自动跳过（由路由守卫直接放行），
 * 因此这里只需处理云端模式。
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuthStore } from '../../stores/useAuthStore';
import { T, BORDER, SHADOW_SM, RADIUS } from '../../app/tokens';

type Mode = 'signIn' | 'signUp';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const from = useLocation().state?.from as string | undefined;
  // 受邀链接跳到登录页时带上 from，登录后直接回到确认页
  const redirectTo = from?.startsWith('/join') ? from : '/today';
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || password.length < 6) {
      setError('请填写邮箱，密码至少 6 位');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'signIn') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const modeButtonSx = (active: boolean) => ({
    flex: 1,
    fontWeight: 800,
    color: T.ink,
    bgcolor: active ? T.yellow : T.gray,
    border: BORDER,
    borderRadius: `${RADIUS} !important`,
    boxShadow: active ? SHADOW_SM : 'none',
    py: 1,
    transition: 'transform 0.12s ease, box-shadow 0.12s ease',
    '&:hover': { backgroundColor: active ? T.yellow : '#E3DCC9' },
    '&:active': { transform: 'translate(2px, 2px)', boxShadow: 'none' },
  });

  return (
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
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: 380,
          bgcolor: T.paper,
          border: BORDER,
          borderRadius: RADIUS,
          boxShadow: SHADOW_SM,
          p: 3,
        }}
      >
        {/* Logo 徽章 */}
        <Box
          sx={{
            width: 48,
            height: 48,
            mb: 1.5,
            borderRadius: 2,
            bgcolor: T.yellow,
            border: BORDER,
            boxShadow: SHADOW_SM,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.4rem',
            color: T.ink,
            transform: 'rotate(-4deg)',
          }}
        >
          学
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: T.ink, mb: 0.5 }}>
          StudyBuddy
        </Typography>
        <Typography sx={{ color: T.textMuted, fontSize: '0.85rem', mb: 2.5 }}>
          登录后可在不同设备上同步课程、计划与错题
        </Typography>

        {/* 登录 / 注册切换 */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
          <Box component="button" type="button" sx={modeButtonSx(mode === 'signIn')} onClick={() => setMode('signIn')}>
            登录
          </Box>
          <Box component="button" type="button" sx={modeButtonSx(mode === 'signUp')} onClick={() => setMode('signUp')}>
            注册
          </Box>
        </Box>

        <TextField
          autoFocus
          label="邮箱"
          type="email"
          fullWidth
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="密码"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="至少 6 位"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  edge="end"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={submitting}
          sx={{ fontWeight: 800, py: 1.2 }}
        >
          {submitting ? '处理中…' : mode === 'signIn' ? '登录' : '注册并登录'}
        </Button>

        <Snackbar
          open={Boolean(error)}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="error" variant="filled" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default LoginPage;
