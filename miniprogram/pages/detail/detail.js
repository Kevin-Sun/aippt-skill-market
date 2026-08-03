// pages/detail/detail.js · V2 支付联调（调云函数下单+wx.requestVirtualPayment）
var skillsService = require('../../data/skills-service.js');

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
    var productId = this.getProductIdForSkill(skill);
    var goodsPrice = Math.round(Number(skill.price) * 100);

    wx.showLoading({ title: '正在下单...' });

    wx.login({
      success: function(loginRes) {
        var code = loginRes.code;
        if (!code) {
          wx.hideLoading();
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
              attach: skill.id,
            }
          },
          success: function(res) {
            wx.hideLoading();
            var result = res.result;
            if (result && result.errno === 0) {
              self.callVirtualPayment(result, goodsPrice);
            } else {
              wx.showModal({
                title: '下单失败',
                content: (result ? result.errMsg : '未知错误') + ' (errno=' + (result ? result.errno : '?') + ')',
                showCancel: false,
              });
            }
          },
          fail: function(err) {
            wx.hideLoading();
            wx.showModal({
              title: '支付失败',
              content: '网络错误或云函数未部署，是否重试？',
              confirmText: '重试',
              cancelText: '取消',
              success: function(modalRes) {
                if (modalRes.confirm) {
                  self.setData({ retryCount: (self.data.retryCount || 0) + 1 });
                  if (self.data.retryCount <= 3) { self.requestPayment(); }
                  else { wx.showToast({ title: '重试次数过多', icon: 'none' }); }
                }
                else { wx.showToast({ title: '已取消', icon: 'none' }); }
              }
            });
          }
        });
      },
      fail: function() {
        wx.hideLoading();
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      }
    });
  },

  getProductIdForSkill: function(skill) {
    var price = Number(skill.price);
    if (price <= 2) return 'skill_lite';
    if (price <= 9) return 'skill_basic';
    return 'skill_pro';
  },

  callVirtualPayment: function(orderData, goodsPrice) {
    var self = this;
    if (!wx.canIUse("requestVirtualPayment")) {
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
      success: function() {
        self.unlockSkill();
      },
      fail: function(res) {
        var msg = (res && res.errMsg) ? res.errMsg : '支付取消';
        wx.showToast({ title: msg, icon: 'none' });
      }
    });
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
