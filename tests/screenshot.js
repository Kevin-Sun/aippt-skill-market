const Connection = require('miniprogram-automator/out/Connection').default;
const Transport = require('miniprogram-automator/out/Transport').default;
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const ws = require('ws');
const fs = require('fs');

async function run() {
  const wsConn = new ws('ws://127.0.0.1:7777');
  await new Promise((r, j) => { wsConn.on('open', r); wsConn.on('error', j); });
  const mp = new MiniProgram(new Connection(new Transport(wsConn)));
  console.log('✓ 连接成功');

  // 页面数据验证
  const result = await mp.evaluate(() => {
    const pages = getCurrentPages();
    const page = pages[0];
    return {
      route: page.route,
      skillsCount: page.data.skills ? page.data.skills.length : 0,
      scenes: page.data.scenes,
      currentScene: page.data.currentScene,
      isLoggedIn: page.data.isLoggedIn,
    };
  });
  console.log('页面数据:', JSON.stringify(result));

  // 尝试截图
  try {
    const base64 = await mp.screenshot();
    if (base64) {
      fs.writeFileSync(__dirname + '/screenshot.png', Buffer.from(base64, 'base64'));
      console.log('✓ 截图保存: tests/screenshot.png (' + Math.round(base64.length/1024) + 'KB)');
    }
  } catch (e) {
    console.log('截图失败:', e.message);
    // 用 evaluate 截图替代
    try {
      const data = await mp.evaluate(() => {
        return document.body.innerHTML.substring(0, 500);
      });
      console.log('页面HTML(前500字):', data);
    } catch (e2) {
      console.log('读HTML也失败:', e2.message);
    }
  }

  // 读元素
  try {
    const page = await mp.currentPage();
    const title = await page.$('.title');
    if (title) {
      const text = await title.text();
      console.log('✓ 标题元素:', text);
    } else {
      console.log('✗ 找不到 .title 元素');
    }

    const cards = await page.$$('.skill-card');
    console.log('✓ skill 卡片数量:', cards.length);

    const scenes = await page.$$('.scene-tag');
    console.log('✓ 场景标签数量:', scenes.length);
  } catch (e) {
    console.log('读元素失败:', e.message);
  }

  mp.disconnect();
  console.log('=== 测试完成 ===');
}
run().catch(e => { console.error(e); process.exit(1); });
