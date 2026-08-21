#!/usr/bin/env node
// data-gate.js · 数据质量评分引擎
// 读取 skill 数据，对每条评分 0-100，检查硬门禁 + 全库门禁
// 用法: node scripts/data-gate.js [--data <path>] [--report <path>]

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '..', 'miniprogram', 'data', 'cloud-skills-data.js');
const REPORT_DIR = path.resolve(__dirname, '..', 'raw-materials');

const LICENSE_WHITELIST = ['MIT', 'Apache', 'CC0', 'CC', 'BSD'];
const PPT_RE = /ppt|pptx|slide|presentation|deck|keynote|幻灯|演示|汇报/i;
const IRRELEVANT_RE = /via Rube MCP|Composio|Automate .* tasks/i;
const NON_GH_SOURCES = ['Behance', 'X', 'ComposioHQ', 'promptadvisers', 'composio-community'];

function deriveRepoUrl(source) {
  if (!source || NON_GH_SOURCES.includes(source)) return null;
  if (/^[\w.-]+\/[\w.-]+$/.test(source)) return `https://github.com/${source}`;
  return null;
}

function deriveTier(skill) {
  if (skill.tier) return skill.tier;
  if (skill.source === 'Behance') return 'inspiration';
  if (IRRELEVANT_RE.test((skill.name || '') + ' ' + (skill.previewDesc || ''))) return 'rejected';
  if (skill.license && LICENSE_WHITELIST.includes(skill.license)) return 'paid';
  if (skill.price > 0) return 'paid';
  return 'free_ref';
}

function scoreDeliverability(skill) {
  const tier = deriveTier(skill);
  if (tier === 'rejected') return 0;
  const repoUrl = skill.repoUrl;
  if (tier === 'paid') {
    let s = 0;
    if (repoUrl) s += 8;
    if (skill.installCmd) s += 7;
    if (skill.skillMdContent) s += 8;
    if (skill.guideZh) s += 7;
    return s;
  }
  if (tier === 'free_ref') return repoUrl ? 30 : 0;
  if (tier === 'inspiration') return (skill.sourceUrl || skill.source === 'Behance') ? 30 : 0;
  return 0;
}

function scoreReadability(skill) {
  const nameZh = skill.nameZh || '';
  const descZh = skill.descZh || skill.previewDesc || '';
  let s = 0;
  if (nameZh) s += 5;
  const cjk = (descZh.match(/[\u4e00-\u9fa5]/g) || []).length;
  const ratio = descZh.length > 0 ? cjk / descZh.length : 0;
  if (ratio >= 0.8) s += 5; else if (ratio >= 0.5) s += 3;
  const noTrunc = descZh.length < 100 || !/…|\.\.\.$/.test(descZh.slice(-3));
  if (noTrunc) s += 5;
  if (!/^\s*[|｜,.·—-]/.test(descZh)) s += 5;
  if (descZh.length >= 40 && descZh.length <= 120) s += 5; else if (descZh.length >= 20) s += 3;
  return s;
}

function scoreCompleteness(skill, allSkills, previewImageUsage) {
  let s = 0;
  const requiredFields = ['id', 'name', 'source', 'scene', 'style', 'language', 'price', 'gradient', 'previewImages', 'includes', 'steps'];
  const present = requiredFields.filter(f => skill[f] !== undefined && skill[f] !== null).length;
  s += Math.round((present / requiredFields.length) * 5);
  const inc = JSON.stringify(skill.includes || {});
  const defaultInc = JSON.stringify({ templates: 4, layouts: 5, colorSchemes: 4 });
  if (inc !== defaultInc) s += 5;
  const stepSig = JSON.stringify(skill.steps || []);
  const allSame = allSkills.every(x => JSON.stringify(x.steps || []) === stepSig);
  if (!allSame) s += 5;
  else if (stepSig !== '[]') s += 2;
  const imgs = skill.previewImages || [];
  if (imgs.length > 0) {
    const maxUsage = Math.max(...imgs.map(i => previewImageUsage[i] || 0));
    if (maxUsage <= 1) s += 5; else if (maxUsage <= 3) s += 3; else s += 1;
  }
  return s;
}

function scoreAuthenticity(skill) {
  let s = 0;
  const hasGithubSignal = skill.githubStars !== undefined || (skill.rating && !skill.estimated);
  if (hasGithubSignal && !skill.estimated) s += 5; else if (hasGithubSignal) s += 2;
  if (skill.license && skill.license !== 'none' && skill.license !== 'unknown') s += 5;
  const tier = deriveTier(skill);
  if (tier === 'paid' && skill.license && LICENSE_WHITELIST.includes(skill.license)) s += 5;
  else if (tier === 'free_ref' && (!skill.license || skill.license === 'none')) s += 5;
  else if (tier === 'inspiration') s += 5;
  return s;
}

