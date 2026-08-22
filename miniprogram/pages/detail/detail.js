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
    skillContent: '',
    previewLoaded: false,
    previewImgLoadCount: 0,
    previewImgErrorCount: 0,
    isMember: false,
  },

  checkMembership: function(skillId) {
    var self = this;
    wx.cloud.callFunction({
      name: 'skills',
      data: { action: 'getSubscription' },
      success: function(res) {
        if (res && res.result && res.result.subscription) {
          self.setData({ isMember: true });
          // 会员直接标记已解锁
          self.setData({ purchased: true, purchasedAt: '会员权益' });
        }
      },
    });
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
    this.checkMembership(skillId);
    if (skill && skill.tier === 'paid') {
      this.loadSkillContent(skillId);
    }
    // 预览图加载检测
    if (skill && skill.previewDeck && skill.previewDeck.length > 0) {
      this.setData({ previewLoaded: true });
    }
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

  getLoginCode: function(force, callback) {
    var now = Date.now();
    if (!force && this.data.loginCode && (now - this.data.loginCodeAt) < LOGIN_CODE_TTL_MS) {
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

  // code 已被云函数消费，立即作废，防止复用报 40163
  invalidateLoginCode: function() {
    this.setData({ loginCode: '', loginCodeAt: 0 });
  },

  checkLogin: function() {
    try {
      var userInfo = wx.getStorageSync('userInfo');
      this.setData({ isLoggedIn: !!userInfo });
    } catch (e) {}
  },

  checkPurchased: function(skillId) {
    var self = this;
    try {
      var purchased = wx.getStorageSync('purchasedSkills') || [];
      var localPurchased = purchased.indexOf(skillId) >= 0;
      self.setData({ isPurchased: localPurchased });
    } catch (e) {}
    // 云端查询（清 localStorage 后仍能恢复）
    wx.cloud.callFunction({
      name: 'skills',
      data: { action: 'getPurchases' },
      success: function(res) {
        if (res && res.result && res.result.purchases) {
          var cloudPurchased = res.result.purchases.some(function(p) { return p.skillId === skillId; });
          if (cloudPurchased && !self.data.isPurchased) {
            // 云端有记录但本地丢了 → 恢复本地
            var local = wx.getStorageSync('purchasedSkills') || [];
            if (local.indexOf(skillId) < 0) local.push(skillId);
            wx.setStorageSync('purchasedSkills', local);
            self.setData({ isPurchased: true });
          }
        }
      },
    });
  },

  checkFavorite: function(skillId) {
    try {
      var favorites = wx.getStorageSync('favorites') || [];
      this.setData({ isFavorited: favorites.indexOf(skillId) >= 0 });
    } catch (e) {}
  },

  onPreviewChange: function(e) {
    this.setData({ currentPreview: e.detail.current || 0 });
  },

  onPreviewError: function() {
    this.setData({ previewLoaded: false, previewImgErrorCount: this.data.previewImgErrorCount + 1 });
  },

  onPreviewImgLoad: function() {
    this.setData({ previewImgLoadCount: this.data.previewImgLoadCount + 1 });
  },

  onPreviewTap: function() {
    // 全屏预览（用 wx.previewImage）
    var urls = this.data.skill.previewDeck || [];
    if (urls.length > 0) {
      wx.previewImage({ current: urls[this.data.currentPreview], urls: urls });
    }
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

  requestPayment: function(isRetry) {
    var self = this;
    var skill = this.data.skill;
    if (!skill) {
      wx.showToast({ title: 'skill 数据加载中', icon: 'none' });
      return;
    }
    var productId = this.getProductIdForSkill(skill);
    var goodsPrice = Math.round(Number(skill.price) * 100);

    wx.showLoading({ title: '正在下单...' });

    this.getLoginCode(!!isRetry, function(loginErr, code) {
      if (loginErr || !code) {
        wx.hideLoading();
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
            attach: skill.id,
          }
        },
        success: function(res) {
          // code 已被云函数消费，立即作废缓存
          self.invalidateLoginCode();
          wx.hideLoading();
          var result = res && res.result;
          if (result && result.errno === 0) {
            self.callVirtualPayment(result, goodsPrice);
          } else {
            var errMsg = (result && result.errMsg) || '';
            // 40163：code 被复用 → 换新 code 静默重试一次
            if (!isRetry && errMsg.indexOf('40163') >= 0) {
              self.requestPayment(true);
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
          if (!isRetry) {
            self.requestPayment(true);
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

  getProductIdForSkill: function(skill) {
    var price = Number(skill.price);
    if (price <= 2) return 'skill_lite';
    if (price <= 9) return 'skill_basic';
    return 'skill_pro';
  },

  callVirtualPayment: function(orderData, goodsPrice) {
    var self = this;
    var canUseVP = wx.canIUse("requestVirtualPayment");
    if (!canUseVP) {
      wx.showModal({
        title: "提示",
        content: "当前微信版本暂不支持支付，请升级微信后重试",
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
        self.unlockSkill();
      },
      fail: function(res) {
        var errCode = res && res.errCode;
        var errMsg = (res && res.errMsg) ? res.errMsg : '';
        if (errCode === -1 || errCode === -2 || (errMsg && errMsg.indexOf('cancel') >= 0)) {
          return;
        }
        wx.showModal({
          title: '支付未完成',
          content: '支付暂时不可用，请稍后重试。如已扣款请联系客服处理',
          showCancel: false,
        });
      }
    });
  },

  unlockSkill: function() {
    try {
      var skill = this.data.skill;
      var purchased = wx.getStorageSync('purchasedSkills') || [];
      if (purchased.indexOf(skill.id) < 0) purchased.push(skill.id);
      wx.setStorageSync('purchasedSkills', purchased);
      var order = {
        id: 'skill_' + skill.id + '_' + Date.now(),
        type: 'skill',
        skillId: skill.id,
        skillName: skill.nameZh || skill.name,
        amount: Math.round(Number(skill.price) * 100),
        status: '已完成',
        createdAt: new Date().toISOString(),
      };
      var records = wx.getStorageSync('orderRecords') || [];
      records.unshift(order);
      wx.setStorageSync('orderRecords', records);
      this.setData({ isPurchased: true, purchasedAt: order.createdAt });
      wx.showToast({ title: '解锁成功', icon: 'success' });
      // 云端保存购买记录
      wx.cloud.callFunction({
        name: 'skills',
        data: {
          action: 'savePurchase',
          data: {
            skillId: skill.id,
            skillName: skill.nameZh || skill.name,
            productId: this.getProductIdForSkill(skill),
            amount: order.amount,
            outTradeNo: order.id,
          },
        },
      });
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

  onViewOriginalTap: function() {
    var skill = this.data.skill;
    var url = skill.sourceUrl || skill.repoUrl || '';
    if (url) {
      wx.navigateTo({ url: '/pages/original-detail/original-detail?id=' + skill.id });
    } else {
      wx.showToast({ title: '此技能为灵感参考，暂无外部链接', icon: 'none' });
    }
  },

  onCopyInstall: function() {
    var skill = this.data.skill;
    if (skill.installCmd) wx.setClipboardData({ data: skill.installCmd, success: function() { wx.showToast({ title: '安装命令已复制', icon: 'success' }); } });
  },

  loadSkillContent: function(skillId) {
    var self = this;
    wx.cloud.callFunction({
      name: 'skills',
      data: { action: 'getSkillContent', data: { skillId: skillId } },
      success: function(res) {
        if (res && res.result && res.result.content && res.result.content.content) {
          self.setData({ skillContent: res.result.content.content });
        }
      },
    });
  },

  onCopySkillMd: function() {
    var content = this.data.skillContent;
    if (content) {
      wx.setClipboardData({ data: content, success: function() { wx.showToast({ title: 'SKILL.md 已复制', icon: 'success' }); } });
    }
  },
});
