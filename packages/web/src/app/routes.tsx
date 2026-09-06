/**
 * 路由表定义
 *
 * 登录页独立于主布局；其余页签（今日 / 课程表 / 计划 / 打卡 / 错题本 / 设置）
 * 与从顶栏进入的「积分奖励」、从设置页进入的「科目管理」「家庭空间」，
 * 统一经受保护布局路由（鉴权守卫 + AppLayout）渲染。
 */

import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CircularProgress, Box, Button, Typography } from '@mui/material';
import { AppLayout } from './AppLayout';
import { useAuthStore } from '../stores/useAuthStore';
import { useFamilyStore } from '../stores/useFamilyStore';
import { useSubjectStore } from '../stores/useSubjectStore';
import { usePointsStore } from '../stores/usePointsStore';
import { useRewardStore } from '../stores/useRewardStore';

/* ── 懒加载页面组件 ── */
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const TodayPage = lazy(() => import('../features/today/TodayPage'));
const SchedulePage = lazy(() => import('../features/schedule/SchedulePage'));
const PlansPage = lazy(() => import('../features/plans/PlansPage'));
const CheckinPage = lazy(() => import('../features/checkin/CheckinPage'));
const PointsPage = lazy(() => import('../features/points/PointsPage'));
const MistakesPage = lazy(() => import('../features/mistakes/MistakesPage'));
const SubjectsPage = lazy(() => import('../features/subjects/SubjectsPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const FamilyPage = lazy(() => import('../features/family/FamilyPage'));
const JoinPage = lazy(() => import('../features/family/JoinPage'));

/** 全局 Loading 指示器 */
const PageLoading: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
    <CircularProgress />
  </Box>
);

/**
 * 受保护的主布局路由
 *
 * 未登录 → 跳登录页；登录后先确保家庭空间就绪（无则自动建个人空间），
 * 再载入该空间的科目表，最后渲染页签内容。
 */
const ProtectedLayout: React.FC = () => {
  const status = useAuthStore((state) => state.status);
  const bootstrapFamily = useFamilyStore((state) => state.bootstrap);
  const familyLoading = useFamilyStore((state) => state.loading);
  const familyError = useFamilyStore((state) => state.error);
  const currentFamilyId = useFamilyStore((state) => state.currentFamilyId);
  const loadSubjects = useSubjectStore((state) => state.load);
  const loadPoints = usePointsStore((state) => state.load);
  const loadRewards = useRewardStore((state) => state.loadAll);

  useEffect(() => {
    if (status === 'signedIn') void bootstrapFamily();
  }, [status, bootstrapFamily]);

  const spaceReady = status === 'signedIn' && Boolean(currentFamilyId) && !familyLoading;

  useEffect(() => {
    if (!spaceReady) return;
    // currentFamilyId 变化 = 换了数据边界，科目 / 积分账本 / 兑换品都要重新载入
    void loadSubjects();
    void loadPoints();
    void loadRewards();
  }, [spaceReady, currentFamilyId, loadSubjects, loadPoints, loadRewards]);

  if (status === 'loading') return <PageLoading />;
  if (status === 'signedOut') return <Navigate to="/login" replace />;

  // 空间未就绪前不渲染业务页：仓储层没有 familyId 会读到空数据
  if (!spaceReady) {
    if (familyError) {
      return (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography color="error" sx={{ mb: 2 }}>
            {familyError}
          </Typography>
          <Button variant="contained" onClick={() => void bootstrapFamily()}>
            重试
          </Button>
        </Box>
      );
    }
    return <PageLoading />;
  }

  return (
    <AppLayout>
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
};

/**
 * 应用路由表
 */
export const AppRoutes: React.FC = () => (
  <Routes>
    {/* 登录 / 注册 */}
    <Route
      path="/login"
      element={
        <Suspense fallback={<PageLoading />}>
          <LoginPage />
        </Suspense>
      }
    />
    {/* 受邀加入（邀请链接落地页，公开访问） */}
    <Route
      path="/join"
      element={
        <Suspense fallback={<PageLoading />}>
          <JoinPage />
        </Suspense>
      }
    />
    <Route element={<ProtectedLayout />}>
      {/* 默认重定向到今日 */}
      <Route path="/" element={<Navigate to="/today" replace />} />
      {/* 今日视图（孩子首页 P0-3） */}
      <Route path="/today" element={<TodayPage />} />
      {/* 课程表（P0-1，周/月视角） */}
      <Route path="/schedule" element={<SchedulePage />} />
      {/* 计划（P0-4/P0-5） */}
      <Route path="/plans" element={<PlansPage />} />
      {/* 打卡（P0-6/P0-7） */}
      <Route path="/checkin" element={<CheckinPage />} />
      {/* 积分奖励（顶栏余额胶囊进入） */}
      <Route path="/points" element={<PointsPage />} />
      {/* 错题本（P0-8/P0-9） */}
      <Route path="/mistakes" element={<MistakesPage />} />
      {/* 科目管理（从设置页进入的二级页） */}
      <Route path="/subjects" element={<SubjectsPage />} />
      {/* 设置（使用模式 / 科目 / 家庭空间 / 退出登录） */}
      <Route path="/settings" element={<SettingsPage />} />
      {/* 家庭空间（成员邀请与切换） */}
      <Route path="/family" element={<FamilyPage />} />
      {/* 兜底 */}
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Route>
  </Routes>
);