function bigramSet(str) {
  const s = new Set();
  for (let i = 0; i < str.length - 1; i++) s.add(str.slice(i, i + 2));
  return s;
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function scoreDiversity(skill, allDescs) {
  let s = 0;
  const descZh = skill.descZh || skill.previewDesc || '';
  if (descZh.length < 5) return 0;
  const target = bigramSet(descZh);
  let maxSim = 0;
  for (const other of allDescs) {
    if (other === descZh) continue;
    const sim = jaccard(target, bigramSet(other));
    if (sim > maxSim) maxSim = sim;
  }
  if (maxSim < 0.7) s += 5; else if (maxSim < 0.85) s += 3; else s += 1;
  const stepSig = JSON.stringify(skill.steps || []);
  const sameCount = allSkills_countSteps[stepSig] || 0;
  if (sameCount <= 2) s += 5; else if (sameCount <= 10) s += 3; else s += 1;
  return s;
}

let allSkills_countSteps = {};

function main() {
  const args = process.argv.slice(2);
  const dataIdx = args.indexOf('--data');
  const dataPath = dataIdx >= 0 ? path.resolve(args[dataIdx + 1]) : DATA_PATH;
  
  delete require.cache[require.resolve(dataPath)];
  const loaded = require(dataPath);
  const skills = Array.isArray(loaded) ? loaded : (loaded.cloudSkills || loaded.default || []);
  
  console.log(`=== data-gate.js 评分引擎 ===`);
  console.log(`数据源: ${dataPath}`);
  console.log(`总条数: ${skills.length}`);
  
  allSkills_countSteps = {};
  skills.forEach(s => { const sig = JSON.stringify(s.steps || []); allSkills_countSteps[sig] = (allSkills_countSteps[sig] || 0) + 1; });
  
  const previewImageUsage = {};
  skills.forEach(s => (s.previewImages || []).forEach(i => previewImageUsage[i] = (previewImageUsage[i] || 0) + 1));
  const allDescs = skills.map(s => s.descZh || s.previewDesc || '');
  
  const scored = skills.map(skill => {
    const tier = deriveTier(skill);
    const a = scoreDeliverability(skill);
    const b = scoreReadability(skill);
    const c = scoreCompleteness(skill, skills, previewImageUsage);
    const d = scoreAuthenticity(skill);
    const e = scoreDiversity(skill, allDescs);
    const total = a + b + c + d + e;
    const hardGateFail = tier === 'paid' && (!skill.license || !LICENSE_WHITELIST.includes(skill.license));
    const publishThreshold = tier === 'paid' ? 80 : (tier === 'free_ref' ? 65 : (tier === 'inspiration' ? 55 : 80));
    const status = hardGateFail ? 'draft' : (tier === 'rejected' ? 'rejected' : (total >= publishThreshold ? 'published' : 'draft'));
    return { id: skill.id, name: skill.name, tier, score: { A: a, B: b, C: c, D: d, E: e, total }, status, hardGateFail, license: skill.license || 'none', source: skill.source };
  });
  
  const byTier = {};
  scored.forEach(s => { byTier[s.tier] = (byTier[s.tier] || 0) + 1; });
  
  const byStatus = {};
  scored.forEach(s => { byStatus[s.status] = (byStatus[s.status] || 0) + 1; });
  
  const published = scored.filter(s => s.status === 'published');
  const paid = scored.filter(s => s.tier === 'paid' && s.status !== 'rejected');
  const paidScores = paid.map(s => s.score.total);
  const paidAvg = paidScores.length > 0 ? (paidScores.reduce((a, b) => a + b, 0) / paidScores.length) : 0;
  
  const p0Violations = scored.filter(s => s.hardGateFail || (s.tier === 'paid' && s.score.A === 0));
  
  const uniqueImages = Object.keys(previewImageUsage).length;
  const totalImageRefs = Object.values(previewImageUsage).reduce((a, b) => a + b, 0);
  const imageUniqRate = totalImageRefs > 0 ? (uniqueImages / totalImageRefs * 100) : 0;
  
  const descSkeletons = new Set();
  const behanceRe = /^Behance 精选演示设计：/;
  skills.forEach(s => {
    const desc = s.descZh || s.previewDesc || '';
    const skel = desc.replace(/：.*?场景/, '：X').replace(/，.*?风格/, '，Y');
    descSkeletons.add(skel);
  });
  const skeletonRate = skills.length > 0 ? (descSkeletons.size / skills.length * 100) : 0;
  
  const realSkillPublished = published.filter(s => s.tier !== 'inspiration' && s.tier !== 'rejected').length;
  
  const namezhSet = new Set();
  let namezhDupBug = 0;
  skills.forEach(s => {
    if (s.nameZh) { namezhSet.add(s.nameZh); if (/PPTXPPT|PPTPPT/.test(s.nameZh)) namezhDupBug++; }
  });
  const namezhUniqRate = skills.length > 0 ? (namezhSet.size / skills.length * 100) : 0;
  
  const globalGate = {
    'published_real_skill': { value: realSkillPublished, target: 220, pass: realSkillPublished >= 220 },
    'paid_avg_score': { value: parseFloat(paidAvg.toFixed(1)), target: 85, pass: paidAvg >= 85 },
    'p0_violations': { value: p0Violations.length, target: 0, pass: p0Violations.length === 0 },
    'image_uniq_rate': { value: parseFloat(imageUniqRate.toFixed(1)), target: 80, pass: imageUniqRate >= 80 },
    'desc_skeleton_rate': { value: parseFloat(skeletonRate.toFixed(1)), target: 90, pass: skeletonRate >= 90 },
    'namezh_uniq_rate': { value: parseFloat(namezhUniqRate.toFixed(1)), target: 95, pass: namezhUniqRate >= 95 },
  };
  
  const allPass = Object.values(globalGate).every(g => g.pass);
  
  const dimAvg = {};
  ['A', 'B', 'C', 'D', 'E', 'total'].forEach(dim => {
    const vals = scored.map(s => s.score[dim]);
    dimAvg[dim] = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  });
  
  const report = {
    timestamp: new Date().toISOString(),
    dataSource: dataPath,
    totalSkills: skills.length,
    byTier,
    byStatus,
    dimensionAverages: dimAvg,
    paidAvgScore: parseFloat(paidAvg.toFixed(1)),
    p0Violations: p0Violations.length,
    p0Details: p0Violations.slice(0, 10).map(s => ({ id: s.id, name: s.name, reason: s.hardGateFail ? 'paid_no_license' : 'no_deliverable' })),
    imageStats: { unique: uniqueImages, total: totalImageRefs, uniqRate: parseFloat(imageUniqRate.toFixed(1)) },
    descStats: { uniqueSkeletons: descSkeletons.size, skeletonRate: parseFloat(skeletonRate.toFixed(1)) },
    namezhStats: { unique: namezhSet.size, uniqRate: parseFloat(namezhUniqRate.toFixed(1)), dupBug: namezhDupBug },
    realSkillPublished,
    globalGate,
    globalGatePass: allPass,
    scored: scored.map(s => ({ id: s.id, name: s.name, tier: s.tier, status: s.status, score: s.score.total, A: s.score.A, B: s.score.B, C: s.score.C, D: s.score.D, E: s.score.E, license: s.license, source: s.source })),
  };
  
  const reportPath = path.join(REPORT_DIR, `quality-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n=== 单条评分 ===');
  console.log('维度均分: A(可交付)=', dimAvg.A, '/30  B(可读)=', dimAvg.B, '/25  C(完整)=', dimAvg.C, '/20  D(真实)=', dimAvg.D, '/15  E(差异)=', dimAvg.E, '/10');
  console.log('总分均分:', dimAvg.total, '/100');
  
  console.log('\n=== Tier 分布 ===');
  console.log(byTier);
  console.log('\n=== Status 分布 ===');
  console.log(byStatus);
  
  console.log('\n=== 全库门禁 ===');
  Object.entries(globalGate).forEach(([k, v]) => {
    console.log(`${v.pass ? '✅' : '❌'} ${k}: ${v.value} / 目标 ${v.target}`);
  });
  console.log(`\n${allPass ? '✅ 全库门禁通过' : '❌ 全库门禁不通过'}`);
  
  console.log('\n=== P0 违规 ===');
  console.log('P0 违规数:', p0Violations.length);
  if (p0Violations.length > 0) {
    console.log('前 10 条:');
    p0Violations.slice(0, 10).forEach(v => console.log(`  ${v.id} ${v.name} | ${v.hardGateFail ? 'paid_no_license' : 'no_deliverable'}`));
  }
  
  console.log('\n=== 图片/描述 ===');
  console.log(`预览图: ${uniqueImages} 唯一 / ${totalImageRefs} 引用 = ${imageUniqRate.toFixed(1)}% 唯一率`);
  console.log(`描述骨架: ${descSkeletons.size} 唯一 / ${skills.length} 总条 = ${skeletonRate.toFixed(1)}% 唯一率`);
  
  console.log('\n报告已输出:', reportPath);
  
  process.exit(allPass ? 0 : 1);
}

main();
