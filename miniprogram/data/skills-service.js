// data/skills-service.js · 统一数据源（本地精品 + 云端真实数据）
var localSkills = require('./skills.js');
var taxonomy = require('./taxonomy.js');

// 内置 300 条真实数据（从 real-skills-clean.json 导入）
var cloudSkills = require('./cloud-skills-data.js');

// gradient 归一化：云端存储为 ["#a","#b"] 数组，本地为 CSS 字符串
// 统一转成 "linear-gradient(135deg, #a, #b)"，WXML style 属性才能渲染
function normalizeGradient(s) {
  if (!s.gradient) return s;
  if (typeof s.gradient === 'string') return s;
  if (Array.isArray(s.gradient) && s.gradient.length >= 2) {
    s.gradient = 'linear-gradient(135deg, ' + s.gradient[0] + ', ' + s.gradient[1] + ')';
  }
  return s;
}

// suitableFor 推导：云端 skill 缺此字段，从 scene+style 经 taxonomy 推导（非编造）
var SCENE_SUIT = {
  '工作汇报': ['年终总结', '季度汇报', '项目复盘', '述职报告'],
  '商务展示': ['产品发布', '商业计划', '招商路演', '品牌提案'],
  '创意设计': ['创意提案', '品牌展示', '艺术展览', '设计评审'],
  '学术研究': ['论文答辩', '学术会议', '课题汇报', '研究展示'],
  '答辩': ['毕业答辩', '开题报告', '中期检查', '论文答辩'],
  '教育课件': ['课堂讲义', '教学演示', '培训课件', '课程总结'],
  '数据分析': ['数据报告', '分析展示', 'BI 面板', '指标复盘'],
};
function deriveSuitableFor(s) {
  if (s.suitableFor && s.suitableFor.length) return s;
  var suits = SCENE_SUIT[s.scene];
  if (suits) s.suitableFor = suits;
  return s;
}

// reviews 归一化：云端 skill 无 reviews 字段，设为空数组让 WXML 空态逻辑生效
function normalizeReviews(s) {
  if (!s.reviews) s.reviews = [];
  if (!Array.isArray(s.reviews)) s.reviews = [];
  return s;
}

// 合并：本地 8 个精品在前 + 300 个真实数据在后，统一做字段归一
var allSkills = localSkills.skills.concat(cloudSkills).map(function(s) {
  return normalizeGradient(deriveSuitableFor(normalizeReviews(Object.assign({}, s))));
});

// 过滤：只显示 published 的 skill
function getPublished() {
  return allSkills.filter(function(s) { return s.status === 'published' || !s.status; });
}

function getByScene(scene) {
  var skills = getPublished();
  if (!scene || scene === '全部') return skills;
  return skills.filter(function(s) { return s.scene === scene; });
}

function getByStyle(style) {
  var skills = getPublished();
  if (!style || style === '全部') return skills;
  return skills.filter(function(s) { return s.style === style; });
}

function getByLanguage(lang) {
  var skills = getPublished();
  if (!lang || lang === '全部') return skills;
  return skills.filter(function(s) { return s.language === lang; });
}

function getByAgent(agent) {
  var skills = getPublished();
  if (!agent || agent === '全部') return skills;
  return skills.filter(function(s) { return s.recommendedAgent === agent; });
}

function getFree() {
  return getPublished().filter(function(s) { return s.isFree; });
}

function getById(id) {
  return allSkills.find(function(s) { return s.id === id; });
}

// getRelated：本地 8 条有 related 字段精确指定；云端 300 条无 related → 回退同场景推荐
function getRelated(id) {
  var skill = getById(id);
  if (!skill) return [];
  if (skill.related && skill.related.length) {
    return skill.related.map(function(rid) { return getById(rid); }).filter(Boolean);
  }
  // 回退：同 scene 的前 4 条（排除自己）
  var same = getPublished().filter(function(s) {
    return s.scene === skill.scene && s.id !== id;
  });
  return same.slice(0, 4);
}

function search(query) {
  var skills = getPublished();
  if (!query) return skills;
  var q = query.toLowerCase();
  return skills.filter(function(s) {
    return (s.name && s.name.toLowerCase().indexOf(q) >= 0) ||
           (s.previewDesc && s.previewDesc.toLowerCase().indexOf(q) >= 0) ||
           (s.scene && s.scene.indexOf(query) >= 0) ||
           (s.style && s.style.indexOf(query) >= 0) ||
           (s.recommendedAgent && s.recommendedAgent.toLowerCase().indexOf(q) >= 0);
  });
}

function getStats() {
  var published = getPublished();
  return {
    total: published.length,
    free: published.filter(function(s) { return s.isFree; }).length,
    scenes: taxonomy.scenes.length - 1,
    styles: taxonomy.styles.length - 1,
    languages: taxonomy.languages.length - 1,
    agents: taxonomy.agents.length - 1,
  };
}

module.exports = {
  skills: getPublished(),
  getAll: function() { return allSkills; },
  getByScene: getByScene,
  getByStyle: getByStyle,
  getByLanguage: getByLanguage,
  getByAgent: getByAgent,
  getFree: getFree,
  getById: getById,
  getRelated: getRelated,
  search: search,
  getStats: getStats,
  taxonomy: taxonomy,
};
