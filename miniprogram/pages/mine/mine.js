// pages/mine/mine.js · P2: 会员外露+等级+有效期
Page({
  data: {
    isLoggedIn: false,
    userName: '',
    isMember: false,
    purchasedCount: 0,
    favoriteCount: 0,
    memberLevel: 0,
    memberLevelText: 'LV0',
    memberExpiry: '',
  },

  onShow: function() {
    this.checkLogin();
    this.loadStats();
    this.loadMemberInfo();
  },

  checkLogin: function() {
    try {
      var userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({
          isLoggedIn: true,
          userName: userInfo.nickName || '用户',
          isMember: wx.getStorageSync('isMember') || false,
        });
      }
    } catch (e) {}
  },

  loadStats: function() {
    try {
      var purchased = wx.getStorageSync('purchasedSkills') || [];
      var favorites = wx.getStorageSync('favorites') || [];
      this.setData({
        purchasedCount: purchased.length,
        favoriteCount: favorites.length,
      });
    } catch (e) {}
  },

  loadMemberInfo: function() {
    try {
      var level = wx.getStorageSync('memberLevel') || 0;
      var levelText = ['LV0', 'LV1', 'LV2', 'LV3'][level] || 'LV0';
      
      // 从 orderRecords 读会员订单的到期时间
      var records = wx.getStorageSync('orderRecords') || [];
      var memberOrder = records.find(function(r) { return r.type === 'member'; });
      var expiry = '';
      if (memberOrder) {
        var date = new Date(memberOrder.createdAt);
        if (memberOrder.tierId === 'monthly') {
          date.setMonth(date.getMonth() + 1);
        } else if (memberOrder.tierId === 'annual') {
          date.setFullYear(date.getFullYear() + 1);
        }
        expiry = date.toISOString().substring(0, 10);
      }
      
      this.setData({
        memberLevel: level,
        memberLevelText: levelText,
        memberExpiry: expiry,
      });
    } catch (e) {}
  },

  onMemberTap: function() { wx.navigateTo({ url: '/pages/member/member' }); },
  onOrdersTap: function() { wx.navigateTo({ url: '/pages/orders/orders' }); },
  onFavoritesTap: function() { wx.navigateTo({ url: '/pages/orders/orders' }); },
  onPromotionTap: function() { wx.navigateTo({ url: '/pages/promotion/promotion' }); },
  onSupportTap: function() { wx.showToast({ title: '联系客服', icon: 'none' }); },
  onAboutTap: function() { wx.showToast({ title: 'AI智作PPT模版社', icon: 'none' }); },
});
