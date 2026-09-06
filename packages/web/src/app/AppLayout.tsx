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
  Badge,
} from '@mui/material';
import {
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  EventNote as PlansIcon,
  CheckCircle as CheckinIcon,
  Assignment as MistakesIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAppStore } from '../stores/useAppStore';
import { usePointsStore, usePendingRedemptionCount } from '../stores/usePointsStore';
import { T, BORDER } from './tokens';

/** 导航项配置 */
const navItems = [
  { label: '今日', icon: <TodayIcon />, path: '/today' },
  { label: '课程表', icon: <ScheduleIcon />, path: '/schedule' },
  { label: '计划', icon: <PlansIcon />, path: '/plans' },
  { label: '打卡', icon: <CheckinIcon />, path: '/checkin' },
  { label: '错题本', icon: <MistakesIcon />, path: '/mistakes' },
  { label: '设置', icon: <SettingsIcon />, path: '/settings' },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * 应用主布局
 *
 * 结构：
 * - 顶部 AppBar：标题 + 积分余额胶囊
 * - 中间内容区（children）
 * - 底部 BottomNavigation（6 页签，含「设置」）
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = useAppStore((state) => state.mode);
  const balance = usePointsStore((state) => state.balance.balance);
  const pendingRedemptions = usePendingRedemptionCount();

  // 根据当前路径确定激活的页签
  const currentValue = navItems.findIndex((item) =>
    location.pathname.startsWith(item.path)
  );

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

          {/* 积分余额胶囊：任意页面都能看到余额并进入积分奖励页 */}
          <Badge
            badgeContent={mode === 'parent' ? pendingRedemptions : 0}
            color="error"
            overlap="circular"
          >
            <Chip
              label={`${balance} ⭐`}
              onClick={() => navigate('/points')}
              size="small"
              title="积分奖励"
              sx={{
                fontWeight: 800,
                bgcolor: T.yellow,
                color: T.ink,
                border: BORDER,
                boxShadow: `2px 2px 0 0 ${T.ink}`,
                '&:active': {
                  transform: 'translate(2px, 2px)',
                  boxShadow: `0 0 0 0 ${T.ink}`,
                },
              }}
            />
          </Badge>
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
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <BottomNavigation
          showLabels
          value={currentValue}
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
