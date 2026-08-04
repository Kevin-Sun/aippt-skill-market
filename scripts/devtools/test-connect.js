// test-connect.js · 测试 devtools automation 连接
// 用法: no_proxy="*" node scripts/devtools/test-connect.js
const auto = require('./devtools-automation');

async function main() {
  try {
    await auto.connect();
    console.log('✅ 连接成功');

    const page = await auto.getCurrentPage();
    console.log('当前页面:', JSON.stringify(page).slice(0, 200));

    const data = await auto.getPageData();
    console.log('页面 data key:', Object.keys(data || {}).join(', '));
    console.log('skills 数量:', (data && data.skills && data.skills.length) || 0);

    await auto.disconnect();
    console.log('\n✅ 自动化配方工作正常');
  } catch (e) {
    console.error('❌', e.message);
    console.error('\n前置条件:');
    console.error('1. cli open --project . --token 1234abcdef');
    console.error('2. cli auto --project . --auto-port 9420 --token 1234abcdef');
    console.error('3. no_proxy="*" （防代理拦截）');
    process.exit(1);
  }
}

main();
