const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));
  const r = await p.evaluate(()=>{
    // 模拟用户场景：4 件皮甲 + 符甲 + 保护 5（减伤约 47%）
    G.items.armorHead='leather'; G.items.armorBody='leather'; G.items.armorLegs='leather'; G.items.armorBoots='leather';
    G.items.runeArmor=true; G.enchant.armor=5;
    switchTab('bag');
    return {armorRow: document.getElementById('actions').textContent.match(/护甲[^]*?减伤/)[0].replace(/\s+/g,' ')};
  });
  console.log('护甲行:', r.armorRow);
  await b.close();
})();
