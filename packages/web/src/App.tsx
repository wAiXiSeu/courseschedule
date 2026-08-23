/**
 * App 根组件
 * - MUI ThemeProvider 包裹
 * - 路由占位
 */
import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route, Typography, Box } from 'react-router-dom';

/** 全局 MUI 主题 —— 后续可扩展 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#1E88E5',
    },
    secondary: {
      main: '#43A047',
    },
  },
  typography: {
    fontFamily: '"PingFang SC", "Helvetica Neue", Arial, sans-serif',
  },
});

/** 首页占位组件 */
function HomePage(): React.ReactElement {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="80vh"
    >
      <Typography variant="h3" gutterBottom>
        📚 课程表管理后台
      </Typography>
      <Typography variant="body1" color="text.secondary">
        欢迎使用小朋友课程表与学习管理系统
      </Typography>
    </Box>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
