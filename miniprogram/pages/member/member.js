// pages/member/member.js · V5 一次性 code + 40163 静默重试 + 用户化话术
// wx.login code 是一次性的：被 createOrder 消费后（无论成败）立即作废缓存。
// 遇 40163（code been used）自动换新 code 静默重试一次，用户无感。

var tiers = [
  { id: 'free', name: '免费', price: 0, period: '', features: ['浏览 skill', '免费 skill 领取'], recommended: false, badge: '' },
  { id: 'monthly', name: '月度会员', price: 19, period: '月', features: ['全库 skill 解锁', '预览+导出', '每月更新'], recommended: true, badge: '最热' },
  { id: 'annual', name: '年度会员', price: 99, period: '年', features: ['全库 skill 解锁', '预览+导出', '定制调优'], recommended: false, badge: '最值' },
];

var allFeatures = ['浏览 skill', '免费 skill', '全库 skill 解锁', '预览+导出', '定制调优'];

Page({
  data: {
    tiers: tiers,
    allFeatures: allFeatures,
    paying: false,
    loginCode: '',
    loginCodeAt: 0,
    retryCount: 0,
    isMember: false,
  },

  onLoad: function() {
    this.prepareLoginCode();
    this.loadSubscription();
  },

  loadSubscription: function() {
    var self = this;
    wx.cloud.callFunction({
      name: 'skills',
      data: { action: 'getSubscription' },
      success: function(res) {
        if (res && res.result && res.result.subscription) {
          self.setData({ isMember: true });
        }
      },
    });
  },

  prepareLoginCode: function() {
    var self = this;
    wx.login({
      success: function(res) {
        if (res && res.code) {
          self.setData({ loginCode: res.code, loginCodeAt: Date.now() });
        }
      },
      fail: function() {}
    });
  },

  // 获取 code：优先用未消费的缓存，否则新取。force=true 时强制新取。
  getLoginCode: function(force, callback) {
    var now = Date.now();
    if (!force && this.data.loginCode && (now - this.data.loginCodeAt) < 4 * 60 * 1000) {
      callback(null, this.data.loginCode);
      return;
    }
    var self = this;
    wx.login({
      success: function(res) {
        if (res && res.code) {
          self.setData({ loginCode: res.code, loginCodeAt: Date.now() });
          callback(null, res.code);
        } else {
          callback(new Error('wx.login 返回空 code'), null);
        }
      },
      fail: function(err) {
        callback(err, null);
      }
    });
  },

  // code 已被消费：立即作废，防止下次复用报 40163
  invalidateLoginCode: function() {
    this.setData({ loginCode: '', loginCodeAt: 0 });
  },

  onSubscribeTap: function(e) {
    if (this.data.paying) return;
    var id = e.currentTarget.dataset.id;
    var tier = tiers.find(function(t) { return t.id === id; });
    if (!tier) return;

    if (tier.price === 0) {
      wx.showToast({ title: '当前即免费方案', icon: 'none' });
      return;
    }
    this.createOrder(tier, false);
  },

  createOrder: function(tier, isRetry) {
    var self = this;
    var productId = this.getProductIdForTier(tier);
    var goodsPrice = Math.round(Number(tier.price) * 100);
    this.setData({ paying: true });
    wx.showLoading({ title: '正在下单...' });

    this.getLoginCode(isRetry, function(loginErr, code) {
      if (loginErr || !code) {
        wx.hideLoading();
        self.setData({ paying: false });
        wx.showModal({
          title: '网络开小差了',
          content: '登录状态获取失败，请稍后重试',
          showCancel: false,
        });
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
            attach: 'member_' + tier.id,
          }
        },
        success: function(res) {
          // code 已被云函数消费，立即作废缓存
          self.invalidateLoginCode();
          wx.hideLoading();
          var result = res && res.result;
          if (result && result.errno === 0) {
            self.callVirtualPayment(result, tier, goodsPrice);
          } else {
            self.setData({ paying: false });
            var errMsg = (result && result.errMsg) || '';
            // 40163：code 被复用 → 换新 code 静默重试一次
            if (!isRetry && errMsg.indexOf('40163') >= 0) {
              console.log('[member] 40163 detected, silent retry with fresh code');
              self.createOrder(tier, true);
              return;
            }
            wx.showModal({
              title: '下单失败',
              content: '支付服务暂时不可用，请稍后重试',
              showCancel: false,
            });
          }
        },
        fail: function() {
          self.invalidateLoginCode();
          wx.hideLoading();
          self.setData({ paying: false });
          if (!isRetry) {
            self.createOrder(tier, true);
            return;
          }
          wx.showModal({
            title: '网络开小差了',
            content: '连接支付服务失败，请稍后重试',
            showCancel: false,
          });
        }
      });
    });
  },

  callVirtualPayment: function(orderData, tier, goodsPrice) {
    var self = this;
    if (!wx.canIUse("requestVirtualPayment")) {
      this.setData({ paying: false });
      wx.showModal({
        title: '提示',
        content: '当前微信版本暂不支持支付，请升级微信后重试',
        showCancel: false,
      });
      return;
    }
    wx.requestVirtualPayment({
      mode: 'short_series_goods',
      offerId: orderData.offerId,
      buyQuantity: 1,
      env: 0,
      currencyType: 'CNY',
      productId: orderData.productId,
      goodsPrice: orderData.goodsPrice,
      outTradeNo: orderData.outTradeNo,
      signData: orderData.signData,
      paySig: orderData.paySig,
      signature: orderData.signature,
      success: function() {
        var order = {
          id: 'member_' + tier.id + '_' + Date.now(),
          type: 'member',
          tierId: tier.id,
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
        wx.setStorageSync('memberLevel', tier.id === 'annual' ? 3 : 2);

        wx.cloud.callFunction({
          name: 'skills',
          data: { action: 'saveSubscription', data: { plan: tier.id, productId: orderData.productId, outTradeNo: orderData.outTradeNo } },
          success: function() {},
          fail: function() {},
        });

        self.setData({ paying: false, isMember: true });
        wx.showToast({ title: '开通成功', icon: 'success' });
      },
      fail: function(res) {
        self.setData({ paying: false });
        var errCode = res && res.errCode;
        var errMsg = (res && res.errMsg) ? res.errMsg : '';
        if (errCode === -1 || errCode === -2 || (errMsg && errMsg.indexOf('cancel') >= 0)) {
          return;
        }
        console.log('[member] requestVirtualPayment fail:', errCode, errMsg);
        wx.showModal({
          title: '支付未完成',
          content: '支付暂时不可用，请稍后重试。如已扣款请联系客服处理',
          showCancel: false,
        });
      }
    });
  },

  getProductIdForTier: function(tier) {
    if (tier.id === 'monthly') return 'member_monthly';
    if (tier.id === 'annual') return 'member_annual';
    return 'member_monthly';
  },
});
