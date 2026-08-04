const automator = require('miniprogram-automator');
const path = require('path');
const fs = require('fs');

const PORT = 9966;

async function run() {
  console.log(`=== 连接 automation ws://127.0.0.1:${PORT} ===`);
  
  let miniProgram;
  try {
    // 直接连接，跳过 checkVersion
    const Connection = require('miniprogram-automator/out/Connection').default;
    const Transport = require('miniprogram-automator/out/Transport').default;
    const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
    
    const ws = new (require('ws'))(`ws://127.0.0.1:${PORT}`);
    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });
    
    const transport = new Transport(ws);
    const connection = new Connection(transport);
    miniProgram = new MiniProgram(connection);
    console.log('✓ 连接成功（跳过 checkVersion）');
  } catch (e) {
    console.log('✗ 连接失败:', e.message);
    process.exit(1);
  }

  // 截图
  try {
    const page = await miniProgram.currentPage();
    console.log('当前页面:', page.path);
    await miniProgram.screenshot({ path: path.join(__dirname, 'screenshot.png') });
    console.log('✓ 截图保存: tests/screenshot.png');
  } catch (e) {
    console.log('截图失败:', e.message);
    // 尝试导航到首页
    try {
      await miniProgram.reLaunch('/pages/index/index');
      await new Promise(r => setTimeout(r, 3000));
      const page = await miniProgram.currentPage();
      console.log('导航后页面:', page.path);
      await miniProgram.screenshot({ path: path.join(__dirname, 'screenshot.png') });
      console.log('✓ 截图保存: tests/screenshot.png');
    } catch (e2) {
      console.log('导航+截图失败:', e2.message);
    }
  }

  // 读 console logs
  try {
    miniProgram.on('console', (msg) => {
      console.log('[console]', msg.type, msg.text);
    });
    // 触发一次日志
    await miniProgram.evaluate(() => {
      console.log('test from automator');
    });
  } catch (e) {
    console.log('读 console 失败:', e.message);
  }

  // 读页面栈
  try {
    const stack = await miniProgram.pageStack();
    console.log('页面栈:', stack.map(p => p.path));
  } catch (e) {
    console.log('读页面栈失败:', e.message);
  }

  // 读页面数据
  try {
    const page = await miniProgram.currentPage();
    const data = await page.data();
    console.log('页面数据:', JSON.stringify(data).substring(0, 200));
  } catch (e) {
    console.log('读页面数据失败:', e.message);
  }

  miniProgram.disconnect();
  console.log('=== 测试完成 ===');
}

run().catch(e => {
  console.error('测试异常:', e);
  process.exit(1);
});
