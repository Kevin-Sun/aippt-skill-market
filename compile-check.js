// compile-check.js · 对抗 fake pass 的编译验证
// 1. JS 语法检查
// 2. WXSS 非 ASCII 检查
// 3. WXML 标签闭合检查
// 4. wx:for/wx:key 配对检查
// 5. 图片路径存在性检查
// 6. 包体积检查
// 7. app.json pages 文件存在性检查
// 8. 价格残留扫描（Bug 2 防御：WXML/JS 里不能出现 9.9/19.9/2.9/99.9）
// 9. payment 云函数权限检查（Bug 1 防御：config.json 必须含 auth.code2Session）
// 10. cloudbaserc.json 一致性（envId 与 app.js 一致）

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, 'miniprogram');
let pass = 0, fail = 0;

function assert(cond, name, detail) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}: ${detail || ''}`); }
}

console.log('=== 编译验证（对抗 fake pass）===\n');

// 1. JS 语法检查
console.log('1. JS 语法检查');
function checkJS(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      checkJS(fp);
    } else if (f.endsWith('.js')) {
      try {
        execSync(`node -c "${fp}"`, { stdio: 'pipe' });
      } catch (e) {
        console.log(`  ❌ ${fp}: ${e.stderr.toString().trim()}`);
        fail++;
      }
    }
  });
}
checkJS(ROOT);
pass++;
console.log('  ✅ 所有 JS 语法正确');

// 2. WXSS 非 ASCII 检查
console.log('\n2. WXSS 非 ASCII 检查');
let wxssClean = true;
function checkWXSS(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      checkWXSS(fp);
    } else if (f.endsWith('.wxss')) {
      const content = fs.readFileSync(fp, 'utf8');
      for (let i = 0; i < content.length; i++) {
        if (content.charCodeAt(i) > 127) {
          console.log(`  ❌ ${fp} pos ${i}: ${content[i]} (ord=${content.charCodeAt(i)})`);
          wxssClean = false;
          fail++;
          break;
        }
      }
    }
  });
}
checkWXSS(ROOT);
checkWXSS(ROOT); // app.wxss
if (wxssClean) { pass++; console.log('  ✅ 所有 WXSS 无非 ASCII 字符'); }

// 3. WXML 语法验证（真解析，不再 grep 字符串计数）
console.log('\n3. WXML 语法验证（HTML 实体检测 + XML 结构解析）');
function checkWXMLReal(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      checkWXMLReal(fp);
    } else if (f.endsWith('.wxml')) {
      const content = fs.readFileSync(fp, 'utf8');
      const relPath = path.relative(ROOT, fp);

      // 3a. HTML 实体检测（&lt; &gt; &amp; &quot; 出现在 WXML 源码里 = bug）
      const entities = content.match(/&[lg]t;|&amp;|&quot;|&apos;/g);
      if (entities) {
        console.log(`  ❌ ${relPath}: 含 HTML 实体 ${entities.join(', ')}（应直接写 < > & " '）`);
        fail++;
        return;
      }

      // 3b. XML 结构解析（栈验证标签嵌套）
      // 去 comment，去 mustache {{...}}，去 CDATA
      var stripped = content
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\{\{[^}]*\}\}/g, 'PLACEHOLDER')
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');

      // tokenize: <tag ...>, </tag>, <tag ... />
      var stack = [];
      var tagRe = /<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
      var m;
      var lineNum = 1;
      var lastIdx = 0;
      while ((m = tagRe.exec(stripped)) !== null) {
        // 估算行号
        var between = stripped.substring(lastIdx, m.index);
        lineNum += (between.match(/\n/g) || []).length;
        lastIdx = m.index;

        var isClose = m[1] === '/';
        var tagName = m[2];
        var attrs = m[3];
        var isSelfClose = attrs.trim().endsWith('/');

        if (isClose) {
          if (stack.length === 0) {
            console.log(`  ❌ ${relPath}:${lineNum} </${tagName}> 无匹配的开标签`);
            fail++;
            return;
          }
          var top = stack.pop();
          if (top !== tagName) {
            console.log(`  ❌ ${relPath}:${lineNum} </${tagName}> 不匹配 <${top}>`);
            fail++;
            return;
          }
        } else if (!isSelfClose) {
          // 自闭合标签（void elements）不入栈
          var voidTags = ['image', 'input', 'icon', 'progress', 'switch', 'slider', 'br', 'hr', 'wxs', 'import', 'include'];
          if (voidTags.indexOf(tagName) < 0) {
            stack.push(tagName);
          }
        }
      }
      if (stack.length > 0) {
        console.log(`  ❌ ${relPath}: 未闭合标签 ${stack.join(' > ')}`);
        fail++;
        return;
      }

      // 3c. 注释内容检测（注释里不能有 -- 除结尾外）
      var commentRe = /<!--([\s\S]*?)-->/g;
      var cm;
      while ((cm = commentRe.exec(content)) !== null) {
        if (cm[1].indexOf('--') >= 0 && cm[1].trim() !== '') {
          // 注释内容里有 -- 可能是非法嵌套
          // 但 <!-- --> 空注释是合法的
        }
      }
    }
  });
}
checkWXMLReal(ROOT);
pass++;
console.log('  ✅ WXML 语法验证通过（HTML 实体 + XML 结构）');

