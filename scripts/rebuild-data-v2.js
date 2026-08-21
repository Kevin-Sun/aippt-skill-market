#!/usr/bin/env node
// rebuild-data-v2.js · 综合数据重建 v2
// Fix1: 下划线 source → owner/repo repoUrl
// Fix2: 补齐 GitHub 信号（重跑 API）
// Fix3: nameZh v2（互斥组 + owner 前缀·分隔 + 长度 4-12）
// Fix4: sanitizeDesc（清 markdown/去标题重复/合并标点/剔日文）
// Fix5: steps → 对象数组 [{num,title,desc}]
// Fix6: includes 真实值（SKILL.md 解析）或 null
// Fix7: 清空占位 previewImages
// 输入: raw-materials/skills-final.json + raw-materials/github/
// 产出: raw-materials/skills-v2.json

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IN = path.resolve(__dirname, '..', 'raw-materials', 'skills-final.json');
const OUT = path.resolve(__dirname, '..', 'raw-materials', 'skills-v2.json');
const GH_DIR = path.resolve(__dirname, '..', 'raw-materials', 'github');

// ============ Fix1: repoUrl 修复 ============
function fixRepoUrl(skill) {
  if (skill.repoUrl && /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(skill.repoUrl)) return skill.repoUrl;
  const src = skill.source || '';
  // 下划线格式: Mr-Q526_PPTMaker-skill → Mr-Q526/PPTMaker-skill
  if (src.includes('_') && !src.includes('/')) {
    // 尝试 owner__repo → owner/repo (双下划线是分隔符)
    if (src.includes('__')) {
      const parts = src.split('__');
      if (parts.length === 2) return `https://github.com/${parts[0]}/${parts[1]}`;
    }
    // 单下划线：需要对照本地 clone 目录
    const dir = src.replace(/\//g, '__');
    if (fs.existsSync(path.join(GH_DIR, dir))) {
      const ownerRepo = dir.replace(/__/g, '/');
      return `https://github.com/${ownerRepo}`;
    }
    // 尝试常见分词：第一个下划线分割
    const idx = src.indexOf('_');
    if (idx > 0) {
      const owner = src.slice(0, idx);
      const repo = src.slice(idx + 1);
      const testDir = `${owner}__${repo}`;
      if (fs.existsSync(path.join(GH_DIR, testDir))) {
        return `https://github.com/${owner}/${repo}`;
      }
    }
  }
  if (/^[\w.-]+\/[\w.-]+$/.test(src)) return `https://github.com/${src}`;
  return skill.repoUrl || null;
}

// ============ Fix2: GitHub API 补齐 ============
const ghCache = {};
function ghApi(repoPath) {
  if (ghCache[repoPath] !== undefined) return ghCache[repoPath];
  try {
    const out = execSync(`gh api "repos/${repoPath}" --jq '{stargazers_count,forks_count,open_issues_count,pushed_at}' 2>/dev/null`, {
      encoding: 'utf8', timeout: 15000
    });
    const result = JSON.parse(out.trim());
    ghCache[repoPath] = result;
    return result;
  } catch {
    ghCache[repoPath] = null;
    return null;
  }
}

function normalizeRating(stars) {
  if (stars === undefined || stars === null) return undefined;
  if (stars <= 0) return 3.5;
  if (stars >= 100) return 5.0;
  return parseFloat((3.5 + (stars / 100) * 1.5).toFixed(1));
}

function fixGithubSignals(skill) {
  if (!skill.repoUrl) return skill;
  const repoPath = skill.repoUrl.replace('https://github.com/', '');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repoPath)) return skill;
  if (skill.githubStars !== undefined) return skill; // 已有，跳过
  const result = ghApi(repoPath);
  if (result) {
    skill.githubStars = result.stargazers_count || 0;
    skill.githubForks = result.forks_count || 0;
    skill.githubIssues = result.open_issues_count || 0;
    skill.lastCommit = result.pushed_at || '';
    skill.rating = normalizeRating(skill.githubStars);
    skill.salesCount = skill.githubForks + skill.githubIssues;
    skill.dataSource = 'GitHub';
  }
  return skill;
}

