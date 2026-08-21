#!/usr/bin/env node
// screenshot-frames.js · 预置 mock + 截 8 张审核图（自包含，不依赖 automation 模块）
// 用法: no_proxy="*" node scripts/screenshot-frames.js

delete process.env.HTTP_PROXY;
delete process.env.http_proxy;
delete process.env.HTTPS_PROXY;
delete process.env.https_proxy;
process.env.no_proxy = '*';

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = 9420;
const OUT_DIR = path.resolve(__dirname, '..', 'tests', 'screenshots');
let ws, msgId = 0;
const pending = new Map();

function connect() {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(`ws://127.0.0.1:${PORT}`, { agent: undefined });
    ws.on('open', () => { console.log('connected'); resolve(); });
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.id && pending.has(msg.id)) {
          const { resolve, reject } = pending.get(msg.id);
          pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      } catch (e) {}
    });
    ws.on('error', (e) => { console.error('ws error:', e.message); reject(e); });
    setTimeout(() => { if (!ws || ws.readyState !== 1) reject(new Error('timeout')); }, 8000);
  });
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('timeout: ' + method)); } }, 10000);
  });
}

function savePng(b64, name) {
  const p = path.join(OUT_DIR, name);
  fs.writeFileSync(p, Buffer.from(b64, 'base64'));
  console.log('  saved:', p, fs.statSync(p).size + ' bytes');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('=== 连接 devtools ===');
  await connect();

  console.log('\n=== 预置 mock 数据 ===');
  const mockResult = await send('App.callWxaMethod', {
    scope: '0',
    method: 'evaluateScript',
    params: { script: `(() => {
      const skills = require('../../data/cloud-skills-data.js');
      const paid = skills.filter(s => s.tier === 'paid');
      const free = skills.filter(s => s.tier === 'free_ref' && s.repoUrl);
      wx.setStorageSync('purchasedSkills', paid.slice(0,3).map(s=>s.id));
      wx.setStorageSync('favorites', free.slice(0,2).map(s=>s.id));
      wx.setStorageSync('orderRecords', [
        {id:'order_001',type:'skill',skillId:paid[0]?.id,skillName:paid[0]?.nameZh||paid[0]?.name,amount:200,status:'已完成',createdAt:'2026-08-15T12:00:00Z'},
        {id:'order_002',type:'member',tierName:'月度会员',amount:1900,status:'已完成',createdAt:'2026-08-15T12:01:00Z'}
      ]);
      wx.setStorageSync('userInfo',{nickName:'微信用户',avatarUrl:''});
      return JSON.stringify({paidCount:paid.length,freeCount:free.length,firstPaidId:paid[0]?.id,firstFreeId:free[0]?.id});
    })()` }
  }).catch(() => null);
  console.log('mock:', mockResult);

  // 尝试 Page.navigate
  console.log('\n=== 截图 ===');
  
  const pages = [
    { name: '01-index.png', url: '/pages/index/index' },
    { name: '06-orders.png', url: '/pages/orders/orders' },
    { name: '05-member.png', url: '/pages/member/member' },
    { name: '07-mine.png', url: '/pages/mine/mine' },
    { name: '08-promotion.png', url: '/pages/promotion/promotion' },
  ];

  for (const p of pages) {
    console.log('\n--- ' + p.name + ' ---');
    try {
      await send('Page.navigateTo', { url: p.url }).catch(() => {});
      await new Promise(r => setTimeout(r, 2500));
      const result = await send('Page.captureScreenshot', {});
      if (result && result.data) savePng(result.data, p.name);
      else console.log('  WARN: no data');
    } catch (e) { console.log('  ERR:', e.message); }
  }

  // 搜索页
  console.log('\n--- 02-search.png ---');
  try {
    await send('Page.navigateTo', { url: '/pages/search/search?q=答辩' }).catch(() => {});
    await new Promise(r => setTimeout(r, 2500));
    const result = await send('Page.captureScreenshot', {});
    if (result && result.data) savePng(result.data, '02-search.png');
  } catch (e) { console.log('  ERR:', e.message); }

  // 详情页 paid
  console.log('\n--- 03-detail-paid.png ---');
  try {
    await send('Page.navigateTo', { url: '/pages/detail/detail?id=skill_001' }).catch(() => {});
    await new Promise(r => setTimeout(r, 2500));
    const result = await send('Page.captureScreenshot', {});
    if (result && result.data) savePng(result.data, '03-detail-paid.png');
  } catch (e) { console.log('  ERR:', e.message); }

  // 详情页 free
  console.log('\n--- 04-detail-free.png ---');
  try {
    await send('Page.navigateTo', { url: '/pages/detail/detail?id=skill_new_042' }).catch(() => {});
    await new Promise(r => setTimeout(r, 2500));
    const result = await send('Page.captureScreenshot', {});
    if (result && result.data) savePng(result.data, '04-detail-free.png');
  } catch (e) { console.log('  ERR:', e.message); }

  console.log('\n=== done ===');
  ws.close();
  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
