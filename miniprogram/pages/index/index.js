// pages/index/index.js · 清新 UI + skill 定位 + 推荐 agent
var skills = [
  { id: 'work-report-01', name: '工作汇报 skill · 全流程生成', scene: '工作汇报', style: '商务', language: '中文', price: 9.9, isFree: false, previewDesc: '给 agent 喂的 PPT skill，让 AI 按专业工作流生成汇报', recommendedAgent: 'Codex', gradient: '#2563eb' },
  { id: 'work-report-free', name: '基础工作汇报 skill', scene: '工作汇报', style: '商务', language: '中文', price: 0, isFree: true, previewDesc: '免费导流品：基础 skill，让 agent 生成汇报 PPT', recommendedAgent: '豆包', gradient: '#16a34a' },
  { id: 'defense-01', name: '科研答辩 skill · 清爽专业风', scene: '答辩', style: '答辩', language: '中文', price: 9.9, isFree: false, previewDesc: '科研答辩 skill，让 agent 生成不撞款答辩 PPT', recommendedAgent: 'Codex', gradient: '#7c3aed' },
  { id: 'defense-free', name: '基础答辩 skill', scene: '答辩', style: '答辩', language: '中文', price: 0, isFree: true, previewDesc: '免费导流品：基础答辩 skill', recommendedAgent: '豆包', gradient: '#0891b2' },
  { id: 'academic-01', name: '学术论文 skill · 英文', scene: '学术研究', style: '学术', language: '英文', price: 9.9, isFree: false, previewDesc: '学术 PPT skill，含 slide patterns + content guidelines', recommendedAgent: 'Codex', gradient: '#ea580c' },
  { id: 'thesis-defense-01', name: '论文答辩 skill · 可编辑 PPTX', scene: '答辩', style: '答辩', language: '中文', price: 19.9, isFree: false, previewDesc: 'Codex/Claude skill 生成可编辑论文答辩 PPTX', recommendedAgent: 'Codex', gradient: '#be185d' },
  { id: 'corporate-01', name: '日企商务 skill', scene: '商务展示', style: '日企', language: '英文', price: 9.9, isFree: false, previewDesc: '日企风格 PPT skill，商务正式', recommendedAgent: 'WorkBuddy', gradient: '#475569' },
  { id: 'corporate-deck-01', name: '商务汇报 Deck skill', scene: '工作汇报', style: '商务', language: '英文', price: 9.9, isFree: false, previewDesc: '企业商务 deck 生成 skill', recommendedAgent: 'WorkBuddy', gradient: '#1e40af' },
];

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
    var scene = this.data.currentScene;
    var list = scene === '全部' ? skills : skills.filter(function(s) { return s.scene === scene; });
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
    if (this.data.searchValue) {
      var scene = this.data.searchValue;
      this.setData({ currentScene: scene, searchValue: '' });
      this.loadSkills();
    }
  },
});
