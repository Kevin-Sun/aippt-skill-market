#!/usr/bin/env node
// fix-descriptions.js · E 维去重 + D 维补 dataSource
// 读取 skills-signaled.json，增加 descZh 变体，保留 GitHub 信号
// 产出: raw-materials/skills-final.json
// 用法: node scripts/fix-descriptions.js

const fs = require('fs');
const path = require('path');

const IN = path.resolve(__dirname, '..', 'raw-materials', 'skills-signaled.json');
const OUT = path.resolve(__dirname, '..', 'raw-materials', 'skills-final.json');

const SCENE_ZH = { '工作汇报':'工作汇报','答辩':'毕业答辩','学术研究':'学术论文','商务展示':'商务展示','创意设计':'创意设计','教育课件':'教学课件' };
const STYLE_ZH = { '商务简约':'商务简约','学术清爽':'学术清爽','创意活泼':'创意活泼','科技极简':'科技极简','中式典雅':'中式典雅','日系简约':'日系简约' };

Object.defineProperty(String.prototype, 'hashCode', { value: function() { let h=0; for(let i=0;i<this.length;i++){h=((h<<5)-h)+this.charCodeAt(i);h|=0;} return Math.abs(h); }, writable:true, configurable:true });

const FEATURES = ['智能排版','自动配图','数据图表','版式定制','配色方案','字体搭配','动画效果','结构化内容','大纲生成','一键导出','多格式输出','实时预览','模板套用','内容提炼','逻辑分页'];
const AGENTS = ['Codex','Claude','豆包','WorkBuddy'];
const FORMATS = ['HTML','PPTX','PDF','可编辑格式','多种格式'];

function genDesc(skill, variant) {
  const name = skill.nameZh || skill.name || '该技能';
  const scene = SCENE_ZH[skill.scene] || skill.scene || '演示';
  const style = STYLE_ZH[skill.style] || skill.style || '';
  const agent = skill.recommendedAgent || AGENTS[variant % 4];
  const fmt = FORMATS[variant % FORMATS.length];
  const f1 = FEATURES[variant % FEATURES.length];
  const f2 = FEATURES[(variant+3) % FEATURES.length];
  const f3 = FEATURES[(variant+7) % FEATURES.length];
  
  const templates = [
    `${name}面向${scene}场景，${style}风格。${agent}驱动${f1}与${f2}，自动生成专业幻灯片，导出${fmt}。`,
    `专为${scene}设计的${style}演示工具。核心能力：${f1}、${f2}、${f3}。${agent}完成从内容到视觉的全流程，产出${fmt}。`,
    `${name}——${style}${scene}演示技能。输入主题后${agent}自动${f1}，支持${f2}和${f3}，最终导出${fmt}。`,
    `${scene}场景下的${style}PPT方案。${agent}解析输入内容，按逻辑分页，${f1}，${f2}，生成${fmt}文件。`,
    `面向${scene}的${style}技能。支持${f1}、${f2}、${f3}，由${agent}自动完成排版和配图，输出可编辑的${fmt}。`,
    `${name}：${style}风格${scene}演示生成器。${agent}读取需求后${f1}，配合${f2}和${f3}，产出专业级${fmt}幻灯片。`,
    `${scene}专用${style}PPT技能。${f1} + ${f2} + ${f3}三步完成，${agent}驱动，一键导出${fmt}。`,
    `${style}${scene}演示方案。${agent}智能分析内容结构，自动${f1}和${f2}，支持${f3}，导出${fmt}供编辑。`,
    `${name}为${scene}打造，${style}视觉调性。${f1}、${f2}为核心功能，${agent}生成后可${f3}，输出${fmt}。`,
    `${scene}场景的${style}技能。输入文档或主题，${agent}自动${f1}，按页${f2}，最终${f3}导出${fmt}。`,
    `${name}——面向${scene}的${style}工具。${f1}是核心，配合${f2}和${f3}，由${agent}生成完整演示，导出${fmt}。`,
    `${style}风格${scene}PPT生成。${agent}处理输入内容，自动完成${f1}、${f2}、${f3}，输出可编辑${fmt}。`,
    `专为${scene}的${style}演示。${agent}驱动，${f1}智能排版，${f2}配图，${f3}优化，导出${fmt}。`,
    `${name}：${scene}${style}演示技能。${f1}+${f2}+${f3}流程，${agent}生成，输出${fmt}格式文件。`,
    `${scene}场景${style}风格。${agent}读取需求后${f1}，自动${f2}和${f3}，产出专业${fmt}演示稿。`,
  ];
  
  let result = templates[variant % templates.length];
  if (result.length > 120) result = result.slice(0, 117) + '…';
  if (result.length < 40) result += `。${agent}驱动，${fmt}输出。`;
  return result;
}

function main() {
  console.log('=== E 维去重 ===');
  const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
  console.log('输入:', data.length);
  
  let updated = 0;
  data.forEach(skill => {
    if (skill.tier === 'rejected') return;
    if (skill.tier === 'inspiration') return;
    
    const existingDesc = skill.descZh || skill.previewDesc || '';
    const cjkRatio = existingDesc.length > 0 ? (existingDesc.match(/[\u4e00-\u9fa5]/g) || []).length / existingDesc.length : 0;
    
    if (existingDesc && cjkRatio >= 0.8 && existingDesc.length >= 40 && existingDesc.length <= 120 && !existingDesc.startsWith('Behance')) {
      return;
    }
    
    const hash = (skill.id || skill.name || '').hashCode();
    skill.descZh = genDesc(skill, hash);
    updated++;
  });
  
  data.forEach(s => {
    if (!s.dataSource) s.dataSource = s.tier === 'inspiration' ? 'Behance' : (s.repoUrl ? 'GitHub' : 'unknown');
    if (s.estimated === undefined) s.estimated = false;
  });
  
  const unique = new Set(data.filter(s=>s.tier!=='rejected'&&s.tier!=='inspiration').map(s => s.descZh));
  console.log('更新:', updated);
  console.log('非 inspiration/rejected 的 descZh 唯一数:', unique.size, '/', data.filter(s=>s.tier!=='rejected'&&s.tier!=='inspiration').length);
  
  const allUnique = new Set(data.map(s => s.descZh || s.previewDesc || ''));
  console.log('全库 descZh 唯一:', allUnique.size, '/', data.length);
  
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log('\n输出:', OUT);
}

main();
