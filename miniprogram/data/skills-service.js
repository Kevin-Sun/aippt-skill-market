// data/skills-service.js · 统一数据源（本地精品 + 云端真实数据）
var localSkills = require('./skills.js');
var taxonomy = require('./taxonomy.js');

// 内置 300 条真实数据（从 real-skills-clean.json 导入）
var cloudSkills = require('./cloud-skills-data.js');

// 合并：本地 8 个精品在前 + 300 个真实数据在后
var allSkills = localSkills.skills.concat(cloudSkills);

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

function getRelated(id) {
  var skill = getById(id);
  if (!skill || !skill.related) return [];
  return skill.related.map(function(rid) { return getById(rid); }).filter(Boolean);
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
