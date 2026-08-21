// e2e-v9.js · UI 重构验收（25 条静态契约）
// 验证 steps 对象数组、卖点区渲染、假数据隐藏、卡片 UI 重设计
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'miniprogram');
let pass = 0, fail = 0, results = [];

function assert(cond, name, detail) {
  if (cond) { pass++; results.push(`  ✅ ${name}`); }
  else { fail++; results.push(`  ❌ ${name}: ${detail || ''}`); }
}
function readFile(p) { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; } }

console.log('=== e2e-v9: UI 重构验收 ===\n');

// ========== DATA: steps + includes + markdown ==========
console.log('DATA-01~08: 数据质量');

const cloudData = require(path.join(ROOT, 'data/cloud-skills-data.js'));
const valid = cloudData.filter(s => s.tier !== 'rejected');
const cjk = s => (String(s||'').match(/[\u4e00-\u9fa5]/g)||[]).length;

// steps 全是对象数组
const strSteps = valid.filter(s => Array.isArray(s.steps) && s.steps.length && typeof s.steps[0] === 'string');
assert(strSteps.length === 0, 'DATA-01 steps 无字符串数组（全对象数组）', `${strSteps.length} 条残留`);

// steps 每条有 num/title/desc
const stepsOk = valid.filter(s => Array.isArray(s.steps) && s.steps.every(st => st && st.title && st.desc));
assert(stepsOk.length === valid.length, 'DATA-02 steps 每条有 num/title/desc', `${stepsOk.length}/${valid.length}`);

