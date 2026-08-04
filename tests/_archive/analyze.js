const https = require('https');
const fs = require('fs');
const KEY = 'sk-api-ovC184Kwxl_3UvsVgmgsJOO1ClfbLqQpSeXBE61X7lagNqnLXIe95fSn1J1nOMAx8vYrz0Ky4gIOcf5oV-0aNyUOcRbawredAuc0yFZUfRsO_1U1yccuUj0';

const img = fs.readFileSync(__dirname + '/screenshot-new.png').toString('base64');
const body = JSON.stringify({
  model: 'MiniMax-M3', max_tokens: 800,
  messages: [{ role: 'user', content: [
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: img }},
    { type: 'text', text: '这是微信小程序截图。详细描述：1.页面布局结构 2.所有可见文字 3.有无报错信息 4.卡片内容 5.整体状态是否正常。' }
  ]}]
});
const req = https.request('https://api.minimaxi.com/anthropic/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Api-Key': KEY },
}, (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    try { const j = JSON.parse(data); console.log(j.content ? j.content[0].text : JSON.stringify(j).substring(0,500)); }
    catch(e) { console.log(data.substring(0,500)); }
  });
});
req.on('error', (e) => console.log('error:', e.message));
req.write(body); req.end();
