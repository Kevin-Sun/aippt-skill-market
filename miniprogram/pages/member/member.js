// pages/member/member.js · V3 wx.login 缓存 + 错误映射
var LOGIN_CODE_TTL_MS = 4 * 60 * 1000;

var tiers = [
  { id: 'free', name: '免费', price: 0, period: '', features: ['浏览 skill', '免费 skill 领取'], recommended: false, badge: '' },
  { id: 'single', name: '单 skill', price: 2, period: '一次性', features: ['1 个 skill', '基础预览'], recommended: false, badge: '' },
  { id: 'category', name: '一类 skill', price: 9, period: '一次性', features: ['n 个同类 skill', '预览+导出'], recommended: false, badge: '' },
  { id: 'monthly', name: '月度会员', price: 19, period: '月', features: ['全库 skill', '预览+导出', '每月更新'], recommended: true, badge: '最热' },
  { id: 'annual', name: '年度会员', price: 99, period: '年', features: ['全库 skill', '预览+导出', '定制调优', '社群'], recommended: false, badge: '最值' },
];

var allFeatures = ['浏览 skill', '免费 skill', '单 skill 购买', '一类 skill', '全库 skill', '预览+导出', '定制调优', '社群'];

Page({
  data: {
    tiers: tiers,
    allFeatures: allFeatures,
    paying: false,
    loginCode: '',
    loginCodeAt: 0,
    retryCount: 0,
  },

  onLoad: function() {
    this.prepareLoginCode();
  },

  prepareLoginCode: function() {
    var self = this;
    wx.login({
      success: function(res) {
        if (res && res.code) {
          self.setData({ loginCode: res.code, loginCodeAt: Date.now() });
          console.log('[member] loginCode 预获取成功');
        }
      },
      fail: function(err) {
        console.warn('[member] 预 login 失败:', err);
      }
    });
  },

  getLoginCode: function(callback) {
    var now = Date.now();
    if (this.data.loginCode && (now - this.data.loginCodeAt) < LOGIN_CODE_TTL_MS) {
      console.log('[member] 使用缓存的 loginCode');
      callback(null, this.data.loginCode);
      return;
    }
    console.log('[member] 缓存失效或不存在，重新调 wx.login');
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

  mapCloudError: function(errno, errMsg) {
    if (errno === 400) return '参数错误（缺 code 或 productId）';
    if (errno === 500) return '云函数未配置 OFFER_ID / VIRTUAL_PAYMENT_KEY';
    if (errMsg && errMsg.indexOf('code2Session') >= 0) return '云函数未开 code2Session 权限，请联系开发者';
    return errMsg || '未知错误';
  },

  mapPaymentError: function(errCode, errMsg) {
    if (errCode === -1 || errCode === -2) return '已取消支付';
    if (errCode === -15013) return '价格不匹配（goodsPrice 与后台配置不一致），请联系客服';
    if (errCode === -15003) return '商品未在后台上架，请等待审核生效';
    if (errCode === -15006) return '商品审核未通过';
    if (errCode === -15012) return '签名错误，请联系开发者';
    if (errCode === 40163) return 'wx.login code 已过期，请重新进入页面';
    return errMsg || '未知错误';
  },

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

    this.getLoginCode(function(loginErr, code) {
      if (loginErr || !code) {
        wx.hideLoading();
        self.setData({ paying: false });
        console.error('[member] getLoginCode 失败:', loginErr);
        wx.showModal({
          title: '登录失败',
          content: '微信登录 code 获取失败，可能是频率限制（5 分钟内有效 1 次），请稍后重试。\n错误：' + (loginErr && loginErr.message ? loginErr.message : '未知'),
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
            attach: 'member_' + id,
          }
        },
        success: function(res) {
          wx.hideLoading();
          var result = res && res.result;
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
                var errCode = res && res.errCode;
                var errMsg = (res && res.errMsg) ? res.errMsg : '';
                console.log('[member] requestVirtualPayment fail:', errCode, errMsg);
                if (errCode === -1 || errCode === -2 || (errMsg && errMsg.indexOf('cancel') >= 0)) {
                  return;
                }
                var userMsg = self.mapPaymentError(errCode, errMsg);
                wx.showModal({
                  title: '支付失败 (' + (errCode || '?') + ')',
                  content: userMsg,
                  showCancel: false,
                });
              }
            });
          } else {
            self.setData({ paying: false });
            var errno = result ? result.errno : '?';
            var errMsg = result && result.errMsg ? result.errMsg : '请稍后重试';
            var userMsg = self.mapCloudError(errno, errMsg);
            wx.showModal({
              title: '下单失败 (errno=' + errno + ')',
              content: userMsg + '\n\n原始：' + errMsg,
              showCancel: false,
            });
          }
        },
        fail: function(err) {
          wx.hideLoading();
          self.setData({ paying: false });
          console.error('[member] callFunction fail:', err);
          wx.showModal({
            title: '云函数调用失败',
            content: 'errCode=' + (err && err.errCode) + '\nerrMsg=' + (err && err.errMsg ? err.errMsg : JSON.stringify(err)),
            confirmText: '重试',
            cancelText: '取消',
            success: function(modalRes) {
              if (modalRes.confirm) {
                self.setData({ retryCount: (self.data.retryCount || 0) + 1, loginCode: '', loginCodeAt: 0 });
                if (self.data.retryCount <= 3) {
                  self.onSubscribeTap(e);
                } else {
                  wx.showToast({ title: '重试次数过多，请稍后再试', icon: 'none' });
                }
              }
            }
          });
        }
      });
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
