const automator = require('miniprogram-automator');
(async () => {
  try {
    const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9888' });
    await mp.reLaunch('/pages/index/index');
    await new Promise(r => setTimeout(r, 5000));
    const page = await mp.currentPage();
    console.log('route:', page.path);
    const data = await page.data();
    console.log('skills:', (data.skills||[]).length);
    console.log('scenes:', (data.scenes||[]).length);
    const cards = await page.$$('.skill-card');
    console.log('cards:', cards.length);
    const title = await page.$('.nav-logo');
    console.log('title:', title ? await title.text() : 'not found');
    await mp.disconnect();
    console.log('OK');
  } catch(e) { console.error('err:', e.message); }
})();
