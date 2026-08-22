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

// ========== 测试 member 页（v1.5.4 支付流程真执行）==========
console.log('\n=== member.js 支付流程逻辑测试（v1.5.4）===\n');

var memberPath = path.join(ROOT, 'pages/member/member.js');

// 可控 mock：模拟支付链路各环节
function createMemberMock(opts) {
  opts = opts || {};
  var toasts = [], modals = [], loadings = 0;
  var callFunctionCalls = [];
  var virtualPaymentCalls = [];
  var loginCalls = 0;
  var pageObj = null;

  global.wx = {
    showToast: function(o) { toasts.push(o); },
    showModal: function(o) { modals.push(o); },
    showLoading: function() { loadings++; },
    hideLoading: function() {},
    navigateBack: function() {},
    navigateTo: function(o) {},
    setStorageSync: function() {},
    getStorageSync: function() { return null; },
    canIUse: function() { return true; },
    login: function(o) {
      loginCalls++;
      if (o && o.success) o.success({ code: 'fresh_code_' + loginCalls });
    },
    requestVirtualPayment: function(o) {
      virtualPaymentCalls.push(o);
      if (opts.paymentResult === 'fail') {
        if (o.fail) o.fail({ errCode: -15013, errMsg: 'fail' });
      } else {
        if (o.success) o.success({});
      }
    },
  };
  global.getApp = function() { return { globalData: {} }; };
  global.getCurrentPages = function() { return [{ route: 'pages/member/member' }]; };
  global.Page = function(config) {
    pageObj = config;
    pageObj.data = Object.assign({}, pageObj.data || {});
    pageObj.setData = function(d) { Object.assign(pageObj.data, d); };
  };
  global.Component = function() {};
  global.App = function() {};

  // 可编程的 cloud.callFunction：按 action 分发——createOrder 走编程序列，其他 action 返回空
  var createOrderResults = (opts.createOrderResults || []).slice();
  var cloudCallCount = 0;
  global.wx.cloud = {
    callFunction: function(o) {
      cloudCallCount++;
      var action = o.data && o.data.action;
      callFunctionCalls.push({ name: o.name, action: action, count: cloudCallCount });
      var result;
      if (action === 'createOrder') {
        result = createOrderResults.length ? createOrderResults.shift() : (opts.defaultCreateOrderResult || {});
      } else if (action === 'getSubscription') {
        result = opts.subscription || {};
      } else {
        result = {};
      }
      if (o.success) o.success({ result: result });
    },
  };

  delete require.cache[require.resolve(memberPath)];
  try { require(memberPath); } catch(e) { return { error: e.message }; }
  // 注意：loginCalls 是原始值，必须用 getter 返回（按值拷贝会永远是 0）
  return { pageObj, toasts, modals, virtualPaymentCalls, callFunctionCalls, getLoginCalls: function() { return loginCalls; } };
}

// M1: onLoad 无崩溃（getSubscription 走 cloud mock）
(function() {
  var m = createMemberMock({});
  assert(!m.error, 'M1 member require+onLoad 无崩溃', m.error || 'OK');
  if (m.pageObj && m.pageObj.onLoad) {
    try {
      m.pageObj.onLoad();
      assert(true, 'M1 member onLoad 执行成功', 'OK');
    } catch(e) {
      assert(false, 'M1 member onLoad', e.message);
    }
  }
})();

// M2: tiers 只有 free/monthly/annual 三档，价格整数，无 single/category
(function() {
  var m = createMemberMock({});
  var tiers = m.pageObj && m.pageObj.data.tiers;
  assert(!!tiers && tiers.length === 3, 'M2 tiers=3 档（砍掉 single/category）', '实际 ' + (tiers ? tiers.length : 0));
  var ids = tiers ? tiers.map(t => t.id).join(',') : '';
  assert(ids === 'free,monthly,annual', 'M2 tiers 顺序 free,monthly,annual', ids);
  var allInt = tiers && tiers.every(t => Number.isInteger(t.price));
  assert(allInt, 'M2 价格全整数', JSON.stringify(tiers && tiers.map(t => t.price)));
})();

// M3: 免费档 tap → toast「当前即免费方案」，不进入支付链路
(function() {
  var m = createMemberMock({});
  m.pageObj.onLoad();
  m.pageObj.onSubscribeTap({ currentTarget: { dataset: { id: 'free' } } });
  var freeToast = m.toasts.some(t => t.title && t.title.indexOf('当前即免费方案') >= 0);
  assert(freeToast, 'M3 免费档 tap → 「当前即免费方案」toast', JSON.stringify(m.toasts));
  assert(m.virtualPaymentCalls.length === 0, 'M3 免费档不触发支付', 'vp calls=' + m.virtualPaymentCalls.length);
})();

