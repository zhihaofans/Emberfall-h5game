const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));
  const r=await p.evaluate(()=>{
    return {
      items: {armorHead:G.items.armorHead, armorBody:G.items.armorBody, armorLegs:G.items.armorLegs, armorBoots:G.items.armorBoots, runeArmor:G.items.runeArmor},
      enchant: G.enchant,
      mult: armorDmgMult(),
      minusPct: Math.round((1-armorDmgMult())*100),
    };
  });
  console.log(JSON.stringify(r, null, 2));
  await b.close();
})();
