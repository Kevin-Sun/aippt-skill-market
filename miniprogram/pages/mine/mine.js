// pages/mine/mine.js · V2 我的页（会员状态+已购+收藏+订单+客服）
Page({
  data: { isLoggedIn: false, userInfo: null, memberLevel: 'free', purchasedCount: 0, favoriteCount: 0 },
  onShow: function() {
    try {
      var userInfo = wx.getStorageSync('userInfo');
      var purchased = wx.getStorageSync('purchasedSkills') || [];
      var favorites = wx.getStorageSync('favorites') || [];
      this.setData({ isLoggedIn: !!userInfo, userInfo: userInfo, purchasedCount: purchased.length, favoriteCount: favorites.length });
    } catch(e) {}
  },
  onLoginTap: function() { wx.navigateTo({ url: '/pages/login/login' }); },
  onMemberTap: function() { wx.navigateTo({ url: '/pages/member/member' }); },
  onOrdersTap: function() { wx.navigateTo({ url: '/pages/orders/orders' }); },
  onCommunityTap: function() { wx.navigateTo({ url: '/pages/community/community' }); },
  onContactTap: function() { wx.showToast({ title: '客服微信：aippt-support', icon: 'none' }); }
});
