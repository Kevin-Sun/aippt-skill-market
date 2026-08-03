// pages/member/member.js · P0: 支付失败不标记已完成
var tiers = [
  { id: 'free', name: '免费', price: 0, period: '', features: ['浏览 skill', '免费 skill 领取'], recommended: false, badge: '' },
  { id: 'single', name: '单 skill', price: 2, period: '一次性', features: ['1 个 skill', '基础预览'], recommended: false, badge: '' },
  { id: 'category', name: '一类 skill', price: 9, period: '一次性', features: ['n 个同类 skill', '预览+导出'], recommended: false, badge: '' },
  { id: 'monthly', name: '月度会员', price: 19, period: '月', features: ['全库 skill', '预览+导出', '每月更新'], recommended: true, badge: '最热' },
  { id: 'annual', name: '年度会员', price: 99, period: '年', features: ['全库 skill', '预览+导出', '定制调优', '社群'], recommended: false, badge: '最值' },
];

var allFeatures = ['浏览 skill', '免费 skill', '单 skill 购买', '一类 skill', '全库 skill', '预览+导出', '定制调优', '社群'];

Page({
  data: { tiers: tiers, allFeatures: allFeatures, paying: false },
  onSubscribeTap: function(e) {
    if (this.data.paying) return;
    var id = e.currentTarget.dataset.id;
    var tier = tiers.find(function(t) { return t.id === id; });
    if (!tier) return;

    if (tier.price === 0) {
      wx.showToast({ title: '免费套餐无需开通', icon: 'none' });
      return;
    }

    var productId = this.getProductIdForTier(tier);
    var goodsPrice = Math.round(Number(tier.price) * 100);
    var self = this;
    this.setData({ paying: true });
    wx.showLoading({ title: '正在下单...' });

    wx.login({
      success: function(loginRes) {
        var code = loginRes.code;
        if (!code) {
          wx.hideLoading();
          self.setData({ paying: false });
          wx.showToast({ title: '登录失败，无法支付', icon: 'none' });
          return;
        }
        wx.cloud.callFunction({
          name: 'payment',
          data: {
            action: 'createOrder',
            data: {
              code: code,
              productId: productId,
              goodsPrice: goodsPrice,
              attach: 'member_' + id,
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
                offerId: result.offerId,
                buyQuantity: 1,
                env: 0,
                currencyType: 'CNY',
                productId: result.productId,
                goodsPrice: result.goodsPrice,
                outTradeNo: result.outTradeNo,
                signData: result.signData,
                paySig: result.paySig,
                signature: result.signature,
                success: function() {
                  var order = {
                    id: 'member_' + id + '_' + Date.now(),
                    type: 'member',
                    tierId: id,
                    tierName: tier.name,
                    amount: goodsPrice,
                    status: '已完成',
                    createdAt: new Date().toISOString(),
                  };
                  try {
                    var records = wx.getStorageSync('orderRecords') || [];
                    records.unshift(order);
                    wx.setStorageSync('orderRecords', records);
                  } catch (e) {}

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
              self.setData({ paying: false });
              wx.showModal({
                title: '下单失败',
                content: (result && result.errMsg ? result.errMsg : '请稍后重试') + ' (errno=' + (result ? result.errno : '?') + ')',
                showCancel: false,
              });
            }
          },
          fail: function(err) {
            wx.hideLoading();
            self.setData({ paying: false });
            wx.showModal({
              title: '网络错误',
              content: '支付服务暂时不可用，请稍后重试',
              showCancel: false,
            });
          }
        });
      },
      fail: function() {
        wx.hideLoading();
        self.setData({ paying: false });
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      }
    });
  },

  getProductIdForTier: function(tier) {
    if (tier.id === 'single') return 'skill_lite';
    if (tier.id === 'category') return 'skill_basic';
    if (tier.id === 'monthly') return 'member_monthly';
    if (tier.id === 'annual') return 'member_annual';
    return 'skill_lite';
  },

  onCommunityTap: function() {
    wx.navigateTo({ url: '/pages/community/community' });
  }
});
