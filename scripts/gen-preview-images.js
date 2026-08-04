// gen-preview-images.js · 生成 76 张 scene×style 预览图并上传 CloudBase storage
// 19 组合 × 4 变体 = 76 张，gpt-image-2 生成，45s 限流间隔
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ENV = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const API_URL = ENV.match(/AZURE_IMAGE_API_URL=(.+)/)[1].trim();
const API_KEY = ENV.match(/AZURE_IMAGE_API_KEY=(.+)/)[1].trim();
const MODEL = (ENV.match(/AZURE_IMAGE_MODEL=(.+)/) || [,'gpt-image-2'])[1].trim();
const ENV_ID = 'aippt-skill-d6g5hsem096551cc3';
const OUT_DIR = path.join(ROOT, 'oss', 'preview-images');
fs.mkdirSync(OUT_DIR, { recursive: true });

const COMBOS = [
  ['工作汇报','商务简约'], ['商务展示','商务简约'], ['创意设计','创意活泼'],
  ['学术研究','学术清爽'], ['答辩','学术清爽'], ['教育课件','创意活泼'],
  ['创意设计','日系简约'], ['创意设计','中式典雅'], ['工作汇报','中式典雅'],
  ['创意设计','科技极简'], ['商务展示','科技极简'], ['教育课件','中式典雅'],
  ['学术研究','科技极简'], ['商务展示','创意活泼'], ['商务展示','中式典雅'],
  ['教育课件','学术清爽'], ['答辩','中式典雅'], ['答辩','创意活泼'],
  ['工作汇报','科技极简'],
];

const VARIANTS = [
  'with clean data charts and timeline visualization',
  'with professional icon grid and structured layout',
  'with elegant typography and subtle geometric shapes',
  'with modern gradient accents and workflow diagram',
];

function buildPrompt(scene, style, variant) {
  return `A minimalist PPT template preview thumbnail for ${scene} scenario, ${style} design style, ${variant}. Flat design, clean white background with subtle color accents, professional business aesthetic. 16:9 aspect ratio. No text, no watermark, no logo.`;
}

function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    const body = JSON.stringify({
      model: MODEL,
      prompt: prompt,
      size: '1024x1024',
      quality: 'medium',
      n: 1,
    });
    const options = {
      method: 'POST',
      hostname: url.hostname,
      path: '/openai/deployments/gpt-image-2/images/generations?api-version=2024-10-21',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
        'Authorization': 'Bearer ' + API_KEY,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error('HTTP ' + res.statusCode + ': ' + data.slice(0, 200)));
          return;
        }
        try {
          const j = JSON.parse(data);
          if (j.data && j.data[0] && j.data[0].b64_json) {
            resolve(Buffer.from(j.data[0].b64_json, 'base64'));
          } else if (j.data && j.data[0] && j.data[0].url) {
            reject(new Error('Got URL not b64, need to download: ' + j.data[0].url));
          } else {
            reject(new Error('No image in response: ' + JSON.stringify(j).slice(0, 200)));
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function uploadToStorage(localPath, cloudPath) {
  try {
    execSync(`tcb storage upload "${localPath}" "${cloudPath}" --env-id ${ENV_ID} 2>&1`, { encoding: 'utf8' });
    return true;
  } catch (e) {
    console.error('  upload fail: ' + e.message.slice(0, 100));
    return false;
  }
}

async function main() {
  console.log('=== 76 张预览图生成计划 ===');
  console.log('API: ' + API_URL.slice(0, 50) + '...');
  console.log('Model: ' + MODEL);
  console.log('Output: ' + OUT_DIR);
  console.log('Storage env: ' + ENV_ID);
  console.log();

  let generated = 0, failed = 0, uploaded = 0;
  const manifest = [];

  for (let i = 0; i < COMBOS.length; i++) {
    const [scene, style] = COMBOS[i];
    for (let v = 0; v < VARIANTS.length; v++) {
      const id = `preview_${String(i).padStart(2,'0')}_${v}`;
      const localPath = path.join(OUT_DIR, id + '.png');
      const cloudPath = `preview-images/${id}.png`;

      // 跳过已生成的
      if (fs.existsSync(localPath)) {
        console.log(`[${generated+uploaded+1}/76] ${id} 已存在，跳过生成`);
        generated++;
        // 仍需上传
        if (uploadToStorage(localPath, cloudPath)) { uploaded++; manifest.push({ id, scene, style, variant: v, url: cloudPath }); }
        continue;
      }

      const prompt = buildPrompt(scene, style, VARIANTS[v]);
      console.log(`[${generated+uploaded+failed+1}/76] ${id} ${scene}×${style} v${v}`);

      try {
        const buf = await generateImage(prompt);
        fs.writeFileSync(localPath, buf);
        generated++;
        console.log('  ✅ 生成 ' + (buf.length / 1024).toFixed(0) + 'KB');

        if (uploadToStorage(localPath, cloudPath)) {
          uploaded++;
          manifest.push({ id, scene, style, variant: v, url: cloudPath });
        }
      } catch (e) {
        failed++;
        console.error('  ❌ ' + e.message.slice(0, 150));
        // 429 限流：等更久
        if (e.message.indexOf('429') >= 0) {
          console.log('  限流，等待 60s...');
          await new Promise(r => setTimeout(r, 60000));
        }
      }

      // 45s 限流间隔
      if (i * 4 + v < 75) {
        await new Promise(r => setTimeout(r, 45000));
      }
    }
  }

  console.log('\n=== 结果 ===');
  console.log('生成: ' + generated + ' / 失败: ' + failed + ' / 上传: ' + uploaded);
  fs.writeFileSync(path.join(ROOT, 'oss', 'preview-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('manifest: oss/preview-manifest.json (' + manifest.length + ' 条)');
}

main().catch(console.error);
