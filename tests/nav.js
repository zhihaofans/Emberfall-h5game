const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  p.on('pageerror',e=>console.log('PAGEERR:', e.message));
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));
  const r = await p.evaluate(()=>{
    switchTab('craft');
    const box=document.getElementById('actions');
    const nav = document.querySelector('.craftnav');
    // 装备区位置（应紧跟 Tier 分组后、强化前）
    const anchors = ['craft0','craftArmor','craftUp','craftEn'].map(id=>{
      const el=document.getElementById(id);
      return {id, exists: !!el, top: el? el.offsetTop : -1};
    });
    // 点击装备导航
    scrollCraftTo('craftArmor');
    return {navExists: !!nav, anchors, armorTopAfterNav: box.scrollTop, armorElTop: document.getElementById('craftArmor')?document.getElementById('craftArmor').offsetTop:0};
  });
  console.log(JSON.stringify(r,null,1));
  await p.screenshot({path:'/tmp/nav.png'});
  await b.close();
})();
