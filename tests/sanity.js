// sanity.js · 防回归 sanity 套件（10 类 × N 子检查）
// 每类对应一个真实踩过的坑。纯静态分析，无 devtools 依赖。
// 运行：node tests/sanity.js
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', 'miniprogram');
let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  ✅ ' + m); } else { fail++; console.log('  ❌ ' + m); } }

// ========== S1. 数据字段完整性矩阵 ==========
console.log('\nS1. 数据字段完整性矩阵（防 compartment #6 详情页空白）');
const svc = require(path.join(ROOT, 'data', 'skills-service.js'));
const all = svc.skills;
const NEED = ['id','name','previewDesc','scene','style','language','price','isFree','recommendedAgent','gradient','includes','steps','rating','salesCount','suitableFor'];
let missing = 0;
for (const f of NEED) {
  const n = all.filter(x => { const v = x[f]; return v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0); }).length;
  if (n < all.length) { missing += (all.length - n); console.log('  ⚠️ ' + f + ': ' + n + '/' + all.length); }
}
ok(missing === 0, '15 个核心字段全覆盖 (' + all.length + ' 条)');

// ========== S2. gradient 类型一致性 ==========
console.log('\nS2. gradient 类型一致性（防 Phase 0 回归：数组→CSS 字符串）');
const arrG = all.filter(x => Array.isArray(x.gradient)).length;
const strG = all.filter(x => typeof x.gradient === 'string' && x.gradient.indexOf('linear-gradient') === 0).length;
ok(arrG === 0, '无数组形式 gradient (' + arrG + ' 条)');
ok(strG === all.length, '全部为合法 CSS 字符串 (' + strG + '/' + all.length + ')');

// ========== S3. 悬空跳转扫描 ==========
console.log('\nS3. 悬空跳转扫描（防 favorites 类幽灵页面）');
const app = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
const declared = new Set(app.pages);
let dangling = 0;
function walkJump(d) {
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    const s = fs.statSync(fp);
    if (s.isDirectory()) { if (f !== 'node_modules') walkJump(fp); continue; }
    if (!/\.(js|wxml)$/.test(f)) continue;
    const src = fs.readFileSync(fp, 'utf8');
    for (const m of src.matchAll(/(?:navigateTo|redirectTo|reLaunch)\s*\(\s*\{[^}]*?url:\s*['"`]([^'"`?]+)/g)) {
      const u = m[1].replace(/^\//, '');
      if (!declared.has(u)) { dangling++; console.log('  ❌ 悬空: ' + u + ' ← ' + fp.replace(ROOT + '/', '')); }
    }
  }
}
walkJump(ROOT);
ok(dangling === 0, '无悬空跳转');

// switchTab 目标必须在 tabBar
const tabs = new Set(((app.tabBar && app.tabBar.list) || []).map(t => t.pagePath));
let badTab = 0;
function walkTab(d) {
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f); const s = fs.statSync(fp);
    if (s.isDirectory()) { if (f !== 'node_modules') walkTab(fp); continue; }
    if (!/\.(js|wxml)$/.test(f)) continue;
    const src = fs.readFileSync(fp, 'utf8');
    for (const m of src.matchAll(/switchTab\s*\(\s*\{[^}]*?url:\s*['"`]([^'"`?]+)/g)) {
      const u = m[1].replace(/^\//, '');
      if (!tabs.has(u)) { badTab++; console.log('  ❌ switchTab 到非 tab 页: ' + u); }
    }
  }
}
walkTab(ROOT);
ok(badTab === 0, 'switchTab 目标全部合法');

// ========== S4. 重复键检测 ==========
console.log('\nS4. 重复键检测（防 skills.js reviews 被覆盖 bug）');
let dupKeys = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'data')).filter(x => x.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(ROOT, 'data', f), 'utf8');
  const blocks = src.split(/\n\s*\{/);
  blocks.forEach((b, i) => {
    const keys = [...b.matchAll(/^\s+(\w+):/gm)].map(m => m[1]);
    const seen = {}, d = [];
    keys.forEach(k => { if (seen[k]) d.push(k); seen[k] = 1; });
    if (d.length) { dupKeys += d.length; console.log('  ⚠️ ' + f + ' 块#' + i + ' 重复键: ' + [...new Set(d)].join(',')); }
  });
}
ok(dupKeys === 0, '无重复键');

// ========== S5. 假数据回归 ==========
console.log('\nS5. 假数据回归（防 1200 条 PPT Skill #N 式命名）');
const fakeNames = all.filter(x => /^PPT Skill #?\d+$|^Skill \d+$/i.test(x.name));
const dupNames = Object.entries(all.reduce((m, x) => { m[x.name] = (m[x.name] || 0) + 1; return m; }, {})).filter(([, v]) => v > 1);
const dupIds = Object.entries(all.reduce((m, x) => { m[x.id] = (m[x.id] || 0) + 1; return m; }, {})).filter(([, v]) => v > 1);
ok(fakeNames.length === 0, '无假名 (PPT Skill #N 式)');
ok(dupNames.length === 0, '无重名');
ok(dupIds.length === 0, '无重 id');

// ========== S6. WXSS 非 ASCII ==========
console.log('\nS6. WXSS 非 ASCII（防编译失败 compartment #199）');
let badAscii = 0;
function walkWxss(d) {
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f); const s = fs.statSync(fp);
    if (s.isDirectory()) { if (f !== 'node_modules') walkWxss(fp); continue; }
    if (!f.endsWith('.wxss')) continue;
    const c = fs.readFileSync(fp, 'utf8');
    // 去掉注释后再检查
    const noComment = c.replace(/\/\*[\s\S]*?\*\//g, '');
    if (/[^\x00-\x7F]/.test(noComment)) { badAscii++; console.log('  ❌ ' + fp.replace(ROOT + '/', '')); }
  }
}
walkWxss(ROOT);
ok(badAscii === 0, 'WXSS 无非 ASCII 字符');

// ========== S7. 包体积 + 单图上限 ==========
console.log('\nS7. 包体积 + 单图上限（防 13MB 超限 compartment #200）');
let totalSize = 0, bigImg = 0;
function walkSize(d) {
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f); const s = fs.statSync(fp);
    if (s.isDirectory()) { if (f !== 'node_modules') walkSize(fp); continue; }
    totalSize += s.size;
    if (/\.(png|jpg|jpeg|gif)$/.test(f) && s.size > 200 * 1024) {
      bigImg++; console.log('  ⚠️ ' + f + ' ' + (s.size / 1024).toFixed(0) + 'KB > 200KB');
    }
  }
}
walkSize(ROOT);
ok(totalSize < 4 * 1024 * 1024, '包体积 < 4MB (' + (totalSize / 1024 / 1024).toFixed(2) + 'MB)');
ok(bigImg === 0, '无单图 > 200KB (' + bigImg + ' 个)');

// ========== S8. 路径事实源一致性 ==========
console.log('\nS8. 路径事实源（真项目 vs 脚手架 appid 必须不同, memory #239/#240）');
const realProj = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'project.config.json'), 'utf8'));
const tmplProj = JSON.parse(fs.readFileSync('/Users/sunkai/ops-dashboard/templates/miniprogram-base/project.config.json', 'utf8'));
ok(realProj.appid && realProj.appid !== 'touristappid', '真项目 appid 是生产值 (' + realProj.appid + ')');
ok(tmplProj.appid === 'touristappid', '脚手架 appid 是 touristappid (非生产)');

