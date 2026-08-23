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
} from '@mui/material';
import {
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  EventNote as PlansIcon,
  CheckCircle as CheckinIcon,
  Assignment as MistakesIcon,
  Person as ParentIcon,
  ChildCare as ChildIcon,
} from '@mui/icons-material';
import { useAppStore } from '../stores/useAppStore';

/** 导航项配置 */
const navItems = [
  { label: '今日', icon: <TodayIcon />, path: '/today' },
  { label: '课程表', icon: <ScheduleIcon />, path: '/schedule' },
  { label: '计划', icon: <PlansIcon />, path: '/plans' },
  { label: '打卡', icon: <CheckinIcon />, path: '/checkin' },
  { label: '错题本', icon: <MistakesIcon />, path: '/mistakes' },
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

  // 根据当前路径确定激活的页签
  const currentValue = navItems.findIndex((item) =>
    location.pathname.startsWith(item.path)
  );

  // 切换模式
  const handleModeToggle = () => {
    setMode(mode === 'parent' ? 'child' : 'parent');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <AppBar
        position="static"
        color="default"
        elevation={1}
        sx={{ bgcolor: 'white' }}
      >
        <Toolbar sx={{ minHeight: '56px !important' }}>
          <Typography
            variant="h5"
            sx={{ flexGrow: 1, fontWeight: 700, color: 'primary.main' }}
          >
            🧒 小明的学习助手
          </Typography>

          {/* 模式切换按钮 */}
          <Chip
            icon={mode === 'parent' ? <ParentIcon /> : <ChildIcon />}
            label={mode === 'parent' ? '家长模式' : '孩子模式'}
            onClick={handleModeToggle}
            color={mode === 'parent' ? 'primary' : 'success'}
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Toolbar>
      </AppBar>

      {/* 中间内容区 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pb: 8, // 底部导航高度预留空间
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>

      {/* 底部页签导航 */}
      <Paper
        elevation={3}
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }}
      >
        <BottomNavigation
          showLabels
          value={currentValue >= 0 ? currentValue : 0}
          onChange={(_, newValue) => {
            navigate(navItems[newValue].path);
          }}
          sx={{
            height: 64,
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontWeight: 600,
            },
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
