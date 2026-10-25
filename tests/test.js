const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));
  const r = await p.evaluate(()=>{
    G.res.leather=100;
    switchTab('craft');
    const box=document.getElementById('actions');
    const upgradeBtns = Array.from(box.querySelectorAll('button')).filter(b=>/制作|升级/.test(b.textContent));
    return {
      upgradeCount: upgradeBtns.length,
      makeLeather: upgradeBtns.some(b=>/制作.*皮/.test(b.textContent)),
      disCount: upgradeBtns.filter(b=>b.classList.contains('actbtn-dis')).length,
    };
  });
  console.log('升级/制作按钮数:', r.upgradeCount, '(应 8 = 4部位×2制作+升级或全)');
  console.log('含皮甲制作:', r.makeLeather, ' 禁用按钮:', r.disCount);
  await b.close();
})();
