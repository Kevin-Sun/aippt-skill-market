const https = require('https');
const fs = require('fs');
const path = require('path');

const ENV = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n');
const getKey = (k) => (ENV.find(l => l.startsWith(k+'=')) || '').split('=')[1];
const API_KEY = getKey('AZURE_IMAGE_API_KEY');
const BASE = 'westus3.api.cognitive.microsoft.com';

const paths = [
  '/openai/deployments/gpt-image-2/images/generations?api-version=2024-10-21',
  '/openai/deployments/gpt-image-2/images/generations?api-version=2024-02-01',
  '/v1/images/generations',
  '/openai/images/generations?api-version=2024-02-01',
];

const body = JSON.stringify({ prompt: 'a blue square', n: 1, size: '256x256' });

for (const p of paths) {
  const req = https.request({ hostname: BASE, path: p, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': API_KEY } }, (res) => {
    let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
      console.log(`${p} → ${res.statusCode}: ${d.substring(0,150)}`);
    });
  });
  req.on('error',e=>console.log(`${p} err: ${e.message}`));
  req.write(body); req.end();
}
