// pages/detail/detail.js · V2 详情页（预览图+包含内容+适用场景+使用步骤+评价+相关推荐+分享+收藏）
var skillsData = require('../../data/skills.js');

Page({
  data: {
    skill: null,
    isPurchased: false,
    isLoggedIn: false,
    isFavorited: false,
    relatedSkills: [],
    currentPreview: 0,
  },

  onLoad: function(options) {
    var skillId = options.id;
    var skill = skillsData.getSkillById(skillId);
    var related = skillsData.getRelatedSkills(skillId);
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
    wx.showToast({ title: '支付功能联调中', icon: 'none' });
    var self = this;
    setTimeout(function() {
      self.unlockSkill();
    }, 1500);
  },

  unlockSkill: function() {
    try {
      var purchased = wx.getStorageSync('purchasedSkills') || [];
      if (this.data.skill) purchased.push(this.data.skill.id);
      wx.setStorageSync('purchasedSkills', purchased);
      this.setData({ isPurchased: true });
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
    wx.navigateTo({ url: '/pages/detail/detail?id=' + skillId });
  },

  onReviewTap: function() {
    var skillId = this.data.skill.id;
    wx.navigateTo({ url: '/pages/reviews/reviews?id=' + skillId });
  },
});
