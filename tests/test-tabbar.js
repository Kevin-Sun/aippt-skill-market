const Connection = require('miniprogram-automator/out/Connection').default;
const Transport = require('miniprogram-automator/out/Transport').default;
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const ws = require('ws');

async function run() {
  const wsConn = new ws('ws://127.0.0.1:8848');
  await new Promise((r, j) => { wsConn.on('open', r); wsConn.on('error', j); });
  const mp = new MiniProgram(new Connection(new Transport(wsConn)));
  console.log('✓ 连接成功\n');

  // 测试预览页（用 navigateTo 不用 switchTab）
  console.log('=== 测试 4b: 预览页（navigateTo）===');
  try {
    await mp.navigateTo('/pages/preview/preview');
    await new Promise(r => setTimeout(r, 2000));
    let page = await mp.currentPage();
    console.log('  路由:', page.path);
    const btn = await page.$('.render-btn');
    console.log('  渲染按钮存在:', !!btn);
    if (btn) {
      await btn.tap();
      await new Promise(r => setTimeout(r, 1000));
      const hint = await page.$('.hint');
      console.log('  渲染提示:', hint ? '出现' : '未出现');
    }
  } catch (e) {
    console.log('  失败:', e.message.substring(0, 100));
  }

  // navigateBack 回首页
  console.log('\n=== navigateBack ===');
  try {
    await mp.navigateBack();
    await new Promise(r => setTimeout(r, 1000));
    let page = await mp.currentPage();
    console.log('  当前页:', page.path);
  } catch (e) {
    console.log('  失败:', e.message.substring(0, 100));
  }

  // 测试我的页（用 switchTab）
  console.log('\n=== 测试 5: 我的页（switchTab）===');
  try {
    await mp.switchTab('/pages/mine/mine');
    await new Promise(r => setTimeout(r, 2000));
    let page = await mp.currentPage();
    console.log('  路由:', page.path);
    const memberCards = await page.$$('.member-card');
    console.log('  会员卡片:', memberCards.length);
    const communitySection = await page.$('.community-section');
    console.log('  社群入口存在:', !!communitySection);
  } catch (e) {
    console.log('  失败:', e.message.substring(0, 100));
  }

  // 测试登录页
  console.log('\n=== 测试 6: 登录页（navigateTo）===');
  try {
    await mp.navigateTo('/pages/login/login');
    await new Promise(r => setTimeout(r, 2000));
    let page = await mp.currentPage();
    console.log('  路由:', page.path);
    const logo = await page.$('.logo');
    if (logo) console.log('  Logo:', await logo.text());
    const loginBtn = await page.$('.login-btn');
    if (loginBtn) console.log('  登录按钮:', await loginBtn.text());
  } catch (e) {
    console.log('  失败:', e.message.substring(0, 100));
  }

  mp.disconnect();
  console.log('\n=== 测试完成 ===');
}
run().catch(e => { console.error('异常:', e); process.exit(1); });
