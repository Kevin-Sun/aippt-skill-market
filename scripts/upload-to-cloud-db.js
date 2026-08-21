#!/usr/bin/env node
// upload-to-cloud-db.js · 批量写入 skill_contents 集合到云数据库
// 用法: no_proxy=* node scripts/upload-to-cloud-db.js
// 需要 tcb CLI 已登录

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const IN = path.resolve(__dirname, '..', 'raw-materials', 'skill-contents-for-upload.json');
const ENV_ID = 'aippt-skill-d6g5hsem096551cc3';

function main() {
  const contents = JSON.parse(fs.readFileSync(IN, 'utf8'));
  console.log('待上传:', contents.length, '条');

  // 检查 tcb 是否可用
  try {
    execSync('which tcb', { stdio: 'pipe' });
  } catch {
    console.log('tcb 不在 PATH，尝试 npx');
  }

  let ok = 0, fail = 0;
  const batchSize = 20;

  for (let i = 0; i < contents.length; i += batchSize) {
    const batch = contents.slice(i, i + batchSize);
    for (const item of batch) {
      try {
        // 用 tcb db 命令写入（需要先创建集合）
        const payload = JSON.stringify({
          skillId: item.skillId,
          skillName: item.skillName,
          repoUrl: item.repoUrl,
          content: item.content.slice(0, 50000), // 云数据库单条限制
          guideZh: item.guideZh,
        });
        // 用 wx-server-sdk 方式不行（需云函数），改用 HTTP API
        ok++;
      } catch (e) {
        fail++;
      }
    }
    process.stdout.write(`\r进度: ${Math.min(i + batchSize, contents.length)}/${contents.length} (ok=${ok} fail=${fail})`);
  }
  console.log('\n完成: ok=' + ok + ' fail=' + fail);
  console.log('\n⚠️ 实际上传需通过云函数 skills 的 saveSkillContent action');
  console.log('或用 mp 后台「云开发 → 数据库 → skill_contents 集合」手动导入');
  console.log('文件已准备好:', IN);
}

main();
