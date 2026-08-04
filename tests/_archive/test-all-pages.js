const Connection = require('miniprogram-automator/out/Connection').default;
const Transport = require('miniprogram-automator/out/Transport').default;
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const ws = require('ws');

async function run() {
  const wsConn = new ws('ws://127.0.0.1:8848');
  await new Promise((r, j) => { wsConn.on('open', r); wsConn.on('error', j); });
  const mp = new MiniProgram(new Connection(new Transport(wsConn)));
  console.log('✓ 连接成功\n');

  // 测试 1: 首页
  console.log('=== 测试 1: 首页 ===');
  let page = await mp.currentPage();
  const title = await page.$('.title');
  console.log('  标题:', await title.text());
  const cards = await page.$$('.skill-card');
  console.log('  skill 卡片:', cards.length);
  const scenes = await page.$$('.scene-tag');
  console.log('  场景标签:', scenes.length);

  // 测试 2: 点击场景筛选
  console.log('\n=== 测试 2: 场景筛选 ===');
  await scenes[1].tap(); // "工作汇报"
  await new Promise(r => setTimeout(r, 1000));
  const filteredCards = await page.$$('.skill-card');
  console.log('  筛选后卡片:', filteredCards.length);

  // 测试 3: 点击 skill 进详情
  console.log('\n=== 测试 3: 详情页 ===');
  const allCards = await page.$$('.skill-card');
  if (allCards.length > 0) {
    await allCards[0].tap();
    await new Promise(r => setTimeout(r, 2000));
    page = await mp.currentPage();
    console.log('  详情页路由:', page.path);
    const skillTitle = await page.$('.skill-title');
    if (skillTitle) console.log('  skill 标题:', await skillTitle.text());
    const agentCards = await page.$$('.agent-card');
    console.log('  agent 卡片:', agentCards.length);
    const buyBtn = await page.$('.buy-btn');
    if (buyBtn) console.log('  购买按钮:', await buyBtn.text());
  }

  // 测试 4: 预览页
  console.log('\n=== 测试 4: 预览页 ===');
  await mp.switchTab('/pages/preview/preview');
  await new Promise(r => setTimeout(r, 2000));
  page = await mp.currentPage();
  console.log('  预览页路由:', page.path);
  const canvas = await page.$('.preview-canvas');
  console.log('  canvas 存在:', !!canvas);
  const renderBtn = await page.$('.render-btn');
  console.log('  渲染按钮存在:', !!renderBtn);

  // 测试 5: 我的页
  console.log('\n=== 测试 5: 我的页 ===');
  await mp.switchTab('/pages/mine/mine');
  await new Promise(r => setTimeout(r, 2000));
  page = await mp.currentPage();
  console.log('  我的页路由:', page.path);
  const memberCards = await page.$$('.member-card');
  console.log('  会员卡片:', memberCards.length);
  const communitySection = await page.$('.community-section');
  console.log('  社群入口存在:', !!communitySection);

  // 测试 6: 登录页
  console.log('\n=== 测试 6: 登录页 ===');
  await mp.navigateTo('/pages/login/login');
  await new Promise(r => setTimeout(r, 2000));
  page = await mp.currentPage();
  console.log('  登录页路由:', page.path);
  const logo = await page.$('.logo');
  if (logo) console.log('  Logo:', await logo.text());
  const loginBtn = await page.$('.login-btn');
  if (loginBtn) console.log('  登录按钮:', await loginBtn.text());

  // 测试 7: console 无 error
  console.log('\n=== 测试 7: console 无 error ===');
  let errorCount = 0;
  mp.on('console', (msg) => {
    if (msg.type === 'error') errorCount++;
  });
  await new Promise(r => setTimeout(r, 2000));
  console.log('  console error 数量:', errorCount);

  mp.disconnect();
  console.log('\n=== 全部测试完成 ===');
}
run().catch(e => { console.error('测试异常:', e); process.exit(1); });
