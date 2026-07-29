// pages/index/index.js · V5: 无限下拉+查看更多+防重复请求
var skillsData = require('../../data/skills.js');

var HINTS_BY_SCENE = {
  '全部': '搜索工作汇报、答辩、咨询报告...',
  '工作汇报': '试试：年终总结、季度汇报、述职报告',
  '答辩': '试试：毕业答辩、开题报告、论文展示',
  '学术研究': '试试：学术会议、论文展示、研究汇报',
  '商务展示': '试试：商业计划书、营销提案、产品发布',
};

var MAX_LOAD = 18; // 3-4 屏后显示"查看更多"

Page({
  data: {
    skills: [],
    scenes: ['全部', '工作汇报', '答辩', '学术研究', '商务展示'],
    currentScene: '全部',
    isLoggedIn: false,
    searchValue: '',
    searchHint: '搜索工作汇报、答辩、咨询报告...',
    page: 0,
    pageSize: 6,
    loading: false,
    hasMore: true,
    showViewMore: false,
    searchResultsCount: 0,
    showSearchResults: false,
  },

  onLoad: function() {
    this.loadSkills(true);
  },

  onShow: function() {
    this.checkLogin();
  },

  // P0-1: 防重复请求
  loadSkills: function(reset) {
    if (this.data.loading) return;
    if (!this.data.hasMore && !reset) return;
    
    var self = this;
    var page = reset ? 0 : this.data.page + 1;
    
    self.setData({ loading: true });
    
    // 先用本地数据
    var allSkills = skillsData.getSkillsByScene(self.data.currentScene);
    
    var pageSize = 6;
    var start = reset ? 0 : self.data.skills.length; // P0-2: 用累计偏移避免重复
    var end = Math.min(start + pageSize, allSkills.length);
    
    var pageData = allSkills.slice(start, end);
    var newList = reset ? pageData : self.data.skills.concat(pageData);
    
    var hasMore = end < allSkills.length;
    // P0: 加载到 MAX_LOAD 后显示"查看更多"
    var showViewMore = newList.length >= MAX_LOAD || !hasMore;
    
    self.setData({
      skills: newList,
      page: page,
      loading: false,
      hasMore: hasMore && newList.length < MAX_LOAD,
      showViewMore: showViewMore,
    });
  },

  // 下拉加载更多
  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadSkills(false);
    }
  },

  // 点击"查看更多"→搜索详情页
  onViewMoreTap: function() {
    wx.navigateTo({
      url: '/pages/search/search?scene=' + encodeURIComponent(this.data.currentScene)
    });
  },

  // 点击"查看全部搜索结果"→搜索详情页
  onViewAllSearchTap: function() {
    wx.navigateTo({
      url: '/pages/search/search?q=' + encodeURIComponent(this.data.searchValue)
    });
  },

  onSceneTap: function(e) {
    var scene = e.currentTarget.dataset.scene;
    var hint = HINTS_BY_SCENE[scene] || '搜索 skill...';
    this.setData({ currentScene: scene, searchHint: hint, searchValue: '', showSearchResults: false, searchResultsCount: 0 });
    this.loadSkills(true);
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

  // 搜索：原地显示前 4-6 个 + "查看全部 N 个结果"
  onSearchSubmit: function() {
    var q = this.data.searchValue;
    if (!q) {
      this.setData({ showSearchResults: false });
      this.loadSkills(true);
      return;
    }
    
    var all = skillsData.getSkillsByScene(self.data.currentScene);
    var filtered = all.filter(function(s) {
      return (s.name && s.name.indexOf(q) >= 0) ||
             (s.previewDesc && s.previewDesc.indexOf(q) >= 0) ||
             (s.scene && s.scene.indexOf(q) >= 0) ||
             (s.style && s.style.indexOf(q) >= 0);
    });
    
    this.setData({
      skills: filtered.slice(0, 6),
      showSearchResults: true,
      searchResultsCount: filtered.length,
      hasMore: false,
      showViewMore: false,
    });
  },

  onSaleTap: function() {
    wx.navigateTo({ url: '/pages/promotion-detail/promotion-detail?id=sale' });
  },

  onFreeTap: function() {
    var scene = this.data.currentScene;
    var free = skillsData.getFreeSkills();
    if (scene !== '全部') {
      free = free.filter(function(s) { return s.scene === scene; });
    }
    if (free.length > 0) {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + free[0].id });
    } else {
      wx.showToast({ title: '当前场景暂无免费 skill', icon: 'none' });
    }
  },
});
