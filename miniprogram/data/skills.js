// data/skills.js · V2 扩展数据（预览图+包含内容+适用场景+使用步骤+评价+相关推荐）
var skills = [
  {
    id: 'work-report-01', name: '工作汇报 skill · 全流程生成', scene: '工作汇报', style: '商务', language: '中文', price: 9.9, isFree: false,
    previewDesc: '给 agent 喂的 PPT skill，让 AI 按专业工作流生成汇报',
    recommendedAgent: 'Codex', gradient: '#2563eb',
    previewImages: ['/images/promotion-member.png', '/images/promotion-invite.png'],
    includes: { layouts: 10, styles: 8, charts: 13 },
    suitableFor: ['季度汇报', '年度总结', '述职报告', '项目汇报'],
    usageSteps: [
      { step: 1, title: '选择 agent', desc: 'Codex（推荐）/豆包/WorkBuddy' },
      { step: 2, title: '复制 skill', desc: '点击复制按钮，粘贴到 agent' },
      { step: 3, title: '生成 PPT', desc: '输入"帮我做季度汇报PPT"' }
    ],
    reviews: [
      { user: '产品经理小王', rating: 5, text: '生成的汇报PPT领导说很专业，不撞款', date: '2026-07-20' },
      { user: '运营小李', rating: 4, text: 'Bento Grid布局很好看，数据图表也清晰', date: '2026-07-22' }
    ],
    rating: 4.8, salesCount: 128, relatedSkills: ['work-report-free', 'corporate-deck-01']
  },
  {
    id: 'work-report-free', name: '基础工作汇报 skill', scene: '工作汇报', style: '商务', language: '中文', price: 0, isFree: true,
    previewDesc: '免费导流品：基础 skill，让 agent 生成汇报 PPT',
    recommendedAgent: '豆包', gradient: '#16a34a',
    previewImages: ['/images/promotion-free.png'],
    includes: { layouts: 3, styles: 2, charts: 5 },
    suitableFor: ['周报', '月报', '简报'],
    usageSteps: [
      { step: 1, title: '选择 agent', desc: '豆包（推荐）/Codex' },
      { step: 2, title: '复制 skill', desc: '点击复制按钮' },
      { step: 3, title: '生成 PPT', desc: '输入主题即可' }
    ],
    reviews: [
      { user: '实习生小张', rating: 4, text: '免费的够用了，比自己做好', date: '2026-07-25' }
    ],
    rating: 4.5, salesCount: 89, relatedSkills: ['work-report-01']
  },
  {
    id: 'defense-01', name: '科研答辩 skill · 清爽专业风', scene: '答辩', style: '答辩', language: '中文', price: 9.9, isFree: false,
    previewDesc: '科研答辩 skill，让 agent 生成不撞款答辩 PPT',
    recommendedAgent: 'Codex', gradient: '#7c3aed',
    previewImages: ['/images/promotion-community.png'],
    includes: { layouts: 8, styles: 5, charts: 10 },
    suitableFor: ['毕业答辩', '开题报告', '中期检查', '论文答辩'],
    usageSteps: [
      { step: 1, title: '选择 agent', desc: 'Codex（推荐）/豆包/WorkBuddy' },
      { step: 2, title: '复制 skill', desc: '点击复制' },
      { step: 3, title: '生成 PPT', desc: '输入论文主题' }
    ],
    reviews: [
      { user: '博士生小陈', rating: 5, text: '答辩一次过，导师说排版很专业', date: '2026-07-18' },
      { user: '硕士生小刘', rating: 5, text: '清爽风格很好，不像别人花里胡哨', date: '2026-07-21' }
    ],
    rating: 5.0, salesCount: 76, relatedSkills: ['defense-free', 'thesis-defense-01']
  },
  {
    id: 'defense-free', name: '基础答辩 skill', scene: '答辩', style: '答辩', language: '中文', price: 0, isFree: true,
    previewDesc: '免费导流品：基础答辩 skill',
    recommendedAgent: '豆包', gradient: '#0891b2',
    previewImages: ['/images/promotion-free.png'],
    includes: { layouts: 3, styles: 2, charts: 4 },
    suitableFor: ['课程答辩', '简单汇报'],
    usageSteps: [
      { step: 1, title: '选择 agent', desc: '豆包（推荐）' },
      { step: 2, title: '复制 skill', desc: '点击复制' },
      { step: 3, title: '生成 PPT', desc: '输入主题' }
    ],
    reviews: [],
    rating: 4.3, salesCount: 52, relatedSkills: ['defense-01']
  },
  {
    id: 'academic-01', name: '学术论文 skill · 英文', scene: '学术研究', style: '学术', language: '英文', price: 9.9, isFree: false,
    previewDesc: '学术 PPT skill，含 slide patterns + content guidelines',
    recommendedAgent: 'Codex', gradient: '#ea580c',
    previewImages: ['/images/promotion-sale.png'],
    includes: { layouts: 6, styles: 4, charts: 8 },
    suitableFor: ['学术报告', '会议演讲', '论文展示'],
    usageSteps: [
      { step: 1, title: '选择 agent', desc: 'Codex（推荐）' },
      { step: 2, title: '复制 skill', desc: '粘贴到 AGENTS.md' },
      { step: 3, title: '生成 PPT', desc: '输入论文摘要' }
    ],
    reviews: [
      { user: 'PhD Student', rating: 4, text: 'Good for conference presentations', date: '2026-07-19' }
    ],
    rating: 4.5, salesCount: 34, relatedSkills: ['defense-01']
  },
  {
    id: 'thesis-defense-01', name: '论文答辩 skill · 可编辑 PPTX', scene: '答辩', style: '答辩', language: '中文', price: 19.9, isFree: false,
    previewDesc: 'Codex/Claude skill 生成可编辑论文答辩 PPTX',
    recommendedAgent: 'Codex', gradient: '#be185d',
    previewImages: ['/images/promotion-invite.png'],
    includes: { layouts: 12, styles: 6, charts: 15 },
    suitableFor: ['论文答辩', '学位答辩', '毕业答辩'],
    usageSteps: [
      { step: 1, title: '选择 agent', desc: 'Codex（推荐）/WorkBuddy' },
      { step: 2, title: '复制 skill', desc: '粘贴到 AGENTS.md' },
      { step: 3, title: '生成 PPTX', desc: '可编辑的 .pptx 文件' }
    ],
    reviews: [
      { user: '博士生小赵', rating: 5, text: '生成的PPTX可以直接编辑，太方便了', date: '2026-07-23' }
    ],
    rating: 4.9, salesCount: 45, relatedSkills: ['defense-01']
  },
  {
    id: 'corporate-01', name: '日企商务 skill', scene: '商务展示', style: '日企', language: '英文', price: 9.9, isFree: false,
    previewDesc: '日企风格 PPT skill，商务正式',
    recommendedAgent: 'WorkBuddy', gradient: '#475569',
    previewImages: ['/images/promotion-member.png'],
    includes: { layouts: 5, styles: 3, charts: 6 },
    suitableFor: ['商务提案', '企业展示', '正式汇报'],
    usageSteps: [
      { step: 1, title: '选择 agent', desc: 'WorkBuddy（推荐）' },
      { step: 2, title: '复制 skill', desc: '粘贴到企业后台' },
      { step: 3, title: '生成 PPT', desc: '输入商务主题' }
    ],
    reviews: [],
    rating: 4.2, salesCount: 23, relatedSkills: ['corporate-deck-01']
  },
  {
    id: 'corporate-deck-01', name: '商务汇报 Deck skill', scene: '工作汇报', style: '商务', language: '英文', price: 9.9, isFree: false,
    previewDesc: '企业商务 deck 生成 skill',
    recommendedAgent: 'WorkBuddy', gradient: '#1e40af',
    previewImages: ['/images/promotion-sale.png'],
    includes: { layouts: 7, styles: 4, charts: 9 },
    suitableFor: ['商务汇报', '企业展示', '投资者报告'],
    usageSteps: [
      { step: 1, title: '选择 agent', desc: 'WorkBuddy（推荐）' },
      { step: 2, title: '复制 skill', desc: '粘贴到企业后台' },
      { step: 3, title: '生成 Deck', desc: '输入汇报主题' }
    ],
    reviews: [],
    rating: 4.4, salesCount: 18, relatedSkills: ['work-report-01', 'corporate-01']
  }
];

module.exports = {
  skills: skills,
  getSkillsByScene: function(scene) {
    if (scene === '全部') return skills;
    return skills.filter(function(s) { return s.scene === scene; });
  },
  getSkillById: function(id) {
    return skills.find(function(s) { return s.id === id; });
  },
  getFreeSkills: function() {
    return skills.filter(function(s) { return s.isFree; });
  },
  getRelatedSkills: function(id) {
    var skill = skills.find(function(s) { return s.id === id; });
    if (!skill || !skill.relatedSkills) return [];
    return skill.relatedSkills.map(function(rid) {
      return skills.find(function(s) { return s.id === rid; });
    }).filter(function(s) { return s; });
  }
};