// ========== S9. 云端/本地价格一致性 ==========
console.log('\nS9. 云端/本地价格一致性（防 decimal→integer 漏改 compartment #231）');
const cloud = require(path.join(ROOT, 'data', 'cloud-skills-data.js'));
const local = require(path.join(ROOT, 'data', 'skills.js')).skills;
const badPrice = cloud.filter(x => typeof x.price !== 'number' || x.price !== Math.floor(x.price));
ok(badPrice.length === 0, '云端 price 全整数 (' + (cloud.length - badPrice.length) + '/' + cloud.length + ')');
const badLocalPrice = local.filter(x => typeof x.price !== 'number' || x.price !== Math.floor(x.price));
ok(badLocalPrice.length === 0, '本地 price 全整数 (' + (local.length - badLocalPrice.length) + '/' + local.length + ')');

// ========== S10. 凭据齐备性 ==========
console.log('\nS10. 凭据齐备性（防 -604100 长链条）');
const cbrc = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'cloudbaserc.json'), 'utf8'));
const payFn = cbrc.functions && cbrc.functions.find(f => f.name === 'payment');
const env = payFn && payFn.envVariables || {};
const needVars = ['APPID', 'APP_SECRET', 'MCHID', 'OFFER_ID', 'VIRTUAL_PAYMENT_KEY'];
let missingVar = 0;
for (const v of needVars) {
  if (!env[v]) { missingVar++; console.log('  ❌ payment envVariables.' + v + ' 缺失'); }
}
ok(missingVar === 0, '5 个凭据齐备');

// envId 三处一致（app.js + cloudbaserc + project.config）
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const envInApp = appJs.match(/env\s*:\s*['"]([^'"]+)['"]/);
const envId = envInApp && envInApp[1];
ok(envId === cbrc.envId, 'envId app.js === cloudbaserc (' + envId + ')');

// ========== 结果 ==========
console.log('\n=== sanity 结果: ' + pass + ' PASS / ' + fail + ' FAIL ===');
process.exit(fail > 0 ? 1 : 0);
