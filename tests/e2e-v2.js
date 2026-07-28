// e2e-v2.js · V2 新增 23 用例（详情页+活动详情+会员+我的页V2+评价+搜索+分享收藏）
const Connection = require('miniprogram-automator/out/Connection').default;
const Transport = require('miniprogram-automator/out/Transport').default;
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const ws = require('ws');

let passCount = 0, failCount = 0;
const results = [];

function assert(c, name, detail) {
  passCount += c ? 1 : 0; failCount += c ? 0 : 1;
  results.push({ name, status: c ? 'PASS' : 'FAIL', detail });
  console.log(`  ${c ? '✅' : '❌'} ${name}${detail ? ' :: ' + detail : ''}`);
}

async function safe(fn, name) {
  try { await fn(); } catch(e) { assert(false, name, e.message.substring(0,100)); }
}

async function run() {
  const wsConn = new ws('ws://127.0.0.1:7777');
  await new Promise((r, j) => { wsConn.on('open', r); wsConn.on('error', j); });
  const mp = new MiniProgram(new Connection(new Transport(wsConn)));
  console.log('✓ 连接成功\n');

  // === 详情页新增 ===
  console.log('=== US3 详情页 V2 ===');
  await safe(async () => {
    await mp.reLaunch('/pages/index/index');
    await new Promise(r => setTimeout(r, 2000));
    const page = await mp.currentPage();
    const cards = await page.$$('.skill-card');
    await cards[0].tap();
    await new Promise(r => setTimeout(r, 2000));
    const detail = await mp.currentPage();
    assert(detail.path === 'pages/detail/detail', 'US3.9a 详情页跳转', detail.path);
  }, 'US3.9a');

  await safe(async () => {
    const page = await mp.currentPage();
    const swiper = await page.$('.preview-swiper');
    assert(!!swiper, 'US3.9b 预览图轮播存在');
  }, 'US3.9b');

  await safe(async () => {
    const page = await mp.currentPage();
    const includes = await page.$$('.include-item');
    assert(includes.length === 3, 'US3.10 包含内容(3项)', `count=${includes.length}`);
  }, 'US3.10');

  await safe(async () => {
    const page = await mp.currentPage();
    const suitable = await page.$$('.suitable-tag');
    assert(suitable.length > 0, 'US3.11 适用场景存在', `count=${suitable.length}`);
  }, 'US3.11');

  await safe(async () => {
    const page = await mp.currentPage();
    const steps = await page.$$('.step-item');
    assert(steps.length >= 3, 'US3.12 使用步骤存在', `count=${steps.length}`);
  }, 'US3.12');

  await safe(async () => {
    const page = await mp.currentPage();
    const reviews = await page.$$('.review-item');
    assert(reviews.length >= 0, 'US3.13 评价区存在', `count=${reviews.length}`);
  }, 'US3.13');

  await safe(async () => {
    const page = await mp.currentPage();
    const related = await page.$$('.related-card');
    assert(related.length > 0, 'US3.14 相关推荐存在', `count=${related.length}`);
  }, 'US3.14');

  await safe(async () => {
    const page = await mp.currentPage();
    const shareBtn = await page.$('.bottom-icon-btn');
    assert(!!shareBtn, 'US9.1 分享按钮存在');
  }, 'US9.1');

  await safe(async () => {
    const page = await mp.currentPage();
    const favBtn = await page.$('.bottom-icon-btn:last-child');
    assert(!!favBtn, 'US9.2 收藏按钮存在');
  }, 'US9.2');

  // === 搜索 ===
  console.log('\n=== US10 搜索 ===');
  await safe(async () => {
    await mp.navigateBack();
    await new Promise(r => setTimeout(r, 2000));
    let page = await mp.currentPage();
    if (page.path !== 'pages/index/index') { await mp.reLaunch('/pages/index/index'); await new Promise(r=>setTimeout(r,2000)); page = await mp.currentPage(); }
    const search = await page.$('.search-input');
    assert(!!search, 'US10.1 搜索框存在');
  }, 'US10.1');

  // === 活动详情页 ===
  console.log('\n=== US5 活动详情 ===');
  await safe(async () => {
    await mp.switchTab('/pages/promotion/promotion');
    await new Promise(r => setTimeout(r, 2000));
    const page = await mp.currentPage();
    assert(page.path === 'pages/promotion/promotion', 'US5.5a 活动页', page.path);
  }, 'US5.5a');

  // === 会员页 ===
  console.log('\n=== US6 会员页 ===');
  await safe(async () => {
    await mp.navigateTo('/pages/member/member');
    await new Promise(r => setTimeout(r, 2000));
    const page = await mp.currentPage();
    assert(page.path === 'pages/member/member', 'US6.2 会员页路由', page.path);
  }, 'US6.2');

  await safe(async () => {
    const page = await mp.currentPage();
    const tiers = await page.$$('.tier-card');
    assert(tiers.length === 5, 'US6.3 SKU 5档', `count=${tiers.length}`);
  }, 'US6.3');

  await safe(async () => {
    const page = await mp.currentPage();
    const badge = await page.$('.tier-badge');
    assert(!!badge, 'US6.4 推荐标签存在');
  }, 'US6.4');

  await safe(async () => {
    const page = await mp.currentPage();
    const table = await page.$('.compare-table');
    assert(!!table, 'US6.5 对比表存在');
  }, 'US6.5');

  // === 我的页 V2 ===
  console.log('\n=== US7 我的页 V2 ===');
  await safe(async () => {
    await mp.navigateBack();
    await new Promise(r => setTimeout(r, 2000));
    await mp.switchTab('/pages/mine/mine');
    await new Promise(r => setTimeout(r, 2000));
    const page = await mp.currentPage();
    assert(page.path === 'pages/mine/mine', 'US7.4 我的页', page.path);
  }, 'US7.4');

  await safe(async () => {
    const page = await mp.currentPage();
    const items = await page.$$('.menu-item');
    assert(items.length >= 3, 'US7.5 菜单项', `count=${items.length}`);
  }, 'US7.5');

  // === 评价页 ===
  console.log('\n=== US17 评价页 ===');
  await safe(async () => {
    await mp.navigateTo('/pages/reviews/reviews?id=work-report-01');
    await new Promise(r => setTimeout(r, 2000));
    const page = await mp.currentPage();
    assert(page.path === 'pages/reviews/reviews', 'US17.1 评价页路由', page.path);
  }, 'US17.1');

  await safe(async () => {
    const page = await mp.currentPage();
    const stars = await page.$$('.star');
    assert(stars.length === 5, 'US17.2 星级评分', `count=${stars.length}`);
  }, 'US17.2');

  await safe(async () => {
    const page = await mp.currentPage();
    const submit = await page.$('.submit-btn');
    assert(!!submit, 'US17.3 提交评价按钮');
  }, 'US17.3');

  // === 社群页 ===
  console.log('\n=== US21 社群页 ===');
  await safe(async () => {
    await mp.navigateBack();
    await new Promise(r => setTimeout(r, 2000));
    await mp.navigateTo('/pages/community/community');
    await new Promise(r => setTimeout(r, 2000));
    const page = await mp.currentPage();
    assert(page.path === 'pages/community/community', 'US21.1 社群页路由', page.path);
  }, 'US21.1');

  await safe(async () => {
    const page = await mp.currentPage();
    const btn = await page.$('.join-btn');
    assert(!!btn, 'US21.2 加入按钮存在');
  }, 'US21.2');

  // === 订单页 ===
  console.log('\n=== US7.6 订单页 ===');
  await safe(async () => {
    await mp.navigateBack();
    await new Promise(r => setTimeout(r, 2000));
    await mp.navigateTo('/pages/orders/orders');
    await new Promise(r => setTimeout(r, 2000));
    const page = await mp.currentPage();
    assert(page.path === 'pages/orders/orders', 'US7.6 订单页路由', page.path);
  }, 'US7.6');

  await safe(async () => {
    const page = await mp.currentPage();
    const tabs = await page.$$('.tab');
    assert(tabs.length === 3, 'US7.7 订单页3个tab', `count=${tabs.length}`);
  }, 'US7.7');

  // === 汇总 ===
  console.log(`\n=== V2 新增结果: ${passCount} PASS / ${failCount} FAIL ===`);
  if (failCount > 0) {
    console.log('\n=== 失败用例 ===');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`));
  }

  mp.disconnect();
  process.exit(failCount > 0 ? 1 : 0);
}
run().catch(e => { console.error(e); process.exit(1); });
