// ci-upload.js · 用 miniprogram-ci 上传正式版代码
// 用法: node scripts/ci-upload.js --ver 1.0.0 --desc "首次提交审核"

// 绕过本机代理直连微信（servicewechat.com 国内可达，避免代理切节点导致 -10008）
delete process.env.HTTP_PROXY;
delete process.env.http_proxy;
delete process.env.HTTPS_PROXY;
delete process.env.https_proxy;
delete process.env.ALL_PROXY;
delete process.env.all_proxy;
process.env.no_proxy = '*';

const ci = require('miniprogram-ci');
const path = require('path');
const fs = require('fs');

const APPID = 'wx9647f4ecd0d033fe';
const KEY_PATH = path.resolve(__dirname, '..', `private.${APPID}.key`);

async function main() {
  const args = process.argv.slice(2);
  const verIdx = args.indexOf('--ver');
  const descIdx = args.indexOf('--desc');
  const version = verIdx >= 0 ? args[verIdx + 1] : '1.0.0';
  const desc = descIdx >= 0 ? args[descIdx + 1] : 'CI upload ' + new Date().toISOString();

  console.log('=== miniprogram-ci 上传 ===');
  console.log('AppID:', APPID);
  console.log('Version:', version);
  console.log('Key:', fs.existsSync(KEY_PATH) ? '✅' : '❌ 密钥未下载');

  if (!fs.existsSync(KEY_PATH)) {
    console.log('\n请下载密钥后保存为:', KEY_PATH);
    process.exit(1);
  }

  const project = new ci.Project({
    appid: APPID,
    type: 'miniProgram',
    projectPath: path.resolve(__dirname, '..'),
    privateKeyPath: KEY_PATH,
    ignores: ['node_modules/**/*', 'tests/**/*', '.git/**/*'],
  });

  const result = await ci.upload({
    project,
    version,
    desc,
    setting: { es6: true, minify: true },
    onProgressUpdate: console.log,
  });

  console.log('\n✅ 上传成功:', JSON.stringify(result, null, 2));
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
