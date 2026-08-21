delete process.env.HTTP_PROXY; delete process.env.HTTPS_PROXY; process.env.no_proxy='*';
const automator=require('miniprogram-automator');

(async()=>{
  const mp=await automator.connect({wsEndpoint:'ws://127.0.0.1:9420', timeout:10000});
  console.log('connected');
  
  // Test reLaunch to detail page
  try {
    await mp.reLaunch('/pages/detail/detail?id=skill_001');
    console.log('reLaunch to detail: OK');
  } catch(e) {
    console.log('reLaunch to detail: FAIL:', e.message);
  }
  
  await new Promise(r=>setTimeout(r,5000));
  const ps=await mp.pageStack();
  console.log('pageStack:', ps.length, ps.map(p=>p.path));
  
  if (ps.length>=1 && ps[ps.length-1].path.includes('detail')) {
    const page=ps[ps.length-1];
    const d=await page.data();
    console.log('skill.id:', d.skill && d.skill.id);
    console.log('skill.previewDeck:', d.skill && d.skill.previewDeck ? d.skill.previewDeck.length+' pages' : 'NO');
    console.log('previewLoaded:', d.previewLoaded);
    console.log('previewImgLoadCount:', d.previewImgLoadCount);
    console.log('previewImgErrorCount:', d.previewImgErrorCount);
    
    // Check if images actually loaded
    await new Promise(r=>setTimeout(r,3000));
    const d2=await page.data();
    console.log('after 3s more:');
    console.log('  previewImgLoadCount:', d2.previewImgLoadCount);
    console.log('  previewImgErrorCount:', d2.previewImgErrorCount);
    console.log('  previewLoaded:', d2.previewLoaded);
  }
  
  // Test reLaunch to orders
  try {
    await mp.reLaunch('/pages/orders/orders');
    console.log('reLaunch to orders: OK');
  } catch(e) {
    console.log('reLaunch to orders: FAIL:', e.message);
  }
  await new Promise(r=>setTimeout(r,5000));
  const ps2=await mp.pageStack();
  console.log('orders pageStack:', ps2.length, ps2.map(p=>p.path));
  
  await mp.disconnect();
  process.exit(0);
})();
