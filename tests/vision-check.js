const Connection = require('miniprogram-automator/out/Connection').default;
const Transport = require('miniprogram-automator/out/Transport').default;
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const ws = require('ws');
const fs = require('fs');
const https = require('https');

const MINIMAX_API = 'https://api.minimaxi.com/anthropic/v1/messages';
const MINIMAX_KEY = 'sk-api-ovC184Kwxl_3UvsVgmgsJOO1ClfbLqQpSeXBE61X7lagNqnLXIe95fSn1J1nOMAx8vYrz0K';

async function callMinimaxVision(imageBase64, prompt) {
  const body = JSON.stringify({
    model: 'MiniMax-M3',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageBase64 }},
        { type: 'text', text: prompt }
      ]
    }]
  });
  
  return new Promise((resolve, reject) => {
    const req = https.request(MINIMAX_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MINIMAX_KEY,
      },
      body: undefined,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ raw: data.substring(0, 500) }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  const wsConn = new ws('ws://127.0.0.1:7777');
  await new Promise((r, j) => { wsConn.on('open', r); wsConn.on('error', j); });
  const mp = new MiniProgram(new Connection(new Transport(wsConn)));
  console.log('✓ 连接成功\n');

  // 读页面元素结构（替代截图）
  const page = await mp.currentPage();
  const title = await page.$('.title');
  const cards = await page.$$('.skill-card');
  const scenes = await page.$$('.scene-tag');
  
  console.log('=== 页面元素结构 ===');
  console.log('标题:', await title.text());
  console.log('skill 卡片:', cards.length);
  console.log('场景标签:', scenes.length);
  
  // 读每个卡片的内容
  for (let i = 0; i < Math.min(3, cards.length); i++) {
    const name = await cards[i].$('.skill-name');
    const price = await cards[i].$('.skill-price');
    console.log(`  卡片${i+1}: ${name ? await name.text() : '?'} | ${price ? await price.text() : '?'}`);
  }

  // 尝试用旧截图调 minimax vision
  if (fs.existsSync(__dirname + '/screenshot.png')) {
    const imgBase64 = fs.readFileSync(__dirname + '/screenshot.png').toString('base64');
    console.log('\n=== 用 minimax-m3 vision 分析截图 ===');
    const result = await callMinimaxVision(imgBase64, '这是一个微信小程序的截图。请描述你看到的内容：页面布局、文字、颜色、是否有报错。简洁回答。');
    console.log('minimax 回复:', JSON.stringify(result).substring(0, 500));
  } else {
    console.log('\n无截图文件可分析');
  }

  mp.disconnect();
  console.log('\n=== 完成 ===');
}
run().catch(e => { console.error(e); process.exit(1); });
