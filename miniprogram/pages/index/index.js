// pages/index/index.js · V6: 从 skills-service.js 读 308 条真实数据
var skillsService = require('../../data/skills-service.js');
var taxonomy = require('../../data/taxonomy.js');

var HINTS_BY_SCENE = {};
taxonomy.scenes.forEach(function(s) {
  if (s === '全部') HINTS_BY_SCENE[s] = '搜索工作汇报、答辩、咨询报告...';
  else HINTS_BY_SCENE[s] = '试试：' + s + '相关 skill';
});

var MAX_LOAD = 18;

Page({
  data: {
    skills: [],
    scenes: taxonomy.scenes,
    currentScene: '全部',
    isLoggedIn: false,
    searchValue: '',
    searchHint: '搜索工作汇报、答辩、咨询报告...',
    loading: false,
    hasMore: true,
    showViewMore: false,
    showSearchResults: false,
    searchResultsCount: 0,
    cloudTotal: 0,
  },

  onLoad: function() { this.loadSkills(true); },
  onShow: function() { this.checkLogin(); },

  loadSkills: function(reset) {
    if (this.data.loading) return;
    var self = this;
    self.setData({ loading: true });
    
    var allSkills = skillsService.getByScene(self.data.currentScene);
    // P0-1: 读 purchasedSkills，标记已购买
    var purchased = [];
    try { purchased = wx.getStorageSync("purchasedSkills") || []; } catch(e) {}
    allSkills.forEach(function(s) { s.isPurchased = purchased.indexOf(s.id) >= 0; });
    var pageSize = 6;
    var start = reset ? 0 : self.data.skills.length;
    var end = Math.min(start + pageSize, allSkills.length);
    var pageData = allSkills.slice(start, end);
    var newList = reset ? pageData : self.data.skills.concat(pageData);
    var hasMore = end < allSkills.length && newList.length < MAX_LOAD;
    var showViewMore = newList.length >= MAX_LOAD || !hasMore;
    
    self.setData({
      skills: newList,
      loading: false,
      hasMore: hasMore,
      showViewMore: showViewMore,
      cloudTotal: allSkills.length,
    });
  },

  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) this.loadSkills(false);
  },

  onViewMoreTap: function() {
    wx.navigateTo({ url: '/pages/search/search?scene=' + encodeURIComponent(this.data.currentScene) });
  },
  onViewAllSearchTap: function() {
    wx.navigateTo({ url: '/pages/search/search?q=' + encodeURIComponent(this.data.searchValue) });
  },

  onSceneTap: function(e) {
    var scene = e.currentTarget.dataset.scene;
    this.setData({
      currentScene: scene,
      searchHint: HINTS_BY_SCENE[scene] || '搜索 skill...',
      searchValue: '',
      showSearchResults: false,
      searchResultsCount: 0,
    });
    this.loadSkills(true);
  },

  onSkillTap: function(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  checkLogin: function() {
    try { this.setData({ isLoggedIn: !!wx.getStorageSync('userInfo') }); } catch(e) {}
  },

  onLoginTap: function() { wx.navigateTo({ url: '/pages/login/login' }); },
  onSearchInput: function(e) { this.setData({ searchValue: e.detail.value }); },

  onSearchSubmit: function() {
    var q = this.data.searchValue;
    if (!q) { this.setData({ showSearchResults: false }); this.loadSkills(true); return; }
    var all = skillsService.getByScene(this.data.currentScene);
    var filtered = all.filter(function(s) {
      return (s.name && s.name.toLowerCase().indexOf(q.toLowerCase()) >= 0) ||
             (s.previewDesc && s.previewDesc.toLowerCase().indexOf(q.toLowerCase()) >= 0) ||
             (s.scene && s.scene.indexOf(q) >= 0) ||
             (s.style && s.style.indexOf(q) >= 0) ||
             (s.recommendedAgent && s.recommendedAgent.toLowerCase().indexOf(q.toLowerCase()) >= 0);
    });
    this.setData({
      skills: filtered.slice(0, 6),
      showSearchResults: true,
      searchResultsCount: filtered.length,
      hasMore: false,
      showViewMore: false,
    });
  },

  onSaleTap: function() { wx.navigateTo({ url: '/pages/promotion-detail/promotion-detail?id=sale' }); },
  onFreeTap: function() {
    var scene = this.data.currentScene;
    var free = skillsService.getFree();
    if (scene !== '全部') free = free.filter(function(s) { return s.scene === scene; });
    if (free.length > 0) wx.navigateTo({ url: '/pages/detail/detail?id=' + free[0].id });
    else wx.showToast({ title: '暂无免费 skill', icon: 'none' });
  },
});
