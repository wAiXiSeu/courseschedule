/**
 * 路由表定义
 *
 * 5 个页签：今日 / 课程表 / 计划 / 打卡 / 错题本
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, CircularProgress, Box } from 'react-router-dom';
import { AppLayout } from './AppLayout';

/* ── 懒加载页面组件 ── */
const TodayPage = lazy(() => import('../features/today/TodayPage'));
const SchedulePage = lazy(() => import('../features/schedule/SchedulePage'));

/* ── 已实现页面 ── */
const PlansPage = lazy(() => import('../features/plans/PlansPage'));
const MistakesPage = lazy(() => import('../features/mistakes/MistakesPage'));

/* ── 尚未实现的占位页面 ── */
const PlaceholderPage: React.FC<{ title: string; emoji: string }> = ({ title, emoji }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12 }}>
    <Box sx={{ fontSize: '4rem', mb: 2 }}>{emoji}</Box>
    <Box sx={{ fontSize: '1.2rem', color: 'text.secondary' }}>{title}</Box>
  </Box>
);
const CheckinPage = () => <PlaceholderPage title="打卡页（T04 实现）" emoji="⭐" />;

/** 全局 Loading 指示器 */
const PageLoading: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
    <CircularProgress />
  </Box>
);

/**
 * 应用路由表
 */
export const AppRoutes: React.FC = () => (
  <AppLayout>
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* 默认重定向到今日 */}
        <Route path="/" element={<Navigate to="/today" replace />} />
        {/* 今日视图（孩子首页 P0-3） */}
        <Route path="/today" element={<TodayPage />} />
        {/* 课程表（P0-1） */}
        <Route path="/schedule" element={<SchedulePage />} />
        {/* 计划（P0-4/P0-5，T04 实现） */}
        <Route path="/plans" element={<PlansPage />} />
        {/* 打卡（P0-6/P0-7，T04 实现） */}
        <Route path="/checkin" element={<CheckinPage />} />
        {/* 错题本（P0-8/P0-9，T05 实现） */}
        <Route path="/mistakes" element={<MistakesPage />} />
        {/* 兜底 */}
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </Suspense>
  </AppLayout>
);
