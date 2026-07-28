// pages/index/index.js · V2 首页（用 data/skills.js + 搜索 + 免费 skill）
var skillsData = require('../../data/skills.js');

Page({
  data: {
    skills: [],
    scenes: ['全部', '工作汇报', '答辩', '学术研究', '商务展示'],
    currentScene: '全部',
    isLoggedIn: false,
    searchValue: '',
  },

  onLoad: function() {
    this.loadSkills();
  },

  onShow: function() {
    this.checkLogin();
  },

  loadSkills: function() {
    var list = skillsData.getSkillsByScene(this.data.currentScene);
    this.setData({ skills: list });
  },

  onSceneTap: function(e) {
    var scene = e.currentTarget.dataset.scene;
    this.setData({ currentScene: scene });
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

  onLoginTap: function() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  onSearchInput: function(e) {
    this.setData({ searchValue: e.detail.value });
  },

  onSearchSubmit: function() {
    var q = this.data.searchValue;
    if (!q) { this.loadSkills(); return; }
    var all = skillsData.skills;
    var filtered = all.filter(function(s) {
      return s.name.indexOf(q) >= 0 || s.previewDesc.indexOf(q) >= 0 || s.scene.indexOf(q) >= 0;
    });
    this.setData({ skills: filtered });
  },
});
