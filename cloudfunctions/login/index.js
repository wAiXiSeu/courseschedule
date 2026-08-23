/**
 * 登录云函数
 *
 * 获取用户 openid，返回用户身份信息。
 * 微信小程序端调用：
 *   wx.cloud.callFunction({ name: 'login' })
 */
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

/**
 * 云函数入口
 * @param {object} event - 事件参数
 * @param {object} context - 调用上下文
 * @returns {Promise<object>} 返回 { openid, unionid? }
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  const openid = wxContext.OPENID || '';
  const unionid = wxContext.UNIONID || '';
  const appid = wxContext.APPID || '';

  // 确保用户在数据库中存在记录
  const db = cloud.database();
  try {
    const userRes = await db
      .collection('users')
      .where({ openid })
      .limit(1)
      .get();

    if (userRes.data.length === 0) {
      // 新用户，创建记录
      await db.collection('users').add({
        data: {
          openid,
          unionid,
          appid,
          role: 'parent',
          nickname: '',
          avatarUrl: '',
          createdAt: db.serverDate(),
        },
      });
    }
  } catch (err) {
    console.error('用户数据查询/写入失败：', err);
  }

  return {
    openid,
    unionid,
    appid,
  };
};
