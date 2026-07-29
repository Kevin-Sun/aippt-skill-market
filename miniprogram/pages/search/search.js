// pages/search/search.js · V5: 搜索详情页（一行一个+筛选器+排序+无限滚动）
var skillsData = require('../../data/skills.js');

Page({
  data: {
    skills: [],
    searchQuery: '',
    sceneFilter: '全部',
    styleFilter: '全部',
    langFilter: '全部',
    agentFilter: '全部',
    priceFilter: '全部',
    sortBy: '最热',
    scenes: ['全部', '工作汇报', '答辩', '学术研究', '商务展示'],
    styles: ['全部', '商务简约', '学术清爽', '创意活泼', '科技极简'],
    langs: ['全部', '中文', '英文'],
    agents: ['全部', 'Codex', '豆包', 'WorkBuddy'],
    prices: ['全部', '免费', '付费'],
    sortOptions: ['最新', '最热', '评分', '价格'],
    page: 0,
    pageSize: 20,
    loading: false,
    hasMore: true,
    total: 0,
    showFilterPanel: false,
    showEmpty: false,
    recommendedSkills: [],
    showMemberCard: false,
  },

  onLoad: function(opts) {
    var query = opts && opts.q ? decodeURIComponent(opts.q) : '';
    var scene = opts && opts.scene ? decodeURIComponent(opts.scene) : '全部';
    this.setData({ searchQuery: query, sceneFilter: scene });
    this.loadSkills(true);
  },

  // P0-1: 防重复请求
  loadSkills: function(reset) {
    if (this.data.loading) return;
    if (!this.data.hasMore && !reset) return;
    
    var self = this;
    var page = reset ? 0 : this.data.page + 1;
    
    self.setData({ loading: true });
    
    // 先用本地数据
    var allSkills = skillsData.skills;
    
    // 筛选
    var filtered = allSkills.filter(function(s) {
      var match = true;
      if (self.data.sceneFilter !== '全部' && s.scene !== self.data.sceneFilter) match = false;
      if (self.data.styleFilter !== '全部' && s.style !== self.data.styleFilter) match = false;
      if (self.data.langFilter !== '全部' && s.language !== self.data.langFilter) match = false;
      if (self.data.agentFilter !== '全部' && s.recommendedAgent !== self.data.agentFilter) match = false;
      // P0-5: 仅看免费/付费
      if (self.data.priceFilter === '免费' && !s.isFree) match = false;
      if (self.data.priceFilter === '付费' && s.isFree) match = false;
      // 搜索
      if (self.data.searchQuery) {
        var q = self.data.searchQuery.toLowerCase();
        var textMatch = (s.name && s.name.toLowerCase().indexOf(q) >= 0) ||
                        (s.previewDesc && s.previewDesc.toLowerCase().indexOf(q) >= 0) ||
                        (s.scene && s.scene.indexOf(self.data.searchQuery) >= 0) ||
                        (s.style && s.style.indexOf(self.data.searchQuery) >= 0);
        if (!textMatch) match = false;
      }
      return match;
    });
    
    // 排序
    if (self.data.sortBy === '最新') {
      filtered.sort(function(a, b) { return b.id.localeCompare(a.id); });
    } else if (self.data.sortBy === '最热') {
      filtered.sort(function(a, b) { return (b.salesCount || 0) - (a.salesCount || 0); });
    } else if (self.data.sortBy === '评分') {
      filtered.sort(function(a, b) { return (b.rating || 0) - (a.rating || 0); });
    } else if (self.data.sortBy === '价格') {
      filtered.sort(function(a, b) { return (a.price || 0) - (b.price || 0); });
    }
    
    var total = filtered.length;
    var start = page * self.data.pageSize;
    var end = start + self.data.pageSize;
    var pageData = filtered.slice(start, end);
    
    var newList = reset ? pageData : self.data.skills.concat(pageData);
    
    // P0-3: 空状态推荐
    var showEmpty = newList.length === 0;
    var recommended = [];
    if (showEmpty) {
      // 推荐相似 skill（取场景最近的）
      var recScene = self.data.sceneFilter !== '全部' ? self.data.sceneFilter : '工作汇报';
      recommended = skillsData.getSkillsByScene(recScene).slice(0, 4);
    }
    
    // P0-8: 会员引导卡片（加载超过 2 页时显示）
    var showMemberCard = page >= 2;
    
    self.setData({
      skills: newList,
      page: page,
      total: total,
      loading: false,
      hasMore: end < total,
      showEmpty: showEmpty,
      recommendedSkills: recommended,
      showMemberCard: showMemberCard,
    });
  },

  // 下拉加载更多
  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadSkills(false);
    }
  },

  // 筛选器
  onSceneTap: function(e) {
    this.setData({ sceneFilter: e.currentTarget.dataset.val });
    this.loadSkills(true);
  },
  onStyleTap: function(e) {
    this.setData({ styleFilter: e.currentTarget.dataset.val });
    this.loadSkills(true);
  },
  onLangTap: function(e) {
    this.setData({ langFilter: e.currentTarget.dataset.val });
    this.loadSkills(true);
  },
  onAgentTap: function(e) {
    this.setData({ agentFilter: e.currentTarget.dataset.val });
    this.loadSkills(true);
  },
  onPriceTap: function(e) {
    this.setData({ priceFilter: e.currentTarget.dataset.val });
    this.loadSkills(true);
  },
  onSortTap: function(e) {
    this.setData({ sortBy: e.currentTarget.dataset.val });
    this.loadSkills(true);
  },

  // P0-2: 筛选器重置
  onResetFilter: function() {
    this.setData({
      sceneFilter: '全部',
      styleFilter: '全部',
      langFilter: '全部',
      agentFilter: '全部',
      priceFilter: '全部',
      sortBy: '最热',
      searchQuery: '',
    });
    this.loadSkills(true);
  },

  // 展开/收起筛选面板
  onToggleFilter: function() {
    this.setData({ showFilterPanel: !this.data.showFilterPanel });
  },

  // 搜索
  onSearchInput: function(e) {
    this.setData({ searchQuery: e.detail.value });
  },
  onSearchSubmit: function() {
    this.loadSkills(true);
  },

  // 点击 skill
  onSkillTap: function(e) {
    var skillId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + skillId });
  },

  // 点击推荐 skill
  onRecommendedTap: function(e) {
    var skillId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + skillId });
  },

  // 会员引导
  onMemberTap: function() {
    wx.navigateTo({ url: '/pages/member/member' });
  },
});
