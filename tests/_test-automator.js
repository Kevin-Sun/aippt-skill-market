delete process.env.HTTP_PROXY; delete process.env.HTTPS_PROXY; process.env.no_proxy='*';
const automator=require('miniprogram-automator');

(async()=>{
  try {
    const mp=await automator.connect({wsEndpoint:'ws://127.0.0.1:9420', timeout:10000});
    console.log('connected');
    
    // Test 1: callWxMethod switchTab
    const t1=Date.now();
    try {
      await Promise.race([
        mp.callWxMethod('switchTab', {url:'/pages/orders/orders'}),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('5s timeout')),5000))
      ]);
      console.log('callWxMethod switchTab: OK in '+(Date.now()-t1)+'ms');
    } catch(e) {
      console.log('callWxMethod switchTab: FAIL in '+(Date.now()-t1)+'ms:', e.message);
    }
    
    // Test 2: element.tap
    const page=await mp.currentPage();
    console.log('current page:', page.path);
    const card=await page.$('.skill-card');
    if(card){
      const t2=Date.now();
      try {
        await Promise.race([card.tap(), new Promise((_,rej)=>setTimeout(()=>rej(new Error('5s tap timeout')),5000))]);
        console.log('card.tap: OK in '+(Date.now()-t2)+'ms');
        await new Promise(r=>setTimeout(r,4000));
        const ps=await mp.pageStack();
        console.log('pageStack after tap:', ps.length, ps.map(p=>p.path));
      } catch(e) { console.log('card.tap: FAIL in '+(Date.now()-t2)+'ms:', e.message); }
    } else { console.log('card not found'); }
    
    // Test 3: page.callMethod
    const homePage=await mp.currentPage();
    const t3=Date.now();
    try {
      await Promise.race([homePage.callMethod('onSearchSubmit'), new Promise((_,rej)=>setTimeout(()=>rej(new Error('5s timeout')),5000))]);
      console.log('callMethod onSearchSubmit: OK in '+(Date.now()-t3)+'ms');
    } catch(e) { console.log('callMethod onSearchSubmit: FAIL in '+(Date.now()-t3)+'ms:', e.message); }
    
    // Test 4: reLaunch
    const t4=Date.now();
    try {
      await Promise.race([
        mp.reLaunch('/pages/index/index'),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('8s timeout')),8000))
      ]);
      console.log('reLaunch index: OK in '+(Date.now()-t4)+'ms');
    } catch(e) { console.log('reLaunch index: FAIL in '+(Date.now()-t4)+'ms:', e.message); }
    
    await mp.disconnect();
  } catch(e) { console.log('FATAL:', e.message); }
  process.exit(0);
})();
