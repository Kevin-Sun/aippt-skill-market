const automator = require('miniprogram-automator');
const path = require('path');
const fs = require('fs');

const PORT = 9966;

async function run() {
  console.log(`=== 连接 automation ===`);
  
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
  const miniProgram = new MiniProgram(connection);
  console.log('✓ 连接成功');

  // 读 console 完整信息
  let consoleMessages = [];
  miniProgram.on('console', (msg) => {
    const text = JSON.stringify(msg).substring(0, 500);
    console.log('[console]', text);
    consoleMessages.push(msg);
  });

  // 读异常
  miniProgram.on('exception', (err) => {
    console.log('[exception]', JSON.stringify(err).substring(0, 500));
  });

  // 等一下让 console 输出
  await new Promise(r => setTimeout(r, 2000));

  // 尝试重新编译
  try {
    console.log('\n=== 尝试 reLaunch 首页 ===');
    await miniProgram.reLaunch('/pages/index/index');
    await new Promise(r => setTimeout(r, 3000));
    console.log('reLaunch 完成');
  } catch (e) {
    console.log('reLaunch 失败:', e.message);
  }

  // 读页面数据
  try {
    const page = await miniProgram.currentPage();
    console.log('\n当前页面:', page.path);
    const data = await page.data();
    console.log('页面数据:', JSON.stringify(data).substring(0, 500));
  } catch (e) {
    console.log('读数据失败:', e.message);
  }

  // 读 wxml
  try {
    const page = await miniProgram.currentPage();
    const wxml = await page.wxml();
    console.log('\nWXML:', wxml.substring(0, 500));
  } catch (e) {
    console.log('读 WXML 失败:', e.message);
  }

  // 截图（用 evaluate 方式）
  try {
    const base64 = await miniProgram.screenshot();
    if (base64) {
      fs.writeFileSync(path.join(__dirname, 'screenshot.png'), Buffer.from(base64, 'base64'));
      console.log('\n✓ 截图保存: tests/screenshot.png');
    }
  } catch (e) {
    console.log('截图失败:', e.message);
  }

  // 读 systemInfo
  try {
    const info = await miniProgram.systemInfo();
    console.log('\n系统信息:', JSON.stringify(info).substring(0, 300));
  } catch (e) {
    console.log('读系统信息失败:', e.message);
  }

  console.log('\n=== 测试完成 ===');
  console.log('console 消息总数:', consoleMessages.length);
  
  miniProgram.disconnect();
}

run().catch(e => {
  console.error('异常:', e);
  process.exit(1);
});
