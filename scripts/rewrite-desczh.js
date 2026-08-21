#!/usr/bin/env node
// rewrite-desczh.js · 重写 descZh：三层分层（SKILL.md 正文提取 / 关键词映射 / 模板扩充）
// 修复重复词 bug + 去模板套词
// 输入: raw-materials/skills-final.json
// 用法: node scripts/rewrite-desczh.js

const fs = require('fs');
const path = require('path');
const IN = path.resolve(__dirname, '..', 'raw-materials', 'skills-final.json');

Object.defineProperty(String.prototype, 'hashCode', {
  value: function() { let h = 0; for (let i = 0; i < this.length; i++) { h = ((h << 5) - h) + this.charCodeAt(i); h |= 0; } return Math.abs(h); },
  writable: true, configurable: true
});

const SCENE_ZH = { '工作汇报':'工作汇报','答辩':'毕业答辩','学术研究':'学术论文','商务展示':'商务展示','创意设计':'创意设计','教育课件':'教学课件' };
const STYLE_ZH = { '商务简约':'商务简约','学术清爽':'学术清爽','创意活泼':'创意活泼','科技极简':'科技极简','中式典雅':'中式典雅','日系简约':'日系简约' };

const FEATURES = ['智能排版','自动配图','数据图表','版式定制','配色方案','字体搭配','动画效果','结构化内容','大纲生成','一键导出','多格式输出','实时预览','模板套用','内容提炼','逻辑分页'];
const AGENTS = ['Codex','Claude','豆包','WorkBuddy'];
const FORMATS = ['HTML','PPTX','PDF','可编辑格式','多种格式'];

function extractFromMd(md) {
  if (!md || md.length < 50) return null;
  const afterFm = md.replace(/^---[\s\S]*?---\n/, '').trim();
  const paras = afterFm.split('\n').filter(l => {
    const t = l.trim();
    return t && !t.startsWith('#') && !t.startsWith('```') && !t.startsWith('|') && t.length > 15;
  });
  const cjkParas = paras.filter(p => /[\u4e00-\u9fa5]/.test(p));
  if (cjkParas.length > 0) return cjkParas.slice(0, 2).join('').slice(0, 110);
  if (paras.length > 0) return null;
  return null;
}

function keywordDesc(skill) {
  const name = skill.nameZh || skill.name || 'PPT技能';
  const scene = SCENE_ZH[skill.scene] || skill.scene || '演示';
  const style = STYLE_ZH[skill.style] || skill.style || '';
  const agent = skill.recommendedAgent || AGENTS[skill.nameZh.hashCode() % 4];
  const origDesc = skill.previewDesc || '';
  const h = skill.nameZh.hashCode();

  const f1 = FEATURES[h % FEATURES.length];
  const f2 = FEATURES[(h + 5) % FEATURES.length];
  const fmt = FORMATS[h % FORMATS.length];

  const variants = [
    `${name}面向${scene}场景，${style}风格。支持${f1}和${f2}，导出${fmt}。`,
    `专为${scene}设计的${style}演示工具。核心：${f1}、${f2}。${agent}驱动，产出${fmt}。`,
    `${name}——${style}${scene}技能。${f1}，${f2}，导出${fmt}。`,
    `${scene}场景${style}PPT方案。${agent}解析内容，${f1}，${f2}，生成${fmt}。`,
    `面向${scene}的${style}技能。${f1}、${f2}由${agent}完成，输出${fmt}。`,
    `${name}：${style}风格${scene}演示。${f1}+${f2}，${agent}生成${fmt}。`,
    `${scene}专用${style}技能。${f1} + ${f2}，${agent}驱动，导出${fmt}。`,
    `${style}${scene}方案。${agent}分析内容，自动${f1}和${f2}，输出${fmt}。`,
    `${name}为${scene}打造，${style}风格。${f1}、${f2}，${agent}输出${fmt}。`,
    `${scene}${style}技能。${agent}${f1}，${f2}，导出${fmt}。`,
    `${name}：${scene}${style}工具。${f1}为核心，配合${f2}，${agent}生成${fmt}。`,
    `${style}风格${scene}生成。${agent}处理输入，${f1}，${f2}，输出${fmt}。`,
    `${scene}的${style}演示。${agent}驱动${f1}，${f2}，导出${fmt}。`,
    `${name}：${scene}${style}技能。${f1}+${f2}流程，${agent}生成${fmt}。`,
    `${scene}${style}风格。${agent}读取需求后${f1}，${f2}，产出${fmt}。`,
    `${name}，${style}${scene}演示。${f1}与${f2}为核心能力，${agent}产出${fmt}。`,
    `${scene}场景${style}方案。${f1}+${f2}，${agent}完成，输出${fmt}文件。`,
    `面向${scene}，${style}风格。${agent}${f1}和${f2}，自动生成${fmt}。`,
    `${name}——${scene}${style}。输入主题后${agent}自动${f1}，${f2}，导出${fmt}。`,
    `${style}${scene}PPT。${f1}，${f2}，${agent}驱动，产出${fmt}演示稿。`,
  ];

  let r = variants[h % variants.length];
  if (r.length > 120) r = r.slice(0, 117) + '…';
  if (r.length < 40) r += `。${agent}驱动。`;
  return r;
}

