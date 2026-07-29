// pages/index/index.js · V5: 从云端读 skills
var skillsData = require('../../data/skills.js');

var HINTS_BY_SCENE = {
  '全部': '搜索工作汇报、答辩、咨询报告...',
  '工作汇报': '试试：年终总结、季度汇报、述职报告',
  '答辩': '试试：毕业答辩、开题报告、论文展示',
  '学术研究': '试试：学术会议、论文展示、研究汇报',
  '商务展示': '试试：商业计划书、营销提案、产品发布',
};

Page({
  data: {
    skills: [],
    scenes: ['全部', '工作汇报', '答辩', '学术研究', '商务展示'],
    currentScene: '全部',
    isLoggedIn: false,
    searchValue: '',
    searchHint: '搜索工作汇报、答辩、咨询报告...',
    loadingFromCloud: false,
    cloudTotal: 0,
  },

  onLoad: function() {
    this.loadSkillsFromCloud();
  },

  onShow: function() {
    this.checkLogin();
  },

  // 从云端加载 skills
  loadSkillsFromCloud: function() {
    var self = this;
    self.setData({ loadingFromCloud: true });
    
    // 先用本地数据兜底
    var localSkills = skillsData.getSkillsByScene(self.data.currentScene);
    self.setData({ skills: localSkills });
    
    // 尝试从云端读
    if (wx.cloud) {
      wx.cloud.callFunction({
        name: 'skills',
        data: {
          action: 'list',
          scene: self.data.currentScene,
          page: 0,
          pageSize: 20,
        },
        success: function(res) {
          if (res.result && res.result.success && res.result.data && res.result.data.length > 0) {
            self.setData({
              skills: res.result.data,
              cloudTotal: res.result.total,
              loadingFromCloud: false,
            });
          } else {
            // 云端无数据，用本地
            self.setData({ loadingFromCloud: false });
          }
        },
        fail: function() {
          // 云函数失败，用本地
          self.setData({ loadingFromCloud: false });
        }
      });
    } else {
      self.setData({ loadingFromCloud: false });
    }
  },

  onSceneTap: function(e) {
    var scene = e.currentTarget.dataset.scene;
    var hint = HINTS_BY_SCENE[scene] || '搜索 skill...';
    this.setData({ currentScene: scene, searchHint: hint });
    this.loadSkillsFromCloud();
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
    if (!q) { this.loadSkillsFromCloud(); return; }
    
    // 先本地搜索
    var localResults = skillsData.skills.filter(function(s) {
      return (s.name && s.name.indexOf(q) >= 0) || 
             (s.previewDesc && s.previewDesc.indexOf(q) >= 0) ||
             (s.scene && s.scene.indexOf(q) >= 0) ||
             (s.style && s.style.indexOf(q) >= 0);
    });
    this.setData({ skills: localResults });
    
    // 尝试云端搜索
    if (wx.cloud) {
      var self = this;
      wx.cloud.callFunction({
        name: 'skills',
        data: {
          action: 'list',
          search: q,
          page: 0,
          pageSize: 20,
        },
        success: function(res) {
          if (res.result && res.result.success && res.result.data && res.result.data.length > 0) {
            self.setData({ skills: res.result.data, cloudTotal: res.result.total });
          }
        },
        fail: function() {}
      });
    }
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
