// pages/orders/orders.js
Page({
  data: { tab: 'purchased', purchased: [], favorites: [], orders: [] },
  onLoad: function() {
    try {
      var purchased = wx.getStorageSync('purchasedSkills') || [];
      var favorites = wx.getStorageSync('favorites') || [];
      this.setData({ purchased: purchased, favorites: favorites });
    } catch(e) {}
  },
  onTabTap: function(e) { this.setData({ tab: e.currentTarget.dataset.tab }); }
});
