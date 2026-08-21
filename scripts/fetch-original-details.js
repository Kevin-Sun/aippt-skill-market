// fetch-original-details.js · 抓取 Behance + GitHub 原作详情
// Behance: opencli browser 渲染 gallery 页 → eval 提取 og:image, og:title, author
// GitHub: HTTP API GET /repos/{owner}/{repo} → name, description, stargazers_count, owner
// 用法: node scripts/fetch-original-details.js

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

const SESSION = 'original';
const OUTPUT = path.join(__dirname, '..', 'raw-materials', 'original-details.json');
const RATE_LIMIT_MS = 1500;

const svc = require(path.join(__dirname, '..', 'miniprogram', 'data', 'skills-service.js'));
const all = svc.getAll().filter(s => s.tier !== 'rejected');

// 加载已有结果
let results = {};
if (fs.existsSync(OUTPUT)) {
  results = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
  console.log(`已有 ${Object.keys(results).length} 条，断点续抓\n`);
}

console.log(`=== 原作详情抓取（${all.length} 条）===\n`);

let ok = 0, fail = 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// HTTP GET helper
function httpGet(url, useProxy) {
  return new Promise((resolve, reject) => {
    const opts = { timeout: 10000 };
    if (useProxy) {
      opts.hostname = '127.0.0.1';
      opts.port = 10808;
      opts.path = url;
      opts.headers = { Host: new URL(url).hostname };
    }
    const req = https.get(url, opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function fetchBehanceDetail(skill) {
  const url = skill.sourceUrl;
  if (!url) return null;

  // 用 opencli browser 渲染 gallery 页
  try {
    execSync(`opencli browser ${SESSION} open "${url}"`, { timeout: 15000, stdio: 'pipe' });
    await sleep(3000);

    // wait for og:image 或 cover image
    try {
      execSync(`opencli browser ${SESSION} wait selector "img" --timeout 8000`, { timeout: 12000, stdio: 'pipe' });
    } catch(e) {}

    // eval 提取 og:image + og:title + author
    const evalJs = `(() => {
      const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
      const ogDesc = document.querySelector('meta[property="og:description"]')?.content || '';
      const authorEl = document.querySelector('a[href*="/"][data-ut*="owner"]') || document.querySelector('.Project-ownerName') || document.querySelector('a[href*="/user/"]');
      const author = authorEl ? authorEl.textContent.trim().slice(0,50) : '';
      const authorLink = authorEl ? authorEl.href : '';
      // 提取所有作品图片
      const imgs = Array.from(document.querySelectorAll('img[src*="mirantiscdn"]')).map(i => i.src).slice(0, 5);
      if (imgs.length === 0) {
        const projImgs = Array.from(document.querySelectorAll('div img')).map(i => i.src).filter(s => s.includes('behance') || s.includes('mirantis')).slice(0,5);
        return JSON.stringify({coverImage: ogImage, title: ogTitle, desc: ogDesc, author, authorLink, images: projImgs});
      }
      return JSON.stringify({coverImage: ogImage, title: ogTitle, desc: ogDesc, author, authorLink, images});
    })()`;
    const b64 = Buffer.from(evalJs).toString('base64');
    const evalResult = execSync(`opencli browser ${SESSION} eval "$(echo ${b64} | base64 -d)"`, { timeout: 10000, encoding: 'utf8', stdio: 'pipe' }).trim();

    const jsonMatch = evalResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch(e) {
    // eval 失败，用 og meta（curl 可能拿不到 CSR 内容）
  }
  return null;
}

async function fetchGitHubDetail(skill) {
  const repoUrl = skill.repoUrl || skill.sourceUrl;
  if (!repoUrl || !repoUrl.includes('github.com')) return null;

  // 从 repoUrl 提取 owner/repo
  const m = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (!m) return null;
  const owner = m[1];
  const repo = m[2].replace(/\.git$/, '');

  try {
    const resp = await httpGet(`https://api.github.com/repos/${owner}/${repo}`);
    if (resp.status !== 200) return null;
    const data = JSON.parse(resp.body);
    return {
      coverImage: `https://opengraph.githubassets.com/1/${owner}/${repo}`,
      title: data.name || skill.name,
      desc: data.description || '',
      author: data.owner ? data.owner.login : owner,
      authorLink: data.owner ? data.owner.html_url : '',
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      language: data.language || '',
    };
  } catch(e) {
    return null;
  }
}

(async () => {
  for (let i = 0; i < all.length; i++) {
    const skill = all[i];
    const skillId = skill.id;

    if (results[skillId] && results[skillId].title) {
      ok++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${all.length}] ${skillId}: `);

    let detail = null;
    if (skill.sourceUrl && skill.sourceUrl.includes('behance.net')) {
      detail = await fetchBehanceDetail(skill);
      process.stdout.write('Behance ');
    } else if ((skill.repoUrl || skill.sourceUrl) && (skill.repoUrl || skill.sourceUrl).includes('github.com')) {
      detail = await fetchGitHubDetail(skill);
      process.stdout.write('GitHub ');
    } else {
      // 没有原作链接的，用现有数据兜底
      detail = {
        coverImage: skill.gradient ? '' : '',
        title: skill.displayName || skill.nameZh || skill.name,
        desc: skill.displayDesc || skill.descZh || skill.previewDesc || '',
        author: skill.recommendedAgent || '',
        authorLink: '',
      };
      process.stdout.write('fallback ');
    }

    if (detail && (detail.title || detail.coverImage)) {
      results[skillId] = detail;
      ok++;
      console.log(`✅ ${detail.title ? detail.title.slice(0, 30) : 'no title'}`);
    } else {
      // fallback 用现有数据
      results[skillId] = {
        coverImage: '',
        title: skill.displayName || skill.nameZh || skill.name,
        desc: skill.displayDesc || skill.descZh || skill.previewDesc || '',
        author: skill.recommendedAgent || '',
        authorLink: '',
      };
      fail++;
      console.log(`⚠️ fallback`);
    }

    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
    }

    await sleep(RATE_LIMIT_MS);
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  console.log(`\n=== 抓取完成 ===`);
  console.log(`成功: ${ok}, fallback: ${fail}`);
  console.log(`总计: ${Object.keys(results).length} 条`);
  console.log(`输出: ${OUTPUT}`);
})();
