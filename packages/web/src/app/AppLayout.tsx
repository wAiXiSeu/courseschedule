/**
 * 应用布局组件
 *
 * 顶部标题栏 + 底部5页签导航（MUI BottomNavigation）
 * 参考 PRD 4.1 节「底部/顶部导航结构」
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Chip,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  EventNote as PlansIcon,
  CheckCircle as CheckinIcon,
  Assignment as MistakesIcon,
  MenuBook as SubjectsIcon,
  Person as ParentIcon,
  ChildCare as ChildIcon,
  Groups as FamilyIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAppStore } from '../stores/useAppStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useFamilyStore } from '../stores/useFamilyStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { T, BORDER } from './tokens';

/** 导航项配置 */
const navItems = [
  { label: '今日', icon: <TodayIcon />, path: '/today' },
  { label: '课程表', icon: <ScheduleIcon />, path: '/schedule' },
  { label: '计划', icon: <PlansIcon />, path: '/plans' },
  { label: '打卡', icon: <CheckinIcon />, path: '/checkin' },
  { label: '错题本', icon: <MistakesIcon />, path: '/mistakes' },
  { label: '科目', icon: <SubjectsIcon />, path: '/subjects' },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * 应用主布局
 *
 * 结构：
 * - 顶部 AppBar：标题 + 模式切换按钮
 * - 中间内容区（children）
 * - 底部 BottomNavigation（5页签）
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const signOut = useAuthStore((state) => state.signOut);
  const pendingInvites = useFamilyStore((state) => state.invites.length);

  // 根据当前路径确定激活的页签
  const currentValue = navItems.findIndex((item) =>
    location.pathname.startsWith(item.path)
  );

  // 切换模式：孩子模式统一落在「今日」首页
  const handleModeToggle = () => {
    const nextMode = mode === 'parent' ? 'child' : 'parent';
    setMode(nextMode);
    if (nextMode === 'child') {
      navigate('/today');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ minHeight: '56px !important', px: 2, gap: 1.5 }}>
          {/* Logo 徽章：黄色贴纸方块 */}
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              bgcolor: T.yellow,
              border: BORDER,
              boxShadow: `2px 2px 0 0 ${T.ink}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              color: T.ink,
              transform: 'rotate(-4deg)',
            }}
          >
            学
          </Box>
          <Typography
            variant="h5"
            sx={{ flexGrow: 1, fontWeight: 800, color: T.ink, letterSpacing: 0.5 }}
          >
            StudyBuddy
          </Typography>

          {/* 模式切换按钮 */}
          <Chip
            icon={mode === 'parent' ? <ParentIcon /> : <ChildIcon />}
            label={mode === 'parent' ? '家长模式' : '孩子模式'}
            onClick={handleModeToggle}
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: mode === 'parent' ? T.blue : T.green,
              color: '#fff',
              border: BORDER,
              boxShadow: `2px 2px 0 0 ${T.ink}`,
              '& .MuiChip-icon': { color: '#fff' },
              '&:active': {
                transform: 'translate(2px, 2px)',
                boxShadow: `0 0 0 0 ${T.ink}`,
              },
            }}
          />

          {/* 家庭空间入口（成员邀请与切换，仅家长模式） */}
          {mode === 'parent' && (
            <IconButton
              size="small"
              onClick={() => navigate('/family')}
              title="家庭空间"
              sx={{ border: BORDER, boxShadow: `2px 2px 0 0 ${T.ink}`, bgcolor: T.paper }}
            >
              <Badge badgeContent={pendingInvites} color="error">
                <FamilyIcon fontSize="small" />
              </Badge>
            </IconButton>
          )}

          {/* 退出登录（仅云端模式） */}
          {isSupabaseConfigured && (
            <IconButton
              size="small"
              onClick={handleSignOut}
              title="退出登录"
              sx={{ border: BORDER, boxShadow: `2px 2px 0 0 ${T.ink}`, bgcolor: T.paper }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* 中间内容区 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pb: 10, // 底部导航高度预留空间
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>

      {/* 底部页签导航 */}
      <Paper
        elevation={0}
        square
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          bgcolor: T.cream,
        }}
      >
        <BottomNavigation
          showLabels
          value={currentValue >= 0 ? currentValue : 0}
          onChange={(_, newValue) => {
            navigate(navItems[newValue].path);
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};
