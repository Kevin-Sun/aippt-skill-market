// page-logic.js · Node 环境执行 page JS 的真逻辑测试
// 原理：mock 小程序运行时（Page/wx/getApp/getCurrentPages）
// 然后 require 每个 page JS，调用 onLoad，验证 data 和 wx 调用
// 这能 100% 抓到 "normalizeAll is not a function" 这类 bug
//
// 用法: node tests/page-logic.js

const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', 'miniprogram');

let pass = 0, fail = 0, errors = [];

function assert(cond, name, detail) {
  if (cond) { pass++; }
  else { fail++; errors.push(`❌ ${name}: ${detail || ''}`); }
}

// ========== Mock 小程序运行时 ==========
function createMockPage(filePath) {
  var toasts = [];
  var navTo = [];
  var navBack = 0;
  var previewImgs = [];
  var pageData = {};
  var pageObj = null;

  global.wx = {
    showToast: function(o) { toasts.push(o); },
    navigateTo: function(o) { navTo.push(o); },
    navigateBack: function() { navBack++; },
    previewImage: function(o) { previewImgs.push(o); },
    showLoading: function() {},
    hideLoading: function() {},
    setClipboardData: function(o) { if (o.success) o.success(); },
    getStorageSync: function(k) { return null; },
    setStorageSync: function() {},
    cloud: { callFunction: function(o) { if (o && o.success) o.success({ result: {} }); } },
    request: function() {},
    canIUse: function() { return true; },
    getSystemInfoSync: function() { return { windowWidth: 375 }; },
    login: function(o) { if (o && o.success) o.success({ code: 'mock_code' }); },
    cloud: {
      callFunction: function(o) { if (o && o.success) o.success({ result: { purchases: [] } }); },
      init: function() {},
    },
    getUserProfile: function(o) { if (o && o.success) o.success({ userInfo: { nickName: 'test', avatarUrl: '' } }); },
  };

  global.getApp = function() {
    return {
      globalData: { userInfo: null },
      checkLogin: function() { return false; },
    };
  };

  global.getCurrentPages = function() {
    return [{ route: 'pages/index/index' }];
  };

  global.Page = function(config) {
    pageObj = config;
    pageObj.data = Object.assign({}, pageObj.data || {});
    pageObj.setData = function(d) {
      Object.assign(pageObj.data, d);
    };
  };

  global.Component = function() {};
  global.App = function() {};

  // 清除缓存，重新 require
  delete require.cache[require.resolve(filePath)];

  try {
    require(filePath);
  } catch(e) {
    return { error: e.message, pageObj: null, toasts, navTo, navBack, data: {} };
  }

  return { error: null, pageObj, toasts, navTo, navBack, previewImgs, data: pageObj ? pageObj.data : {} };
}

// ========== 测试 preview 页 ==========
console.log('=== preview.js page logic 测试（405 条全覆盖）===\n');

var skillsService = require(path.join(ROOT, 'data/skills-service.js'));
var allSkills = skillsService.getAll();
var published = allSkills.filter(s => s.tier !== 'rejected');

var previewPath = path.join(ROOT, 'pages/preview/preview.js');

var previewPass = 0, previewFail = 0;
published.forEach(function(skill) {
  var mock = createMockPage(previewPath);
  if (mock.error) {
    assert(false, `preview onLoad(${skill.id})`, mock.error);
    previewFail++;
    return;
  }
  if (!mock.pageObj || !mock.pageObj.onLoad) {
    assert(false, `preview onLoad(${skill.id})`, 'pageObj 或 onLoad 不存在');
    previewFail++;
    return;
  }
  try {
    mock.pageObj.onLoad({ id: skill.id });
  } catch(e) {
    assert(false, `preview onLoad(${skill.id})`, '异常: ' + e.message);
    previewFail++;
    return;
  }
  var hasToast = mock.toasts.some(t => t.title && t.title.indexOf('不存在') >= 0);
  if (hasToast) {
    assert(false, `preview onLoad(${skill.id})`, '弹了"不存在" toast');
    previewFail++;
    return;
  }
  if (!mock.pageObj.data.totalPreview || mock.pageObj.data.totalPreview === 0) {
    assert(false, `preview onLoad(${skill.id})`, 'totalPreview=0（无预览图）');
    previewFail++;
    return;
  }
  if (!mock.pageObj.data.skillName || mock.pageObj.data.skillName.length === 0) {
    assert(false, `preview onLoad(${skill.id})`, 'skillName 为空');
    previewFail++;
    return;
  }
  previewPass++;
});

