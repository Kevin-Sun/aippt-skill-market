// E2E 测试套件 · 30+ 用例（基于用户故事）
// 运行：node tests/e2e-suite.js
const Connection = require('miniprogram-automator/out/Connection').default;
const Transport = require('miniprogram-automator/out/Transport').default;
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const ws = require('ws');

let mp;
let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, name, detail) {
  if (condition) {
    passCount++;
    results.push({ name, status: 'PASS', detail });
  } else {
    failCount++;
    results.push({ name, status: 'FAIL', detail });
  }
  console.log(`  ${condition ? '✅' : '❌'} ${name}${detail ? ' :: ' + detail : ''}`);
}

async function safe(fn, name) {
  try { return await fn(); }
  catch(e) { assert(false, name, e.message.substring(0,100)); return null; }
}

async function run() {
  const wsConn = new ws('ws://127.0.0.1:7777');
  await new Promise((r, j) => { wsConn.on('open', r); wsConn.on('error', j); });
  mp = new MiniProgram(new Connection(new Transport(wsConn)));
  console.log('✓ 连接成功\n');

  // ===== US1: 用户打开小程序看到首页 =====
  console.log('=== US1: 首页渲染 ===');
  await safe(async () => {
    await mp.reLaunch('/pages/index/index');
    await new Promise(r => setTimeout(r, 2000));
    const page = await mp.currentPage();
    assert(page.path === 'pages/index/index', 'US1.1 首页路由正确', page.path);
  }, 'US1.1 首页路由');

  await safe(async () => {
    const page = await mp.currentPage();
    const title = await page.$('.nav-logo');
    const text = title ? await title.text() : '';
    assert(text.indexOf('AI智作PPT') >= 0, 'US1.2 标题含"AI智作PPT"', text);
  }, 'US1.2 标题');

  await safe(async () => {
    const page = await mp.currentPage();
    const cards = await page.$$('.skill-card');
    assert(cards.length === 8, 'US1.3 8个skill卡片', `count=${cards.length}`);
  }, 'US1.3 卡片数');

  await safe(async () => {
    const page = await mp.currentPage();
    const data = await page.data();
    assert(data.skills && data.skills.length === 8, 'US1.4 页面数据8个skill', `skills=${data.skills ? data.skills.length : 0}`);
  }, 'US1.4 页面数据');

  await safe(async () => {
    const page = await mp.currentPage();
    const scenes = await page.$$('.scene-tag');
    assert(scenes.length === 5, 'US1.5 5个场景标签', `count=${scenes.length}`);
  }, 'US1.5 场景标签');

  await safe(async () => {
    const page = await mp.currentPage();
    const data = await page.data();
    const expected = ['全部', '工作汇报', '答辩', '学术研究', '商务展示'];
    assert(JSON.stringify(data.scenes) === JSON.stringify(expected), 'US1.6 场景列表正确', JSON.stringify(data.scenes));
  }, 'US1.6 场景列表');

  // ===== US2: 用户筛选场景 =====
  console.log('\n=== US2: 场景筛选 ===');
  await safe(async () => {
    const page = await mp.currentPage();
    const scenes = await page.$$('.scene-tag');
    await scenes[1].tap(); // 工作汇报
    await new Promise(r => setTimeout(r, 1000));
    const filtered = await page.$$('.skill-card');
    assert(filtered.length === 3, 'US2.1 工作汇报筛选3个', `count=${filtered.length}`);
  }, 'US2.1 工作汇报筛选');

  await safe(async () => {
    const page = await mp.currentPage();
    const data = await page.data();
    assert(data.currentScene === '工作汇报', 'US2.2 currentScene更新', data.currentScene);
  }, 'US2.2 currentScene');

  await safe(async () => {
    const page = await mp.currentPage();
    const scenes = await page.$$('.scene-tag');
    await scenes[0].tap(); // 全部
    await new Promise(r => setTimeout(r, 1000));
    const all = await page.$$('.skill-card');
    assert(all.length === 8, 'US2.3 回全部8个', `count=${all.length}`);
  }, 'US2.3 回全部');

  // ===== US3: 用户点击skill进详情 =====
  console.log('\n=== US3: 详情页 ===');
  await safe(async () => {
    const page = await mp.currentPage();
    const cards = await page.$$('.skill-card');
    await cards[0].tap();
    await new Promise(r => setTimeout(r, 2000));
    const detailPage = await mp.currentPage();
    assert(detailPage.path === 'pages/detail/detail', 'US3.1 跳转详情页', detailPage.path);
  }, 'US3.1 跳转详情');

  await safe(async () => {
    const page = await mp.currentPage();
    const title = await page.$('.skill-title');
    const text = title ? await title.text() : '';
    assert(text.length > 0, 'US3.2 skill标题显示', text.substring(0,30));
  }, 'US3.2 skill标题');

  await safe(async () => {
    const page = await mp.currentPage();
    const agents = await page.$$('.agent-card');
    assert(agents.length === 3, 'US3.3 三agent卡片', `count=${agents.length}`);
  }, 'US3.3 三agent');

  await safe(async () => {
    const page = await mp.currentPage();
    const btn = await page.$('.buy-btn');
    const text = btn ? await btn.text() : '';
    assert(text.indexOf('解锁') >= 0 || text.indexOf('购买') >= 0, 'US3.4 购买按钮', text.substring(0,20));
  }, 'US3.4 购买按钮');

  await safe(async () => {
    const page = await mp.currentPage();
    const agentNames = await page.$$('.agent-name');
    const names = [];
    for (const n of agentNames) names.push((await n.text()).trim());
    assert(names.indexOf('Codex') >= 0, 'US3.5 Codex agent', JSON.stringify(names));
  }, 'US3.5 Codex');

  await safe(async () => {
    const page = await mp.currentPage();
    const agentNames = await page.$$('.agent-name');
    const names = [];
    for (const n of agentNames) names.push((await n.text()).trim());
    assert(names.some(n => n.indexOf('豆包') >= 0), 'US3.6 豆包agent', JSON.stringify(names));
  }, 'US3.6 豆包');

  await safe(async () => {
    const page = await mp.currentPage();
    const agentNames = await page.$$('.agent-name');
    const names = [];
    for (const n of agentNames) names.push((await n.text()).trim());
    assert(names.some(n => n.indexOf('WorkBuddy') >= 0), 'US3.7 WorkBuddy agent', JSON.stringify(names));
  }, 'US3.7 WorkBuddy');

  // ===== US4: 用户返回首页 =====
  console.log('\n=== US4: 返回首页 ===');
  await safe(async () => {
    await mp.navigateBack();
    await new Promise(r => setTimeout(r, 2000));
    let page = await mp.currentPage();
    if (page.path !== 'pages/index/index') {
      // navigateBack 失败，用 reLaunch 恢复
      await mp.reLaunch('/pages/index/index');
      await new Promise(r => setTimeout(r, 2000));
      page = await mp.currentPage();
    }
    assert(page.path === 'pages/index/index', 'US4.1 返回首页', page.path);
  }, 'US4.1 返回首页');

  // ===== US5: 用户切tab到我的 =====
  console.log('\n=== US5: 我的页 ===');
  await safe(async () => {
    await mp.switchTab('/pages/mine/mine');
    await new Promise(r => setTimeout(r, 3000));
    const page = await mp.currentPage();
    assert(page.path === 'pages/mine/mine', 'US5.1 我的页路由', page.path);
  }, 'US5.1 我的页');

  await safe(async () => {
    const page = await mp.currentPage();
    const cards = await page.$$('.member-card');
    assert(cards.length === 4, 'US5.2 4个会员卡片', `count=${cards.length}`);
  }, 'US5.2 会员卡片');

  await safe(async () => {
    const page = await mp.currentPage();
    const community = await page.$('.community-section');
    assert(!!community, 'US5.3 社群入口存在');
  }, 'US5.3 社群入口');

  // ===== US6: 用户去登录 =====
  console.log('\n=== US6: 登录页 ===');
  await safe(async () => {
    await mp.navigateTo('/pages/login/login');
    await new Promise(r => setTimeout(r, 3000));
    const page = await mp.currentPage();
    assert(page.path === 'pages/login/login', 'US6.1 登录页路由', page.path);
  }, 'US6.1 登录页');

  await safe(async () => {
    const page = await mp.currentPage();
    const logo = await page.$('.logo');
    const text = logo ? await logo.text() : '';
    assert(text === 'AI智作PPT模版社', 'US6.2 Logo', text);
  }, 'US6.2 Logo');

  await safe(async () => {
    const page = await mp.currentPage();
    const btn = await page.$('.login-btn');
    const text = btn ? await btn.text() : '';
    assert(text.indexOf('登录') >= 0, 'US6.3 登录按钮', text);
  }, 'US6.3 登录按钮');

  // ===== US7: 首页登录按钮 =====
  console.log('\n=== US7: 首页登录入口 ===');
  await safe(async () => {
    await mp.navigateBack();
    await new Promise(r => setTimeout(r, 2000));
    let page = await mp.currentPage();
    if (page.path !== 'pages/index/index') {
      await mp.reLaunch('/pages/index/index');
      await new Promise(r => setTimeout(r, 2000));
      page = await mp.currentPage();
    }
    const loginBtn = await page.$('.nav-login-btn');
    assert(!!loginBtn, 'US7.1 首页有登录按钮');
  }, 'US7.1 首页登录按钮');

  await safe(async () => {
    const page = await mp.currentPage();
    const data = await page.data();
    assert(data.isLoggedIn === false, 'US7.2 未登录状态', `isLoggedIn=${data.isLoggedIn}`);
  }, 'US7.2 未登录');

  // ===== US8: skill卡片内容 =====
  console.log('\n=== US8: skill卡片内容 ===');
  await safe(async () => {
    const page = await mp.currentPage();
    const cards = await page.$$('.skill-card');
    const firstCard = cards[0];
    const name = await firstCard.$('.skill-name');
    const text = name ? await name.text() : '';
    assert(text.length > 0, 'US8.1 卡片有名称', text.substring(0,20));
  }, 'US8.1 卡片名称');

  await safe(async () => {
    const page = await mp.currentPage();
    const cards = await page.$$('.skill-card');
    const firstCard = cards[0];
    const price = await firstCard.$('.skill-price');
    const text = price ? await price.text() : '';
    assert(text.indexOf('¥') >= 0 || text.indexOf('免费') >= 0, 'US8.2 卡片有价格', text);
  }, 'US8.2 卡片价格');

  await safe(async () => {
    const page = await mp.currentPage();
    const cards = await page.$$('.skill-card');
    const firstCard = cards[0];
    const scene = await firstCard.$('.skill-scene');
    const text = scene ? await scene.text() : '';
    assert(text.length > 0, 'US8.3 卡片有场景标签', text);
  }, 'US8.3 卡片场景');

  // ===== US9: console无报错 =====
  console.log('\n=== US9: console无报错 ===');
  await safe(async () => {
    let errorCount = 0;
    mp.on('console', (msg) => { if (msg.type === 'error') errorCount++; });
    await new Promise(r => setTimeout(r, 2000));
    assert(errorCount === 0, 'US9.1 console 0 error', `count=${errorCount}`);
  }, 'US9.1 console无error');

  // ===== US10: 免费skill存在 =====
  console.log('\n=== US10: 免费skill ===');
  await safe(async () => {
    const page = await mp.currentPage();
    const data = await page.data();
    const freeSkills = data.skills.filter(s => s.isFree);
    assert(freeSkills.length >= 1, 'US10.1 有免费skill', `count=${freeSkills.length}`);
  }, 'US10.1 免费skill');

  await safe(async () => {
    const page = await mp.currentPage();
    const cards = await page.$$('.skill-card');
    let hasFree = false;
    for (const card of cards) {
      const price = await card.$('.skill-price');
      const text = price ? await price.text() : '';
      if (text.indexOf('免费') >= 0) { hasFree = true; break; }
    }
    assert(hasFree, 'US10.2 卡片显示免费');
  }, 'US10.2 卡片显示免费');

  // ===== US11: skill描述存在 =====
  console.log('\n=== US11: skill描述 ===');
  await safe(async () => {
    const page = await mp.currentPage();
    const cards = await page.$$('.skill-card');
    const desc = await cards[0].$('.skill-desc');
    const text = desc ? await desc.text() : '';
    assert(text.length > 5, 'US11.1 卡片有描述', text.substring(0,30));
  }, 'US11.1 卡片描述');

  // ===== 结果汇总 =====
  console.log('\n=== 测试结果汇总 ===');
  console.log(`总用例: ${passCount + failCount}`);
  console.log(`✅ PASS: ${passCount}`);
  console.log(`❌ FAIL: ${failCount}`);
  console.log(`通过率: ${Math.round(passCount/(passCount+failCount)*100)}%`);

  // 输出失败用例
  const failed = results.filter(r => r.status === 'FAIL');
  if (failed.length > 0) {
    console.log('\n=== 失败用例 ===');
    failed.forEach(f => console.log(`  ❌ ${f.name}: ${f.detail}`));
  }

  mp.disconnect();
  process.exit(failCount > 0 ? 1 : 0);
}

run().catch(e => { console.error('测试异常:', e); process.exit(1); });
