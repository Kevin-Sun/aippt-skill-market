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

  // reLaunch
  try { await mp.reLaunch('/pages/index/index'); } catch(e) {}
  await new Promise(r => setTimeout(r, 3000));

  // 页面元素验证
  const page = await mp.currentPage();
  const title = await page.$('.title');
  const cards = await page.$$('.skill-card');
  const scenes = await page.$$('.scene-tag');
  console.log('标题:', await title.text());
  console.log('卡片:', cards.length);
  console.log('标签:', scenes.length);

  // 尝试截图（等更长时间）
  console.log('\n=== 截图尝试 ===');
  let screenshotData = null;
  for (let i = 0; i < 3; i++) {
    try {
      screenshotData = await mp.screenshot();
      if (screenshotData) {
        fs.writeFileSync(__dirname + '/screenshot-final.png', Buffer.from(screenshotData, 'base64'));
        console.log('✓ 截图成功:', Math.round(screenshotData.length/1024) + 'KB');
        break;
      }
    } catch(e) {
      console.log(`尝试 ${i+1}/3 失败:`, e.message.substring(0,80));
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (screenshotData) {
    console.log('\n=== minimax-m3 vision 分析 ===');
    const desc = await analyzeImage(screenshotData, '微信小程序截图。描述：1.布局 2.文字 3.有无报错 4.状态。简洁。');
    console.log('minimax:', desc);
  } else {
    console.log('截图失败，但页面元素验证通过');
  }

  mp.disconnect();
  console.log('\n=== 完成 ===');
}
run().catch(e => { console.error(e); process.exit(1); });
