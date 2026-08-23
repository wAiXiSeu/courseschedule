/**
 * MUI 主题配置 —— 儿童友好色板
 *
 * 圆角大、字号大、色彩鲜明，适合 6-12 岁小朋友使用。
 */

import { createTheme } from '@mui/material/styles';

/** 儿童友好色板 */
const kidPalette = {
  primary: {
    main: '#1E88E5',
    light: '#64B5F6',
    dark: '#1565C0',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#43A047',
    light: '#81C784',
    dark: '#2E7D32',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#E53935',
    light: '#EF5350',
    dark: '#C62828',
  },
  warning: {
    main: '#FB8C00',
    light: '#FFB74D',
    dark: '#EF6C00',
  },
  success: {
    main: '#7CB342',
    light: '#AED581',
    dark: '#558B2F',
  },
  info: {
    main: '#00ACC1',
    light: '#4DD0E1',
    dark: '#00838F',
  },
  background: {
    default: '#FAFAFA',
    paper: '#FFFFFF',
  },
};

/**
 * 全局 MUI 主题
 *
 * - 圆角统一 12px（儿童友好）
 * - 字号偏大（适合 6-12 岁）
 * - 色彩鲜明
 */
export const theme = createTheme({
  palette: kidPalette,
  typography: {
    fontFamily: '"PingFang SC", "Helvetica Neue", Arial, sans-serif',
    fontSize: 15,
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.6rem', fontWeight: 700 },
    h3: { fontSize: '1.3rem', fontWeight: 600 },
    h4: { fontSize: '1.1rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.95rem', fontWeight: 600 },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.9rem' },
    button: { fontSize: '0.95rem', textTransform: 'none' as const },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '8px 20px',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
        },
      },
    },
  },
});
