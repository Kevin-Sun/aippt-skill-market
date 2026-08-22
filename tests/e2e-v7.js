// e2e-v7.js · Bug 1 + Bug 2 修复验收（22 条静态契约+逻辑测试）
// 避免 fake pass：不依赖 devtools 渲染，纯代码结构+数据契约+逻辑分支验证
// 这些 case 验证的是「代码里有没有写防御逻辑」，不是「页面上能不能看到」
// 页面行为用真机验证（PAY-09+、E2E-05+ 真机测试用例）
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'miniprogram');
const CLOUD = path.join(__dirname, '..', 'cloudfunctions');
let pass = 0, fail = 0, results = [];

function assert(cond, name, detail) {
  if (cond) { pass++; results.push(`  ✅ ${name}`); }
  else { fail++; results.push(`  ❌ ${name}: ${detail || ''}`); }
}

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; }
}

console.log('=== e2e-v7: Bug 1 (支付) + Bug 2 (价格) 修复验收 ===\n');

// === PAY-01 → PAY-08（支付防御逻辑）===
console.log('PAY-01~08: 支付防御逻辑');
const detailJs = readFile(path.join(ROOT, 'pages/detail/detail.js'));
const memberJs = readFile(path.join(ROOT, 'pages/member/member.js'));

// PAY-01: detail.js 含 wx.login code 空值防御 + 用户化弹窗（v1.5.4 起不再暴露调试信息）
assert(
  detailJs.indexOf("if (loginErr || !code)") >= 0 && detailJs.indexOf('登录状态获取失败') >= 0,
  'PAY-01 detail.js wx.login code 空值防御 + 用户化弹窗'
);

// PAY-02: detail.js 含 LOGIN_CODE_TTL_MS 缓存常量
assert(
  detailJs.indexOf('LOGIN_CODE_TTL_MS') >= 0 && detailJs.indexOf('4 * 60 * 1000') >= 0,
  'PAY-02 detail.js LOGIN_CODE_TTL_MS 缓存常量（4分钟）'
);

// PAY-03: v1.5.4 下单失败弹窗不含 errno 调试信息（用户话术）
assert(
  detailJs.indexOf('下单失败') >= 0 && detailJs.indexOf('errno=') < 0 && detailJs.indexOf('原始：') < 0,
  'PAY-03 detail.js 下单失败弹窗用户化（无 errno/原始错误串）'
);

// PAY-04: v1.5.4 code 一次性消费：下单后立即作废缓存
assert(
  detailJs.indexOf('invalidateLoginCode') >= 0 && memberJs.indexOf('invalidateLoginCode') >= 0,
  'PAY-04 detail/member.js 均有 invalidateLoginCode（code 消费即作废）'
);

// PAY-05: v1.5.4 40163 静默重试（换新 code 自动重试一次）
assert(
  detailJs.indexOf('40163') >= 0 && memberJs.indexOf('40163') >= 0,
  'PAY-05 detail/member.js 40163 检测 + 静默重试'
);

// PAY-06: v1.5.4 支付失败弹窗用户化（无 errCode 标题、无调试映射）
assert(
  detailJs.indexOf('支付未完成') >= 0 && detailJs.indexOf('mapPaymentError') < 0 && detailJs.indexOf('mapCloudError') < 0,
  'PAY-06 detail.js 支付失败弹窗用户化（移除 mapPaymentError/mapCloudError 调试映射）'
);

