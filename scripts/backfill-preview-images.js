// backfill-preview-images.js · 等 76 张图生成完后，回填 previewImages 到数据
// 逻辑：按 skill 的 scene+style 找到对应的 4 个变体，分配给 previewImages
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ENV_ID = 'aippt-skill-d6g5hsem096551cc3';
const MANIFEST_PATH = path.join(ROOT, 'oss', 'preview-manifest.json');
const IMG_DIR = path.join(ROOT, 'oss', 'preview-images');

const COMBOS = [
  ['工作汇报','商务简约'], ['商务展示','商务简约'], ['创意设计','创意活泼'],
  ['学术研究','学术清爽'], ['答辩','学术清爽'], ['教育课件','创意活泼'],
  ['创意设计','日系简约'], ['创意设计','中式典雅'], ['工作汇报','中式典雅'],
  ['创意设计','科技极简'], ['商务展示','科技极简'], ['教育课件','中式典雅'],
  ['学术研究','科技极简'], ['商务展示','创意活泼'], ['商务展示','中式典雅'],
  ['教育课件','学术清爽'], ['答辩','中式典雅'], ['答辩','创意活泼'],
  ['工作汇报','科技极简'],
];

function main() {
  console.log('=== 回填 previewImages ===');

  // 检查图片是否全部生成
  const files = fs.existsSync(IMG_DIR) ? fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.png')) : [];
  console.log('已生成图片: ' + files.length + '/76');
  if (files.length < 76) {
    console.log('⚠️ 图片未全部生成，等待完成后再跑此脚本');
    console.log('当前: ' + files.length + ' 张，缺 ' + (76 - files.length) + ' 张');
    return;
  }

  // 上传所有图片到 CloudBase storage
  console.log('\n=== 上传到 CloudBase storage ===');
  let uploaded = 0;
  for (const f of files) {
    const localPath = path.join(IMG_DIR, f);
    const cloudPath = 'preview-images/' + f;
    try {
      execSync(`tcb storage upload "${localPath}" "${cloudPath}" --env-id ${ENV_ID} 2>&1`, { encoding: 'utf8', stdio: 'pipe' });
      uploaded++;
      if (uploaded % 10 === 0) console.log('  已上传 ' + uploaded + '/' + files.length);
    } catch (e) {
      console.error('  ❌ upload fail: ' + f);
    }
  }
  console.log('上传完成: ' + uploaded + '/' + files.length);

  // 构建 scene+style → [4个变体的 cloud:// URL] 映射
  const comboMap = {};
  for (let i = 0; i < COMBOS.length; i++) {
    const [scene, style] = COMBOS[i];
    const key = scene + '|' + style;
    comboMap[key] = [];
    for (let v = 0; v < 4; v++) {
      const id = `preview_${String(i).padStart(2,'0')}_${v}`;
      comboMap[key].push(`cloud://${ENV_ID}.${getStorageBucket(ENV_ID)}/${id}.png`);
    }
  }

  // 回填到 cloud-skills-data.js
  console.log('\n=== 回填到 cloud-skills-data.js ===');
  const cloudDataPath = path.join(ROOT, 'miniprogram', 'data', 'cloud-skills-data.js');
  let cloudSrc = fs.readFileSync(cloudDataPath, 'utf8');

  // 读取 cloud-skills-data.js 的数据
  const cloudData = require(cloudDataPath);
  let filled = 0;
  for (const skill of cloudData) {
    const key = skill.scene + '|' + skill.style;
    if (comboMap[key]) {
      // 按 skill id 哈希选变体，保证同组合内不重样
      const hash = skill.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const variant = hash % 4;
      skill.previewImages = [comboMap[key][variant]];
      filled++;
    }
  }
  console.log('回填: ' + filled + '/' + cloudData.length + ' 条');

  // 写回 cloud-skills-data.js
  const newSrc = 'var cloudSkills = ' + JSON.stringify(cloudData, null, 2) + ';\nmodule.exports = cloudSkills;\n';
  fs.writeFileSync(cloudDataPath, newSrc);
  console.log('✅ 已写回 cloud-skills-data.js');

  // 同步到云端 DB
  console.log('\n=== 同步到云端 DB ===');
  const dbDataPath = path.join(ROOT, 'cloudfunctions', 'skills', 'cloud-skills-data.js');
  fs.writeFileSync(dbDataPath, newSrc);
  console.log('✅ 已同步到云函数目录');

  console.log('\n=== 完成 ===');
  console.log('previewImages 回填 ' + filled + ' 条');
  console.log('下一步: tcb fn deploy skills --force 同步云函数');
}

function getStorageBucket(envId) {
  // CloudBase storage 的默认 bucket 格式: envId-<random>
  // 小程序里用 cloud://envId.xxx/path，但 xxx 是 bucket 标识
  // 直接用 envId 作为前缀即可，SDK 会自动解析
  return envId;
}

main();
