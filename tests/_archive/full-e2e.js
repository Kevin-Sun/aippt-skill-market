const Connection = require('miniprogram-automator/out/Connection').default;
const Transport = require('miniprogram-automator/out/Transport').default;
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const ws = require('ws');
const fs = require('fs');
const https = require('https');

const MINIMAX_KEY = 'sk-api-ovC184Kwxl_3UvsVgmgsJOO1ClfbLqQpSeXBE61X7lagNqnLXIe95fSn1J1nOMAx8vYrz0Ky4gIOcf5oV-0aNyUOcRbawredAuc0yFZUfRsO_1U1yccuUj0';

function analyzeImage(imgBase64, prompt) {
  const body = JSON.stringify({
    model: 'MiniMax-M3', max_tokens: 500,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imgBase64 }},
      { type: 'text', text: prompt }
    ]}]
  });
  return new Promise((resolve) => {
    const req = https.request('https://api.minimaxi.com/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': MINIMAX_KEY },
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { const j = JSON.parse(data); resolve(j.content ? j.content[0].text : JSON.stringify(j).substring(0,300)); }
        catch(e) { resolve(data.substring(0,300)); }
      });
    });
    req.on('error', () => resolve('error'));
    req.write(body); req.end();
  });
}

async function run() {
  const wsConn = new ws('ws://127.0.0.1:7777');
  await new Promise((r, j) => { wsConn.on('open', r); wsConn.on('error', j); });
  const mp = new MiniProgram(new Connection(new Transport(wsConn)));
  console.log('✓ 连接成功\n');

  // reLaunch 确保首页刷新
  console.log('=== reLaunch 首页 ===');
  try { await mp.reLaunch('/pages/index/index'); } catch(e) {}
  await new Promise(r => setTimeout(r, 3000));

  // 读页面元素
  const page = await mp.currentPage();
  console.log('路由:', page.path);
  const title = await page.$('.title');
  console.log('标题:', title ? await title.text() : '未找到');
  const cards = await page.$$('.skill-card');
  console.log('skill 卡片:', cards.length);
  const scenes = await page.$$('.scene-tag');
  console.log('场景标签:', scenes.length);
  
  // 读 console errors
  let errors = [];
  mp.on('console', (msg) => { if (msg.type === 'error') errors.push(JSON.stringify(msg).substring(0,200)); });
  await new Promise(r => setTimeout(r, 2000));
  console.log('console errors:', errors.length);
  errors.forEach((e,i) => console.log(`  ${i}:`, e.substring(0,150)));

  // 截图（用 captureScreenshot 可能 timeout，试 evaluate 方式）
  console.log('\n=== 截图 ===');
  let imgBase64 = null;
  try {
    imgBase64 = await mp.screenshot();
    if (imgBase64) {
      fs.writeFileSync(__dirname + '/screenshot-new.png', Buffer.from(imgBase64, 'base64'));
      console.log('✓ 截图保存:', Math.round(imgBase64.length/1024) + 'KB');
    }
  } catch(e) {
    console.log('screenshot timeout，用旧截图');
    if (fs.existsSync(__dirname + '/screenshot.png')) {
      imgBase64 = fs.readFileSync(__dirname + '/screenshot.png').toString('base64');
    }
  }

  // minimax vision 分析
  if (imgBase64) {
    console.log('\n=== minimax-m3 vision 分析 ===');
    const desc = await analyzeImage(imgBase64, '这是微信小程序截图。描述：1.页面布局 2.文字内容 3.有无报错 4.整体状态。简洁。');
    console.log('minimax:', desc);
  }

  mp.disconnect();
  console.log('\n=== E2E 完成 ===');
}
run().catch(e => { console.error(e); process.exit(1); });
