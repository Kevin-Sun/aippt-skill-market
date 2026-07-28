const automator = require('miniprogram-automator');
const path = require('path');

const PROJECT_PATH = '/Users/sunkai/ops-dashboard/templates/miniprogram-base';
const PORT = 9966;

async function run() {
  console.log('=== 连接 devtools automation ===');
  let miniProgram;
  try {
    miniProgram = await automator.connect({
      wsEndpoint: `ws://127.0.0.1:${PORT}`,
    });
    console.log('✓ 连接成功');
  } catch (e) {
    console.log('✗ 连接失败:', e.message);
    // 尝试 launch
    try {
      miniProgram = await automator.launch({
        projectPath: PROJECT_PATH,
        cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      });
      console.log('✓ launch 成功');
    } catch (e2) {
      console.log('✗ launch 失败:', e2.message);
      process.exit(1);
    }
  }

  // 截图
  try {
    const page = await miniProgram.currentPage();
    console.log('当前页面:', page.path);
    await page.screenshot({ path: path.join(__dirname, 'screenshot.png') });
    console.log('✓ 截图保存: tests/screenshot.png');
  } catch (e) {
    console.log('截图失败:', e.message);
    // 尝试 navigateTo 首页
    try {
      await miniProgram.navigateTo('/pages/index/index');
      const page = await miniProgram.currentPage();
      console.log('导航后页面:', page.path);
      await page.screenshot({ path: path.join(__dirname, 'screenshot.png') });
      console.log('✓ 截图保存: tests/screenshot.png');
    } catch (e2) {
      console.log('导航失败:', e2.message);
    }
  }

  // 读 console
  try {
    const logs = await miniProgram.pageStack();
    console.log('页面栈:', JSON.stringify(logs));
  } catch (e) {
    console.log('读页面栈失败:', e.message);
  }

  await miniProgram.disconnect();
  console.log('=== 测试完成 ===');
}

run().catch(e => {
  console.error('测试异常:', e);
  process.exit(1);
});
