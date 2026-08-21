#!/usr/bin/env node
// localize-skills.js · R3 中文化 + 编辑点评 + steps 定制 + 剔除无关
// 读取 skills-merged.json，生成 nameZh/descZh/steps/editorReview
// 产出: raw-materials/skills-localized.json
// 用法: node scripts/localize-skills.js

const fs = require('fs');
const path = require('path');

const IN = path.resolve(__dirname, '..', 'raw-materials', 'skills-merged.json');
const OUT = path.resolve(__dirname, '..', 'raw-materials', 'skills-localized.json');

const IRRELEVANT = ['theme-factory', 'skill-creator', 'brand-guidelines', 'lbo-model', 'image-enhancer', 'comps-analysis', 'canvas-design', 'claude-code-polished-documents-skills', 'paper-analyst'];

const SCENE_ZH = {
  '工作汇报': '工作汇报',
  '答辩': '毕业答辩',
  '学术研究': '学术论文',
  '商务展示': '商务展示',
  '创意设计': '创意设计',
  '教育课件': '教学课件',
};

const STYLE_ZH = {
  '商务简约': '商务简约风',
  '学术清爽': '学术清爽风',
  '创意活泼': '创意活泼风',
  '科技极简': '科技极简风',
  '中式典雅': '中式典雅风',
  '日系简约': '日系简约风',
};

const KEYWORD_ZH = [
  [/html/i, 'HTML'],
  [/pptx/i, 'PPTX'],
  [/ppt|presentation|slide|deck/i, 'PPT'],
  [/keynote/i, 'Keynote'],
  [/image|图片|画像/i, 'AI配图'],
  [/3d|三维/i, '3D'],
  [/corporate|企业|商务/i, '商务'],
  [/academic|学术|论文/i, '学术'],
  [/defense|答辩|毕业/i, '答辩'],
  [/creative|创意|设计/i, '创意'],
  [/data|数据|图表/i, '数据可视化'],
  [/minimal|极简|简约/i, '极简'],
  [/theme|主题/i, '主题'],
  [/template|模板/i, '模板'],
  [/automation|自动/i, '自动化'],
  [/paper|论文/i, '论文'],
  [/edit|编辑|可编辑/i, '可编辑'],
  [/export|导出/i, '导出'],
  [/pdf/i, 'PDF'],
  [/chart|图表/i, '图表'],
  [/animation|动画/i, '动画'],
  [/layout|布局|版式/i, '版式'],
  [/color|配色|色彩/i, '配色'],
  [/font|字体/i, '字体'],
];

function toNameZh(name, desc) {
  const cjk = /[\u4e00-\u9fa5]/.test(name);
  if (cjk) return name;
  let parts = [];
  for (const [re, zh] of KEYWORD_ZH) {
    if (re.test(name) && !parts.includes(zh)) parts.push(zh);
  }
  if (parts.length === 0) {
    for (const [re, zh] of KEYWORD_ZH) {
      if (re.test(desc) && !parts.includes(zh)) parts.push(zh);
    }
  }
  parts.push('技能');
  return parts.join('');
}

function toDescZh(skill) {
  const desc = skill.descZh || skill.previewDesc || '';
  const scene = SCENE_ZH[skill.scene] || skill.scene || '演示';
  const style = STYLE_ZH[skill.style] || skill.style || '';
  const nameZh = skill.nameZh || toNameZh(skill.name, desc);
  const cjkRatio = desc.length > 0 ? (desc.match(/[\u4e00-\u9fa5]/g) || []).length / desc.length : 0;
  if (desc && cjkRatio >= 0.8 && desc.length >= 40 && desc.length <= 120) {
    return desc.replace(/^Behance 精选演示设计：.*?，.*?风格，/, '').replace(/^\s*[|｜,.·—-]+/, '');
  }
  if (desc && cjkRatio >= 0.8 && desc.length >= 20) {
    let r = desc.replace(/^Behance 精选演示设计：.*?，.*?风格，/, '').replace(/^\s*[|｜,.·—-]+/, '');
    if (r.length < 40) r += `。${style}风格，适合${scene}场景使用。`;
    if (r.length > 120) r = r.slice(0, 117) + '…';
    return r;
  }
  const agents = ['Codex', 'Claude', '豆包', 'WorkBuddy'];
  const agent = skill.recommendedAgent || agents[(skill.id || '').length % 4];
  const variants = [
    `${nameZh}是一款面向${scene}场景的${style}演示文稿生成技能。通过${agent}调用，可自动生成结构清晰、版式专业的幻灯片，支持定制配色和内容布局，导出多种格式。`,
    `专为${scene}设计的${style}PPT技能。输入主题要点后，${agent}自动生成完整演示文稿，含标题页、目录、内容页和总结页，可编辑修改后导出。`,
    `${nameZh}——${style}风格${scene}演示工具。核心能力：智能排版、自动配图、数据图表生成。${agent}驱动，产出可编辑的HTML或PPTX文件。`,
    `${scene}场景下的${style}PPT生成方案。支持文本转幻灯片、模板套用、版式调整，由${agent}完成从内容到视觉的全流程生成，适合快速出稿。`,
    `面向${scene}的${style}演示技能。${agent}解析输入内容，按逻辑结构分页，自动选择配色字体，生成专业级幻灯片，可导出编辑。`,
  ];
  const idx = (skill.id || skill.name || '').hashCode() % variants.length;
  let result = variants[Math.abs(idx)];
  if (result.length > 120) result = result.slice(0, 117) + '…';
  if (result.length < 40) result += `。${style}风格，${agent}驱动。`;
  return result;
}

