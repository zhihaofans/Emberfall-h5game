const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  p.on('pageerror',e=>console.log('PAGEERR:', e.message));
  p.on('console',m=>{ if(m.type()==='error') console.log('CONSOLE ERR:', m.text()); });
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));
  const r=await p.evaluate(()=>{
    G.gold=1000;
    G.res.luckyDraw=0;
    // 找出抽奖券商品
    const good = MERCHANT_GOODS.find(g => g.get && g.get.luckyDraw);
    if(!good) return {err:'not found'};
    console.log('商品:', JSON.stringify({label:good.label, cost:good.cost, get:good.get}));
    // 调用 eff
    good.eff(G);
    return {afterGold:G.gold, afterLucky:G.res.luckyDraw, isNaN:isNaN(G.gold)};
  });
  console.log('结果:', JSON.stringify(r));
  await b.close();
})();
