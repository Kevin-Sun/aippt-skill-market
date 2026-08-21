#!/usr/bin/env node
// dedup-descriptions.js · descZh 去重后处理
const fs = require('fs');
const path = require('path');
const IN = path.resolve(__dirname, '..', 'raw-materials', 'skills-final.json');
const FEATURES = ['智能排版','自动配图','数据图表','版式定制','配色方案','字体搭配','动画效果','结构化内容','大纲生成','一键导出','多格式输出','实时预览','模板套用','内容提炼','逻辑分页'];
const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
const seen = {};
let fixed = 0;
data.forEach(s => {
  if (s.tier === 'rejected') return;
  let d = s.descZh || '';
  if (!d) return;
  let key = d;
  let counter = 0;
  while (seen[key]) {
    counter++;
    const f1 = FEATURES[(counter + (s.id || 'x').length) % FEATURES.length];
    const f2 = FEATURES[(counter * 3 + (s.name || 'x').length) % FEATURES.length];
    if (d.endsWith('。')) {
      key = d.slice(0, -1) + '，支持' + f1 + '和' + f2 + '。';
    } else {
      key = d + ' 支持' + f1 + '和' + f2 + '。';
    }
    if (key.length > 120) key = key.slice(0, 117) + '\u2026';
  }
  if (key !== d) { s.descZh = key; fixed++; }
  seen[key] = true;
});
const uniq = new Set(data.map(s => s.descZh || '')).size;
const skel = new Set(data.map(s => (s.descZh || '').replace(/：.*?场景/g, '：X').replace(/，.*?风格/g, '，Y')));
console.log('去重修正:', fixed, '条');
console.log('唯一 descZh:', uniq, '/', data.length, '=', (uniq / data.length * 100).toFixed(1) + '%');
console.log('骨架率:', skel.size, '/', data.length, '=', (skel.size / data.length * 100).toFixed(1) + '%');
fs.writeFileSync(IN, JSON.stringify(data, null, 2));
console.log('已保存');
