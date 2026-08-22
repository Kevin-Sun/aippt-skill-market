// ci-upload.js · 用 miniprogram-ci 上传正式版代码
// 用法: node scripts/ci-upload.js --ver 1.5.4 --desc "版本描述"（或裸位置参数 node scripts/ci-upload.js 1.5.4）

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
  // 版本号解析：优先 --ver <v>；也接受 --version <v> 和裸位置参数（v1.5.4 曾因位置参数不识别回落 1.0.0，不允许再犯）
  let version = null;
  if (verIdx >= 0 && args[verIdx + 1]) {
    version = args[verIdx + 1];
  } else {
    const versionIdx = args.indexOf('--version');
    if (versionIdx >= 0 && args[versionIdx + 1]) {
      version = args[versionIdx + 1];
    } else {
      const positional = args.find(a => !a.startsWith('--') && /^\d+\.\d+\.\d+$/.test(a));
      if (positional) version = positional;
    }
  }
  // 版本号强校验：缺失或不合法直接退出——宁可不上传，不可传错号（2026-08-22 事故：位置参数不识别回落 1.0.0）
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`❌ 版本号缺失或不合法: "${version}"（用法: node scripts/ci-upload.js --ver 1.5.4 或 node scripts/ci-upload.js 1.5.4）`);
    process.exit(1);
  }
  const desc = descIdx >= 0 && args[descIdx + 1] ? args[descIdx + 1] : 'CI upload ' + new Date().toISOString();

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
