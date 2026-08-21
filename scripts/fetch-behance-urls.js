// fetch-behance-urls.js · 批量抓取 122 条 Behance 原作链接
// 用 opencli browser 驱动 Chrome 渲染搜索页，从 DOM 提取第一个 gallery 链接
// 失败条 fallback A1（搜索页 URL）
// 用法: node scripts/fetch-behance-urls.js

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SESSION = 'behance';
const OUTPUT = path.join(__dirname, '..', 'raw-materials', 'behance-urls.json');
const RATE_LIMIT_MS = 2000; // 2s/条，防风控

// 加载 122 条 inspiration 数据
const svc = require(path.join(__dirname, '..', 'miniprogram', 'data', 'skills-service.js'));
const insp = svc.getAll().filter(s => s.tier === 'inspiration');

console.log(`=== Behance 原作链接抓取（${insp.length} 条）===\n`);

// 加载已有结果（支持断点续抓）
let results = {};
if (fs.existsSync(OUTPUT)) {
  results = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
  console.log(`已有 ${Object.keys(results).length} 条结果，断点续抓\n`);
}

let ok = 0, fail = 0, fallback = 0;

for (let i = 0; i < insp.length; i++) {
  const skill = insp[i];
  const skillId = skill.id;

  // 跳过已抓的
  if (results[skillId] && results[skillId].url && !results[skillId].fallback) {
    ok++;
    continue;
  }

  const searchName = skill.name || skill.originalName || skill.nameZh || '';
  const searchUrl = 'https://www.behance.net/search/projects/' + encodeURIComponent(searchName);

  process.stdout.write(`[${i + 1}/${insp.length}] ${skillId}: "${searchName.slice(0, 40)}" ... `);

  try {
    // open 搜索页
    execSync(`opencli browser ${SESSION} open "${searchUrl}"`, { timeout: 15000, stdio: 'pipe' });
    // wait for gallery link
    try {
      execSync(`opencli browser ${SESSION} wait selector "a[href*='/gallery/']" --timeout 8000`, { timeout: 12000, stdio: 'pipe' });
    } catch(e) {
      // wait 失败，可能没结果
    }
    // eval 提取第一个 gallery href（用 base64 编码绕过 shell 引号问题）
    const evalJs = `(() => { const links = document.querySelectorAll('a[href*="/gallery/"]'); if(links.length === 0) return JSON.stringify({url: null, text: null}); const a = links[0]; return JSON.stringify({url: a.href, text: a.textContent.trim().slice(0,80)}); })()`;
    const b64 = Buffer.from(evalJs).toString('base64');
    const evalResult = execSync(
      `opencli browser ${SESSION} eval "$(echo ${b64} | base64 -d)"`,
      { timeout: 10000, encoding: 'utf8', stdio: 'pipe' }
    ).trim();

    // 解析 eval 输出（可能含 warning 行）
    const jsonMatch = evalResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.url && parsed.url.includes('/gallery/')) {
        results[skillId] = {
          url: parsed.url,
          text: parsed.text,
          skillName: searchName,
          fallback: false,
        };
        ok++;
        console.log(`✅ ${parsed.url.slice(0, 60)}`);
      } else {
        // 没找到 gallery 链接，fallback
        results[skillId] = {
          url: searchUrl,
          text: '(fallback: 搜索页)',
          skillName: searchName,
          fallback: true,
        };
        fallback++;
        console.log(`⚠️ fallback (无 gallery 链接)`);
      }
    } else {
      results[skillId] = { url: searchUrl, text: '(eval 失败)', skillName: searchName, fallback: true };
      fallback++;
      console.log(`⚠️ fallback (eval 无输出)`);
    }
  } catch(e) {
    results[skillId] = {
      url: searchUrl,
      text: '(error: ' + (e.message || '').slice(0, 50) + ')',
      skillName: searchName,
      fallback: true,
    };
    fail++;
    console.log(`❌ ${e.message.slice(0, 60)}`);
  }

  // 限速
  if (i < insp.length - 1) {
    execSync(`sleep ${RATE_LIMIT_MS / 1000}`);
  }

  // 每 10 条保存一次（断点续抓）
  if ((i + 1) % 10 === 0) {
    fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  }
}

// 最终保存
fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));

console.log(`\n=== 抓取完成 ===`);
console.log(`成功: ${ok}, fallback: ${fallback}, 失败: ${fail}`);
console.log(`总计: ${Object.keys(results).length} 条`);
console.log(`输出: ${OUTPUT}`);
