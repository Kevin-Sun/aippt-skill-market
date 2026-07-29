// verify-search.js · 30 个搜索验证 case
const db = require('./skill-db.js');
db.load();

let pass = 0, fail = 0;
const results = [];

function assert(cond, name, detail) {
  if (cond) { pass++; results.push({ name, status: 'PASS' }); }
  else { fail++; results.push({ name, status: 'FAIL', detail }); }
  console.log(`  ${cond ? '✅' : '❌'} ${name}${detail ? ' :: ' + detail : ''}`);
}

console.log('=== 30 个搜索验证 case ===\n');

// 场景筛选（6 个 case）
console.log('--- 场景筛选 ---');
assert(db.getByScene('工作汇报').length > 0, 'VC1 工作汇报有结果', `count=${db.getByScene('工作汇报').length}`);
assert(db.getByScene('答辩').length > 0, 'VC2 答辩有结果', `count=${db.getByScene('答辩').length}`);
assert(db.getByScene('学术研究').length > 0, 'VC3 学术研究有结果', `count=${db.getByScene('学术研究').length}`);
assert(db.getByScene('商务展示').length > 0, 'VC4 商务展示有结果', `count=${db.getByScene('商务展示').length}`);
assert(db.getByScene('创意设计').length > 0, 'VC5 创意设计有结果', `count=${db.getByScene('创意设计').length}`);
assert(db.getByScene('教育课件').length > 0, 'VC6 教育课件有结果', `count=${db.getByScene('教育课件').length}`);

// 风格筛选（6 个 case）
console.log('\n--- 风格筛选 ---');
assert(db.getByStyle('商务简约').length > 0, 'VC7 商务简约有结果', `count=${db.getByStyle('商务简约').length}`);
assert(db.getByStyle('学术清爽').length > 0, 'VC8 学术清爽有结果', `count=${db.getByStyle('学术清爽').length}`);
assert(db.getByStyle('创意活泼').length > 0, 'VC9 创意活泼有结果', `count=${db.getByStyle('创意活泼').length}`);
assert(db.getByStyle('科技极简').length > 0, 'VC10 科技极简有结果', `count=${db.getByStyle('科技极简').length}`);
assert(db.getByStyle('中式典雅').length > 0, 'VC11 中式典雅有结果', `count=${db.getByStyle('中式典雅').length}`);
assert(db.getByStyle('日系简约').length > 0, 'VC12 日系简约有结果', `count=${db.getByStyle('日系简约').length}`);

// 语言筛选（3 个 case）
console.log('\n--- 语言筛选 ---');
assert(db.getByLanguage('中文').length > 0, 'VC13 中文有结果', `count=${db.getByLanguage('中文').length}`);
assert(db.getByLanguage('英文').length > 0, 'VC14 英文有结果', `count=${db.getByLanguage('英文').length}`);
assert(db.getByLanguage('双语').length > 0, 'VC15 双语有结果', `count=${db.getByLanguage('双语').length}`);

// Agent 筛选（4 个 case）
console.log('\n--- Agent 筛选 ---');
assert(db.getByAgent('Codex').length > 0, 'VC16 Codex有结果', `count=${db.getByAgent('Codex').length}`);
assert(db.getByAgent('豆包').length > 0, 'VC17 豆包有结果', `count=${db.getByAgent('豆包').length}`);
assert(db.getByAgent('WorkBuddy').length > 0, 'VC18 WorkBuddy有结果', `count=${db.getByAgent('WorkBuddy').length}`);
assert(db.getByAgent('Claude').length > 0, 'VC19 Claude有结果', `count=${db.getByAgent('Claude').length}`);

// 搜索（10 个 case）
console.log('\n--- 搜索 ---');
assert(db.search('PPT').length > 0, 'VC20 搜索PPT', `count=${db.search('PPT').length}`);
assert(db.search('汇报').length > 0, 'VC21 搜索汇报', `count=${db.search('汇报').length}`);
assert(db.search('答辩').length > 0, 'VC22 搜索答辩', `count=${db.search('答辩').length}`);
assert(db.search('商务').length > 0, 'VC23 搜索商务', `count=${db.search('商务').length}`);
assert(db.search('slide').length > 0, 'VC24 搜索slide', `count=${db.search('slide').length}`);
assert(db.search('presentation').length > 0, 'VC25 搜索presentation', `count=${db.search('presentation').length}`);
assert(db.search('pptx').length > 0, 'VC26 搜索pptx', `count=${db.search('pptx').length}`);
assert(db.search('deck').length > 0, 'VC27 搜索deck', `count=${db.search('deck').length}`);
assert(db.search('工作').length > 0, 'VC28 搜索工作', `count=${db.search('工作').length}`);
assert(db.search('学术').length > 0, 'VC29 搜索学术', `count=${db.search('学术').length}`);

// 免费 skill（1 个 case）
console.log('\n--- 免费 ---');
assert(db.getFree().length > 0, 'VC30 免费skill有结果', `count=${db.getFree().length}`);

console.log(`\n=== 验证结果: ${pass} PASS / ${fail} FAIL ===`);
console.log(`通过率: ${Math.round(pass/(pass+fail)*100)}%`);