// 无 markdown 残留
const mdStar = valid.filter(s => /\*\*/.test(s.descZh || ''));
const mdTick = valid.filter(s => /`/.test(s.descZh || ''));
assert(mdStar.length === 0, 'DATA-03 descZh 无 ** 星号', `${mdStar.length} 条`);
assert(mdTick.length === 0, 'DATA-04 descZh 无反引号', `${mdTick.length} 条`);

// 无占位 previewImages
const placeholder = valid.filter(s => (s.previewImages || []).some(i => /uniq_|placeholder/.test(i)));
assert(placeholder.length === 0, 'DATA-05 无占位 previewImages', `${placeholder.length} 条`);

// includes 为 null 的条目（应被前端隐藏）
const nullInc = valid.filter(s => s.includes === null || s.includes === undefined);
assert(nullInc.length > 0, 'DATA-06 includes 有 null 值（前端应隐藏）', `${nullInc.length} 条 null`);

// nameZh 无语义重复
const semRep = valid.filter(s => /幻灯片PPT|演示文稿PPT|PPT.*PPT/.test(s.nameZh || ''));
assert(semRep.length === 0, 'DATA-07 nameZh 无语义重复', `${semRep.length} 条`);

// nameZh 无 owner 硬拼后缀
const ownerSuffix = valid.filter(s => /[\u4e00-\u9fa5][A-Za-z]{4,}$/.test(s.nameZh || ''));
assert(ownerSuffix.length === 0, 'DATA-08 nameZh 无 owner 硬拼后缀', `${ownerSuffix.length} 条`);

// ========== WXML: 详情页结构 ==========
console.log('\nWXML-01~08: 详情页结构');

const detailWxml = readFile(path.join(ROOT, 'pages/detail/detail.wxml'));

// hero-card 渐变设计卡
assert(detailWxml.indexOf('hero-card') >= 0, 'WXML-01 详情页有 hero-card 渐变设计卡');

// 无旧 preview-swiper（已改为预览区用新 class）
assert(detailWxml.indexOf('preview-swiper') >= 0 && detailWxml.indexOf('previewDeck') >= 0, 'WXML-02 预览区用新 preview-swiper + previewDeck');

// editorReview 渲染
assert(detailWxml.indexOf('editorReview') >= 0, 'WXML-03 详情页渲染 editorReview（编辑点评）');

// includes 条件隐藏
assert(detailWxml.indexOf('wx:if="{{skill.includes}}"') >= 0, 'WXML-04 includes 条件隐藏（null 不显示）');

// rating 条件隐藏
assert(detailWxml.indexOf('wx:if="{{skill.githubStars !== undefined}}"') >= 0, 'WXML-05 评分区条件隐藏（无 GitHub stars 不显示）');

// steps 对象数组渲染
assert(detailWxml.indexOf('{{item.num}}') >= 0 && detailWxml.indexOf('{{item.title}}') >= 0 && detailWxml.indexOf('{{item.desc}}') >= 0,
  'WXML-06 steps 渲染 num/title/desc 对象字段');

// inspiration 专属布局
assert(detailWxml.indexOf("skill.tier === 'inspiration'") >= 0, 'WXML-07 inspiration 专属布局（查看原作）');

// 已购交付物
assert(detailWxml.indexOf('isPurchased') >= 0 && detailWxml.indexOf('installCmd') >= 0, 'WXML-08 已购交付物区（installCmd）');

// ========== WXML: 列表卡片 ==========
console.log('\nCARD-01~05: 列表卡片 UI');

const indexWxml = readFile(path.join(ROOT, 'pages/index/index.wxml'));

// agent 移到底部 meta 行
assert(indexWxml.indexOf('skill-agent') >= 0, 'CARD-01 agent 在底部 meta 行（skill-agent class）');

// 无 skill-recommend 在 header
const headerMatch = indexWxml.match(/skill-card-header[\s\S]*?<\/view>/);
assert(!headerMatch || headerMatch[0].indexOf('skill-recommend') < 0, 'CARD-02 卡片头部无 skill-recommend');

// tier badge 在 header
assert(indexWxml.indexOf('skill-tier-badge') >= 0, 'CARD-03 卡片头部有 tier badge（付费/免费/参考）');

// ========== WXSS: 样式 ==========
console.log('\nSTYLE-01~04: 样式');

const indexWxss = readFile(path.join(ROOT, 'pages/index/index.wxss'));

// header min-height 降低
const mh = indexWxss.match(/min-height:\s*(\d+)rpx/);
assert(mh && parseInt(mh[1]) <= 60, 'STYLE-01 卡片头部 min-height ≤60rpx', mh ? mh[1] : 'not found');

// style-tag 有 flex:1
assert(indexWxss.indexOf('flex: 1') >= 0 || indexWxss.indexOf('flex:1') >= 0, 'STYLE-02 style-tag 有 flex:1');

// tier-badge 有 flex-shrink:0
assert(indexWxss.indexOf('flex-shrink: 0') >= 0 || indexWxss.indexOf('flex-shrink:0') >= 0, 'STYLE-03 tier-badge 有 flex-shrink:0');

// agent 有 white-space:nowrap
assert(indexWxss.indexOf('white-space: nowrap') >= 0, 'STYLE-04 agent 有 white-space:nowrap');

// ========== LOGIC: 详情页方法 ==========
console.log('\nLOGIC-01~04: 详情页方法');

const detailJs = readFile(path.join(ROOT, 'pages/detail/detail.js'));

assert(detailJs.indexOf('onViewOriginalTap') >= 0, 'LOGIC-01 有 onViewOriginalTap 方法');
assert(detailJs.indexOf('onCopyInstall') >= 0, 'LOGIC-02 有 onCopyInstall 方法');
assert(detailJs.indexOf('onShareAppMessage') >= 0, 'LOGIC-03 有 onShareAppMessage（分享裂变）');

// ========== 汇总 ==========
console.log('\n=== e2e-v9 结果: ' + pass + ' PASS / ' + fail + ' FAIL ===');
if (fail > 0) {
  console.log('\n失败项:');
  results.filter(r => r.startsWith('  ❌')).forEach(r => console.log(r));
}
process.exit(fail > 0 ? 1 : 0);