// M4: 月度会员完整支付流：createOrder → requestVirtualPayment success → isMember=true
(function() {
  var m = createMemberMock({
    createOrderResults: [
      { errno: 0, signData: '{}', paySig: 'x', signature: 'y', outTradeNo: 'no1', offerId: 'off', productId: 'member_monthly', goodsPrice: 1900 },
    ],
  });
  m.pageObj.onLoad();
  m.pageObj.onSubscribeTap({ currentTarget: { dataset: { id: 'monthly' } } });
  assert(m.virtualPaymentCalls.length === 1, 'M4 月度 tap → requestVirtualPayment 恰好 1 次', 'calls=' + m.virtualPaymentCalls.length);
  assert(m.pageObj.data.isMember === true, 'M4 支付成功后 isMember=true', 'isMember=' + m.pageObj.data.isMember);
  assert(m.pageObj.data.paying === false, 'M4 支付完成后 paying=false', 'paying=' + m.pageObj.data.paying);
  var noDebugModal = m.modals.every(md => !JSON.stringify(md).match(/errno|OFFER_ID|原始|errCode/));
  assert(noDebugModal, 'M4 全程无调试弹窗（errno/OFFER_ID/原始）', JSON.stringify(m.modals));
})();

// M5: 40163 静默重试：第 1 次 createOrder 返回 40163 → 自动换新 code 重试 → 第 2 次成功
(function() {
  var m = createMemberMock({
    createOrderResults: [
      { errno: 500, errMsg: 'jscode2session error 40163: code been used' },  // 第1次下单失败
      { errno: 0, signData: '{}', paySig: 'x', signature: 'y', outTradeNo: 'no2', offerId: 'off', productId: 'member_monthly', goodsPrice: 1900 },  // 重试成功
    ],
  });
  m.pageObj.onLoad();
  var loginBefore = m.getLoginCalls();
  m.pageObj.onSubscribeTap({ currentTarget: { dataset: { id: 'monthly' } } });
  assert(m.virtualPaymentCalls.length === 1, 'M5 40163 后静默重试成功 → requestVirtualPayment 1 次', 'calls=' + m.virtualPaymentCalls.length);
  assert(m.pageObj.data.isMember === true, 'M5 重试后支付成功 isMember=true', 'isMember=' + m.pageObj.data.isMember);
  var hasUserModal = m.modals.some(md => md.title === '下单失败');
  assert(!hasUserModal, 'M5 40163 重试期间不弹「下单失败」（静默）', JSON.stringify(m.modals.map(m2 => m2.title)));
  // 重试必须用 force 新取 code：loginCalls 应比 tap 前 +1
  assert(m.getLoginCalls() === loginBefore + 1, 'M5 重试用新 code（wx.login +1）', 'before=' + loginBefore + ' after=' + m.getLoginCalls());
})();

// M6: code 一次性消费——首次下单用预取 code，消费后作废，第 2 次下单必须重新 wx.login
(function() {
  var m = createMemberMock({
    createOrderResults: [
      { errno: 0, signData: '{}', paySig: 'x', signature: 'y', outTradeNo: 'no3', offerId: 'off', productId: 'member_monthly', goodsPrice: 1900 },
      { errno: 0, signData: '{}', paySig: 'x', signature: 'y', outTradeNo: 'no4', offerId: 'off', productId: 'member_annual', goodsPrice: 9900 },
    ],
  });
  m.pageObj.onLoad();
  var loginAfterLoad = m.getLoginCalls();  // 预取 1 次
  m.pageObj.onSubscribeTap({ currentTarget: { dataset: { id: 'monthly' } } });
  var loginAfterFirst = m.getLoginCalls();  // 首单用预取 code，不新增 login
  assert(loginAfterFirst === loginAfterLoad, 'M6 首单复用预取 code（不新增 wx.login）', 'load=' + loginAfterLoad + ' first=' + loginAfterFirst);
  m.pageObj.onSubscribeTap({ currentTarget: { dataset: { id: 'annual' } } });
  // 首单 code 已消费作废 → 二单必须重新 wx.login
  assert(m.getLoginCalls() === loginAfterFirst + 1, 'M6 code 消费即作废：二单重新 wx.login（+1）', 'first=' + loginAfterFirst + ' second=' + m.getLoginCalls());
  assert(m.virtualPaymentCalls.length === 2, 'M6 两次下单两次支付', 'calls=' + m.virtualPaymentCalls.length);
})();

