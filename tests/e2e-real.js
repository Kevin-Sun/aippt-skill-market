// e2e-real.js · 真e2e: miniprogram-automator 连 devtools + page.data() 验证渲染 + 导航 + 交互
// 用 automator.connect 绕过 App.callFunction 超时问题
// 用法: node tests/e2e-real.js

delete process.env.HTTP_PROXY; delete process.env.http_proxy;
delete process.env.HTTPS_PROXY; delete process.env.https_proxy;
process.env.no_proxy = '*';

const automator = require('miniprogram-automator');
const path = require('path');
let pass = 0, fail = 0, results = [];

function assert(cond, name, detail) {
  if (cond) { pass++; results.push(`  ✅ ${name}`); }
  else { fail++; results.push(`  ❌ ${name}: ${detail || ''}`); }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
const cjk = s => (String(s||'').match(/[\u4e00-\u9fa5]/g)||[]).length;

async function main() {
  console.log('=== e2e-real: devtools 自动化验证（automator.connect）===\n');

  let mp;
  try {
    mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' });
  } catch (e) {
    console.log('❌ automator.connect 失败:', e.message);
    console.log('  启动: cli auto --project . --auto-port 9420 --token 1234abcdef');
    process.exit(1);
  }
  console.log('connected\n');

  // ========== 1. 连接 + 页面栈验证 ==========
  console.log('CONN-01~03: 连接验证');
  const stack = await mp.pageStack();
  assert(stack.length > 0, 'CONN-01 pageStack 有页面', JSON.stringify(stack.map(p => p.path)).slice(0, 100));
  assert(stack[0].path.includes('index'), 'CONN-02 当前在首页', stack[0].path);

  let cur = await mp.currentPage();
  assert(cur && cur.path.includes('index'), 'CONN-03 currentPage 是首页', cur ? cur.path : 'null');

  // ========== 2. 首页中文渲染验证 ==========
  console.log('\nPAGE-01~06: 首页中文渲染验证');
  let data = await cur.data();
  assert(data.skills && data.skills.length > 0, 'PAGE-01 首页 skills 有数据', 'len=' + (data.skills ? data.skills.length : 0));
  assert(data.skills && data.skills.length <= 6, 'PAGE-02 首页 skills ≤6 条（分页）', 'len=' + data.skills.length);

  if (data.skills && data.skills[0]) {
    const s = data.skills[0];
    assert(s.displayName && cjk(s.displayName) > 0, 'PAGE-03 首页首个 skill 名称含中文', s.displayName || '(空)');
    assert(!/PPTXPPT|PPTPPT/.test(s.displayName || ''), 'PAGE-04 无 PPTXPPT 重复词', s.displayName);
    assert(s.displayDesc && s.displayDesc.length > 0, 'PAGE-05 首页首个 skill 描述非空', s.displayDesc ? s.displayDesc.slice(0, 40) : '(空)');
    
    // 检查多个 skill 的 nameZh 唯一性
    const names = data.skills.map(x => x.displayName);
    const uniq = new Set(names);
    assert(uniq.size === names.length, 'PAGE-06 首页 skills 名称全唯一', `${uniq.size}/${names.length} unique`);
  }

  // ========== 3. 搜索交互验证 ==========
  console.log('\nSEARCH-01~06: 搜索交互验证');
  
  // 模拟搜索：调用页面方法
  try {
    await cur.callMethod('onSearchInput', { detail: { value: '答辩' } });
    await sleep(200);
    let d2 = await cur.data();
    assert(d2.searchValue === '答辩', 'SEARCH-01 输入「答辩」后 searchValue 更新', d2.searchValue);
    
    await cur.callMethod('onSearchSubmit');
    await sleep(1000);
    let d3 = await cur.data();
    assert(d3.showSearchResults === true, 'SEARCH-02 showSearchResults 变 true', String(d3.showSearchResults));
    assert(d3.searchResultsCount > 0, 'SEARCH-03 搜索「答辩」有结果', 'count=' + d3.searchResultsCount);
    assert(d3.skills && d3.skills.length > 0, 'SEARCH-04 搜索后 skills 列表有数据', 'len=' + (d3.skills ? d3.skills.length : 0));
    
    if (d3.skills && d3.skills[0]) {
      assert(cjk(d3.skills[0].displayName) > 0, 'SEARCH-05 搜索结果首个名称含中文', d3.skills[0].displayName);
    }
    
    // 清除搜索
    await cur.callMethod('onSearchClear');
    await sleep(500);
    let d4 = await cur.data();
    assert(d4.showSearchResults === false, 'SEARCH-06 清除后 showSearchResults 变 false', String(d4.showSearchResults));
  } catch (e) {
    assert(false, 'SEARCH-01~06 callMethod 异常', e.message);
  }

  // ========== 4. 空结果验证 ==========
  console.log('\nEMPTY-01~03: 空结果验证');
  try {
    await cur.callMethod('onSearchInput', { detail: { value: 'zzzznotexist' } });
    await sleep(200);
    await cur.callMethod('onSearchSubmit');
    await sleep(1000);
    let d5 = await cur.data();
    assert(d5.showSearchResults === true, 'EMPTY-01 空搜索也进入搜索态', String(d5.showSearchResults));
    assert(d5.searchResultsCount === 0, 'EMPTY-02 搜索不存在的词返回 0 条', 'count=' + d5.searchResultsCount);
    assert(!d5.skills || d5.skills.length === 0, 'EMPTY-03 空结果 skills 为空', 'len=' + (d5.skills ? d5.skills.length : 0));
    
    // 恢复
    await cur.callMethod('onSearchClear');
    await sleep(500);
  } catch (e) {
    assert(false, 'EMPTY-01~03 异常', e.message);
  }

  // ========== 5. 导航到详情页 ==========
  console.log('\nNAV-01~04: 详情页导航验证');
  try {
    let d = await cur.data();
    if (d.skills && d.skills[0] && d.skills[0].id) {
      const skillId = d.skills[0].id;
      // 用 callMethod 触发 onSkillTap（内部调 wx.navigateTo，比 callWxMethod 更可靠）
      // ⚠️ 导航后 currentPage 引用可能失效，需重新获取
      let navTimeout = false;
      const navTimer = setTimeout(() => { navTimeout = true; }, 8000);
      try {
        await Promise.race([
          cur.callMethod('onSkillTap', { currentTarget: { dataset: { id: skillId } } }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('nav timeout')), 8000))
        ]);
      } catch (e) { navTimeout = true; }
      clearTimeout(navTimer);
      await sleep(3000);
      
      let stack2;
      try { stack2 = await mp.pageStack(); } catch (e) { stack2 = []; }
      assert(stack2.length > 1, 'NAV-01 页面栈 >1（导航成功）', 'stack len=' + stack2.length + (navTimeout ? ' (callMethod 超时)' : ''));
      
      if (stack2.length > 1) {
        let detailPage = stack2[stack2.length - 1];
        assert(detailPage.path.includes('detail'), 'NAV-02 当前在详情页', detailPage.path);
        
        try {
          let detailData = await detailPage.data();
          assert(detailData.skill, 'NAV-03 详情页 skill 数据存在', detailData.skill ? 'OK' : 'null');
          
          if (detailData.skill) {
            assert(cjk(detailData.skill.displayName) > 0, 'NAV-04 详情页 skill 名称含中文', detailData.skill.displayName || '(空)');
          }
        } catch (e) {
          assert(false, 'NAV-03 详情页 data() 异常', e.message);
          assert(false, 'NAV-04 skill 名称含中文', e.message);
        }
      } else {
        // callMethod 可能也超时——用补偿验证（首页已有 skill 中文数据）
        assert(false, 'NAV-01 导航 callMethod 超时（devtools 36.6.0）', 'stack len=' + stack2.length);
        assert(false, 'NAV-02', '导航未成功');
        assert(false, 'NAV-03', '导航未成功');
        assert(false, 'NAV-04', '导航未成功');
      }
    } else {
      assert(false, 'NAV-01 无 skill id 可导航', '');
      assert(false, 'NAV-02', '');
      assert(false, 'NAV-03', '');
      assert(false, 'NAV-04', '');
    }
  } catch (e) {
    assert(false, 'NAV-01~04 异常', e.message);
  }

  // ========== 6. 数据一致性验证 ==========
  console.log('\nDATA-01~06: 数据一致性验证');
  // 返回首页
  try {
    while ((await mp.pageStack()).length > 1) {
      try { await mp.navigateBack(); } catch (e) { break; }
      await sleep(1000);
    }
  } catch (e) {}

  // 用 skills-service 验证全量数据（在 Node 侧，不通过 devtools）
  const skillsService = require(path.join(__dirname, '..', 'miniprogram/data/skills-service.js'));
  const all = skillsService.skills;
  
  assert(all.length > 200, 'DATA-01 published skills >200', 'len=' + all.length);
  
  const allNames = all.map(s => s.displayName);
  const uniqNames = new Set(allNames);
  assert(uniqNames.size / allNames.length >= 0.95, 'DATA-02 displayName 唯一率 >=95%', `${uniqNames.size}/${allNames.length}=${(uniqNames.size/allNames.length*100).toFixed(1)}%`);
  
  const allZh = all.filter(s => cjk(s.displayName) > 0);
  assert(allZh.length === all.length, 'DATA-03 全部 displayName 含中文', `${allZh.length}/${all.length}`);
  
  // steps 全是对象数组
  const strSteps = all.filter(s => Array.isArray(s.steps) && s.steps.length && typeof s.steps[0] === 'string');
  assert(strSteps.length === 0, 'DATA-04 steps 无字符串数组（全对象数组）', `${strSteps.length} 条残留`);
  
  // steps 每条有 num/title/desc
  const stepsOk = all.filter(s => Array.isArray(s.steps) && s.steps.every(st => st && st.num !== undefined && st.title && st.desc));
  assert(stepsOk.length === all.length, 'DATA-05 steps 每条有 num/title/desc', `${stepsOk.length}/${all.length}`);

  // 无 markdown 残留
  const mdStar = all.filter(s => /\*\*/.test(s.displayDesc || ''));
  assert(mdStar.length === 0, 'DATA-06 displayDesc 无 ** 星号', `${mdStar.length} 条`);

  // ========== 汇总 ==========
  console.log('\n=== e2e-real 结果: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  if (fail > 0) {
    console.log('\n失败项:');
    results.filter(r => r.startsWith('  ❌')).forEach(r => console.log(r));
  }
  
  await mp.disconnect();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});

// 硬超时 120s
setTimeout(() => {
  console.log('\n=== e2e-real: 120s 硬超时退出 ===');
  console.log('  ' + pass + ' PASS / ' + fail + ' FAIL');
  process.exit(fail > 0 ? 1 : 0);
}, 120000);
