// ci-preview.js · 用 miniprogram-ci 自动生成预览二维码
// 前置: 从 mp.weixin.qq.com → 开发管理 → 开发设置 下载"小程序代码上传密钥"
//       保存为项目根目录的 private.wx9647f4ecd0d033fe.key
//       IP 白名单可不勾（密钥本身是强凭据）
//
// 用法: node scripts/ci-preview.js
const ci = require('miniprogram-ci');
const path = require('path');
const os = require('os');

const APPID = 'wx9647f4ecd0d033fe';
const KEY_PATH = path.resolve(__dirname, '..', `private.${APPID}.key`);

async function main() {
  console.log('=== miniprogram-ci 预览 ===');
  console.log('AppID:', APPID);
  console.log('Key:', fs.existsSync(KEY_PATH) ? '✅ 密钥已下载' : '❌ 密钥未下载（从 mp 后台 → 开发管理 → 开发设置 → 下载密钥）');

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

  const qrcodeDest = path.join(os.tmpdir(), `preview-${Date.now()}.jpg`);
  const result = await ci.preview({
    project,
    desc: 'CI auto preview ' + new Date().toISOString(),
    setting: { es6: true, minify: true },
    qrcodeFormat: 'image',
    qrcodeOutputDest: qrcodeDest,
    onProgressUpdate: console.log,
  });

  console.log('\n✅ 预览二维码:', qrcodeDest);
  console.log('result:', JSON.stringify(result, null, 2));
}

const fs = require('fs');
main().catch(e => { console.error('❌', e.message); process.exit(1); });
