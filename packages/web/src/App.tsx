/**
 * App 根组件
 * - MUI ThemeProvider 包裹（儿童友好主题，见 app/theme.ts）
 * - 挂载真实路由表（app/routes.tsx，登录页 + 6 页签）
 * - 启动时恢复 Supabase 登录会话
 */
import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { theme } from './app/theme';
import { AppRoutes } from './app/routes';
import { useAuthStore } from './stores/useAuthStore';

const App: React.FC = () => {
  useEffect(() => {
    void useAuthStore.getState().init();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
