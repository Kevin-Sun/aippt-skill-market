// pages/search/search.js · V6: 从 skills-service.js 读 + taxonomy 动态标签
var skillsService = require('../../data/skills-service.js');
var taxonomy = require('../../data/taxonomy.js');

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
    scenes: taxonomy.scenes,
    styles: taxonomy.styles,
    langs: taxonomy.languages,
    agents: taxonomy.agents,
    prices: taxonomy.prices,
    sortOptions: taxonomy.sortOptions,
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
    var query = '';
    var scene = '全部';
    try {
      if (opts && opts.q) query = decodeURIComponent(opts.q);
      if (opts && opts.scene) scene = decodeURIComponent(opts.scene);
    } catch(e) {}
    this.setData({ searchQuery: query, sceneFilter: scene });
    this.loadSkills(true);
  },

  loadSkills: function(reset) {
    if (this.data.loading) return;
    if (!this.data.hasMore && !reset) return;
    var self = this;
    var page = reset ? 0 : this.data.page + 1;
    self.setData({ loading: true });
    
    var allSkills = skillsService.skills;
    var filtered = allSkills.filter(function(s) {
      var match = true;
      if (self.data.sceneFilter !== '全部' && s.scene !== self.data.sceneFilter) match = false;
      if (self.data.styleFilter !== '全部' && s.style !== self.data.styleFilter) match = false;
      if (self.data.langFilter !== '全部' && s.language !== self.data.langFilter) match = false;
      if (self.data.agentFilter !== '全部' && s.recommendedAgent !== self.data.agentFilter) match = false;
      if (self.data.priceFilter === '免费' && !s.isFree) match = false;
      if (self.data.priceFilter === '付费' && s.isFree) match = false;
      if (self.data.searchQuery) {
        var q = self.data.searchQuery.toLowerCase();
        var textMatch = (s.name && s.name.toLowerCase().indexOf(q) >= 0) ||
                        (s.previewDesc && s.previewDesc.toLowerCase().indexOf(q) >= 0) ||
                        (s.recommendedAgent && s.recommendedAgent.toLowerCase().indexOf(q) >= 0);
        if (!textMatch) match = false;
      }
      return match;
    });
    
    // 排序
    if (self.data.sortBy === '最热') {
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
    
    var showEmpty = newList.length === 0;
    var recommended = [];
    if (showEmpty) {
      var recScene = self.data.sceneFilter !== '全部' ? self.data.sceneFilter : '工作汇报';
      recommended = skillsService.getByScene(recScene).slice(0, 4);
    }
    
    self.setData({
      skills: newList,
      page: page,
      total: total,
      loading: false,
      hasMore: end < total,
      showEmpty: showEmpty,
      recommendedSkills: recommended,
      showMemberCard: page >= 1,
    });
  },

  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) this.loadSkills(false);
  },

  onSceneTap: function(e) { this.setData({ sceneFilter: e.currentTarget.dataset.val }); this.loadSkills(true); },
  onStyleTap: function(e) { this.setData({ styleFilter: e.currentTarget.dataset.val }); this.loadSkills(true); },
  onLangTap: function(e) { this.setData({ langFilter: e.currentTarget.dataset.val }); this.loadSkills(true); },
  onAgentTap: function(e) { this.setData({ agentFilter: e.currentTarget.dataset.val }); this.loadSkills(true); },
  onPriceTap: function(e) { this.setData({ priceFilter: e.currentTarget.dataset.val }); this.loadSkills(true); },
  onSortTap: function(e) { this.setData({ sortBy: e.currentTarget.dataset.val }); this.loadSkills(true); },

  onResetFilter: function() {
    this.setData({
      sceneFilter: '全部', styleFilter: '全部', langFilter: '全部',
      agentFilter: '全部', priceFilter: '全部', sortBy: '最热', searchQuery: '',
    });
    this.loadSkills(true);
  },

  onToggleFilter: function() { this.setData({ showFilterPanel: !this.data.showFilterPanel }); },
  onSearchInput: function(e) { this.setData({ searchQuery: e.detail.value }); },
  onSearchSubmit: function() { this.loadSkills(true); },
  onSkillTap: function(e) { wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id }); },
  onRecommendedTap: function(e) { wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id }); },
  onMemberTap: function() { wx.navigateTo({ url: '/pages/member/member' }); },
});
