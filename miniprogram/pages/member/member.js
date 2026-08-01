// pages/member/member.js · P0: 支付失败不标记已完成
var tiers = [
  { id: 'free', name: '免费', price: 0, period: '', features: ['浏览 skill', '免费 skill 领取'], recommended: false, badge: '' },
  { id: 'single', name: '单 skill', price: 2.9, period: '一次性', features: ['1 个 skill', '基础预览'], recommended: false, badge: '' },
  { id: 'category', name: '一类 skill', price: 9.9, period: '一次性', features: ['n 个同类 skill', '预览+导出'], recommended: false, badge: '' },
  { id: 'monthly', name: '月度会员', price: 19.9, period: '月', features: ['全库 skill', '预览+导出', '每月更新'], recommended: true, badge: '最热' },
  { id: 'annual', name: '年度会员', price: 99.9, period: '年', features: ['全库 skill', '预览+导出', '定制调优', '社群'], recommended: false, badge: '最值' },
];

var allFeatures = ['浏览 skill', '免费 skill', '单 skill 购买', '一类 skill', '全库 skill', '预览+导出', '定制调优', '社群'];

Page({
  data: { tiers: tiers, allFeatures: allFeatures, paying: false },

  onSubscribeTap: function(e) {
    if (this.data.paying) return; // P0-6: 防重复点击
    var id = e.currentTarget.dataset.id;
    var tier = tiers.find(function(t) { return t.id === id; });
    if (!tier) return;
    
    // P0-5: 免费套餐直接跳过支付
    if (tier.price === 0) {
      wx.showToast({ title: '免费套餐无需开通', icon: 'none' });
      return;
    }
    
    var amount = Math.round(Number(tier.price) * 100); // P8-1: 转 Number
    var self = this;
    this.setData({ paying: true });
    wx.showLoading({ title: '正在下单...' });

    wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'createOrder',
        data: {
          mode: 'short_series_goods',
          amount: amount,
          attach: 'member_' + id,
          productId: 'member_' + id,
        }
      },
      success: function(res) {
        wx.hideLoading();
        var result = res.result;
        if (result && result.errno === 0) {
          if (!wx.canIUse("requestVirtualPayment")) {
            wx.showModal({
              title: "提示",
              content: "当前微信版本不支持虚拟支付，请用真机扫码测试",
              showCancel: false,
            });
            self.setData({ paying: false });
            return;
          }
          wx.requestVirtualPayment({
            mode: 'short_series_goods',
            offerId: result.offerId || '1450602455',
            buyQuantity: 1,
            env: 0,
            currencyType: 'CNY',
            outTradeNo: result.outTradeNo,
            sign: result.sign,
            nonce: result.nonce,
            success: function() {
              // P0-2: 支付成功写 orderRecords
              var order = {
                id: 'member_' + id + '_' + Date.now(),
                type: 'member',
                tierId: id,
                tierName: tier.name,
                amount: amount,
                status: '已完成',
                createdAt: new Date().toISOString(),
              };
              try {
                var records = wx.getStorageSync('orderRecords') || [];
                records.unshift(order);
                wx.setStorageSync('orderRecords', records);
              } catch (e) {}
              
              // P0-3: 设 isMember=true
              wx.setStorageSync('isMember', true);
              wx.setStorageSync('memberLevel', tier.id === 'annual' ? 3 : (tier.id === 'monthly' ? 2 : 1));
              self.setData({ paying: false });
              wx.showToast({ title: '开通成功', icon: 'success' });
              setTimeout(function() { wx.navigateBack(); }, 1500);
            },
            fail: function(res) {
              self.setData({ paying: false });
              var msg = (res && res.errMsg) ? res.errMsg : '支付已取消';
              wx.showToast({ title: msg, icon: 'none' });
            }
          });
        } else {
          // 云函数返回失败
          self.setData({ paying: false });
          wx.showModal({
            title: '下单失败',
            content: result && result.errMsg ? result.errMsg : '请稍后重试',
            showCancel: false,
          });
        }
      },
      fail: function(err) {
        wx.hideLoading();
        // P0-1: 云函数失败不标记 isMember，只显示错误
        self.setData({ paying: false });
        wx.showModal({
          title: '网络错误',
          content: '支付服务暂时不可用，请稍后重试',
          showCancel: false,
        });
      }
    });
  },

  onCommunityTap: function() {
    wx.navigateTo({ url: '/pages/community/community' });
  }
});
