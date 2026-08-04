const https = require('https');
const fs = require('fs');

const KEY = 'sk-api-ovC184Kwxl_3UvsVgmgsJOO1ClfbLqQpSeXBE61X7lagNqnLXIe95fSn1J1nOMAx8vYrz0K';

function tryAuth(imgBase64, headers, label) {
  const body = JSON.stringify({
    model: 'MiniMax-M3',
    max_tokens: 500,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imgBase64 }},
      { type: 'text', text: '描述这个小程序截图的内容，有无报错。简洁。' }
    ]}]
  });
  return new Promise((resolve) => {
    const req = https.request('https://api.minimaxi.com/anthropic/v1/messages', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`[${label}] status=${res.statusCode}`);
        try { 
          const j = JSON.parse(data);
          if (j.content) console.log(`[${label}] ✓ 成功:`, j.content[0].text.substring(0, 300));
          else console.log(`[${label}] 回复:`, JSON.stringify(j).substring(0, 200));
        } catch(e) { console.log(`[${label}] 原始:`, data.substring(0, 200)); }
        resolve();
      });
    });
    req.on('error', (e) => { console.log(`[${label}] error:`, e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

async function run() {
  const img = fs.existsSync(__dirname + '/screenshot.png') 
    ? fs.readFileSync(__dirname + '/screenshot.png').toString('base64') : null;
  if (!img) { console.log('无截图'); return; }
  
  // 试不同认证方式
  await tryAuth(img, { 'x-api-key': KEY }, 'x-api-key 小写');
  await tryAuth(img, { 'X-Api-Key': KEY }, 'X-Api-Key 大写');
  await tryAuth(img, { 'Authorization': 'Bearer ' + KEY }, 'Bearer');
  await tryAuth(img, { 'Authorization': KEY }, 'raw auth');
}
run();
