// pages/login/login.js · F8: getUserProfile降级
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
    var self = this;
    // F8: 先尝试 getUserProfile，失败降级
    if (wx.getUserProfile) {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: function(res) {
          self.loginSuccess(res.userInfo);
        },
        fail: function() {
          // 降级：使用默认用户信息
          self.loginSuccess({ nickName: '微信用户', avatarUrl: '' });
        },
      });
    } else {
      // 降级：使用默认用户信息
      self.loginSuccess({ nickName: '微信用户', avatarUrl: '' });
    }
  },

  loginSuccess: function(userInfo) {
    wx.setStorageSync('userInfo', userInfo);
    wx.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(function() { wx.navigateBack(); }, 1500);
  },
});