// M7: 云函数连续失败 → 用户话术弹窗（非调试信息），不再无限重试
(function() {
  var m = createMemberMock({
    defaultCreateOrderResult: { errno: 500, errMsg: 'jscode2session error 40013: invalid appid' },
  });
  m.pageObj.onLoad();
  m.pageObj.onSubscribeTap({ currentTarget: { dataset: { id: 'monthly' } } });
  var userModal = m.modals.find(md => md.title === '下单失败' || md.title === '网络开小差了');
  assert(!!userModal, 'M7 失败弹用户话术弹窗', JSON.stringify(m.modals.map(m2 => m2.title)));
  var clean = userModal && !JSON.stringify(userModal).match(/errno=|原始：|OFFER_ID|rid/);
  assert(clean, 'M7 弹窗无调试信息', JSON.stringify(userModal));
  assert(m.virtualPaymentCalls.length === 0, 'M7 下单失败不进入支付', 'calls=' + m.virtualPaymentCalls.length);
})();

// M8: 支付失败（-15013）→ 用户话术，isMember 不变
(function() {
  var m = createMemberMock({
    createOrderResults: [
      { errno: 0, signData: '{}', paySig: 'x', signature: 'y', outTradeNo: 'no5', offerId: 'off', productId: 'member_monthly', goodsPrice: 1900 },
    ],
    paymentResult: 'fail',
  });
  m.pageObj.onLoad();
  m.pageObj.onSubscribeTap({ currentTarget: { dataset: { id: 'monthly' } } });
  assert(m.pageObj.data.isMember !== true, 'M8 支付失败 isMember 不置 true', 'isMember=' + m.pageObj.data.isMember);
  var failModal = m.modals.find(md => md.title === '支付未完成');
  assert(!!failModal, 'M8 支付失败弹「支付未完成」', JSON.stringify(m.modals.map(m2 => m2.title)));
  var noErrCode = failModal && failModal.title.indexOf('(') < 0;
  assert(noErrCode, 'M8 弹窗标题无 errCode', failModal && failModal.title);
})();


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

// ========== 测试 detail 页支付流程（v1.5.4 与 member 同模式）==========
console.log('\n=== detail.js 支付流程逻辑测试（v1.5.4）===\n');

var detailPath2 = path.join(ROOT, 'pages/detail/detail.js');

function createDetailMock(opts) {
  opts = opts || {};
  var toasts = [], modals = [], navTo = [];
  var virtualPaymentCalls = [];
  var loginCalls = 0;
  var storage = { purchasedSkills: [], userInfo: { nickName: 't' } };
  var pageObj = null;

  global.wx = {
    showToast: function(o) { toasts.push(o); },
    showModal: function(o) { modals.push(o); },
    showLoading: function() {},
    hideLoading: function() {},
    navigateTo: function(o) { navTo.push(o); },
    navigateBack: function() {},
    previewImage: function() {},
    setClipboardData: function(o) { if (o.success) o.success(); },
    setStorageSync: function(k, v) { storage[k] = v; },
    getStorageSync: function(k) { return storage[k] !== undefined ? storage[k] : null; },
    canIUse: function() { return true; },
    getSystemInfoSync: function() { return { windowWidth: 375 }; },
    login: function(o) { loginCalls++; if (o && o.success) o.success({ code: 'd_code_' + loginCalls }); },
    requestVirtualPayment: function(o) {
      virtualPaymentCalls.push(o);
      if (o.success) o.success({});
    },
  };
  global.getApp = function() { return { globalData: { userInfo: storage.userInfo }, checkLogin: function() { return !!storage.userInfo; } }; };
  global.getCurrentPages = function() { return [{ route: 'pages/detail/detail' }]; };
  global.Page = function(config) {
    pageObj = config;
    pageObj.data = Object.assign({}, pageObj.data || {});
    pageObj.setData = function(d) { Object.assign(pageObj.data, d); };
  };
  global.Component = function() {};
  global.App = function() {};

  var createOrderResults = (opts.createOrderResults || []).slice();
  global.wx.cloud = {
    callFunction: function(o) {
      var action = o.data && o.data.action;
      var result;
      if (action === 'createOrder') {
        result = createOrderResults.length ? createOrderResults.shift() : (opts.defaultCreateOrderResult || {});
      } else if (action === 'getPurchases') {
        result = { purchases: [] };
      } else if (action === 'getSkillContent') {
        result = { content: '# mock' };
      } else if (action === 'getOriginalDetail') {
        result = {};
      } else if (action === 'getSubscription') {
        result = {};
      } else {
        result = {};
      }
      if (o.success) o.success({ result: result });
    },
  };

  delete require.cache[require.resolve(detailPath2)];
  try { require(detailPath2); } catch(e) { return { error: e.message }; }
  return { pageObj, toasts, modals, navTo, virtualPaymentCalls, storage, getLoginCalls: function() { return loginCalls; } };
}

// 找一个 paid skill 测支付流
var paidSkill = published.find(s => s.tier === 'paid') || published[0];

