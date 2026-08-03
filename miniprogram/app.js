// app.js · F17: 全局错误处理
App({
  globalData: { userInfo: null, openid: null },

  onLaunch: function() {
    if (!wx.cloud) {
      console.warn('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      try {
        wx.cloud.init({
          env: 'aippt-skill-d6g5hsem096551cc3',
          traceUser: true,
        });
      } catch (e) {
        console.warn('云开发初始化失败:', e);
      }
    }
  },

  onError: function(err) {
    console.error('全局错误:', err);
  },

  onUnhandledRejection: function(res) {
    console.error('未处理Promise:', res);
  },
});
