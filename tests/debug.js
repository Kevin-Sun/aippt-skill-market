const Connection = require('miniprogram-automator/out/Connection').default;
const Transport = require('miniprogram-automator/out/Transport').default;
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const ws = require('ws');
const fs = require('fs');

async function run() {
  const wsConn = new ws(`ws://127.0.0.1:7777`);
  await new Promise((r, j) => { wsConn.on('open', r); wsConn.on('error', j); });
  const mp = new MiniProgram(new Connection(new Transport(wsConn)));
  console.log('✓ 连接成功');

  // console 监听
  const errors = [];
  mp.on('console', (msg) => {
    const s = JSON.stringify(msg);
    if (s.length > 10) errors.push(s.substring(0, 300));
  });
  mp.on('exception', (err) => {
    errors.push('EXCEPTION: ' + JSON.stringify(err).substring(0, 300));
  });

  await new Promise(r => setTimeout(r, 2000));
  console.log('\n=== console errors ===');
  errors.forEach((e, i) => console.log(i + ':', e));

  // evaluate 读 app + page
  try {
    const result = await mp.evaluate(() => {
      try {
        const app = getApp();
        const pages = getCurrentPages();
        const page = pages[0];
        return {
          appExists: !!app,
          appGlobalData: app ? JSON.stringify(app.globalData) : null,
          pagesCount: pages.length,
          pageRoute: page ? page.route : null,
          pageData: page ? JSON.stringify(page.data).substring(0, 300) : null,
          pageDataKeys: page ? Object.keys(page.data) : null,
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('\n=== evaluate 结果 ===');
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.log('evaluate 失败:', e.message);
  }

  // 截图
  try {
    const base64 = await mp.screenshot();
    if (base64) {
      fs.writeFileSync(__dirname + '/screenshot.png', Buffer.from(base64, 'base64'));
      console.log('\n✓ 截图保存: tests/screenshot.png (' + base64.length + ' chars)');
    } else {
      console.log('\n截图返回空');
    }
  } catch (e) {
    console.log('\n截图失败:', e.message);
  }

  mp.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
