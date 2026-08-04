const https = require('https');
const fs = require('fs');

const MINIMAX_KEY = 'sk-api-ovC184Kwxl_3UvsVgmgsJOO1ClfbLqQpSeXBE61X7lagNqnLXIe95fSn1J1nOMAx8vYrz0K';

function callMinimax(imageBase64, prompt) {
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
  
  return new Promise((resolve) => {
    const req = https.request('https://api.minimaxi.com/anthropic/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': MINIMAX_KEY,
        'Authorization': 'Bearer ' + MINIMAX_KEY,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ raw: data.substring(0, 500), status: res.statusCode }); }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

async function run() {
  if (!fs.existsSync(__dirname + '/screenshot.png')) {
    console.log('无截图文件');
    return;
  }
  const imgBase64 = fs.readFileSync(__dirname + '/screenshot.png').toString('base64');
  console.log('截图大小:', Math.round(imgBase64.length/1024) + 'KB base64');
  
  const result = await callMinimax(imgBase64, '这是微信小程序截图。描述页面内容、布局、文字、颜色、有无报错。简洁。');
  console.log('minimax-m3 回复:', JSON.stringify(result).substring(0, 800));
}
run();
