const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));
  await p.evaluate(()=>{
    G.res.metal=1000; G.res.alloy=1000; G.res.rune=1000; G.res.leather=1000; G.res.stone=1000;
    G.res.copper=1000; G.res.silver=1000; G.res.gold=1000;
    G.items.steel=true; G.items.forge=true; G.items.huntKing=true; G.items.tower=true; G.items.enchantTbl=true;
    G.enchant={tblLv:5, weapon:3, armor:2, tool:1};
    G.items.armorHead='leather'; G.items.armorBody='iron';
    switchTab('craft');
  });
  await new Promise(r=>setTimeout(r,300));
  // 滚到附魔/装备区
  await p.evaluate(()=>{
    const box=document.getElementById('actions');
    // 滚到附魔台 Lv 按钮（材料最多）
    const enchantBtn=Array.from(box.querySelectorAll('.actbtn')).find(b=>b.textContent.includes('附魔台 Lv'));
    if(enchantBtn) enchantBtn.scrollIntoView({block:'center'});
  });
  await new Promise(r=>setTimeout(r,200));
  await p.screenshot({path:'/tmp/wrap2.png'});
  // 检查附魔升级按钮（材料最多）
  const r = await p.evaluate(()=>{
    const box = document.getElementById('actions');
    const buttons = Array.from(box.querySelectorAll('.actbtn'));
    return buttons.filter(b=>b.textContent.includes('锋利') || b.textContent.includes('保护') || b.textContent.includes('附魔台 Lv') || b.textContent.includes('升级🥉铜')).map(b=>{
      const sub=b.querySelector('.sub');
      const ch=sub?sub.clientHeight:0; const lh=parseFloat(getComputedStyle(sub).lineHeight);
      return {name:b.textContent.slice(0,15), lines:Math.round(ch/lh), height:Math.round(b.getBoundingClientRect().height), sub:sub?sub.textContent.slice(0,80):''};
    });
  });
  console.log('长材料按钮行数:');
  r.forEach(r=>console.log('  '+r.name+'  '+r.lines+'行  高'+r.height+'px  sub:', r.sub));
  await b.close();
})();
