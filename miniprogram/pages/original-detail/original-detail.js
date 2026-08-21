var skillsService = require('../../data/skills-service.js');

Page({
  data: {
    skillId: '',
    skillName: '',
    platform: '',
    coverImage: '',
    title: '',
    author: '',
    desc: '',
    originalUrl: '',
    stars: 0,
    forks: 0,
    language: '',
    hasCover: false,
    noDetail: false,
    loading: true,
  },

  onLoad: function(options) {
    var skillId = options.id || '';
    var skill = skillsService.getById(skillId);
    if (!skill) {
      this.setData({ noDetail: true, loading: false });
      return;
    }

    var platform = '未知';
    var originalUrl = skill.sourceUrl || skill.repoUrl || '';
    if (originalUrl.indexOf('behance.net') >= 0) platform = 'Behance';
    else if (originalUrl.indexOf('github.com') >= 0) platform = 'GitHub';
    else if (skill.source === 'Behance') platform = 'Behance';

    this.setData({
      skillId: skillId,
      skillName: skill.displayName || skill.nameZh || skill.name || '',
      platform: platform,
      originalUrl: originalUrl,
      title: skill.displayName || skill.nameZh || skill.name || '',
      desc: skill.displayDesc || skill.descZh || skill.previewDesc || '',
      loading: true,
    });

    // 从云函数加载原作详情
    var self = this;
    wx.cloud.callFunction({
      name: 'skills',
      data: { action: 'getOriginalDetail', data: { skillId: skillId } },
      success: function(res) {
        if (res && res.result && res.result.detail) {
          var d = res.result.detail;
          self.setData({
            coverImage: d.c || d.coverImage || '',
            title: d.t || d.title || self.data.title,
            author: d.a || d.author || '',
            desc: d.d || d.desc || self.data.desc,
            stars: d.s || d.stars || 0,
            forks: d.f || d.forks || 0,
            language: d.l || d.language || '',
            hasCover: !!((d.c || d.coverImage || '').length > 10),
            loading: false,
          });
        } else {
          self.setData({ loading: false });
        }
      },
      fail: function() {
        self.setData({ loading: false });
      },
    });
  },

  onCopyLink: function() {
    var url = this.data.originalUrl;
    if (url) {
      wx.setClipboardData({
        data: url,
        success: function() {
          wx.showToast({ title: '链接已复制', icon: 'success' });
        },
      });
    }
  },

  onPreviewCover: function() {
    if (this.data.coverImage) {
      wx.previewImage({ urls: [this.data.coverImage] });
    }
  },

  onBack: function() {
    wx.navigateBack();
  },
});
