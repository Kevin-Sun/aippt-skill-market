// e2e-v8.js · 中文化 + 搜索交互 + 数据质量验收（30 条静态契约）
// 不依赖 devtools 渲染，纯代码结构 + 数据契约 + 逻辑分支验证
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'miniprogram');
let pass = 0, fail = 0, results = [];

function assert(cond, name, detail) {
  if (cond) { pass++; results.push(`  ✅ ${name}`); }
  else { fail++; results.push(`  ❌ ${name}: ${detail || ''}`); }
}

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; }
}

console.log('=== e2e-v8: 中文化 + 搜索交互 + 数据质量 ===\n');

// ========== I18N: 中文化验证 ==========
console.log('I18N-01~08: 中文化验证');

const skillsService = readFile(path.join(ROOT, 'data/skills-service.js'));
const indexWxml = readFile(path.join(ROOT, 'pages/index/index.wxml'));
const detailWxml = readFile(path.join(ROOT, 'pages/detail/detail.wxml'));
const searchWxml = readFile(path.join(ROOT, 'pages/search/search.wxml'));

// I18N-01: skills-service.js 含 displayName/displayDesc 映射
assert(
  skillsService.indexOf('displayName') >= 0 && skillsService.indexOf('displayDesc') >= 0,
  'I18N-01 skills-service.js 含 displayName/displayDesc 映射'
);

// I18N-02: index.wxml 用 displayName（不是 name）
assert(
  indexWxml.indexOf('{{item.displayName}}') >= 0 && indexWxml.indexOf('{{item.displayDesc}}') >= 0,
  'I18N-02 index.wxml 用 displayName/displayDesc'
);

// I18N-03: detail.wxml 用 displayName
assert(
  detailWxml.indexOf('{{skill.displayName}}') >= 0 && detailWxml.indexOf('{{skill.displayDesc}}') >= 0,
  'I18N-03 detail.wxml 用 displayName/displayDesc'
);

// I18N-04: search.wxml 用 displayName
assert(
  searchWxml.indexOf('{{item.displayName}}') >= 0 && searchWxml.indexOf('{{item.displayDesc}}') >= 0,
  'I18N-04 search.wxml 用 displayName/displayDesc'
);

// I18N-05~08: 数据层 nameZh 质量
const cloudData = require(path.join(ROOT, 'data/cloud-skills-data.js'));
const validSkills = cloudData.filter(s => s.tier !== 'rejected');
const cjk = s => (String(s||'').match(/[\u4e00-\u9fa5]/g)||[]).length;

const nameZhNonEmpty = validSkills.filter(s => s.nameZh && s.nameZh.length > 0).length;
assert(nameZhNonEmpty === validSkills.length,
  'I18N-05 nameZh 非空率 100%',
  `${nameZhNonEmpty}/${validSkills.length}`
);

const nameZhCjk = validSkills.filter(s => cjk(s.nameZh) > 0).length;
assert(nameZhCjk === validSkills.length,
  'I18N-06 nameZh 含中文 100%',
  `${nameZhCjk}/${validSkills.length}`
);

const nameZhUniq = new Set(validSkills.map(s => s.nameZh));
assert(nameZhUniq.size / validSkills.length >= 0.95,
  'I18N-07 nameZh 唯一率 >=95%',
  `${nameZhUniq.size}/${validSkills.length} = ${(nameZhUniq.size/validSkills.length*100).toFixed(1)}%`
);

const pptxbug = validSkills.filter(s => /PPTXPPT|PPTPPT/.test(s.nameZh || ''));
assert(pptxbug.length === 0,
  'I18N-08 无 PPTXPPT/PPTPPT 重复词 bug',
  `${pptxbug.length} 条命中`
);

// ========== SEARCH: 搜索交互验证 ==========
console.log('\nSEARCH-01~12: 搜索交互验证');

const indexJs = readFile(path.join(ROOT, 'pages/index/index.js'));
const searchJs = readFile(path.join(ROOT, 'pages/search/search.js'));

// SEARCH-01: index.js 搜索索引含 nameZh
assert(
  indexJs.indexOf('s.nameZh') >= 0 && indexJs.indexOf('s.descZh') >= 0,
  'SEARCH-01 index.js 搜索索引含 nameZh+descZh'
);

// SEARCH-02: search.js 搜索索引含 nameZh
assert(
  searchJs.indexOf('s.nameZh') >= 0 && searchJs.indexOf('s.descZh') >= 0,
  'SEARCH-02 search.js 搜索索引含 nameZh+descZh'
);

// SEARCH-03: index.js 有 showLoading
assert(
  indexJs.indexOf('showLoading') >= 0,
  'SEARCH-03 index.js 搜索有 showLoading 反馈'
);

// SEARCH-04: index.js 有 hideLoading
assert(
  indexJs.indexOf('hideLoading') >= 0,
  'SEARCH-04 index.js 搜索有 hideLoading'
);

