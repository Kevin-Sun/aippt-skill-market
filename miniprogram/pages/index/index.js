// pages/index/index.js · V3.2 标签重做+搜索hints浮动
var skillsData = require('../../data/skills.js');

var HINTS_BY_SCENE = {
  '全部': '搜索工作汇报、答辩、咨询报告...',
  '工作汇报': '试试：年终总结、季度汇报、述职报告',
  '答辩': '试试：毕业答辩、开题报告、论文展示',
  '学术研究': '试试：学术会议、论文展示、研究汇报',
  '商务展示': '试试：商业计划书、营销提案、产品发布',
  '个人求职': '试试：求职简历、面试展示、自我介绍',
  '教育培训': '试试：课件制作、培训资料、课程展示',
};

Page({
  data: {
    skills: [],
    scenes: ['全部', '工作汇报', '答辩', '学术研究', '商务展示', '个人求职', '教育培训'],
    currentScene: '全部',
    isLoggedIn: false,
    searchValue: '',
    searchHint: '搜索工作汇报、答辩、咨询报告...',
  },

  onLoad: function() { this.loadSkills(); },
  onShow: function() { this.checkLogin(); },

  loadSkills: function() {
    var list = skillsData.getSkillsByScene(this.data.currentScene);
    this.setData({ skills: list });
  },

  onSceneTap: function(e) {
    var scene = e.currentTarget.dataset.scene;
    var hint = HINTS_BY_SCENE[scene] || '搜索 skill...';
    this.setData({ currentScene: scene, searchHint: hint });
    this.loadSkills();
  },

  onSkillTap: function(e) {
    var skillId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + skillId });
  },

  checkLogin: function() {
    try {
      var userInfo = wx.getStorageSync('userInfo');
      this.setData({ isLoggedIn: !!userInfo });
    } catch (e) {}
  },

  onLoginTap: function() { wx.navigateTo({ url: '/pages/login/login' }); },
  onSearchInput: function(e) { this.setData({ searchValue: e.detail.value }); },
  onSearchSubmit: function() {
    var q = this.data.searchValue;
    if (!q) { this.loadSkills(); return; }
    var all = skillsData.skills;
    var filtered = all.filter(function(s) {
      return s.name.indexOf(q) >= 0 || s.previewDesc.indexOf(q) >= 0 || s.scene.indexOf(q) >= 0 || s.style.indexOf(q) >= 0;
    });
    this.setData({ skills: filtered });
  },

  onSaleTap: function() {
    wx.navigateTo({ url: '/pages/promotion-detail/promotion-detail?id=sale' });
  },

  onFreeTap: function() {
    var free = skillsData.getFreeSkills();
    if (free.length > 0) {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + free[0].id });
    } else {
      wx.showToast({ title: '暂无免费 skill', icon: 'none' });
    }
  },
});