// PAY-07: detail.js callVirtualPayment fail 分支调 wx.showModal（不写 orderRecords）
const failMatch = detailJs.match(/fail:\s*function\(res\)\s*{[\s\S]*?showModal/);
assert(
  failMatch !== null,
  'PAY-07 detail.js callVirtualPayment fail 分支调 showModal（不直接写 orderRecords）'
);

// PAY-08: detail.js callVirtualPayment success 分支调 unlockSkill
assert(
  /success:\s*function\([^)]*\)\s*{[\s\S]*?self\.unlockSkill\(\)/.test(detailJs),
  'PAY-08 detail.js callVirtualPayment success 分支调 unlockSkill'
);

// PAY-09: detail.js callVirtualPayment fail 分支有 cancel 静默分支（-1/-2/cancel → return 不弹 modal）
const detailCancelMatch = detailJs.match(/fail:\s*function\(res\)\s*{[\s\S]*?(?:errCode\s*===?\s*-1|errCode\s*===?\s*-2|indexOf\(['"]cancel[']\))/);
assert(
  detailCancelMatch !== null,
  'PAY-09 detail.js fail 分支有 cancel 静默分支（-1/-2/cancel → return）'
);

// PAY-10: detail.js mapPaymentError 覆盖 -1 和 -2
assert(
  detailJs.indexOf('errCode === -1') >= 0 && detailJs.indexOf('errCode === -2') >= 0,
  'PAY-10 detail.js mapPaymentError 覆盖 -1 和 -2'
);

// PAY-11: member.js callVirtualPayment fail 分支有 cancel 静默分支
const memberCancelMatch = memberJs.match(/fail:\s*function\(res\)\s*{[\s\S]*?(?:errCode\s*===?\s*-1|errCode\s*===?\s*-2|indexOf\(['"]cancel[']\))/);
assert(
  memberCancelMatch !== null,
  'PAY-11 member.js fail 分支有 cancel 静默分支'
);

results.forEach(r => console.log(r));
results.length = 0;

// === PRICE-01 → PRICE-06（价格一致性）===
console.log('\nPRICE-01~06: 价格一致性');

// PRICE-01: 所有 WXML 不含 9.9/19.9/2.9/99.9
const PRICE_RE = /\b(2\.9|9\.9|19\.9|99\.9)\b/;
let wxmlPriceResidue = false;
function scanWxmlPrice(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      scanWxmlPrice(fp);
    } else if (f.endsWith('.wxml')) {
      const content = readFile(fp);
      if (PRICE_RE.test(content)) {
        console.log(`  ❌ ${fp}: 含小数价格`);
        wxmlPriceResidue = true;
      }
    }
  });
}
scanWxmlPrice(ROOT);
assert(!wxmlPriceResidue, 'PRICE-01 所有 WXML 无 9.9/19.9/2.9/99.9 硬编码');

// PRICE-02: skills.js 所有 price 字段是整数
const skillsJs = readFile(path.join(ROOT, 'data/skills.js'));
const skillPrices = [];
skillsJs.replace(/price:\s*(\d+(?:\.\d+)?)/g, function(_, p) {
  skillPrices.push(parseFloat(p));
  return _;
});
const allInteger = skillPrices.every(p => Number.isInteger(p));
assert(allInteger, 'PRICE-02 skills.js 所有 price 字段是整数', `找到: ${skillPrices.filter(p => !Number.isInteger(p)).join(',')}`);

// PRICE-03: cloud-skills-data.js 所有 price 字段是整数
const cloudSkillsJs = readFile(path.join(ROOT, 'data/cloud-skills-data.js'));
const cloudPrices = [];
cloudSkillsJs.replace(/price:\s*(\d+(?:\.\d+)?)/g, function(_, p) {
  cloudPrices.push(parseFloat(p));
  return _;
});
const cloudAllInteger = cloudPrices.every(p => Number.isInteger(p));
assert(cloudAllInteger, 'PRICE-03 cloud-skills-data.js 所有 price 字段是整数', `找到: ${cloudPrices.filter(p => !Number.isInteger(p)).slice(0, 3).join(',')}`);

// PRICE-04: member.js tiers 所有 price 是整数
const tierPrices = [];
memberJs.replace(/price:\s*(\d+(?:\.\d+)?)/g, function(_, p) {
  tierPrices.push(parseFloat(p));
  return _;
});
const tierAllInteger = tierPrices.every(p => Number.isInteger(p));
assert(tierAllInteger, 'PRICE-04 member.js tiers 所有 price 是整数', `找到: ${tierPrices.filter(p => !Number.isInteger(p)).join(',')}`);

// PRICE-05: detail.wxml 购买按钮显示 skill.price（数据绑定，不硬编码）
const detailWxml = readFile(path.join(ROOT, 'pages/detail/detail.wxml'));
assert(
  detailWxml.indexOf("skill.price") >= 0 && detailWxml.indexOf("'购买解锁 ¥' + skill.price") >= 0,
  'PRICE-05 detail.wxml 购买按钮显示 skill.price（数据绑定）'
);

// PRICE-06: payment 云函数 PRODUCT_TIER_MAP 值为 200/900/1900/1900/9900
const paymentJs = readFile(path.join(CLOUD, 'payment/index.js'));
assert(
  paymentJs.indexOf("'skill_lite': 200") >= 0 &&
  paymentJs.indexOf("'skill_basic': 900") >= 0 &&
  paymentJs.indexOf("'skill_pro': 1900") >= 0 &&
  paymentJs.indexOf("'member_monthly': 1900") >= 0 &&
  paymentJs.indexOf("'member_annual': 9900") >= 0,
  'PRICE-06 payment 云函数 PRODUCT_TIER_MAP 200/900/1900/1900/9900'
);