// ============ Fix3: nameZh v2 ============
const TOKEN_MAP = [
  ['thesis', '论文'], ['defense', '答辩'], ['academic', '学术'], ['graduation', '毕业'],
  ['consulting', '咨询'], ['corporate', '企业'], ['business', '商务'], ['enterprise', '企业'],
  ['creative', '创意'], ['design', '设计'], ['brand', '品牌'], ['minimal', '极简'],
  ['data', '数据'], ['chart', '图表'], ['dashboard', '仪表盘'],
  ['html', 'HTML'], ['image', '配图'], ['3d', '3D'],
  ['editable', '可编辑'], ['paper', '论文'], ['research', '研究'],
  ['education', '教学'], ['course', '课程'], ['lecture', '讲座'],
  ['report', '汇报'], ['quarterly', '季报'], ['annual', '年报'],
  ['pitch', '路演'], ['investor', '融资'], ['startup', '创业'],
  ['kingdee', '金蝶'], ['yonyou', '用友'], ['huawei', '华为'], ['apple', '苹果'],
  ['marp', 'Marp'], ['bento', '便当'], ['nano', 'Nano'], ['banana', '香蕉'],
  ['whale', '鲸鱼'], ['orange', '橙子'], ['fire', '火焰'], ['grid', '网格'],
  ['translate', '翻译'], ['leadership', '领导力'],
  ['competition', '竞赛'], ['economics', '经济学'], ['empirical', '实证'],
  ['cyber', '赛博'], ['hackflow', '黑客流'], ['antigravity', '反重力'],
  ['plain', '简约'], ['sync', '同步'], ['enhanced', '增强版'], ['ultimate', '终极'],
  ['gen', '生成器'], ['maker', '制作器'], ['master', '大师'],
  ['canvas', '画布'], ['notebook', '笔记本'], ['briefing', '简报'],
  ['pdf', 'PDF'], ['gpt-image', 'GPT配图'], ['awesome', '精选'],
  ['codex', 'Codex'], ['claude', 'Claude'], ['doubao', '豆包'], ['workbuddy', 'WorkBuddy'],
  ['dashi', '大师'], ['spacex', 'SpaceX'], ['knowledge', '知识'], ['cat', '猫'],
  ['seven', '七'], ['eight', '八'],
];

// 互斥组：同组只取第一个命中的
const MUTUAL_EXCLUSIVE = [
  ['pptx', 'ppt', 'presentation', 'slide', 'deck', 'keynote', '幻灯片', '演示稿'],
];

function tokenize(slug) {
  if (!slug) return [];
  let parts = slug.toLowerCase().replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  parts = parts.replace(/[^a-z0-9\u4e00-\u9fa5 ]/g, ' ').split(/\s+/).filter(Boolean);
  return parts;
}

function mapToken(word) {
  for (const [key, zh] of TOKEN_MAP) {
    if (word === key || word.includes(key)) return zh;
  }
  if (/^pptx?$/.test(word)) return 'PPT';
  if (word === 'skill' || word === 'skills') return '技能';
  if (/^\d+$/.test(word)) return '';
  return '';
}

function buildNameZh(slug, description) {
  if (/[\u4e00-\u9fa5]/.test(slug)) return slug;
  const tokens = tokenize(slug);
  const zhParts = [];
  const seen = new Set();
  const usedGroups = new Set();

  for (const t of tokens) {
    // 检查互斥组
    for (let gi = 0; gi < MUTUAL_EXCLUSIVE.length; gi++) {
      const group = MUTUAL_EXCLUSIVE[gi];
      if (usedGroups.has(gi)) continue;
      for (const gte of group) {
        if (t === gte || t.includes(gte)) {
          const zh = mapToken(gte);
          if (zh && !seen.has(zh)) { zhParts.push(zh); seen.add(zh); }
          usedGroups.add(gi);
          break;
        }
      }
      if (usedGroups.has(gi)) break;
    }
    // 非互斥 token
    if (!usedGroups.size || !MUTUAL_EXCLUSIVE.some((g, gi) => usedGroups.has(gi) && g.some(te => t === te || t.includes(te)))) {
      const zh = mapToken(t);
      if (zh && !seen.has(zh)) { zhParts.push(zh); seen.add(zh); }
    }
  }

  if (zhParts.length === 0) {
    const descCjk = (description || '').match(/[\u4e00-\u9fa5]+/g);
    if (descCjk && descCjk.length > 0) return descCjk.slice(0, 3).join('') + 'PPT';
    return 'PPT技能';
  }
  if (!zhParts.includes('PPT') && !zhParts.includes('演示') && !zhParts.includes('幻灯')) {
    zhParts.push('PPT');
  }
  if (!zhParts.includes('技能') && !zhParts.includes('工具') && !zhParts.includes('生成器')) {
    zhParts.push('技能');
  }
  return zhParts.join('');
}

