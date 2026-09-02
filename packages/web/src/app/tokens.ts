/**
 * 全局设计 Token —— Neo-Brutalism（贴纸风）
 *
 * 唯一视觉语言来源：所有页面/组件一律从这里取值，
 * 禁止散落硬编码颜色与阴影，保证全站风格一致。
 *
 * 风格特征：
 * - 奶油色底 + 纯白卡面
 * - 2px 粗黑描边 + 4px 硬投影（无模糊）
 * - 荧光黄主色 + 糖果色点缀
 * - 可点元素按压位移反馈（向下压、投影收回）
 */

/** 品牌色板 */
export const T = {
  ink: '#1A1A1A',
  cream: '#FFF8E7',
  paper: '#FFFFFF',
  yellow: '#FFC93C',
  blue: '#4D7CFE',
  pink: '#FF7BA9',
  green: '#2FBF71',
  orange: '#FF9F45',
  gray: '#EFE9DA',
  textMuted: '#78716C',
} as const;

/** 描边 */
export const BORDER = `2px solid ${T.ink}`;
export const BORDER_SOFT = `2px solid #E5DFCF`;

/** 硬投影（无模糊，贴纸感） */
export const SHADOW = `4px 4px 0 0 ${T.ink}`;
export const SHADOW_SM = `3px 3px 0 0 ${T.ink}`;

/** 圆角 */
export const RADIUS = '14px';
export const RADIUS_SM = '10px';

/** 卡片通用样式 */
export const cardSx = {
  bgcolor: T.paper,
  border: BORDER,
  borderRadius: RADIUS,
  boxShadow: SHADOW_SM,
} as const;

/** 可点卡片：悬停上浮、按压下沉 */
export const pressableCardSx = {
  ...cardSx,
  cursor: 'pointer',
  transition: 'transform 0.12s ease, box-shadow 0.12s ease',
  '&:hover': {
    transform: 'translate(-2px, -2px)',
    boxShadow: `6px 6px 0 0 ${T.ink}`,
  },
  '&:active': {
    transform: 'translate(2px, 2px)',
    boxShadow: `0 0 0 0 ${T.ink}`,
  },
} as const;

/** 页面主标题：粗黑大字 + 荧光黄荧光笔下划线 */
export const pageHeadingSx = {
  display: 'inline-block',
  fontWeight: 800,
  fontSize: '1.5rem',
  lineHeight: 1.3,
  color: T.ink,
  backgroundImage: `linear-gradient(transparent 62%, ${T.yellow} 62%)`,
  pb: 0.25,
} as const;

/** 区块小标题 */
export const sectionTitleSx = {
  fontWeight: 700,
  fontSize: '0.95rem',
  color: T.ink,
} as const;
