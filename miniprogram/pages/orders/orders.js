// pages/orders/orders.js · F19: 真实订单记录
Page({
  data: { tab: 'purchased', purchased: [], favorites: [], orders: [] },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  loadData: function() {
    try {
      var purchased = wx.getStorageSync('purchasedSkills') || [];
      var favorites = wx.getStorageSync('favorites') || [];
      var orderRecords = wx.getStorageSync('orderRecords') || [];
      this.setData({
        purchased: purchased,
        favorites: favorites,
        orders: orderRecords,
      });
    } catch (e) {}
  },

  onTabTap: function(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },
});