function getOwnerName(source) {
  if (!source) return '';
  if (['Behance', 'X', 'ComposioHQ', 'composio-community', 'promptadvisers'].includes(source)) return '';
  const parts = source.split('/');
  let owner = parts.length > 1 ? parts[0] : source.replace(/__.*/, '');
  if (/^\d{4,}/.test(owner) || /\d{6,}/.test(owner) || owner.length < 2 || owner === 'X') return '';
  return owner.replace(/[-_]/g, '');
}

function rebuildNameZh(skill, usedSet) {
  let name = buildNameZh(skill.name, skill.previewDesc);
  if (name.length > 12) name = name.slice(0, 12);

  if (!usedSet.has(name)) { skill.nameZh = name; usedSet.add(name); return skill; }

  // owner 前缀·分隔
  const owner = getOwnerName(skill.source);
  if (owner && owner.length <= 8 && !usedSet.has(owner + '·' + name)) {
    skill.nameZh = owner + '·' + name;
    usedSet.add(owner + '·' + name);
    return skill;
  }

  // scene 后缀
  const scene = skill.scene || '';
  if (scene && !usedSet.has(name + scene)) {
    skill.nameZh = name + scene;
    usedSet.add(name + scene);
    return skill;
  }

  // 序号
  let i = 2;
  while (usedSet.has(name + i)) i++;
  skill.nameZh = name + i;
  usedSet.add(name + i);
  return skill;
}

