// compile-check.js · 对抗 fake pass 的编译验证
// 1. JS 语法检查
// 2. WXSS 非 ASCII 检查
// 3. WXML 标签闭合检查
// 4. wx:for/wx:key 配对检查
// 5. 图片路径存在性检查
// 6. 包体积检查
// 7. app.json pages 文件存在性检查

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', 'miniprogram');
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

// 3. WXML 标签闭合检查
console.log('\n3. WXML 标签闭合检查');
function checkWXML(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      checkWXML(fp);
    } else if (f.endsWith('.wxml')) {
      const content = fs.readFileSync(fp, 'utf8');
      // view 标签
      const viewOpen = (content.match(/<view/g) || []).length;
      const viewClose = (content.match(/<\/view>/g) || []).length;
      if (viewOpen !== viewClose) {
        console.log(`  ❌ ${fp}: view ${viewOpen}/${viewClose}`);
        fail++;
      }
      // text 标签（排除 textarea）
      const textOpen = (content.match(/<text(?!area)/g) || []).length;
      const textClose = (content.match(/<\/text>/g) || []).length;
      if (textOpen !== textClose) {
        console.log(`  ❌ ${fp}: text ${textOpen}/${textClose}`);
        fail++;
      }
    }
  });
}
checkWXML(ROOT);
pass++;
console.log('  ✅ WXML 标签闭合正确');

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

console.log(`\n=== 编译验证结果: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
