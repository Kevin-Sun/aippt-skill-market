// gen-icons.js · 用 gpt-image-2 生成小 icon 图片替代 emoji
// 提示词参考：awesome-gpt-image 风格（flat design, minimal, 2D vector, white bg, single color）
const https = require('https');
const fs = require('fs');
const path = require('path');

const ENV = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n');
const getConfig = (key) => {
  const line = ENV.find(l => l.startsWith(key + '='));
  return line ? line.split('=')[1] : '';
};
const API_URL = getConfig('AZURE_IMAGE_API_URL');
const API_KEY = getConfig('AZURE_IMAGE_API_KEY');
const MODEL = getConfig('AZURE_IMAGE_MODEL') || 'gpt-image-2';

const OUT_DIR = path.join(__dirname, '..', 'miniprogram', 'images', 'icons');
fs.mkdirSync(OUT_DIR, { recursive: true });

// 要生成的 icon 列表（替代 emoji）
const ICONS = [
  { name: 'star', prompt: 'A single golden star icon, flat design, minimal, 2D vector style, solid gold color #f59e0b, white background, centered, no text, no shadow, simple geometric shape, app icon style' },
  { name: 'check', prompt: 'A single green checkmark icon, flat design, minimal, 2D vector style, solid green color #16a34a, white background, centered, no text, no shadow, simple geometric shape, app icon style' },
  { name: 'cross', prompt: 'A single red X cross icon, flat design, minimal, 2D vector style, solid red color #dc2626, white background, centered, no text, no shadow, simple geometric shape, app icon style' },
  { name: 'search', prompt: 'A single blue magnifying glass icon, flat design, minimal, 2D vector style, solid blue color #2563eb, white background, centered, no text, no shadow, simple geometric shape, app icon style' },
  { name: 'crown', prompt: 'A single golden crown icon, flat design, minimal, 2D vector style, solid gold color #f59e0b, white background, centered, no text, no shadow, simple geometric shape, app icon style' },
  { name: 'box', prompt: 'A single blue box package icon, flat design, minimal, 2D vector style, solid blue color #2563eb, white background, centered, no text, no shadow, simple geometric shape, app icon style' },
  { name: 'heart', prompt: 'A single red heart icon, flat design, minimal, 2D vector style, solid red color #dc2626, white background, centered, no text, no shadow, simple geometric shape, app icon style' },
  { name: 'chat', prompt: 'A single blue chat bubble icon, flat design, minimal, 2D vector style, solid blue color #2563eb, white background, centered, no text, no shadow, simple geometric shape, app icon style' },
  { name: 'gift', prompt: 'A single purple gift box icon, flat design, minimal, 2D vector style, solid purple color #7c3aed, white background, centered, no text, no shadow, simple geometric shape, app icon style' },
  { name: 'bell', prompt: 'A single blue bell icon, flat design, minimal, 2D vector style, solid blue color #2563eb, white background, centered, no text, no shadow, simple geometric shape, app icon style' },
  { name: 'info', prompt: 'A single blue info circle icon, flat design, minimal, 2D vector style, solid blue color #2563eb, white background, centered, no text, no shadow, simple geometric shape, app icon style' },
  { name: 'arrow-right', prompt: 'A single gray right arrow chevron icon, flat design, minimal, 2D vector style, solid gray color #9ca3af, white background, centered, no text, no shadow, simple geometric shape, app icon style' },
];

function generateImage(icon) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: MODEL,
      prompt: icon.prompt,
      n: 1,
      size: '1024x1024',
    });

    const url = new URL(API_URL + 'openai/deployments/' + MODEL + '/images/generations?api-version=2025-04-01-preview');

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.data && j.data[0]) {
            const imgUrl = j.data[0].url;
            // 下载图片
            const imgReq = https.get(imgUrl, (imgRes) => {
              const chunks = [];
              imgRes.on('data', (c) => chunks.push(c));
              imgRes.on('end', () => {
                const buf = Buffer.concat(chunks);
                const fp = path.join(OUT_DIR, icon.name + '.png');
                fs.writeFileSync(fp, buf);
                console.log('✓ ' + icon.name + '.png (' + Math.round(buf.length / 1024) + 'KB)');
                resolve(fp);
              });
            });
            imgReq.on('error', () => resolve(null));
          } else {
            console.log('✗ ' + icon.name + ': ' + (j.error?.message || 'unknown'));
            resolve(null);
          }
        } catch (e) {
          console.log('✗ ' + icon.name + ': ' + e.message);
          resolve(null);
        }
      });
    });
    req.on('error', (e) => { console.log('✗ ' + icon.name + ': ' + e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('=== 生成 ' + ICONS.length + ' 个 icon ===');
  console.log('API: ' + API_URL);
  console.log('模型: ' + MODEL + '\n');

  const results = [];
  for (let i = 0; i < ICONS.length; i++) {
    const icon = ICONS[i];
    console.log('[' + (i + 1) + '/' + ICONS.length + '] ' + icon.name + '...');
    const result = await generateImage(icon);
    results.push({ name: icon.name, path: result });
    if (i < ICONS.length - 1) {
      console.log('等待 5 秒...');
      await new Promise(r => setTimeout(r, 45000));
    }
  }

  console.log('\n=== 结果汇总 ===');
  let ok = 0;
  results.forEach(r => {
    if (r.path) { ok++; console.log('✓ ' + r.name); }
    else console.log('✗ ' + r.name + ' 失败');
  });
  console.log('成功: ' + ok + '/' + ICONS.length);
}

run();
