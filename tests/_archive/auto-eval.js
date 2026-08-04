const Connection = require('miniprogram-automator/out/Connection').default;
const Transport = require('miniprogram-automator/out/Transport').default;
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const ws = require('ws');

async function run() {
  const wsConn = new ws(`ws://127.0.0.1:9966`);
  await new Promise((r, j) => { wsConn.on('open', r); wsConn.on('error', j); });
  const mp = new MiniProgram(new Connection(new Transport(wsConn)));
  console.log('✓ 连接成功');

  // 用 evaluate 读页面数据
  try {
    const result = await mp.evaluate(() => {
      const pages = getCurrentPages();
      const page = pages[0];
      return {
        route: page.route,
        data: page.data,
        hasSkills: page.data.skills ? page.data.skills.length : -1,
      };
    });
    console.log('页面数据:', JSON.stringify(result).substring(0, 500));
  } catch (e) {
    console.log('evaluate 失败:', e.message);
  }

  // 截图
  try {
    const base64 = await mp.screenshot();
    if (base64) {
      require('fs').writeFileSync(__dirname + '/screenshot.png', Buffer.from(base64, 'base64'));
      console.log('✓ 截图保存: tests/screenshot.png');
      console.log('截图大小:', base64.length, 'bytes base64');
    }
  } catch (e) {
    console.log('截图失败:', e.message);
  }

  mp.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