results.forEach(r => console.log(r));
results.length = 0;

// === CFG-01 → CFG-04（配置完整性）===
console.log('\nCFG-01~04: 配置完整性');

// CFG-01: cloudbaserc.json envVariables 4 个变量都存在
const cbrc = JSON.parse(readFile(path.join(__dirname, '..', 'cloudbaserc.json')));
const paymentFn = cbrc.functions.find(f => f.name === 'payment');
const envVars = paymentFn && paymentFn.envVariables || {};
assert(
  envVars.OFFER_ID && envVars.APPID && envVars.MCHID && envVars.VIRTUAL_PAYMENT_KEY,
  'CFG-01 cloudbaserc.json payment envVariables 4 变量齐备'
);

// CFG-02: cloudbaserc.json envId === app.js wx.cloud.init env
const appJs = readFile(path.join(ROOT, 'app.js'));
const envMatch = appJs.match(/env:\s*'([^']+)'/);
const appEnv = envMatch ? envMatch[1] : '';
assert(
  cbrc.envId === appEnv && cbrc.envId === 'aippt-skill-d6g5hsem096551cc3',
  'CFG-02 cloudbaserc.json envId === app.js envId === aippt-skill-d6g5hsem096551cc3'
);

// CFG-03: payment 云函数用 HTTP jscode2session（V4: code2Session 不支持云调用）
const payIndex = readFile(path.join(CLOUD, 'payment/index.js'));
assert(
  payIndex.indexOf('https.get') >= 0 && payIndex.indexOf('jscode2session') >= 0 && payIndex.indexOf('cloud.openapi.auth.code2Session') === -1,
  'CFG-03 payment index.js 用 HTTP jscode2session（非 cloud.openapi，因 code2Session 不支持云调用）'
);

// CFG-04: project.config.json appid === cloudbaserc.json envVariables.APPID
const projCfg = JSON.parse(readFile(path.join(__dirname, '..', 'project.config.json')));
assert(
  projCfg.appid === envVars.APPID && projCfg.appid === 'wx9647f4ecd0d033fe',
  'CFG-04 project.config.json appid === cloudbaserc APPID === wx9647f4ecd0d033fe'
);

results.forEach(r => console.log(r));
results.length = 0;

// === E2E-01 → E2E-04（端到端场景契约）===
console.log('\nE2E-01~04: 端到端场景契约');

// E2E-01: detail.js onLoad 调 prepareLoginCode（预登录）
assert(
  detailJs.indexOf('this.prepareLoginCode()') >= 0 && detailJs.indexOf('onLoad') >= 0,
  'E2E-01 detail.js onLoad 预调用 prepareLoginCode'
);

// E2E-02: detail.js unlockSkill 设 isPurchased=true + 写 orderRecords
assert(
  detailJs.indexOf("this.setData({ isPurchased: true, purchasedAt: order.createdAt });") >= 0 &&
  detailJs.indexOf("wx.setStorageSync('purchasedSkills', purchased);") >= 0,
  'E2E-02 detail.js unlockSkill 设 isPurchased + 写 purchasedSkills storage'
);

// E2E-03: detail.js getProductIdForSkill 价格映射（price ≤ 2 → skill_lite, ≤ 9 → skill_basic, else → skill_pro）
assert(
  detailJs.indexOf("if (price <= 2) return 'skill_lite';") >= 0 &&
  detailJs.indexOf("if (price <= 9) return 'skill_basic';") >= 0 &&
  detailJs.indexOf("return 'skill_pro';") >= 0,
  'E2E-03 detail.js getProductIdForSkill 价格→productId 映射正确'
);

// E2E-04: v1.5.4 code 一次性消费：callFunction 回调即作废缓存 + 40163 换新 code 重试（requestPayment(true) 走 force 取新）
assert(
  detailJs.indexOf("self.invalidateLoginCode();") >= 0 && detailJs.indexOf('requestPayment(true)') >= 0,
  'E2E-04 detail.js code 消费即作废 + 40163 用 force=true 取新 code 重试'
);

results.forEach(r => console.log(r));
results.length = 0;

console.log(`\n=== e2e-v7 结果: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
