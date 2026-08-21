var skillsService = require('../../data/skills-service.js');

Page({
  data: {
    skillId: '',
    previewDeck: [],
    currentPreview: 0,
    totalPreview: 0,
    imgErrorCount: 0,
    imgLoadCount: 0,
    skillName: '',
    skillGradient: '',
  },

  onLoad: function(options) {
    var skillId = options.id || '';
    var skill = skillsService.getById(skillId);
    if (!skill) {
      wx.showToast({ title: 'skill 不存在', icon: 'none' });
      setTimeout(function() { wx.navigateBack(); }, 1500);
      return;
    }
    var deck = skill.previewDeck || [];
    this.setData({
      skillId: skillId,
      previewDeck: deck,
      totalPreview: deck.length,
      skillName: skill.displayName || skill.nameZh || skill.name || '',
      skillGradient: skill.gradient || 'linear-gradient(135deg,#667eea,#764ba2)',
    });
  },

  onSwiperChange: function(e) {
    this.setData({ currentPreview: e.detail.current || 0 });
  },

  onImgError: function(e) {
    this.setData({ imgErrorCount: this.data.imgErrorCount + 1 });
  },

  onImgLoad: function(e) {
    this.setData({ imgLoadCount: this.data.imgLoadCount + 1 });
  },

  onFullScreen: function() {
    var urls = this.data.previewDeck;
    if (urls && urls.length > 0) {
      wx.previewImage({
        current: urls[this.data.currentPreview] || urls[0],
        urls: urls,
      });
    }
  },

  onClose: function() {
    wx.navigateBack();
  },
});