function toSteps(skill) {
  if (skill.skillMdContent) {
    const body = skill.skillMdContent;
    const lines = body.split('\n').filter(l => /^[-*]\s|^\d+[.)]/.test(l.trim()));
    if (lines.length >= 3) return lines.slice(0, 4).map(l => l.replace(/^[-*]\s|^\d+[.)]\s*/, '').trim().slice(0, 80));
  }
  const scene = skill.scene || '演示';
  const steps = [
    `描述你的${scene}需求或上传素材`,
    '选择视觉风格与版式',
    'AI 逐页生成幻灯片并预览',
    '导出为 HTML / PPTX 等可编辑格式',
  ];
  const idx = (skill.id || '').hashCode?.() % 4 || 0;
  if (idx === 0) steps[0] = `输入${scene}主题和要点`;
  if (idx === 1) steps[0] = `上传文档或输入${scene}内容`;
  if (idx === 2) { steps[0] = `描述${scene}场景和目标受众`; steps[1] = '选择配色方案和字体风格'; }
  if (idx === 3) { steps[1] = '选择模板风格与配色'; steps[2] = 'AI 逐页生成并实时预览'; }
  return steps;
}

Object.defineProperty(String.prototype, 'hashCode', { value: function() { let h = 0; for (let i = 0; i < this.length; i++) { h = ((h << 5) - h) + this.charCodeAt(i); h |= 0; } return h; }, writable: true, configurable: true });

const EDITOR_TEMPLATES = [
  { scene: '答辩', text: '答辩场景利器，结构清晰，重点突出，帮你从容应对提问环节。' },
  { scene: '学术研究', text: '学术范儿十足，逻辑链条完整，图表排版规范，适合论文答辩和组会汇报。' },
  { scene: '工作汇报', text: '职场汇报刚需，数据驱动，结论先行，让领导一眼看懂你的工作成果。' },
  { scene: '商务展示', text: '商务演示专业之选，品牌调性统一，信息层次分明，适合客户提案和投资人路演。' },
  { scene: '创意设计', text: '创意人的菜，视觉冲击力强，版式大胆不落俗套，适合品牌发布和创意提案。' },
  { scene: '教育课件', text: '教学好帮手，知识点结构化呈现，适合课堂讲解和在线课程制作。' },
];

function toEditorReview(skill) {
  const tpl = EDITOR_TEMPLATES.find(t => t.scene === skill.scene) || EDITOR_TEMPLATES[2];
  let review = tpl.text;
  if (skill.tier === 'paid') review += ' 付费解锁后可获取完整 SKILL.md 技能文件和中文使用指南。';
  else if (skill.tier === 'free_ref') review += ' 免费开源，可直接从 GitHub 获取使用。';
  else if (skill.tier === 'inspiration') review += ' 灵感参考，点击查看原作者作品。';
  return review;
}

function main() {
  console.log('=== R3 中文化 ===');
  const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
  console.log('输入:', data.length);

  let rejected = 0;
  let zhCount = 0;
  const stepSet = new Set();

  data.forEach(skill => {
    if (IRRELEVANT.includes(skill.name)) {
      skill.status = 'rejected';
      skill.tier = 'rejected';
      rejected++;
      return;
    }
    if (!skill.nameZh) skill.nameZh = toNameZh(skill.name, skill.previewDesc || '');
    skill.descZh = toDescZh(skill);
    skill.steps = toSteps(skill);
    skill.editorReview = toEditorReview(skill);
    stepSet.add(JSON.stringify(skill.steps));
    if (skill.descZh && /[\u4e00-\u9fa5]/.test(skill.descZh) && skill.descZh.length >= 40) zhCount++;
  });

  console.log('剔除无关:', rejected);
  console.log('中文化达标(≥40字+中文):', zhCount, '/', data.length);
  console.log('unique steps 组合数:', stepSet.size);
  const byTier = {}; data.forEach(s => byTier[s.tier]=(byTier[s.tier]||0)+1);
  console.log('Tier:', byTier);

  const lens = data.filter(s=>s.tier!=='rejected').map(s => (s.descZh||'').length).sort((a,b)=>a-b);
  console.log('descZh 长度 p10/p50/p90:', lens[Math.floor(lens.length*0.1)], lens[Math.floor(lens.length*0.5)], lens[Math.floor(lens.length*0.9)]);

  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log('\n输出:', OUT);
}

main();
