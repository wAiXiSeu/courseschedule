/**
 * ID 生成工具 —— 跨端共享
 *
 * 封装 nanoid，提供统一的 genId() 方法。
 * 小程序环境使用 Math.random 降级方案（nanoid/non-secure 不依赖 crypto）。
 */

/** nanoid 字符集（URL 安全字符） */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

/** ID 默认长度 */
const DEFAULT_LENGTH = 21;

/**
 * 生成一个 URL 安全的短 ID
 *
 * 在浏览器/Node 环境优先使用 crypto.getRandomValues，
 * 小程序环境降级使用 Math.random。
 * 所有实体主键统一由此函数生成，业务代码不得手写 ID。
 */
export function genId(length: number = DEFAULT_LENGTH): string {
  let id = '';
  // 尝试使用 crypto（浏览器 + 现代 Node）
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      id += ALPHABET[bytes[i] % ALPHABET.length];
    }
  } else {
    // 降级方案：小程序 / 旧环境
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * ALPHABET.length);
      id += ALPHABET[randomIndex];
    }
  }
  return id;
}
