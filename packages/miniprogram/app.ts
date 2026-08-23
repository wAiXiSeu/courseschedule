/**
 * 小程序入口
 * - 初始化微信云开发
 * - 全局状态管理
 */
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      // env 参数说明：
      //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
      //   此处请填入环境 ID
      //   环境 ID 可打开云控制台查看
      //   手动填则不启用云开发
      env: '',
      traceUser: true,
    });

    console.log('小程序启动');
  },

  onShow() {
    console.log('小程序显示');
  },

  onHide() {
    console.log('小程序隐藏');
  },

  onError(err) {
    console.error('小程序错误：', err);
  },

  globalData: {
    userInfo: null,
    openid: '',
  },
});
