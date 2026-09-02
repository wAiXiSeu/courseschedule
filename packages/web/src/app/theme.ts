/**
 * MUI 主题配置 —— Neo-Brutalism（贴纸风）
 *
 * 所有 MUI 基础组件在此统一覆盖：
 * 粗黑描边 + 硬投影 + 按压位移。
 * 页面代码无需重复写样式即可获得一致观感。
 *
 * 视觉 token 见 ./tokens（唯一来源）。
 */

import { createTheme } from '@mui/material/styles';
import { T, BORDER, SHADOW_SM, SHADOW } from './tokens';

/** 按钮按压反馈：下压 2px、投影收回 */
const pressDown = {
  transition: 'transform 0.12s ease, box-shadow 0.12s ease',
  '&:active': {
    transform: 'translate(2px, 2px)',
    boxShadow: `0 0 0 0 ${T.ink}`,
  },
};

export const theme = createTheme({
  palette: {
    primary: { main: T.yellow, light: '#FFDE85', dark: '#E8A800', contrastText: T.ink },
    secondary: { main: T.blue, light: '#8FABFF', dark: '#2E5BDB', contrastText: '#FFFFFF' },
    error: { main: T.pink, light: '#FFA7C4', dark: '#E2517F', contrastText: T.ink },
    warning: { main: T.orange, light: '#FFC58F', dark: '#E07F1D', contrastText: T.ink },
    success: { main: T.green, light: '#7DDCA8', dark: '#1E9857', contrastText: '#FFFFFF' },
    info: { main: T.blue, light: '#8FABFF', dark: '#2E5BDB' },
    background: { default: T.cream, paper: T.paper },
    text: { primary: T.ink, secondary: T.textMuted, disabled: '#C9C1AF' },
    divider: '#E5DFCF',
  },
  typography: {
    fontFamily: '"PingFang SC", "Helvetica Neue", Arial, sans-serif',
    fontSize: 15,
    h1: { fontSize: '1.75rem', fontWeight: 800 },
    h2: { fontSize: '1.5rem', fontWeight: 800 },
    h3: { fontSize: '1.25rem', fontWeight: 800 },
    h4: { fontSize: '1.125rem', fontWeight: 700 },
    h5: { fontSize: '1.0625rem', fontWeight: 700 },
    h6: { fontSize: '0.95rem', fontWeight: 700 },
    body1: { fontSize: '0.9375rem' },
    body2: { fontSize: '0.8125rem' },
    button: { fontSize: '0.875rem', textTransform: 'none' as const, fontWeight: 700 },
    caption: { fontSize: '0.75rem' },
  },
  shape: { borderRadius: 14 },
  components: {
    /* ── 按钮：粗描边 + 硬投影 + 按压下沉 ── */
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '8px 16px',
          border: BORDER,
          boxShadow: SHADOW_SM,
          ...pressDown,
        },
        contained: {
          '&:hover': { boxShadow: SHADOW_SM },
        },
        outlined: {
          bgcolor: T.paper,
          '&:hover': { bgcolor: T.gray },
        },
        text: {
          border: '2px solid transparent',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
    },
    /* ── 纸面 / 卡片：白底 + 黑描边 + 硬投影 ── */
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: BORDER,
          boxShadow: SHADOW_SM,
        },
      },
    },
    /* ── 弹窗：贴纸边框 ── */
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 18, border: BORDER, boxShadow: SHADOW },
      },
    },
    /* ── Chip：描边小贴纸 ── */
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 700, border: BORDER, bgcolor: T.paper },
        colorPrimary: { bgcolor: T.yellow, color: T.ink },
        colorSecondary: { bgcolor: T.blue, color: '#fff' },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: BORDER,
          boxShadow: SHADOW,
          ...pressDown,
        },
      },
    },
    /* ── 顶栏：奶油底 + 黑色粗底线 ── */
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: T.cream,
          color: T.ink,
          boxShadow: 'none',
          borderBottom: BORDER,
        },
      },
    },
    /* ── 底部导航：奶油底 + 黑色粗顶线 + 选中黄色药丸 ── */
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
          backgroundColor: T.cream,
          borderTop: BORDER,
          padding: '6px 8px',
          gap: 4,
          '& .MuiBottomNavigationAction-root': {
            color: '#A89F8D',
            minWidth: 0,
            borderRadius: 12,
            padding: '4px 0',
            '&.Mui-selected': {
              color: T.ink,
              backgroundColor: T.yellow,
              border: BORDER,
              boxShadow: `2px 2px 0 0 ${T.ink}`,
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.6875rem',
            fontWeight: 600,
            '&.Mui-selected': { fontSize: '0.6875rem', fontWeight: 800 },
          },
        },
      },
    },
    /* ── Tabs：黑色粗指示条 ── */
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: { height: 4, bgcolor: T.ink, borderRadius: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40,
          fontWeight: 700,
          color: T.textMuted,
          '&.Mui-selected': { color: T.ink },
        },
      },
    },
    /* ── 输入框：描边 ── */
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          bgcolor: T.paper,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: T.ink, borderWidth: 2 },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: T.ink },
        },
      },
    },
    /* ── 复选框：大号黑描边 ── */
    MuiCheckbox: {
      styleOverrides: {
        root: { color: T.ink },
      },
    },
    /* ── 进度条：描边轨道 ── */
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: BORDER,
          bgcolor: T.paper,
          height: 14,
        },
        bar: { borderRadius: 0, bgcolor: T.green },
      },
    },
  },
});