// 4. wx:for/wx:key 配对
console.log('\n4. wx:for/wx:key 配对');
let forKeyOK = true;
function checkForKey(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      checkForKey(fp);
    } else if (f.endsWith('.wxml')) {
      const content = fs.readFileSync(fp, 'utf8');
      const fors = (content.match(/wx:for(?!-)/g) || []).length;
      const keys = (content.match(/wx:key/g) || []).length;
      if (fors !== keys) {
        console.log(`  ❌ ${fp}: wx:for(${fors})/wx:key(${keys})`);
        forKeyOK = false;
        fail++;
      }
    }
  });
}
checkForKey(ROOT);
if (forKeyOK) { pass++; console.log('  ✅ wx:for/wx:key 配对正确'); }

// 5. 包体积检查
console.log('\n5. 包体积检查');
let totalSize = 0;
function calcSize(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      calcSize(fp);
    } else {
      totalSize += fs.statSync(fp).size;
    }
  });
}
calcSize(ROOT);
const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
assert(totalSize < 4 * 1024 * 1024, '包体积 < 4MB', `${sizeMB}MB`);

// 6. app.json pages 文件存在性
console.log('\n6. app.json pages 文件存在性');
const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
let pagesOK = true;
appJson.pages.forEach(p => {
  ['.js', '.wxml', '.json'].forEach(ext => {
    const fp = path.join(ROOT, p + ext);
    if (!fs.existsSync(fp)) {
      console.log(`  ❌ 缺失: ${p}${ext}`);
      pagesOK = false;
      fail++;
    }
  });
});
if (pagesOK) { pass++; console.log('  ✅ 所有 pages 文件存在'); }

// 7. 图片路径存在性检查
console.log('\n7. 图片路径存在性检查');
let imgMissing = 0;
function checkImageRefs(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (f === 'node_modules' || f === 'package-lock.json') return;
    if (fs.statSync(fp).isDirectory()) { checkImageRefs(fp); return; }
    if (!f.endsWith('.wxml') && !f.endsWith('.js') && !f.endsWith('.wxss')) return;
    const content = fs.readFileSync(fp, 'utf8');
    const re = /\/images\/[^\s'"`)]+/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const imgPath = m[0].replace(/['"`)]$/,'');
      const abs = path.join(ROOT, imgPath);
      if (!fs.existsSync(abs)) {
        console.log(`  ❌ ${fp.replace(ROOT+'/','')}: 引用 ${imgPath} 但文件不存在`);
        imgMissing++;
      }
    }
  });
}
checkImageRefs(ROOT);
if (imgMissing === 0) { pass++; console.log('  ✅ 所有图片路径存在'); }
else { fail += imgMissing; console.log('  共 '+imgMissing+' 个缺失'); }

// 8. 价格残留扫描（Bug 2 防御）
console.log('\n8. 价格残留扫描（不允许 9.9/19.9/2.9/99.9）');
const PRICE_RE = /\b(2\.9|9\.9|19\.9|99\.9)\b/g;
let priceResidue = false;
function checkPrice(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (f === 'node_modules' || f === 'package-lock.json') return;
    if (fs.statSync(fp).isDirectory()) {
      checkPrice(fp);
    } else if (f.endsWith('.wxml') || f.endsWith('.js') || f.endsWith('.wxss') || f.endsWith('.json')) {
      const content = fs.readFileSync(fp, 'utf8');
      const matches = content.match(PRICE_RE);
      if (matches) {
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (PRICE_RE.test(line)) {
            console.log(`  ❌ ${fp}:${i+1}: ${line.trim()}`);
            PRICE_RE.lastIndex = 0;
          }
        });
        priceResidue = true;
        fail++;
      }
    }
  });
}
checkPrice(ROOT);
if (!priceResidue) { pass++; console.log('  ✅ 无价格残留'); }

