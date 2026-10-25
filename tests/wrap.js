const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  p.on('pageerror',e=>console.log('PAGEERR:', e.message));
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));
  await p.evaluate(()=>{
    G.res.metal=1000; G.res.alloy=1000; G.res.rune=1000; G.res.leather=1000; G.res.stone=1000;
    G.res.copper=1000; G.res.silver=1000; G.res.gold=1000;
    G.items.steel=true; G.items.forge=true; G.items.huntKing=true; G.items.tower=true; G.items.enchantTbl=true;
    switchTab('craft');
  });
  await new Promise(r=>setTimeout(r,300));
  const r = await p.evaluate(()=>{
    const box = document.getElementById('actions');
    const buttons = box.querySelectorAll('.actbtn');
    const subs = Array.from(buttons).map(b=>{
      const sub = b.querySelector('.sub');
      if(!sub) return null;
      const ch = sub.clientHeight, lh = parseFloat(getComputedStyle(sub).lineHeight);
      return {h:ch, lines: Math.round(ch/lh), text: sub.textContent.slice(0,60)};
    }).filter(x=>x && x.text);
    const truncated = subs.filter(s=>s.text.endsWith('...') || s.text.endsWith('…'));
    const heights = Array.from(buttons).map(b=>Math.round(b.getBoundingClientRect().height));
    return {
      btnCount: buttons.length,
      maxH: Math.max(...heights),
      truncatedCount: truncated.length,
      sampleLines: subs.slice(0,8).map(s=>`${s.lines}行: ${s.text}`),
    };
  });
  console.log('按钮数:', r.btnCount, ' 最高:', r.maxH, ' 截断按钮数:', r.truncatedCount);
  console.log('前8个按钮 sub 行数:');
  r.sampleLines.forEach(l=>console.log('  ',l));
  await p.screenshot({path:'/tmp/wrap.png'});
  await b.close();
})();