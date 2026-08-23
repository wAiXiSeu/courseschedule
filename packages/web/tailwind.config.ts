import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS 配置
 * 扫描 src 目录下的 TSX 文件
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {},
  },
  plugins: [],
  // 避免与 MUI 样式冲突，使用 important 前缀
  important: '#root',
};

export default config;
