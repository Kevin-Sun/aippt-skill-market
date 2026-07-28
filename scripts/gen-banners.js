// banner 生成脚本 · 用 Azure gpt-image-2 API 生成活动 banner
// 用法：node scripts/gen-banners.js
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

const BANNERS = [
  {
    name: 'promotion-invite',
    prompt: 'A promotional banner for a mobile app, modern flat design, 750x400px ratio. Theme: "邀请好友得免费 skill". Blue gradient background (#2563eb to #1d4ed8), white bold text "邀请好友 得免费 PPT skill", gift icon, social sharing icons (WeChat, Weibo), clean layout, high contrast, Chinese text. Professional, minimalist style.',
  },
  {
    name: 'promotion-member',
    prompt: 'A promotional banner for a mobile app, modern flat design, 750x400px ratio. Theme: "会员权益". Green gradient background (#16a34a to #15803d), white bold text "会员权益 8种风格 全场景覆盖", crown icon, checklist with checkmarks, gold accent border, clean layout, high contrast, Chinese text. Professional, minimalist style.',
  },
  {
    name: 'promotion-community',
    prompt: 'A promotional banner for a mobile app, modern flat design, 750x400px ratio. Theme: "知识星球社群 299年费". Purple gradient background (#7c3aed to #5b21b6), white bold text "AI+办公社群 每日更新", star icon, community/group icon, calendar icon, clean layout, high contrast, Chinese text. Professional, minimalist style.',
  },
  {
    name: 'promotion-sale',
    prompt: 'A promotional banner for a mobile app, modern flat design, 750x400px ratio. Theme: "限时特惠 skill 0.99元". Orange-red gradient background (#ea580c to #c2410c), white bold text "限时特惠 PPT skill 0.99元", countdown timer icon, flash sale icon, price tag, clean layout, high contrast, Chinese text. Professional, minimalist style.',
  },
  {
    name: 'promotion-free',
    prompt: 'A promotional banner for a mobile app, modern flat design, 750x400px ratio. Theme: "免费 skill 领取". Blue-green gradient background (#0891b2 to #0e7490), white bold text "免费领取 PPT skill", download icon, gift box icon, "免费" badge, clean layout, high contrast, Chinese text. Professional, minimalist style.',
  },
];

function generateImage(banner) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      prompt: banner.prompt,
      n: 1,
      size: '1024x1024',
    });

    const options = {
      method: 'POST',
      hostname: 'westus3.api.cognitive.microsoft.com',
      path: '/openai/deployments/gpt-image-2/images/generations?api-version=2024-10-21',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`[${banner.name}] status=${res.statusCode}`);
        try {
          const result = JSON.parse(data);
          if (result.data && result.data[0]) {
            const imageUrl = result.data[0].url || '';
            const b64 = result.data[0].b64_json || '';
            if (imageUrl) {
              console.log(`[${banner.name}] ✓ 图片URL: ${imageUrl.substring(0,80)}...`);
              // 下载图片
              downloadImage(imageUrl, banner.name, resolve);
            } else if (b64) {
              const outPath = path.join(__dirname, '..', 'miniprogram', 'images', `${banner.name}.png`);
              fs.mkdirSync(path.dirname(outPath), { recursive: true });
              fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
              console.log(`[${banner.name}] ✓ 保存 base64: ${outPath}`);
              resolve(outPath);
            } else {
              console.log(`[${banner.name}] 无图片数据:`, JSON.stringify(result).substring(0,200));
              resolve(null);
            }
          } else {
            console.log(`[${banner.name}] API错误:`, JSON.stringify(result).substring(0,300));
            resolve(null);
          }
        } catch(e) {
          console.log(`[${banner.name}] 解析失败:`, data.substring(0,300));
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`[${banner.name}] 网络错误:`, e.message);
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

function downloadImage(url, name, callback) {
  const outPath = path.join(__dirname, '..', 'miniprogram', 'images', `${name}.png`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.log(`[${name}] 下载失败: status=${res.statusCode}`);
      callback(null);
      return;
    }
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(outPath, buffer);
      console.log(`[${name}] ✓ 下载保存: ${outPath} (${Math.round(buffer.length/1024)}KB)`);
      callback(outPath);
    });
  }).on('error', (e) => {
    console.log(`[${name}] 下载错误:`, e.message);
    callback(null);
  });
}

async function run() {
  console.log(`=== 生成 ${BANNERS.length} 个 banner ===`);
  console.log(`API: ${API_URL}`);
  console.log(`模型: ${MODEL}`);
  console.log(`（S0 rate limit，每个间隔 45 秒）\n`);

  const results = [];
  for (let i = 0; i < BANNERS.length; i++) {
    const banner = BANNERS[i];
    console.log(`\n[${i+1}/${BANNERS.length}] ${banner.name}...`);
    const result = await generateImage(banner);
    results.push({ name: banner.name, path: result });
    
    // S0 rate limit 需要间隔 45 秒
    if (i < BANNERS.length - 1) {
      console.log(`等待 45 秒（rate limit）...`);
      await new Promise(r => setTimeout(r, 45000));
    }
  }

  console.log('\n=== 结果汇总 ===');
  let ok = 0;
  results.forEach(r => {
    if (r.path) { ok++; console.log(`✓ ${r.name}: ${r.path}`); }
    else console.log(`✗ ${r.name}: 失败`);
  });
  console.log(`成功: ${ok}/${BANNERS.length}`);
}

run();
