/**
 * 云开发初始化 —— 小程序端
 *
 * 初始化微信云开发环境，提供云数据库实例。
 */

/**
 * 初始化云开发
 *
 * 在 app.ts 的 onLaunch 中调用一次即可。
 */
export function initCloud(): void {
  if (!wx.cloud) {
    console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    return;
  }

  wx.cloud.init({
    // 云环境 ID（从环境变量或配置中读取）
    env: 'your-env-id', // TODO: 替换为实际的云环境 ID
    traceUser: true, // 是否在将用户访问记录到用户管理中
  });
}

/**
 * 获取云数据库实例
 */
export function getDatabase() {
  return wx.cloud.database();
}

/**
 * 获取云存储实例
 */
export function getStorage() {
  return wx.cloud;
}