console.log(`  preview 页: ${previewPass} PASS / ${previewFail} FAIL（共 ${published.length} 条 skill）`);
assert(previewFail === 0, 'PAGE-LOGIC-01 preview onLoad 全 405 条无崩溃', `${previewPass}/${published.length}`);

// ========== 测试 detail 页 ==========
console.log('\n=== detail.js page logic 测试（405 条全覆盖）===\n');

var detailPath = path.join(ROOT, 'pages/detail/detail.js');
var detailPass = 0, detailFail = 0;

published.forEach(function(skill) {
  var mock = createMockPage(detailPath);
  if (mock.error) {
    assert(false, `detail onLoad(${skill.id})`, mock.error);
    detailFail++;
    return;
  }
  if (!mock.pageObj || !mock.pageObj.onLoad) {
    assert(false, `detail onLoad(${skill.id})`, 'pageObj 或 onLoad 不存在');
    detailFail++;
    return;
  }
  try {
    mock.pageObj.onLoad({ id: skill.id });
  } catch(e) {
    assert(false, `detail onLoad(${skill.id})`, '异常: ' + e.message);
    detailFail++;
    return;
  }
  var hasToast = mock.toasts.some(t => t.title && t.title.indexOf('不存在') >= 0);
  if (hasToast) {
    assert(false, `detail onLoad(${skill.id})`, '弹了"不存在" toast');
    detailFail++;
    return;
  }
  if (!mock.pageObj.data.skill) {
    assert(false, `detail onLoad(${skill.id})`, 'data.skill 未设置');
    detailFail++;
    return;
  }
  if (!mock.pageObj.data.skill.displayName && !mock.pageObj.data.skill.name) {
    assert(false, `detail onLoad(${skill.id})`, 'skill 无名称');
    detailFail++;
    return;
  }
  detailPass++;
});

console.log(`  detail 页: ${detailPass} PASS / ${detailFail} FAIL（共 ${published.length} 条 skill）`);
assert(detailFail === 0, 'PAGE-LOGIC-02 detail onLoad 全 405 条无崩溃', `${detailPass}/${published.length}`);

// ========== 测试其他页面的 onLoad 不抛异常 ==========
console.log('\n=== 其他页面 onLoad smoke 测试 ===\n');

var otherPages = [
  { file: 'pages/index/index.js', opts: {} },
  { file: 'pages/orders/orders.js', opts: {} },
  { file: 'pages/mine/mine.js', opts: {} },
  { file: 'pages/search/search.js', opts: {} },
  { file: 'pages/login/login.js', opts: {} },
  { file: 'pages/promotion/promotion.js', opts: {} },
];

otherPages.forEach(function(p) {
  var fp = path.join(ROOT, p.file);
  if (!fs.existsSync(fp)) {
    assert(false, `${p.file} onLoad`, '文件不存在');
    return;
  }
  var mock = createMockPage(fp);
  if (mock.error) {
    assert(false, `${p.file} require`, mock.error);
    return;
  }
  if (!mock.pageObj) {
    assert(false, `${p.file} Page()`, 'pageObj 未创建');
    return;
  }
  if (mock.pageObj.onLoad) {
    try {
      mock.pageObj.onLoad(p.opts);
      assert(true, `${p.file} onLoad 不抛异常`, 'OK');
    } catch(e) {
      assert(false, `${p.file} onLoad`, e.message);
    }
  } else {
    assert(true, `${p.file} 无 onLoad（跳过）`, 'OK');
  }
});

// ========== 汇总 ==========
console.log('\n=== page-logic 结果: ' + pass + ' PASS / ' + fail + ' FAIL ===');
if (fail > 0) {
  console.log('\n失败项:');
  errors.forEach(e => console.log('  ' + e));
}
process.exit(fail > 0 ? 1 : 0);
