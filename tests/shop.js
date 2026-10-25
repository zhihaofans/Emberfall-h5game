const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  p.on('pageerror',e=>console.log('PAGEERR:', e.message));
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));
  const r = await p.evaluate(()=>{
    return {
      total: Object.keys(SHOP).length,
      ids: Object.keys(SHOP),
      rune: SHOP.rune, life: SHOP.lifePotion, exp: SHOP.expPotion, tot: SHOP.totem, lucky: SHOP.lucky5,
    };
  });
  console.log('SHOP 总数:', r.total, '(应 14 = 5 基础 + 9 高级)');
  console.log('IDs:', r.ids.join(','));
  console.log('符石:', JSON.stringify(r.rune));
  console.log('经验药水:', JSON.stringify(r.exp));
  console.log('抽奖券×5:', JSON.stringify(r.lucky));
  await b.close();
})();