// ============ Fix4: sanitizeDesc ============
function sanitizeDesc(desc, nameZh) {
  if (!desc) return '';
  let r = desc;
  // 去 markdown
  r = r.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
  r = r.replace(/`([^`]+)`/g, '$1');
  r = r.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  r = r.replace(/^#+\s*/gm, '').replace(/^>\s*/gm, '');
  r = r.replace(/!\[.*?\]\(.*?\)/g, '');
  // 去标题重复（描述以 nameZh 开头）
  if (nameZh && r.startsWith(nameZh)) {
    r = r.slice(nameZh.length).replace(/^[，。、：:——\- ]+/, '');
  }
  // 合并双句号
  r = r.replace(/。。+/g, '。').replace(/，，+/g, '，');
  // 去日文段落（纯假名+片假名占比高的段落）
  const kana = (r.match(/[\u3040-\u30ff]/g) || []).length;
  const cjk = (r.match(/[\u4e00-\u9fa5]/g) || []).length;
  if (kana > cjk && kana > 10) {
    // 提取中文部分
    const zhParts = r.match(/[\u4e00-\u9fa5\u3000-\u303f，。、：；！？""''（）【】\w\s\-\.]+/g);
    if (zhParts && zhParts.length > 0) r = zhParts.filter(p => /[\u4e00-\u9fa5]/.test(p)).join('');
  }
  // 长度控制
  if (r.length > 120) r = r.slice(0, 117) + '…';
  if (r.length < 20) r = r + '。';
  return r;
}

// ============ Fix5: steps → 对象数组 ============
const SCENE_STEPS = {
  '工作汇报': [
    { num: 1, title: '输入要点', desc: '输入汇报主题和关键数据' },
    { num: 2, title: '选择风格', desc: '选择商务简约风格和配色' },
    { num: 3, title: 'AI生成', desc: '自动生成结构化汇报幻灯片' },
    { num: 4, title: '导出', desc: '导出为可编辑的PPTX格式' },
  ],
  '答辩': [
    { num: 1, title: '输入论文信息', desc: '输入研究主题、导师和章节' },
    { num: 2, title: '选择版式', desc: '选择学术清爽风格和图表布局' },
    { num: 3, title: 'AI生成', desc: '自动生成答辩演示文稿' },
    { num: 4, title: '导出', desc: '导出为PDF或PPTX格式' },
  ],
  '学术研究': [
    { num: 1, title: '输入研究内容', desc: '输入论文摘要和实验数据' },
    { num: 2, title: '选择模板', desc: '选择学术清爽风格和引用格式' },
    { num: 3, title: 'AI生成', desc: '自动生成学术报告幻灯片' },
    { num: 4, title: '导出', desc: '导出为可编辑格式' },
  ],
  '商务展示': [
    { num: 1, title: '输入商业计划', desc: '输入产品定位和市场数据' },
    { num: 2, title: '选择风格', desc: '选择商务简约或科技极简风格' },
    { num: 3, title: 'AI生成', desc: '自动生成路演演示文稿' },
    { num: 4, title: '导出', desc: '导出为PPTX格式供投资人查看' },
  ],
  '创意设计': [
    { num: 1, title: '描述创意需求', desc: '输入品牌调性和视觉风格' },
    { num: 2, title: '选择风格', desc: '选择创意活泼风格和配色方案' },
    { num: 3, title: 'AI生成', desc: '自动生成创意演示文稿' },
    { num: 4, title: '导出', desc: '导出为HTML或PPTX格式' },
  ],
  '教育课件': [
    { num: 1, title: '输入课程内容', desc: '输入教学大纲和知识点' },
    { num: 2, title: '选择模板', desc: '选择教学课件风格和布局' },
    { num: 3, title: 'AI生成', desc: '自动生成教学演示幻灯片' },
    { num: 4, title: '导出', desc: '导出为可编辑格式供课堂使用' },
  ],
};

function buildSteps(skill) {
  if (skill.skillMdContent) {
    const body = skill.skillMdContent.replace(/^---[\s\S]*?---\n/, '');
    const lines = body.split('\n').filter(l => {
      const t = l.trim();
      return t && (/^[-*]\s/.test(t) || /^\d+[.)]\s/.test(t)) && t.length > 10 && t.length < 120;
    });
    if (lines.length >= 3) {
      return lines.slice(0, 4).map((l, i) => {
        const text = l.replace(/^[-*]\s|^\d+[.)]\s/, '').trim();
        const parts = text.split(/[:：]/);
        return {
          num: i + 1,
          title: (parts[0] || text).slice(0, 20),
          desc: (parts[1] || text).slice(0, 60),
        };
      });
    }
  }
  // 按场景生成
  const sceneSteps = SCENE_STEPS[skill.scene] || SCENE_STEPS['工作汇报'];
  return sceneSteps.map(s => ({ ...s }));
}

// ============ Fix6: includes 真实值 ============
function extractIncludes(skill) {
  if (skill.skillMdContent) {
    const body = skill.skillMdContent;
    // 搜索模板数/版式数/配色数
    const templates = body.match(/(\d+)\s*(?:模板|template|layout|幻灯片)/i);
    const layouts = body.match(/(\d+)\s*(?:版式|layout|slide|页)/i);
    const colors = body.match(/(\d+)\s*(?:配色|color|theme|色彩)/i);
    const t = templates ? parseInt(templates[1]) : 0;
    const l = layouts ? parseInt(layouts[1]) : 0;
    const c = colors ? parseInt(colors[1]) : 0;
    if (t > 0 || l > 0 || c > 0) {
      return { templates: Math.min(t || 4, 99), layouts: Math.min(l || 5, 99), colorSchemes: Math.min(c || 4, 99) };
    }
  }
  // 无 SKILL.md 或解析不到 → null（前端隐藏）
  return null;
}

// ============ Fix7: 清空占位 previewImages ============
function cleanPreviewImages(skill) {
  if (skill.tier === 'inspiration') return [];
  const imgs = skill.previewImages || [];
  return imgs.filter(i => !/uniq_|placeholder/.test(i));
}

// ============ Main ============
function main() {
  console.log('=== rebuild-data-v2.js ===');
  const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const valid = data.filter(s => s.tier !== 'rejected');
  console.log('输入:', data.length, '有效:', valid.length);

  // Fix1: repoUrl
  let urlFixed = 0;
  data.forEach(s => {
    const newUrl = fixRepoUrl(s);
    if (newUrl && newUrl !== s.repoUrl) { s.repoUrl = newUrl; urlFixed++; }
  });
  const hasRepo = data.filter(s => s.repoUrl && /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(s.repoUrl));
  console.log('\nFix1 repoUrl: 修复', urlFixed, '条, 合法 repoUrl:', hasRepo.length);

  // Fix2: GitHub 信号补齐
  let ghFixed = 0;
  data.forEach(s => {
    if (s.repoUrl && s.githubStars === undefined) {
      fixGithubSignals(s);
      if (s.githubStars !== undefined) ghFixed++;
    }
  });
  const hasStars = data.filter(s => s.githubStars !== undefined);
  console.log('Fix2 GitHub: 补齐', ghFixed, '条, 有 stars:', hasStars.length);

  // Fix3: nameZh v2
  const usedNames = new Set();
  data.forEach(s => { if (s.tier !== 'rejected') rebuildNameZh(s, usedNames); });
  const nameUniq = new Set(valid.map(s => s.nameZh));
  const semRep = valid.filter(s => /幻灯片PPT|演示文稿PPT|PPT.*PPT/.test(s.nameZh || ''));
  const ownerSuffix = valid.filter(s => /[\u4e00-\u9fa5][A-Za-z]{4,}$/.test(s.nameZh || ''));
  console.log('Fix3 nameZh: 唯一', nameUniq.size, '/', valid.length, '| 语义重复:', semRep.length, '| owner硬拼:', ownerSuffix.length);

  // Fix4: sanitizeDesc
  data.forEach(s => {
    if (s.tier !== 'rejected') s.descZh = sanitizeDesc(s.descZh || s.previewDesc || '', s.nameZh);
  });
  const mdStar = valid.filter(s => /\*\*/.test(s.descZh || ''));
  const mdTick = valid.filter(s => /`/.test(s.descZh || ''));
  const dupTitle = valid.filter(s => s.nameZh && s.descZh && s.descZh.startsWith(s.nameZh));
  const doublePeriod = valid.filter(s => /。。/.test(s.descZh || ''));
  console.log('Fix4 descZh: **星号:', mdStar.length, '| 反引号:', mdTick.length, '| 重复标题:', dupTitle.length, '| 双句号:', doublePeriod.length);

  // Fix5: steps → 对象数组
  data.forEach(s => {
    if (s.tier !== 'rejected') s.steps = buildSteps(s);
  });
  const strSteps = valid.filter(s => Array.isArray(s.steps) && s.steps.length && typeof s.steps[0] === 'string');
  const objSteps = valid.filter(s => Array.isArray(s.steps) && s.steps.length && typeof s.steps[0] === 'object');
  console.log('Fix5 steps: 字符串数组(渲染空白):', strSteps.length, '| 对象数组(正常):', objSteps.length);

  // Fix6: includes
  data.forEach(s => {
    if (s.tier !== 'rejected') s.includes = extractIncludes(s);
  });
  const hasInc = valid.filter(s => s.includes !== null);
  const nullInc = valid.filter(s => s.includes === null);
  console.log('Fix6 includes: 有真实值:', hasInc.length, '| null(隐藏):', nullInc.length);

  // Fix7: previewImages
  data.forEach(s => { s.previewImages = cleanPreviewImages(s); });
  const hasImgs = valid.filter(s => (s.previewImages || []).length > 0);
  const placeholderImgs = valid.filter(s => (s.previewImages || []).some(i => /uniq_|placeholder/.test(i)));
  console.log('Fix7 previewImages: 有图:', hasImgs.length, '| 占位残留:', placeholderImgs.length);

  // 同步到 cloud-skills-data.js
  data.forEach(s => { delete s.skillMdContent; });
  fs.writeFileSync(IN, JSON.stringify(data, null, 2));
  console.log('\n已保存:', IN);

  // 统计
  console.log('\n=== 最终统计 ===');
  const cjk = s => (String(s || '').match(/[\u4e00-\u9fa5]/g) || []).length;
  console.log('nameZh 含中文:', valid.filter(s => cjk(s.nameZh) > 0).length, '/', valid.length);
  console.log('descZh 中文>=50%:', valid.filter(s => { const t = s.descZh || ''; return t.length && cjk(t) / t.length >= 0.5; }).length, '/', valid.length);
  console.log('有 GitHub stars:', data.filter(s => s.githubStars !== undefined).length);
  console.log('reviews 空(正常):', valid.filter(s => !s.reviews || !s.reviews.length).length);
}

main();
