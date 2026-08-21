#!/usr/bin/env bash
set -euo pipefail
PROJECT="/Users/sunkai/ops-dashboard/docs/aippt-skill-market"
OUT="$PROJECT/tests/screenshots"
mkdir -p "$OUT"

WID=$(swift - <<'SWIFT'
import CoreGraphics
let opts = CGWindowListOption(arrayLiteral: .optionOnScreenOnly, .excludeDesktopElements)
if let list = CGWindowListCopyWindowInfo(opts, kCGNullWindowID) as? [[String: Any]] {
  for w in list {
    let owner = w[kCGWindowOwnerName as String] as? String ?? ""
    if owner == "微信开发者工具" { print(w[kCGWindowNumber as String] as? Int ?? 0, terminator: ""); break }
  }
}
SWIFT
)
[ -z "$WID" ] && { echo "❌ devtools 未找到"; exit 1; }
echo "devtools WID=$WID"
export WID OUT no_proxy="*"

node <<'NODE'
delete process.env.HTTP_PROXY; delete process.env.http_proxy;
delete process.env.HTTPS_PROXY; delete process.env.https_proxy;
process.env.no_proxy='*';
const WebSocket=require('ws');
const fs=require('fs');
const cp=require('child_process');
const WID=process.env.WID, OUT=process.env.OUT;
const ws=new WebSocket('ws://127.0.0.1:9420',{agent:undefined});
let id=0; const pend=new Map();
function send(m,p={},t=15000){return new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});ws.send(JSON.stringify({id:i,method:m,params:p}));setTimeout(()=>{if(pend.has(i)){pend.delete(i);rej(new Error('timeout '+m))}},t)})}
ws.on('message',d=>{try{const m=JSON.parse(d.toString());if(m.id&&pend.has(m.id)){const{res,rej}=pend.get(m.id);pend.delete(m.id);m.error?rej(new Error(m.error.message)):res(m.result)}}catch(e){}});

const PAGES=[
  {name:'01-index',url:'/pages/index/index',tab:true,wait:5000},
  {name:'02-search',url:'/pages/search/search',nav:true,wait:3500},
  {name:'03-detail-paid',url:'/pages/detail/detail?id=skill_001',nav:true,wait:3500},
  {name:'04-detail-free',url:'/pages/detail/detail?id=skill_new_001',nav:true,wait:3500},
  {name:'05-member',url:'/pages/member/member',nav:true,wait:3500},
  {name:'06-orders',url:'/pages/orders/orders',nav:true,wait:3500},
  {name:'07-mine',url:'/pages/mine/mine',tab:true,wait:3500},
  {name:'08-promotion',url:'/pages/promotion/promotion',tab:true,wait:3500},
];

ws.on('open',async()=>{
  console.log('connected');
  for(const p of PAGES){
    process.stdout.write('  '+p.name+': ');
    try{
      if(p.tab) await send('App.callWxMethod',{method:'switchTab',args:[{url:p.url}]});
      else await send('App.callWxMethod',{method:'navigateTo',args:[{url:p.url}]});
    }catch(e){ process.stdout.write('(nav err:'+e.message.slice(0,30)+')'); }
    await new Promise(r=>setTimeout(r,p.wait));
    // 确认当前页
    let cur='';
    try{ cur=(await send('App.getCurrentPage',{})).route; }catch(e){}
    process.stdout.write('page='+cur+' → ');
    const pngPath=OUT+'/'+p.name+'.png';
    try{
      cp.execSync('screencapture -l '+WID+' "'+pngPath+'"',{env:{...process.env},stdio:'pipe'});
      console.log(fs.statSync(pngPath).size+'B');
    }catch(e){
      cp.execSync('screencapture -x "'+pngPath+'"');
      console.log('fullscreen '+fs.statSync(pngPath).size+'B');
    }
  }
  console.log('\n=== done ===');
  // md5 对比
  const files=fs.readdirSync(OUT).filter(f=>f.endsWith('.png')).sort();
  const crypto=require('crypto');
  for(const f of files){
    const h=crypto.createHash('md5').update(fs.readFileSync(OUT+'/'+f)).digest('hex').slice(0,8);
    console.log('  '+f+' '+h);
  }
  ws.close(); process.exit(0);
});
ws.on('error',e=>{console.log('WS ERR:',e.message);process.exit(1)});
NODE
