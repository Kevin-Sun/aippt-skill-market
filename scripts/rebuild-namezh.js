#!/usr/bin/env node
// rebuild-namezh.js · 重建 nameZh：语义分词 + owner 名兜底 + 唯一性校验
// 输入: raw-materials/skills-final.json
// 产出: 同文件原地更新 nameZh
// 用法: node scripts/rebuild-namezh.js

const fs = require('fs');
const path = require('path');
const IN = path.resolve(__dirname, '..', 'raw-materials', 'skills-final.json');

const TOKEN_MAP = [
  ['thesis', '论文'], ['defense', '答辩'], ['academic', '学术'], ['graduation', '毕业'],
  ['consulting', '咨询'], ['corporate', '企业'], ['business', '商务'], ['enterprise', '企业'],
  ['creative', '创意'], ['design', '设计'], ['brand', '品牌'], ['minimal', '极简'],
  ['data', '数据'], ['chart', '图表'], ['dashboard', '仪表盘'], ['visualization', '可视化'],
  ['html', 'HTML'], ['image', '配图'], ['image2', '配图'], ['3d', '3D'],
  ['editable', '可编辑'], ['paper', '论文'], ['research', '研究'], ['science', '科学'],
  ['education', '教学'], ['course', '课程'], ['lecture', '讲座'], ['teaching', '教学'],
  ['report', '汇报'], ['quarterly', '季报'], ['annual', '年报'], ['review', '复盘'],
  ['pitch', '路演'], ['investor', '融资'], ['startup', '创业'], ['product', '产品'],
  ['marketing', '营销'], ['sales', '销售'], ['finance', '财务'], ['strategy', '战略'],
  ['kingdee', '金蝶'], ['yonyou', '用友'], ['huawei', '华为'], ['apple', '苹果'],
  ['stripe', 'Stripe'], ['linear', 'Linear'], ['marp', 'Marp'], ['bento', '便当'],
  ['nano', 'Nano'], ['banana', '香蕉'], ['raccoon', '浣熊'], ['whale', '鲸鱼'],
  ['orange', '橙子'], ['fire', '火焰'], ['grid', '网格'], ['oracle', '甲骨文'],
  ['translate', '翻译'], ['enterprise', '企业'], ['leadership', '领导力'],
  ['competition', '竞赛'], ['economics', '经济学'], ['empirical', '实证'],
  ['cyber', '赛博'], ['hackflow', '黑客流'], ['antigravity', '反重力'],
  ['plain', '简约'], ['sync', '同步'], ['enhanced', '增强版'], ['ultimate', '终极'],
  ['gen', '生成器'], ['maker', '制作器'], ['master', '大师'], ['agent', 'Agent'],
  ['maker', '工具'], ['canvas', '画布'], ['notebook', '笔记本'], ['briefing', '简报'],
  ['pdf', 'PDF'], ['pptx', 'PPTX'], ['ppt', 'PPT'], ['slide', '幻灯片'],
  ['deck', '演示稿'], ['presentation', '演示文稿'], ['keynote', 'Keynote'],
  ['html-to-pptx', 'HTML转PPTX'], ['image2pptx', '图片转PPTX'],
  ['paper2ppt', '论文转PPT'], ['paper-to-ppt', '论文转PPT'], ['notebooklm', 'NotebookLM'],
  ['pdf2ppt', 'PDF转PPT'], ['pdf2pptx', 'PDF转PPTX'], ['svg2pptx', 'SVG转PPTX'],
  ['gpt-image', 'GPT配图'], ['gpt-image2', 'GPT配图'], ['awesome', '精选'],
  ['codex', 'Codex'], ['claude', 'Claude'], ['doubao', '豆包'], ['workbuddy', 'WorkBuddy'],
  ['dashi', '大师'], ['marauders', '突击队'], ['spacex', 'SpaceX'],
];

function tokenize(slug) {
  if (!slug) return [];
  let parts = slug.toLowerCase().replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  parts = parts.replace(/[^a-z0-9\u4e00-\u9fa5 ]/g, ' ').split(/\s+/).filter(Boolean);
  return parts;
}

function mapToken(word) {
  for (const [key, zh] of TOKEN_MAP) {
    if (word === key || word.startsWith(key) || word.includes(key)) return zh;
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
  for (const t of tokens) {
    const zh = mapToken(t);
    if (zh && !seen.has(zh)) { zhParts.push(zh); seen.add(zh); }
  }
  if (zhParts.length === 0) {
    const descCjk = (description || '').match(/[\u4e00-\u9fa5]+/g);
    if (descCjk && descCjk.length > 0) return descCjk.slice(0, 3).join('') + 'PPT技能';
    return 'PPT技能';
  }
  if (!zhParts.includes('PPT') && !zhParts.includes('PPTX') && !zhParts.includes('演示') && !zhParts.includes('幻灯')) {
    zhParts.push('PPT');
  }
  if (!zhParts.includes('技能') && !zhParts.includes('工具') && !zhParts.includes('生成器') && !zhParts.includes('制作器')) {
    zhParts.push('技能');
  }
  return zhParts.join('');
}

function getOwnerName(source) {
  if (!source) return '';
  if (source === 'Behance' || source === 'X' || source === 'ComposioHQ' || source === 'composio-community' || source === 'promptadvisers') return '';
  const parts = source.split('/');
  let owner = parts.length > 1 ? parts[0] : source;
  if (/^\d{4,}/.test(owner) || /\d{6,}/.test(owner) || owner.length < 2 || owner === 'X') return '';
  owner = owner.replace(/[-_]/g, '');
  if (owner.length > 8) owner = owner.slice(0, 8);
  return owner;
}

function main() {
  const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const valid = data.filter(s => s.tier !== 'rejected');
  console.log('总条数:', data.length, '| 有效:', valid.length);

  const used = new Set();

  valid.forEach(s => {
    let name = buildNameZh(s.name, s.previewDesc);
    if (name.length > 16) name = name.slice(0, 16);

    if (!used.has(name)) { s.nameZh = name; used.add(name); return; }

    const owner = getOwnerName(s.source);
    if (owner && !used.has(name + owner)) {
      s.nameZh = name + owner;
      used.add(name + owner);
      return;
    }

    const scene = s.scene || '';
    if (scene && !used.has(name + scene)) {
      s.nameZh = name + scene;
      used.add(name + scene);
      return;
    }

    const style = s.style || '';
    if (style && !used.has(name + scene + style)) {
      s.nameZh = name + scene + style;
      used.add(name + scene + style);
      return;
    }

    let i = 2;
    while (used.has(name + i)) i++;
    s.nameZh = name + i;
    used.add(name + i);
  });

  const uniq = new Set(valid.map(s => s.nameZh));
  const dupGroups = {};
  valid.forEach(s => { const n = s.nameZh; dupGroups[n] = (dupGroups[n] || 0) + 1; });
  const dups = Object.entries(dupGroups).filter(([k, v]) => v > 1);
  const pptxbug = valid.filter(s => /PPTXPPT|PPTPPT/.test(s.nameZh || ''));

  console.log('唯一 nameZh:', uniq.size, '/', valid.length, '=', (uniq.size / valid.length * 100).toFixed(1) + '%');
  console.log('重名组数:', dups.length);
  console.log('PPTXPPT 重复词 bug:', pptxbug.length);
  console.log('样本:');
  valid.slice(0, 10).forEach(s => console.log('  ' + s.name + ' → ' + s.nameZh));

  fs.writeFileSync(IN, JSON.stringify(data, null, 2));
  console.log('\n已保存:', IN);
}

main();
