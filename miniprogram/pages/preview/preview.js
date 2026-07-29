// pages/preview/preview.js · F9: loading状态
Page({
  data: { skillId: '', renderReady: false, loading: false },

  onLoad: function(options) {
    this.setData({ skillId: options.id || '' });
  },

  onRender: function() {
    var self = this;
    this.setData({ loading: true });
    wx.showLoading({ title: '渲染中...' });
    
    // 模拟渲染延迟
    setTimeout(function() {
      self.setData({ renderReady: true, loading: false });
      wx.hideLoading();
    }, 1500);
  },
});
