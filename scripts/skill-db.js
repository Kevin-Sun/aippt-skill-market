// skill-db.js · 本地 skill 数据库查询
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'raw-materials', 'skills-database.json');
let skills = [];

function load() {
  skills = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  return skills;
}

function getByScene(scene) {
  if (!scene || scene === '全部') return skills;
  return skills.filter(s => s.scene === scene);
}

function getByStyle(style) {
  if (!style || style === '全部') return skills;
  return skills.filter(s => s.style === style);
}

function getByLanguage(lang) {
  if (!lang || lang === '全部') return skills;
  return skills.filter(s => s.language === lang);
}

function getByAgent(agent) {
  if (!agent || agent === '全部') return skills;
  return skills.filter(s => s.agent === agent);
}

function search(query) {
  if (!query) return skills;
  const q = query.toLowerCase();
  return skills.filter(s => 
    (s.name && s.name.toLowerCase().includes(q)) ||
    (s.previewDesc && s.previewDesc.toLowerCase().includes(q)) ||
    (s.scene && s.scene.includes(query)) ||
    (s.style && s.style.includes(query)) ||
    (s.agent && s.agent.toLowerCase().includes(q))
  );
}

function getFree() {
  return skills.filter(s => s.isFree);
}

function getById(id) {
  return skills.find(s => s.id === id);
}

function getStats() {
  return {
    total: skills.length,
    free: skills.filter(s => s.isFree).length,
    scenes: [...new Set(skills.map(s => s.scene))].length,
    styles: [...new Set(skills.map(s => s.style))].length,
    languages: [...new Set(skills.map(s => s.language))].length,
    agents: [...new Set(skills.map(s => s.agent))].length,
  };
}

module.exports = {
  load,
  getByScene,
  getByStyle,
  getByLanguage,
  getByAgent,
  search,
  getFree,
  getById,
  getStats,
  skills,
};
