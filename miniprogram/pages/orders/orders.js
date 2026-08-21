// pages/orders/orders.js · V2: 空态CTA + 客服入口 + 云端购买记录
var skills = require('../../data/cloud-skills-data.js');

function getSkillName(id) {
  var s = skills.find(function(x) { return x.id === id; });
  return s ? (s.nameZh || s.name || id) : id;
}

Page({
  data: { tab: 'orders', purchased: [], favorites: [], orders: [], loadingCloud: false },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  loadData: function() {
    var self = this;
    try {
      var purchasedIds = wx.getStorageSync('purchasedSkills') || [];
      var favoriteIds = wx.getStorageSync('favorites') || [];
      var orderRecords = wx.getStorageSync('orderRecords') || [];
      self.setData({
        purchased: purchasedIds.map(function(id) { return { id: id, name: getSkillName(id) }; }),
        favorites: favoriteIds.map(function(id) { return { id: id, name: getSkillName(id) }; }),
        orders: orderRecords,
      });
    } catch (e) {}

    // 云端购买记录（清 localStorage 后仍能恢复）
    self.loadCloudPurchases();
  },

  loadCloudPurchases: function() {
    var self = this;
    self.setData({ loadingCloud: true });
    wx.cloud.callFunction({
      name: 'skills',
      data: { action: 'getPurchases' },
      success: function(res) {
        self.setData({ loadingCloud: false });
        if (res && res.result && res.result.purchases) {
          var cloudPurchases = res.result.purchases;
          if (cloudPurchases.length > 0) {
            var localIds = wx.getStorageSync('purchasedSkills') || [];
            cloudPurchases.forEach(function(p) {
              if (localIds.indexOf(p.skillId) < 0) localIds.push(p.skillId);
            });
            wx.setStorageSync('purchasedSkills', localIds);
            self.setData({
              purchased: localIds.map(function(id) { return { id: id, name: getSkillName(id) }; }),
              orders: cloudPurchases.map(function(p) {
                return {
                  id: p.outTradeNo || p._id,
                  skillName: getSkillName(p.skillId) || p.skillName || p.skillId,
                  amount: p.amount || 0,
                  status: p.status || '已完成',
                  createdAt: p.createdAt || '',
                };
              }),
            });
          }
        }
      },
      fail: function() { self.setData({ loadingCloud: false }); },
    });
  },

  onTabTap: function(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  onGoMarket: function() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onContactTap: function() {},
});
