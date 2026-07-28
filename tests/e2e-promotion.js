const Connection = require('miniprogram-automator/out/Connection').default;
const Transport = require('miniprogram-automator/out/Transport').default;
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const ws = require('ws');

let passCount = 0, failCount = 0;
function assert(c, name, detail) {
  passCount += c ? 1 : 0; failCount += c ? 0 : 1;
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

  console.log('=== US12: 活动页 ===');
  await safe(async () => {
    await mp.switchTab('/pages/promotion/promotion');
    await new Promise(r => setTimeout(r, 2000));
    const page = await mp.currentPage();
    assert(page.path === 'pages/promotion/promotion', 'US12.1 活动页路由', page.path);
  }, 'US12.1');

  await safe(async () => {
    const page = await mp.currentPage();
    const title = await page.$('.header-title');
    const text = title ? await title.text() : '';
    assert(text === '活动中心', 'US12.2 标题"活动中心"', text);
  }, 'US12.2');

  await safe(async () => {
    const page = await mp.currentPage();
    const banners = await page.$$('.banner-card');
    assert(banners.length === 5, 'US12.3 5个活动banner', `count=${banners.length}`);
  }, 'US12.3');

  await safe(async () => {
    const page = await mp.currentPage();
    const images = await page.$$('.banner-image');
    assert(images.length === 5, 'US12.4 5个banner图', `count=${images.length}`);
  }, 'US12.4');

  await safe(async () => {
    const page = await mp.currentPage();
    const actions = await page.$$('.banner-action');
    assert(actions.length === 5, 'US12.5 5个行动按钮', `count=${actions.length}`);
  }, 'US12.5');

  await safe(async () => {
    const page = await mp.currentPage();
    const titles = await page.$$('.banner-title');
    const firstTitle = titles[0] ? await titles[0].text() : '';
    assert(firstTitle.indexOf('邀请') >= 0, 'US12.6 第一个活动"邀请"', firstTitle);
  }, 'US12.6');

  console.log(`\n=== 活动页测试: ${passCount} PASS / ${failCount} FAIL ===`);
  mp.disconnect();
  process.exit(failCount > 0 ? 1 : 0);
}
run().catch(e => { console.error(e); process.exit(1); });
