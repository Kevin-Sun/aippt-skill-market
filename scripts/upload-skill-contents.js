#!/usr/bin/env node
// upload-skill-contents.js · 1.4 从 raw-materials/github/ 重新解析 SKILL.md 全文
// 输出到 raw-materials/skill-contents-for-upload.json（每条含 skillId/repoUrl/content/guideZh）
// 用法: node scripts/upload-skill-contents.js
// 上传: tcb fn invoke skills --data '{"action":"getSkillContents"}' 验证
//   或用脚本 upload-to-cloud.js 直接 batch 写入

const fs = require('fs');
const path = require('path');

const GH_DIR = path.resolve(__dirname, '..', 'raw-materials', 'github');
const DATA = path.resolve(__dirname, '..', 'miniprogram', 'data', 'cloud-skills-data.js');
const OUT = path.resolve(__dirname, '..', 'raw-materials', 'skill-contents-for-upload.json');

function findSkillMd(repoDir) {
  const repoPath = path.join(GH_DIR, repoDir);
  if (!fs.existsSync(repoPath)) return null;
  function walk(dir, depth) {
    if (depth > 3) return null;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return null; }
    for (const e of entries) {
      if (e.name === '.git') continue;
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        const found = walk(fullPath, depth + 1);
        if (found) return found;
      } else if (e.name.toLowerCase() === 'skill.md') {
        try { return fs.readFileSync(fullPath, 'utf8'); } catch { return null; }
      }
    }
    return null;
  }
  return walk(repoPath, 0);
}

function main() {
  const skills = require(DATA);
  const valid = skills.filter(s => s.tier !== 'rejected' && s.repoUrl);
  console.log('有效 skill（有 repoUrl）:', valid.length);

  const contents = [];
  let found = 0, missing = 0;

  valid.forEach(s => {
    const ownerRepo = s.repoUrl.replace('https://github.com/', '');
    const dir = ownerRepo.replace(/\//g, '__');
    const md = findSkillMd(dir);
    if (md && md.length > 50) {
      contents.push({
        skillId: s.id,
        skillName: s.nameZh || s.name,
        repoUrl: s.repoUrl,
        content: md,
        guideZh: s.guideZh || '',
      });
      found++;
    } else {
      missing++;
    }
  });

  console.log('找到 SKILL.md:', found, '| 缺失:', missing);
  console.log('总条数:', contents.length);

  fs.writeFileSync(OUT, JSON.stringify(contents));
  console.log('输出:', OUT);
  const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
  console.log('文件大小:', sizeMB, 'MB');
}

main();
