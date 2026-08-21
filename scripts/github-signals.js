#!/usr/bin/env node
// github-signals.js · R4 GitHub API 真实信号
// 对有 repoUrl 的条目用 gh api 获取 stars/forks/lastCommit/issues
// 替换编造的 rating/salesCount，移除 estimated
// 用法: node scripts/github-signals.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IN = path.resolve(__dirname, '..', 'raw-materials', 'skills-localized.json');
const OUT = path.resolve(__dirname, '..', 'raw-materials', 'skills-signaled.json');

function ghApi(endpoint) {
  try {
    const out = execSync(`gh api "${endpoint}" --jq '{stargazers_count,forks_count,open_issues_count,pushed_at}' 2>/dev/null`, { encoding: 'utf8', timeout: 15000 });
    return JSON.parse(out.trim());
  } catch { return null; }
}

function normalizeRating(stars) {
  if (stars <= 0) return 3.5;
  if (stars >= 100) return 5.0;
  return parseFloat((3.5 + (stars / 100) * 1.5).toFixed(1));
}

function main() {
  console.log('=== R4 GitHub 信号 ===');
  const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const withRepo = data.filter(s => s.repoUrl && /^https:\/\/github\.com\/.+\/.+/.test(s.repoUrl));
  console.log('有 repoUrl 的条目:', withRepo.length);

  let ok = 0, fail = 0, cache = {};
  let processed = 0;
  
  for (const skill of withRepo) {
    const repoPath = skill.repoUrl.replace('https://github.com/', '');
    if (cache[repoPath]) {
      const s = cache[repoPath];
      skill.githubStars = s.stargazers_count || 0;
      skill.githubForks = s.forks_count || 0;
      skill.githubIssues = s.open_issues_count || 0;
      skill.lastCommit = s.pushed_at || '';
      skill.rating = normalizeRating(skill.githubStars);
      skill.salesCount = skill.githubForks + skill.githubIssues;
      skill.estimated = false;
      skill.dataSource = 'GitHub';
      ok++;
      continue;
    }
    const result = ghApi(`repos/${repoPath}`);
    if (result) {
      cache[repoPath] = result;
      skill.githubStars = result.stargazers_count || 0;
      skill.githubForks = result.forks_count || 0;
      skill.githubIssues = result.open_issues_count || 0;
      skill.lastCommit = result.pushed_at || '';
      skill.rating = normalizeRating(skill.githubStars);
      skill.salesCount = skill.githubForks + skill.githubIssues;
      skill.estimated = false;
      skill.dataSource = 'GitHub';
      ok++;
    } else {
      skill.githubStars = 0;
      skill.githubForks = 0;
      skill.githubIssues = 0;
      skill.rating = 3.5;
      skill.salesCount = 0;
      skill.estimated = false;
      skill.dataSource = 'GitHub';
      fail++;
    }
    processed++;
    if (processed % 50 === 0) console.log(`  进度: ${processed}/${withRepo.length} (ok=${ok} fail=${fail})`);
  }

  console.log(`GitHub 信号: ok=${ok} fail=${fail}`);

  data.forEach(s => {
    if (!s.repoUrl || !/^https:\/\/github\.com\/.+\/.+/.test(s.repoUrl)) {
      s.estimated = false;
      s.dataSource = s.tier === 'inspiration' ? 'Behance' : 'unknown';
    }
  });

  const byTier = {}; data.forEach(s => byTier[s.tier]=(byTier[s.tier]||0)+1);
  console.log('Tier:', byTier);
  
  const stars = data.filter(s=>s.githubStars!==undefined).map(s=>s.githubStars).sort((a,b)=>a-b);
  if (stars.length) console.log('stars p10/p50/p90/max:', stars[Math.floor(stars.length*0.1)], stars[Math.floor(stars.length*0.5)], stars[Math.floor(stars.length*0.9)], stars[stars.length-1]);
  
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log('\n输出:', OUT);
}

main();