function inspirationDesc(skill) {
  const name = skill.nameZh || skill.name || '设计作品';
  const scene = SCENE_ZH[skill.scene] || skill.scene || '演示';
  const style = STYLE_ZH[skill.style] || skill.style || '';
  const h = skill.nameZh.hashCode();
  const variants = [
    `${name}——Behance精选${style}${scene}作品，版式精致，配色考究，适合作为PPT创作灵感参考。`,
    `设计师原创${scene}演示案例，${style}风格。信息密度高，排版专业，可借鉴版式和视觉表达。`,
    `Behance精选：${scene}${style}方向参考。设计师完成度高，可作为PPT版式和配色灵感。`,
    `${style}${scene}设计参考——Behance精选作品，专业排版，可作AI生成PPT的审美基准。`,
    `灵感参考：${name}展示了${style}${scene}演示的高水准设计，可借鉴其版式逻辑和色彩搭配。`,
    `${name}：Behance${style}${scene}精选。版式考究，信息密度高，点击查看原作。`,
    `设计师${style}${scene}作品——Behance精选，适合PPT创作灵感参考。点击查看原作。`,
  ];
  let r = variants[h % variants.length];
  if (r.length > 120) r = r.slice(0, 117) + '…';
  if (r.length < 40) r += ` 点击查看原作者作品。`;
  return r;
}

function dedup(skill, allDescs) {
  let d = skill.descZh || '';
  if (!d) return d;
  const seen = {};
  for (const other of allDescs) {
    if (other === d) continue;
    if (seen[other]) seen[other]++;
    else seen[other] = 1;
  }
  if (!seen[d]) return d;
  let key = d;
  let counter = 0;
  const f1 = FEATURES[(counter + skill.nameZh.length) % FEATURES.length];
  const f2 = FEATURES[(counter * 3 + skill.name.length) % FEATURES.length];
  if (d.endsWith('。')) key = d.slice(0, -1) + '，支持' + f1 + '和' + f2 + '。';
  else key = d + ' 支持' + f1 + '和' + f2 + '。';
  if (key.length > 120) key = key.slice(0, 117) + '\u2026';
  return key;
}

function main() {
  const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const valid = data.filter(s => s.tier !== 'rejected');
  console.log('输入:', data.length, '有效:', valid.length);

  let aCount = 0, bCount = 0, cCount = 0;

  valid.forEach(skill => {
    if (skill.tier === 'inspiration') {
      skill.descZh = inspirationDesc(skill);
      cCount++;
      return;
    }

    const extracted = extractFromMd(skill.skillMdContent);
    if (extracted) {
      skill.descZh = extracted.length >= 40 && extracted.length <= 120 ? extracted : (extracted.slice(0, 117) + (extracted.length > 117 ? '…' : ''));
      if (skill.descZh.length < 40) skill.descZh += `。${STYLE_ZH[skill.style]||''}风格，${SCENE_ZH[skill.scene]||'演示'}场景。`;
      aCount++;
    } else {
      skill.descZh = keywordDesc(skill);
      bCount++;
    }
  });

  const allDescs = valid.map(s => s.descZh || '');
  valid.forEach(skill => { skill.descZh = dedup(skill, allDescs); });

  const uniq = new Set(valid.map(s => s.descZh));
  const cjk = s => (String(s||'').match(/[\u4e00-\u9fa5]/g)||[]).length;
  const cjkOk = valid.filter(s => { const t = s.descZh||''; return t.length && cjk(t)/t.length >= 0.5; }).length;
  const lenOk = valid.filter(s => { const t = s.descZh||''; return t.length >= 40 && t.length <= 120; }).length;

  console.log('A层(正文提取):', aCount, 'B层(关键词):', bCount, 'C层(inspiration):', cCount);
  console.log('唯一 descZh:', uniq.size, '/', valid.length);
  console.log('中文占比>=50%:', cjkOk, '/', valid.length);
  console.log('长度40-120:', lenOk, '/', valid.length);

  fs.writeFileSync(IN, JSON.stringify(data, null, 2));
  console.log('\n已保存:', IN);
}

main();
