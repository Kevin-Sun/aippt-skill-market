#!/usr/bin/env node
// rebuild-steps-v3.js · 重建 steps：6场景4步骨架 + 注入skill名 + 过滤技术词
// 输入: raw-materials/skills-final.json
// 产出: 同文件原地更新 steps + includes
const fs = require('fs');
const path = require('path');
const IN = path.resolve(__dirname, '..', 'raw-materials', 'skills-final.json');

const TECH_WORDS = /\bpython\b|pptx库|import |shapes|SVG|matplotlib|PIL|Canvas|脚本|命令行|CLI|代码|DrawingML|\.py\b|pip install|requirements|node_modules|npm/i;

const SCENE_STEPS = {
  '工作汇报': { action: '做一份工作汇报', tips: '说清楚汇报周期和关键指标' },
  '答辩': { action: '做毕业答辩PPT', tips: '把研究背景、方法、结果各放一两页' },
  '学术研究': { action: '做学术报告', tips: '附上实验数据和图表' },
  '商务展示': { action: '做商务路演', tips: '突出产品亮点和市场规模' },
  '创意设计': { action: '做创意提案', tips: '描述品牌调性和视觉风格' },
  '教育课件': { action: '做教学课件', tips: '列出知识点和教学大纲' },
};

function buildSteps(skill) {
  const name = skill.nameZh || skill.name || 'PPT技能';
  const agent = skill.recommendedAgent || 'Claude';
  const sceneData = SCENE_STEPS[skill.scene] || SCENE_STEPS['工作汇报'];
  const action = sceneData.action;
  const tips = sceneData.tips;
  return [
    { num: 1, title: '拿到技能', desc: `点「购买解锁」后复制「${name}」技能包，粘贴给你的 AI 助手（推荐 ${agent}，也支持 Claude / Codex / 豆包 / WorkBuddy）` },
    { num: 2, title: '说出需求', desc: `在对话框里说「${action}」，可以拖入 Word / PDF / 图片，也可以直接粘贴文字。${tips}` },
    { num: 3, title: '确认风格', desc: `${agent} 会先问你要几页、什么配色、要不要套模板。确认后开始生成，想省事就说「直接生成」` },
    { num: 4, title: '局部精修', desc: '生成的是可编辑 PPT。哪页不满意就继续说「第 3 页换成柱状图」，也可在 PowerPoint 里直接改' },
  ];
}

function validateIncludes(inc) {
  if (!inc) return null;
  const t = parseInt(inc.templates) || 0;
  const l = parseInt(inc.layouts) || 0;
  const c = parseInt(inc.colorSchemes) || 0;
  if (t < 1 || t > 30 || l < 1 || l > 30 || c < 1 || c > 30) return null;
  return { templates: t, layouts: l, colorSchemes: c };
}

function main() {
  const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const valid = data.filter(s => s.tier !== 'rejected');
  let stepFixed = 0, incFixed = 0, techCaught = 0;

  valid.forEach(s => {
    const oldSteps = s.steps;
    s.steps = buildSteps(s);
    if (JSON.stringify(oldSteps) !== JSON.stringify(s.steps)) stepFixed++;
    if (TECH_WORDS.test(JSON.stringify(s.steps))) techCaught++;
    const oldInc = s.includes;
    s.includes = validateIncludes(s.includes);
    if (oldInc !== s.includes) incFixed++;
  });

  // 同步到 cloud-skills-data.js
  data.forEach(s => { delete s.skillMdContent; });
  fs.writeFileSync(IN, JSON.stringify(data, null, 2));
  const js = 'var cloudSkills = ' + JSON.stringify(data, null, 2) + ';\nmodule.exports = cloudSkills;\n';
  fs.writeFileSync(path.join(__dirname, '..', 'miniprogram/data/cloud-skills-data.js'), js);

  console.log('=== rebuild-steps-v3 ===');
  console.log('steps 重建:', stepFixed, '/', valid.length);
  console.log('技术词命中:', techCaught, '(应为0)');
  console.log('includes 校验修正:', incFixed);
  console.log('cloud-skills-data.js 已同步');

  // 验证样本
  console.log('\n=== 样本 ===');
  ['skill_001', 'skill_new_001', 'skill_010'].forEach(id => {
    const s = data.find(x => x.id === id) || valid[0];
    if (s) {
      console.log(`${s.nameZh} (${s.scene}, ${s.recommendedAgent})`);
      s.steps.forEach(st => console.log(`  [${st.num}] ${st.title}: ${st.desc.slice(0, 50)}`));
      console.log('');
    }
  });
}

main();