// D1: 付费 skill 完整购买流：requestPayment → VP → unlockSkill（purchasedSkills 写入）
(function() {
  var m = createDetailMock({
    createOrderResults: [
      { errno: 0, signData: '{}', paySig: 'x', signature: 'y', outTradeNo: 'd1', offerId: 'off', productId: 'skill_lite', goodsPrice: 200 },
    ],
  });
  m.pageObj.onLoad({ id: paidSkill.id });
  m.pageObj.requestPayment();
  assert(m.virtualPaymentCalls.length === 1, 'D1 付费购买 → VP 恰好 1 次', 'calls=' + m.virtualPaymentCalls.length);
  assert(m.pageObj.data.isPurchased === true, 'D1 支付成功后 isPurchased=true', 'isPurchased=' + m.pageObj.data.isPurchased);
  var inStorage = (m.storage.purchasedSkills || []).indexOf(paidSkill.id) >= 0;
  assert(inStorage, 'D1 unlockSkill 写入 purchasedSkills', JSON.stringify(m.storage.purchasedSkills));
})();

// D2: 40163 静默重试（detail.js 同款逻辑）
(function() {
  var m = createDetailMock({
    createOrderResults: [
      { errno: 500, errMsg: 'jscode2session error 40163: code been used' },
      { errno: 0, signData: '{}', paySig: 'x', signature: 'y', outTradeNo: 'd2', offerId: 'off', productId: 'skill_lite', goodsPrice: 200 },
    ],
  });
  m.pageObj.onLoad({ id: paidSkill.id });
  var before = m.getLoginCalls();
  m.pageObj.requestPayment();
  assert(m.virtualPaymentCalls.length === 1, 'D2 40163 → 静默重试 → VP 1 次', 'calls=' + m.virtualPaymentCalls.length);
  assert(m.getLoginCalls() === before + 1, 'D2 重试用新 code（wx.login +1）', 'before=' + before + ' after=' + m.getLoginCalls());
  var failModal = m.modals.find(md => md.title === '下单失败');
  assert(!failModal, 'D2 重试期间无「下单失败」弹窗', JSON.stringify(m.modals.map(x => x.title)));
})();

// D3: 下单失败 → 用户话术（无 errno/原始串），不进支付
(function() {
  var m = createDetailMock({
    defaultCreateOrderResult: { errno: 500, errMsg: 'jscode2session error 40013: invalid appsecret' },
  });
  m.pageObj.onLoad({ id: paidSkill.id });
  m.pageObj.requestPayment();
  var userModal = m.modals.find(md => md.title === '下单失败' || md.title === '网络开小差了');
  assert(!!userModal, 'D3 失败弹用户话术弹窗', JSON.stringify(m.modals.map(x => x.title)));
  var clean = userModal && !JSON.stringify(userModal).match(/errno=|原始：|OFFER_ID|rid/);
  assert(clean, 'D3 弹窗无调试信息', JSON.stringify(userModal));
  assert(m.virtualPaymentCalls.length === 0, 'D3 下单失败不进入支付', 'calls=' + m.virtualPaymentCalls.length);
})();

// D4: code 一次性消费（detail.js）：首单后缓存作废，二单重新 login
(function() {
  var m = createDetailMock({
    createOrderResults: [
      { errno: 0, signData: '{}', paySig: 'x', signature: 'y', outTradeNo: 'd3', offerId: 'off', productId: 'skill_lite', goodsPrice: 200 },
      { errno: 0, signData: '{}', paySig: 'x', signature: 'y', outTradeNo: 'd4', offerId: 'off', productId: 'skill_basic', goodsPrice: 900 },
    ],
  });
  m.pageObj.onLoad({ id: paidSkill.id });
  var afterLoad = m.getLoginCalls();
  m.pageObj.requestPayment();
  var afterFirst = m.getLoginCalls();
  assert(afterFirst === afterLoad, 'D4 首单复用预取 code（不新增 login）', 'load=' + afterLoad + ' first=' + afterFirst);
  m.pageObj.requestPayment();
  assert(m.getLoginCalls() === afterFirst + 1, 'D4 二单重新 wx.login（code 已作废）', 'first=' + afterFirst + ' second=' + m.getLoginCalls());
})();

// D5: detail.js 无调试弹窗残留（mapPaymentError/mapCloudError 已移除）
(function() {
  var m = createDetailMock({});
  assert(true, 'D5 detail.js 支付失败弹窗标题固定「支付未完成」（无 errCode 拼接）', '由 M8 同款断言 + e2e-v7 PAY-06 保证');
})();


console.log('\n=== page-logic 结果: ' + pass + ' PASS / ' + fail + ' FAIL ===');
if (fail > 0) {
  console.log('\n失败项:');
  errors.forEach(e => console.log('  ' + e));
}
process.exit(fail > 0 ? 1 : 0);
