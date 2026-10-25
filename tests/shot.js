const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));
  await p.evaluate(()=>{
    newGame();
    G.day=30; // 解锁所有区域
    curZone='pyramid';
    renderZone();
    switchTab('act');
  });
  await new Promise(r=>setTimeout(r,300));
  await p.screenshot({path:'/tmp/pyramid_selected.png'});
  await b.close();
})();
