// pages/detail/detail.js · V3 wx.login 缓存 + 错误映射
var skillsService = require('../../data/skills-service.js');

var LOGIN_CODE_TTL_MS = 4 * 60 * 1000;  // 4 分钟缓存（官方限制 5 分钟）

Page({
  data: {
    skill: null,
    isPurchased: false,
    isLoggedIn: false,
    isFavorited: false,
    relatedSkills: [],
    currentPreview: 0,
    retryCount: 0,
    purchasedAt: '',
    loginCode: '',
    loginCodeAt: 0,
  },

  onLoad: function(options) {
    var skillId = options.id;
    var skill = skillsService.getById(skillId);
    var related = skillsService.getRelated(skillId);
    this.setData({
      skill: skill,
      relatedSkills: related || []
    });
    this.checkLogin();
    this.checkPurchased(skillId);
    this.checkFavorite(skillId);
    this.prepareLoginCode();
  },

  onShow: function() {
    this.checkLogin();
    if (this.data.skill) {
      this.checkPurchased(this.data.skill.id);
      this.checkFavorite(this.data.skill.id);
    }
  },

  prepareLoginCode: function() {
    var self = this;
    wx.login({
      success: function(res) {
        if (res && res.code) {
          self.setData({ loginCode: res.code, loginCodeAt: Date.now() });
          console.log('[detail] loginCode 预获取成功');
        }
      },
      fail: function(err) {
        console.warn('[detail] 预 login 失败:', err);
      }
    });
  },

  getLoginCode: function(callback) {
    var now = Date.now();
    if (this.data.loginCode && (now - this.data.loginCodeAt) < LOGIN_CODE_TTL_MS) {
      console.log('[detail] 使用缓存的 loginCode');
      callback(null, this.data.loginCode);
      return;
    }
    console.log('[detail] 缓存失效或不存在，重新调 wx.login');
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

  checkLogin: function() {
    try {
      var userInfo = wx.getStorageSync('userInfo');
      this.setData({ isLoggedIn: !!userInfo });
    } catch (e) {}
  },

  checkPurchased: function(skillId) {
    try {
      var purchased = wx.getStorageSync('purchasedSkills') || [];
      this.setData({ isPurchased: purchased.indexOf(skillId) >= 0 });
    } catch (e) {}
  },

  checkFavorite: function(skillId) {
    try {
      var favorites = wx.getStorageSync('favorites') || [];
      this.setData({ isFavorited: favorites.indexOf(skillId) >= 0 });
    } catch (e) {}
  },

  onPreviewChange: function(e) {
    this.setData({ currentPreview: e.detail.current });
  },

  onPreviewTap: function() {
    var images = this.data.skill.previewImages || [];
    wx.previewImage({ urls: images, current: images[this.data.currentPreview] || images[0] });
  },

  onBuyTap: function() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    if (this.data.skill && this.data.skill.isFree) {
      this.unlockSkill();
    } else {
      this.requestPayment();
    }
  },

  requestPayment: function() {
    var self = this;
    var skill = this.data.skill;
    if (!skill) {
      wx.showToast({ title: 'skill 数据加载中', icon: 'none' });
      return;
    }
    var productId = this.getProductIdForSkill(skill);
    var goodsPrice = Math.round(Number(skill.price) * 100);

    wx.showLoading({ title: '正在下单...' });

    this.getLoginCode(function(loginErr, code) {
      if (loginErr || !code) {
        wx.hideLoading();
        console.error('[detail] getLoginCode 失败:', loginErr);
        wx.showModal({
          title: '登录失败',
          content: '微信登录 code 获取失败，可能是频率限制（5 分钟内有效 1 次），请稍后重试。\n错误：' + (loginErr && loginErr.message ? loginErr.message : '未知'),
          showCancel: false,
        });
        return;
      }
      console.log('[detail] about to callFunction, code=' + code.slice(0, 8) + ', productId=' + productId + ', goodsPrice=' + goodsPrice);
      wx.cloud.callFunction({
        name: 'payment',
        data: {
          action: 'createOrder',
          data: {
            code: code,
            productId: productId,
            goodsPrice: goodsPrice,
            attach: skill.id,
          }
        },
        success: function(res) {
          wx.hideLoading();
          var result = res && res.result;
          console.log('[detail] callFunction success, errno=' + (result && result.errno) + ', has signData=' + !!(result && result.signData));
          if (result && result.errno === 0) {
            self.callVirtualPayment(result, goodsPrice);
          } else {
            var errno = result ? result.errno : '?';
            var errMsg = result && result.errMsg ? result.errMsg : '未知错误';
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
          console.error('[detail] callFunction fail:', err && JSON.stringify(err));
          wx.showModal({
            title: '云函数调用失败',
            content: 'errCode=' + (err && err.errCode) + '\nerrMsg=' + (err && err.errMsg ? err.errMsg : JSON.stringify(err)),
            confirmText: '重试',
            cancelText: '取消',
            success: function(modalRes) {
              if (modalRes.confirm) {
                self.setData({ retryCount: (self.data.retryCount || 0) + 1 });
                if (self.data.retryCount <= 3) {
                  self.setData({ loginCode: '', loginCodeAt: 0 });  // 清缓存重新 login
                  self.requestPayment();
                } else {
                  wx.showToast({ title: '重试次数过多，请稍后再试', icon: 'none' });
                }
              } else {
                wx.showToast({ title: '已取消', icon: 'none' });
              }
            }
          });
        }
      });
    });
  },

  mapCloudError: function(errno, errMsg) {
    if (errno === 400) return '参数错误（缺 code 或 productId）';
    if (errno === 500) return '云函数未配置 OFFER_ID / VIRTUAL_PAYMENT_KEY';
    if (errMsg && errMsg.indexOf('code2Session') >= 0) return '云函数未开 code2Session 权限，请联系开发者';
    if (errMsg && errMsg.indexOf('appid') >= 0) return 'AppID 配置错误';
    return errMsg || '未知错误';
  },

  getProductIdForSkill: function(skill) {
    var price = Number(skill.price);
    if (price <= 2) return 'skill_lite';
    if (price <= 9) return 'skill_basic';
    return 'skill_pro';
  },

  callVirtualPayment: function(orderData, goodsPrice) {
    var self = this;
    console.log('[detail] callVirtualPayment, offerId=' + orderData.offerId + ', productId=' + orderData.productId + ', goodsPrice=' + orderData.goodsPrice + ', outTradeNo=' + orderData.outTradeNo + ', signDataLen=' + (orderData.signData ? orderData.signData.length : 0) + ', paySigLen=' + (orderData.paySig ? orderData.paySig.length : 0) + ', signatureLen=' + (orderData.signature ? orderData.signature.length : 0));
    var canUseVP = wx.canIUse("requestVirtualPayment");
    console.log('[detail] wx.canIUse requestVirtualPayment =', canUseVP);
    if (!canUseVP) {
      wx.showModal({
        title: "提示",
        content: "当前微信版本不支持虚拟支付，请用真机扫码测试或升级微信",
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
      success: function(res) {
        console.log('[detail] requestVirtualPayment SUCCESS:', JSON.stringify(res));
        self.unlockSkill();
      },
      fail: function(res) {
        var errCode = res && res.errCode;
        var errMsg = (res && res.errMsg) ? res.errMsg : '支付取消';
        console.error('[detail] requestVirtualPayment fail:', errCode, errMsg);
        var userMsg = self.mapPaymentError(errCode, errMsg);
        wx.showModal({
          title: '支付失败 (' + (errCode || '?') + ')',
          content: userMsg,
          showCancel: false,
        });
      }
    });
  },

  mapPaymentError: function(errCode, errMsg) {
    if (errCode === -15013) return '价格不匹配（goodsPrice 与后台配置不一致），请联系客服';
    if (errCode === -15003) return '商品未在后台上架，请等待审核生效';
    if (errCode === -15006) return '商品审核未通过';
    if (errCode === -15012) return '签名错误，请联系开发者';
    if (errCode === 40163) return 'wx.login code 已过期，请重新进入页面';
    return errMsg || '未知错误';
  },

  unlockSkill: function() {
    try {
      var skill = this.data.skill;
      var purchased = wx.getStorageSync('purchasedSkills') || [];
      if (purchased.indexOf(skill.id) < 0) purchased.push(skill.id);
      wx.setStorageSync('purchasedSkills', purchased);
      // P0-4: 写 orderRecords
      var order = {
        id: 'skill_' + skill.id + '_' + Date.now(),
        type: 'skill',
        skillId: skill.id,
        skillName: skill.name,
        amount: Math.round(Number(skill.price) * 100),
        status: '已完成',
        createdAt: new Date().toISOString(),
      };
      var records = wx.getStorageSync('orderRecords') || [];
      records.unshift(order);
      wx.setStorageSync('orderRecords', records);
      this.setData({ isPurchased: true, purchasedAt: order.createdAt });
      wx.showToast({ title: '解锁成功', icon: 'success' });
    } catch (e) {}
  },

  onFavoriteTap: function() {
    try {
      var favorites = wx.getStorageSync('favorites') || [];
      var skillId = this.data.skill.id;
      var idx = favorites.indexOf(skillId);
      if (idx >= 0) {
        favorites.splice(idx, 1);
        this.setData({ isFavorited: false });
        wx.showToast({ title: '已取消收藏', icon: 'none' });
      } else {
        favorites.push(skillId);
        this.setData({ isFavorited: true });
        wx.showToast({ title: '已收藏', icon: 'success' });
      }
      wx.setStorageSync('favorites', favorites);
    } catch (e) {}
  },

  onShareTap: function() {
    wx.showShareMenu({ withShareTicket: true });
  },

  onShareAppMessage: function() {
    var skill = this.data.skill;
    return {
      title: skill.name + ' · AI智作PPT',
      path: '/pages/detail/detail?id=' + skill.id,
      imageUrl: skill.previewImages ? skill.previewImages[0] : ''
    };
  },

  onTryUseTap: function() {
    wx.navigateTo({ url: '/pages/preview/preview?id=' + this.data.skill.id });
  },

  onCopyCodex: function() {
    var content = '你是专业 PPT 生成助手。当用户要求生成 PPT 时按以下流程：\n1. 需求调研\n2. 大纲策划（5-10页）\n3. 内容填充（每页一个核心观点）\n4. 风格统一（主色#2563eb）\n排版：每页不超过50字\n格式：HTML（16:9）';
    wx.setClipboardData({ data: content, success: function() { wx.showToast({ title: 'Codex skill 已复制', icon: 'success' }); } });
  },

  onCopyDoubao: function() {
    var content = '你是一个专业 PPT 生成助手。当用户要求生成 PPT 时按以下流程：\n1. 需求调研\n2. 大纲策划\n3. 内容填充\n4. 风格统一\n配色：主色#2563eb\n排版：每页不超过50字\n格式：HTML';
    wx.setClipboardData({ data: content, success: function() { wx.showToast({ title: '豆包 skill 已复制', icon: 'success' }); } });
  },

  onCopyWorkBuddy: function() {
    var content = '{"name":"PPT Skill","systemPrompt":"你是专业PPT生成助手","triggers":["做PPT","生成PPT"]}';
    wx.setClipboardData({ data: content, success: function() { wx.showToast({ title: 'WorkBuddy skill 已复制', icon: 'success' }); } });
  },

  onRelatedTap: function(e) {
    var skillId = e.currentTarget.dataset.id;
    wx.redirectTo({ url: '/pages/detail/detail?id=' + skillId });
  },

  onReviewTap: function() {
    var skillId = this.data.skill.id;
    wx.navigateTo({ url: '/pages/reviews/reviews?id=' + skillId });
  },
});
