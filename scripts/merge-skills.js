#!/usr/bin/env node
// merge-skills.js · R2 合并 L0 解析结果到 cloud-skills-data.js
// 1. 匹配现有 300 条 → 增量更新 tier/license/repoUrl/skillMdContent
// 2. 新增未匹配的 PPT skill
// 3. Behance 122 条转 inspiration
// 产出: raw-materials/skills-merged.json
// 用法: node scripts/merge-skills.js

const fs = require('fs');
const path = require('path');

const GH_DIR = path.resolve(__dirname, '..', 'raw-materials', 'github');
const PARSED = path.resolve(__dirname, '..', 'raw-materials', 'skills-parsed.json');
const EXISTING = path.resolve(__dirname, '..', 'miniprogram', 'data', 'cloud-skills-data.js');
const OUT = path.resolve(__dirname, '..', 'raw-materials', 'skills-merged.json');

const TAXONOMY = {
  scenes: ['工作汇报', '答辩', '学术研究', '商务展示', '创意设计', '教育课件'],
  styles: ['商务简约', '学术清爽', '创意活泼', '科技极简', '中式典雅', '日系简约'],
  agents: ['Codex', '豆包', 'WorkBuddy', 'Claude'],
};

function guessScene(name, desc) {
  const t = (name + ' ' + desc).toLowerCase();
  if (/defense|答辩|毕业|学位|开题/.test(t)) return '答辩';
  if (/paper|论文|academic|学术|research|科研|实验/.test(t)) return '学术研究';
  if (/business|corporate|consulting|report|汇报|述职|年报|季报/.test(t)) return '工作汇报';
  if (/creative|创意|design|brand|品牌/.test(t)) return '创意设计';
  if (/course|课件|lecture|教学|课程|教育/.test(t)) return '教育课件';
  if (/pitch|deck|investor|融资|商业计划/.test(t)) return '商务展示';
  return '工作汇报';
}

function guessStyle(name, desc) {
  const t = (name + ' ' + desc).toLowerCase();
  if (/minimal|极简|clean|简洁/.test(t)) return '科技极简';
  if (/academic|学术|paper/.test(t)) return '学术清爽';
  if (/creative|活泼|colorful/.test(t)) return '创意活泼';
  if (/chinese|中式|中国|国风/.test(t)) return '中式典雅';
  if (/japanese|日系|日企|japan/.test(t)) return '日系简约';
  return '商务简约';
}

function guessAgent(repoDir) {
  if (/codex|claude/i.test(repoDir)) return 'Claude';
  if (/doubao|豆包/i.test(repoDir)) return '豆包';
  if (/workbuddy|work-buddy/i.test(repoDir)) return 'WorkBuddy';
  return 'Claude';
}

function guessPrice(tier, license) {
  if (tier === 'inspiration' || tier === 'free_ref') return 0;
  return 9;
}

function guessLanguage(desc) {
  if (/[\u3040-\u30ff]/.test(desc)) return '日文';
  if (/[\u4e00-\u9fa5]/.test(desc)) return '中文';
  return '英文';
}

const GRADIENTS = [
  ['#667eea', '#764ba2'], ['#0f2027', '#2c5364'], ['#11998e', '#38ef7d'],
  ['#fc466b', '#3f5efb'], ['#ff9a9e', '#fecfef'], ['#a18cd1', '#fbc2eb'],
  ['#fbc2eb', '#a6c1ee'], ['#fdcbf1', '#e6dee9'], ['#a1c4fd', '#c2e9fb'],
  ['#d4fc79', '#96e6a1'], ['#84fab0', '#8fd3f4'], ['#a8edea', '#fed6e3'],
];

function main() {
  console.log('=== R2 合并 ===');
  const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
  const pptSkills = parsed.filter(s => s.isPPT);
  console.log('L0 PPT 相关:', pptSkills.length);

  const existing = require(EXISTING);
  console.log('现有数据:', existing.length);

  const matchedParsed = new Set();

  existing.forEach(skill => {
    const src = skill.source;
    const normSrc = src.replace(/__/g, '/');
    const match = pptSkills.find(p =>
      p.ownerSlashRepo === src || p.ownerSlashRepo === normSrc ||
      p.repoDir === src || p.repoDir === src.replace(/\//g, '__')
    );
    if (match) {
      skill.tier = match.tier;
      skill.license = match.license;
      skill.repoUrl = match.repoUrl;
      const fullMdPath = path.join(GH_DIR, match.skillMdPath);
      try { skill.skillMdContent = fs.readFileSync(fullMdPath, 'utf8'); } catch {}
      skill.installCmd = `git clone ${match.repoUrl}.git`;
      if (!skill.guideZh) skill.guideZh = match.description || '';
      if (skill.source === 'Behance') {
        skill.tier = 'inspiration';
        skill.previewImages = [];
        skill.sourceUrl = skill.sourceUrl || '';
      }
      matchedParsed.add(match.skillMdPath);
    } else if (skill.source === 'Behance') {
      skill.tier = 'inspiration';
      skill.previewImages = [];
    } else if (skill.source === 'X') {
      skill.tier = 'free_ref';
    }
  });

  let newCount = 0;
  const newSkills = pptSkills.filter(p => !matchedParsed.has(p.skillMdPath));
  newSkills.forEach((p, i) => {
    const fullMdPath = path.join(GH_DIR, p.skillMdPath);
    let mdContent = '';
    try { mdContent = fs.readFileSync(fullMdPath, 'utf8'); } catch {}
    const id = `skill_new_${String(existing.length + i + 1).padStart(3, '0')}`;
    existing.push({
      id,
      name: p.name,
      nameZh: '',
      source: p.ownerSlashRepo,
      repoUrl: p.repoUrl,
      license: p.license,
      tier: p.tier,
      scene: guessScene(p.name, p.description),
      style: guessStyle(p.name, p.description),
      language: guessLanguage(p.description),
      recommendedAgent: guessAgent(p.repoDir),
      price: guessPrice(p.tier, p.license),
      isFree: p.tier !== 'paid',
      rating: 3.5,
      salesCount: 0,
      estimated: true,
      previewDesc: p.description,
      descZh: '',
      gradient: GRADIENTS[i % GRADIENTS.length],
      previewImages: [],
      includes: { templates: 0, layouts: 0, colorSchemes: 0 },
      steps: [],
      reviews: [],
      editorReview: '',
      installCmd: `git clone ${p.repoUrl}.git`,
      skillMdContent: mdContent,
      guideZh: '',
      status: 'draft',
    });
    newCount++;
  });

  console.log('匹配并更新:', matchedParsed.size);
  console.log('新增:', newCount);
  console.log('合并后总数:', existing.length);

  const byTier = {};
  existing.forEach(s => { byTier[s.tier || 'unknown'] = (byTier[s.tier || 'unknown'] || 0) + 1; });
  console.log('Tier 分布:', byTier);

  const paidWithDeliverable = existing.filter(s => s.tier === 'paid' && s.skillMdContent && s.repoUrl && s.installCmd && s.guideZh !== undefined);
  console.log('paid 有四件套:', paidWithDeliverable.length, '/', existing.filter(s => s.tier === 'paid').length);

  fs.writeFileSync(OUT, JSON.stringify(existing, null, 2));
  console.log('\n输出:', OUT);
}

main();
