#!/usr/bin/env node
// parse-skills.js · L0 重解析 — 从 raw-materials/github/ 提取全部 SKILL.md
// 产出: raw-materials/skills-parsed.json
// 用法: node scripts/parse-skills.js

const fs = require('fs');
const path = require('path');

const GH_DIR = path.resolve(__dirname, '..', 'raw-materials', 'github');
const OUT = path.resolve(__dirname, '..', 'raw-materials', 'skills-parsed.json');

const PPT_RE = /ppt|pptx|slide|presentation|deck|keynote|幻灯|演示|汇报/i;
const IRRELEVANT_RE = /via Rube MCP|Composio|Automate .* tasks/i;

function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0] && lines[0].trim() !== '---') return { name: '', description: '', body: content.slice(0, 500) };
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  if (end < 0) return { name: '', description: '', body: content.slice(0, 500) };
  const fm = lines.slice(1, end).join('\n');
  const body = lines.slice(end + 1).join('\n').trim();
  const name = (fm.match(/^name:\s*(.+)$/m) || [])[1] || '';
  let description = (fm.match(/^description:\s*(.+)$/m) || [])[1] || '';
  if (description) {
    description = description.replace(/^["']|["']$/g, '').replace(/["']\s*$/, '');
  }
  return { name: name.trim(), description: description.trim(), body: body.slice(0, 1000) };
}

function detectLicense(dir) {
  for (const f of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'COPYING']) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) {
      const c = fs.readFileSync(p, 'utf8').slice(0, 500);
      if (/MIT License/i.test(c)) return 'MIT';
      if (/Apache License/i.test(c)) return 'Apache';
      if (/Creative Commons|CC0|CC BY/i.test(c)) return 'CC0';
      if (/BSD/i.test(c)) return 'BSD';
      if (/GNU GENERAL PUBLIC|GPL/i.test(c)) return 'GPL';
      return 'other';
    }
  }
  for (const sub of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!sub.isDirectory() || sub.name === '.git') continue;
    for (const f of ['LICENSE', 'license']) {
      const p = path.join(dir, sub.name, f);
      if (fs.existsSync(p)) {
        const c = fs.readFileSync(p, 'utf8').slice(0, 400);
        if (/MIT License/i.test(c)) return 'MIT';
        if (/Apache License/i.test(c)) return 'Apache';
        return 'other';
      }
    }
  }
  return 'none';
}

function main() {
  console.log('=== L0 重解析 ===');
  const repos = fs.readdirSync(GH_DIR).filter(d => fs.statSync(path.join(GH_DIR, d)).isDirectory());
  console.log('repo 目录数:', repos.length);

  const all = [];
  let pptCount = 0, irrelevantCount = 0;

  repos.forEach(repoDir => {
    const repoPath = path.join(GH_DIR, repoDir);
    const license = detectLicense(repoPath);
    const ownerSlashRepo = repoDir.replace(/__/g, '/');
    const repoUrl = `https://github.com/${ownerSlashRepo}`;

    function walk(dir, depth) {
      if (depth > 3) return;
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        if (e.name === '.git') continue;
        const fullPath = path.join(dir, e.name);
        if (e.isDirectory()) {
          walk(fullPath, depth + 1);
        } else if (e.name === 'SKILL.md' || (e.name.endsWith('.md') && e.name.toLowerCase() === 'skill.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const fm = parseFrontmatter(content);
            const combined = `${fm.name} ${fm.description}`;
            const isPPT = PPT_RE.test(combined);
            const isIrrelevant = IRRELEVANT_RE.test(combined) && !isPPT;
            if (isPPT) pptCount++;
            if (isIrrelevant) irrelevantCount++;
            all.push({
              repoDir,
              repoUrl,
              ownerSlashRepo,
              license,
              skillMdPath: path.relative(GH_DIR, fullPath),
              name: fm.name,
              description: fm.description,
              body: fm.body.slice(0, 500),
              isPPT,
              isIrrelevant,
              tier: isIrrelevant ? 'rejected' : (license !== 'none' && ['MIT','Apache','CC0','BSD'].includes(license) ? 'paid' : 'free_ref')
            });
          } catch (e) {}
        }
      }
    }

    walk(repoPath, 0);
  });

  console.log('SKILL.md 总数:', all.length);
  console.log('PPT 相关:', pptCount);
  console.log('Composio 无关:', irrelevantCount);
  console.log('');

  const byLicense = {};
  all.forEach(s => { byLicense[s.license] = (byLicense[s.license] || 0) + 1; });
  console.log('LICENSE 分布:', byLicense);

  const byTier = {};
  all.forEach(s => { byTier[s.tier] = (byTier[s.tier] || 0) + 1; });
  console.log('Tier 分布:', byTier);

  const pptSkills = all.filter(s => s.isPPT);
  const byTierPPT = {};
  pptSkills.forEach(s => { byTierPPT[s.tier] = (byTierPPT[s.tier] || 0) + 1; });
  console.log('PPT 相关 Tier 分布:', byTierPPT);

  fs.writeFileSync(OUT, JSON.stringify(all, null, 2));
  console.log('\n输出:', OUT);
  console.log('PPT 相关条目:', pptSkills.length, '(可绑交付物的候选池)');
}

main();
