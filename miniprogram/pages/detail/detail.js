// pages/detail/detail.js · skill 详情 + 推荐 agent
var skills = {
  'work-report-01': { name: '工作汇报 skill · 全流程生成', scene: '工作汇报', style: '商务', language: '中文', price: 9.9, isFree: false, previewDesc: '给 agent 喂的 PPT skill，让 AI 按专业工作流生成汇报', recommendedAgent: 'Codex', agents: ['Codex', '豆包', 'WorkBuddy'] },
  'work-report-free': { name: '基础工作汇报 skill', scene: '工作汇报', style: '商务', language: '中文', price: 0, isFree: true, previewDesc: '免费导流品：基础 skill', recommendedAgent: '豆包', agents: ['Codex', '豆包'] },
  'defense-01': { name: '科研答辩 skill · 清爽专业风', scene: '答辩', style: '答辩', language: '中文', price: 9.9, isFree: false, previewDesc: '科研答辩 skill，让 agent 生成不撞款答辩 PPT', recommendedAgent: 'Codex', agents: ['Codex', '豆包', 'WorkBuddy'] },
  'defense-free': { name: '基础答辩 skill', scene: '答辩', style: '答辩', language: '中文', price: 0, isFree: true, previewDesc: '免费导流品：基础答辩 skill', recommendedAgent: '豆包', agents: ['Codex', '豆包'] },
  'academic-01': { name: '学术论文 skill · 英文', scene: '学术研究', style: '学术', language: '英文', price: 9.9, isFree: false, previewDesc: '学术 PPT skill', recommendedAgent: 'Codex', agents: ['Codex', '豆包'] },
  'thesis-defense-01': { name: '论文答辩 skill · 可编辑 PPTX', scene: '答辩', style: '答辩', language: '中文', price: 19.9, isFree: false, previewDesc: 'Codex/Claude skill 生成可编辑论文答辩 PPTX', recommendedAgent: 'Codex', agents: ['Codex', 'WorkBuddy'] },
  'corporate-01': { name: '日企商务 skill', scene: '商务展示', style: '日企', language: '英文', price: 9.9, isFree: false, previewDesc: '日企风格 PPT skill', recommendedAgent: 'WorkBuddy', agents: ['Codex', '豆包', 'WorkBuddy'] },
  'corporate-deck-01': { name: '商务汇报 Deck skill', scene: '工作汇报', style: '商务', language: '英文', price: 9.9, isFree: false, previewDesc: '企业商务 deck 生成 skill', recommendedAgent: 'WorkBuddy', agents: ['Codex', '豆包', 'WorkBuddy'] },
};

Page({
  data: {
    skill: null,
    isPurchased: false,
    isLoggedIn: false,
  },

  onLoad: function(options) {
    var skillId = options.id;
    var skill = skills[skillId] || null;
    this.setData({ skill: skill });
    this.checkLogin();
    this.checkPurchased(skillId);
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

  onLoginTap: function() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  onPreviewTap: function() {
    wx.navigateTo({ url: '/pages/preview/preview?id=' + (this.data.skill ? this.data.skill.id : '') });
  },

  onBuyTap: function() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    if (this.data.skill && this.data.skill.isFree) {
      this.unlockSkill();
    } else {
      wx.showToast({ title: '支付功能开发中', icon: 'none' });
    }
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

  onCopyCodex: function() {
    wx.setClipboardData({ data: 'Codex AGENTS.md 片段（完整版请到小程序获取）' });
  },

  onCopyDoubao: function() {
    wx.setClipboardData({ data: '豆包智能体 System Prompt（完整版请到小程序获取）' });
  },

  onCopyWorkBuddy: function() {
    wx.setClipboardData({ data: 'WorkBuddy 技能包内容（完整版请到小程序获取）' });
  },
});
