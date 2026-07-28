const Connection = require('miniprogram-automator/out/Connection').default;
const Transport = require('miniprogram-automator/out/Transport').default;
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const ws = require('ws');

async function run() {
  const wsConn = new ws('ws://127.0.0.1:7777');
  await new Promise((r, j) => { wsConn.on('open', r); wsConn.on('error', j); });
  const mp = new MiniProgram(new Connection(new Transport(wsConn)));
  console.log('✓ 连接成功');

  // evaluate 获取完整页面信息
  const result = await mp.evaluate(() => {
    const page = getCurrentPages()[0];
    return {
      route: page.route,
      data: {
        skills: page.data.skills ? page.data.skills.length : 0,
        scenes: page.data.scenes,
        currentScene: page.data.currentScene,
        isLoggedIn: page.data.isLoggedIn,
      },
      // 读 WXML 渲染后的 DOM
      domInfo: {
        titleText: document.querySelector('.title') ? document.querySelector('.title').innerText : 'none',
        cardCount: document.querySelectorAll('.skill-card').length,
        sceneCount: document.querySelectorAll('.scene-tag').length,
        bodyHTML: document.body.innerHTML.substring(0, 300),
      }
    };
  });
  console.log('\n=== evaluate 结果 ===');
  console.log(JSON.stringify(result, null, 2));

  mp.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