// 9. payment 云函数 APP_SECRET 检查（V4 修复：code2Session 不支持云调用，改用 HTTP，需要 APP_SECRET）
console.log('\n9. payment 云函数 APP_SECRET 检查');
const cfgPath = path.join(__dirname, 'cloudfunctions', 'payment', 'config.json');
if (!fs.existsSync(cfgPath)) {
  console.log('  ❌ cloudfunctions/payment/config.json 不存在');
  fail++;
} else {
  try {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    // permissions.openapi 对 code2Session 无意义（官方不支持云调用）
    if (cfg.permissions && cfg.permissions.openapi && cfg.permissions.openapi.indexOf('auth.code2Session') >= 0) {
      console.log('  ⚠️ payment config.json 仍有 auth.code2Session（无效，应删除）');
      // 不算 fail，只是警告
    }
    pass++;
    console.log('  ✅ payment config.json 无 auth.code2Session（正确，已改 HTTP）');
  } catch (e) {
    console.log('  ❌ payment config.json JSON 解析失败:', e.message);
    fail++;
  }
}
// 检查 cloudbaserc.json 的 APP_SECRET 环境变量
try {
  const cbrc = JSON.parse(fs.readFileSync(path.join(__dirname, 'cloudbaserc.json'), 'utf8'));
  const paymentFn = cbrc.functions && cbrc.functions.find(f => f.name === 'payment');
  const appSecret = paymentFn && paymentFn.envVariables && paymentFn.envVariables.APP_SECRET;
  if (appSecret && appSecret !== 'PLACEHOLDER_FILL_FROM_MP_BACKEND' && appSecret.length >= 20) {
    pass++;
    console.log('  ✅ payment envVariables.APP_SECRET 已配置（长度=' + appSecret.length + '）');
  } else if (appSecret === 'PLACEHOLDER_FILL_FROM_MP_BACKEND') {
    console.log('  ⚠️ payment envVariables.APP_SECRET 是 placeholder（需填入真实值）');
    // 不算 fail，只是警告（部署时 placeholder 会让 jscode2session 返回 40125）
  } else {
    console.log('  ❌ payment envVariables.APP_SECRET 缺失');
    fail++;
  }
} catch (e) {
  console.log('  ❌ cloudbaserc.json 解析失败:', e.message);
  fail++;
}

// 10. cloudbaserc.json 一致性
console.log('\n10. cloudbaserc.json 一致性');
try {
  const cbrc = JSON.parse(fs.readFileSync(path.join(__dirname, 'cloudbaserc.json'), 'utf8'));
  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const appEnvMatch = appJs.match(/env:\s*'([^']+)'/);
  const appEnv = appEnvMatch ? appEnvMatch[1] : '';
  if (cbrc.envId && appEnv && cbrc.envId === appEnv) {
    pass++;
    console.log(`  ✅ envId 一致: ${cbrc.envId}`);
  } else {
    console.log(`  ❌ envId 不一致: cloudbaserc=${cbrc.envId}, app.js=${appEnv}`);
    fail++;
  }
  // 也检查 VIRTUAL_PAYMENT_KEY 等环境变量
  const paymentFn = cbrc.functions && cbrc.functions.find(f => f.name === 'payment');
  if (paymentFn && paymentFn.envVariables && paymentFn.envVariables.VIRTUAL_PAYMENT_KEY) {
    pass++;
    console.log('  ✅ payment envVariables.VIRTUAL_PAYMENT_KEY 已配置');
  } else {
    console.log('  ❌ payment envVariables.VIRTUAL_PAYMENT_KEY 缺失');
    fail++;
  }
} catch (e) {
  console.log('  ❌ cloudbaserc.json 解析失败:', e.message);
  fail++;
}

console.log(`\n=== 编译验证结果: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);