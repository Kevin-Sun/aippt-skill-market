const https = require('https');
const fs = require('fs');

const KEY = 'sk-api-ovC184Kwxl_3UvsVgmgsJOO1ClfbLqQpSeXBE61X7lagNqnLXIe95fSn1J1nOMAx8vYrz0Ky4gIOcf5oV-0aNyUOcRbawredAuc0yFZUfRsO_1U1yccuUj0';

async function run() {
  const img = fs.readFileSync(__dirname + '/screenshot.png').toString('base64');
  const body = JSON.stringify({
    model: 'MiniMax-M3',
    max_tokens: 500,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: img }},
      { type: 'text', text: '描述这个微信小程序截图的页面内容、布局、有无报错。简洁回答。' }
    ]}]
  });
  
  return new Promise((resolve) => {
    const req = https.request('https://api.minimaxi.com/anthropic/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': KEY,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('status:', res.statusCode);
        try {
          const j = JSON.parse(data);
          if (j.content) console.log('✓ minimax-m3:', j.content[0].text);
          else console.log('回复:', JSON.stringify(j).substring(0, 400));
        } catch(e) { console.log('原始:', data.substring(0, 400)); }
        resolve();
      });
    });
    req.on('error', (e) => { console.log('error:', e.message); resolve(); });
    req.write(body);
    req.end();
  });
}
run();
