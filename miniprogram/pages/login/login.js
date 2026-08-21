// pages/login/login.js · 直接登录（getUserProfile 已废弃 2022-10-25）
Page({
  data: { agree: false },

  onAgreeChange: function(e) {
    this.setData({ agree: e.detail.value.length > 0 });
  },

  onLoginTap: function() {
    if (!this.data.agree) {
      wx.showToast({ title: '请先同意用户协议', icon: 'none' });
      return;
    }
    var userInfo = { nickName: '微信用户', avatarUrl: '' };
    wx.setStorageSync('userInfo', userInfo);
    wx.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(function() { wx.navigateBack(); }, 1500);
  },

  onShareAppMessage: function() {
    return {
      title: 'AI智作PPT模版社 - 300+ AI技能模版',
      path: '/pages/index/index',
    };
  },

  onShareTimeline: function() {
    return {
      title: 'AI智作PPT模版社 - 300+ AI技能模版',
    };
  },
});