// SEARCH-05: index.wxml 有搜索结果条
assert(
  indexWxml.indexOf('search-result-bar') >= 0 && indexWxml.indexOf('searchResultsCount') >= 0,
  'SEARCH-05 index.wxml 有搜索结果条（显示结果数）'
);

// SEARCH-06: index.wxml 搜索态隐藏 banner
assert(
  indexWxml.indexOf('wx:if="{{!showSearchResults}}"') >= 0,
  'SEARCH-06 index.wxml 搜索态隐藏 banner+场景栏'
);

// SEARCH-07: index.wxml 有清除按钮
assert(
  indexWxml.indexOf('search-clear-btn') >= 0 || indexWxml.indexOf('onSearchClear') >= 0,
  'SEARCH-07 index.wxml 有搜索清除按钮'
);

// SEARCH-08: index.wxml 有空态
assert(
  indexWxml.indexOf('search-empty-state') >= 0 || indexWxml.indexOf('未找到') >= 0,
  'SEARCH-08 index.wxml 有搜索空态'
);

// SEARCH-09: index.wxml 空态有快捷词
assert(
  indexWxml.indexOf('quick-tag') >= 0 && indexWxml.indexOf('onQuickSearch') >= 0,
  'SEARCH-09 index.wxml 空态有快捷词'
);

// SEARCH-10: index.wxml 空态有 CTA
assert(
  indexWxml.indexOf('empty-cta') >= 0 || indexWxml.indexOf('浏览全部') >= 0,
  'SEARCH-10 index.wxml 空态有「浏览全部」CTA'
);

// SEARCH-11: index.js 有 onQuickSearch 方法
assert(
  indexJs.indexOf('onQuickSearch') >= 0,
  'SEARCH-11 index.js 有 onQuickSearch 方法'
);

// SEARCH-12: index.js 搜索有 trim 防纯空格
assert(
  indexJs.indexOf('.trim()') >= 0,
  'SEARCH-12 index.js 搜索有 trim 防纯空格'
);

// ========== LOGIC: 搜索逻辑跑测 ==========
console.log('\nLOGIC-01~10: 搜索逻辑跑测');

const skillsServiceModule = require(path.join(ROOT, 'data/skills-service.js'));

// LOGIC-01: 搜「答辩」有结果
const r1 = skillsServiceModule.search('答辩');
assert(r1 && r1.length > 0, 'LOGIC-01 搜「答辩」有结果', `${r1 ? r1.length : 0} 条`);

// LOGIC-02: 搜「工作汇报」有结果
const r2 = skillsServiceModule.search('工作汇报');
assert(r2 && r2.length > 0, 'LOGIC-02 搜「工作汇报」有结果', `${r2 ? r2.length : 0} 条`);

// LOGIC-03: 搜「学术」有结果
const r3 = skillsServiceModule.search('学术');
assert(r3 && r3.length > 0, 'LOGIC-03 搜「学术」有结果', `${r3 ? r3.length : 0} 条`);

// LOGIC-04: 搜「PPT」有结果
const r4 = skillsServiceModule.search('PPT');
assert(r4 && r4.length > 0, 'LOGIC-04 搜「PPT」有结果', `${r4 ? r4.length : 0} 条`);

// LOGIC-05: 搜「pptx」有结果（小写）
const r5 = skillsServiceModule.search('pptx');
assert(r5 && r5.length > 0, 'LOGIC-05 搜「pptx」有结果', `${r5 ? r5.length : 0} 条`);

// LOGIC-06: 搜「Claude」有结果
const r6 = skillsServiceModule.search('Claude');
assert(r6 && r6.length > 0, 'LOGIC-06 搜「Claude」有结果', `${r6 ? r6.length : 0} 条`);

// LOGIC-07: 搜中文名命中（如「论文」）
const r7 = skillsServiceModule.search('论文');
assert(r7 && r7.length > 0, 'LOGIC-07 搜「论文」有结果', `${r7 ? r7.length : 0} 条`);

// LOGIC-08: 搜不存在的词不抛异常
let r8err = false;
try { skillsServiceModule.search('zzzznotfound'); } catch (e) { r8err = true; }
assert(!r8err, 'LOGIC-08 搜不存在的词不抛异常');

// LOGIC-09: 空串返回全量
const r9 = skillsServiceModule.search('');
assert(r9 && r9.length > 0, 'LOGIC-09 空串返回全量', `${r9 ? r9.length : 0} 条`);

// LOGIC-10: skills-service.js 搜索函数含 originalName 保留
assert(
  skillsService.indexOf('originalName') >= 0,
  'LOGIC-10 skills-service.js 保留 originalName 供搜索'
);

// ========== 汇总 ==========
console.log('\n=== e2e-v8 结果: ' + pass + ' PASS / ' + fail + ' FAIL ===');
if (fail > 0) {
  console.log('\n失败项:');
  results.filter(r => r.startsWith('  ❌')).forEach(r => console.log(r));
}
process.exit(fail > 0 ? 1 : 0);
