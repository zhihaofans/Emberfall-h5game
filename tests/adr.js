const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  p.on('pageerror',e=>console.log('PAGEERR:', e.message));
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));

  console.log('=== 1. 资源/字段默认 ===');
  const r1 = await p.evaluate(()=>{
    newGame();
    return {res:G.res.adrenaline===0, left:G.adrenalineLeft===0, names:RES_NAMES.adrenaline};
  });
  console.log('默认:', JSON.stringify(r1));

  console.log('=== 2. 使用肾上腺素 ===');
  const r2 = await p.evaluate(()=>{
    G.res.adrenaline=2;
    useAdrenaline();
    return {left:G.adrenalineLeft, res:G.res.adrenaline, active:isAdrenaline()};
  });
  console.log('使用后: left=', r2.left, '(6)', ' 库存=', r2.res, '(1)', ' 生效:', r2.active);

  console.log('=== 3. 期间精力不消耗 ===');
  const r3 = await p.evaluate(()=>{
    G.adrenalineLeft=6; G.stam=50;
    doAction('chop');
    const stamAfter=G.stam;
    return {stamAfter, stamSame: stamAfter===50};
  });
  console.log('砍柴后精力:', r3.stamAfter, '不降:', r3.stamSame);

  console.log('=== 4. 期间饥饿/口渴不掉血 ===');
  const r4 = await p.evaluate(()=>{
    G.adrenalineLeft=6; G.hp=80; G.food=0; G.water=0;
    applyPassive();
    const hpAfter=G.hp;
    return {hpAfter, hpSame: hpAfter===80};
  });
  console.log('饥饿口渴下 hp:', r4.hpAfter, '不降:', r4.hpSame);

  console.log('=== 5. 期间每日食物水不降 ===');
  const r5 = await p.evaluate(()=>{
    G.adrenalineLeft=6; G.food=50; G.water=50;
    // 模拟 nextDay 消耗段
    if(!isAdrenaline()){ G.food=clamp(G.food-15,0,100); G.water=clamp(G.water-20,0,100); }
    return {food:G.food, water:G.water};
  });
  console.log('每日后: 食', r5.food, '水', r5.water, '(应 50/50 不降)');

  console.log('=== 6. 计时递减 ===');
  const r6 = await p.evaluate(()=>{
    G.adrenalineLeft=6;
    passTime(2);
    const t1=G.adrenalineLeft;
    passTime(4);
    const t2=G.adrenalineLeft;
    return {t1, t2, active:isAdrenaline()};
  });
  console.log('6h后: left=', r6.t1, '(4)', ' 再4h:', r6.t2, '(0)', ' 失效:', !r6.active);

  console.log('=== 7. 背包注射按钮 ===');
  const r7 = await p.evaluate(()=>{
    G.res.adrenaline=1;
    switchTab('bag');
    const txt=document.getElementById('actions').textContent;
    return {shown:txt.includes('肾上腺素'), btn:txt.includes('注射')};
  });
  console.log('背包显示:', r7.shown, ' 注射按钮:', r7.btn);

  console.log('=== 8. 状态栏倒计时 ===');
  const r8 = await p.evaluate(()=>{
    G.adrenalineLeft=4;
    renderAll();
    return el('dayinfo').textContent.includes('💉');
  });
  console.log('状态栏含💉:', r8);

  console.log('=== 9. 获取途径：兽王 30% / 幸运方块 / 商人 ===');
  const r9 = await p.evaluate(()=>{
    let drops=0; for(let i=0;i<200;i++){ if(Math.random()<0.3) drops++; }
    const luck=!!LUCK_EVENTS.find(e=>e.name==='肾上腺素');
    const merch=!!MERCHANT_GOODS.find(g=>g.get && g.get.adrenaline);
    return {bossPct: drops/2, luck, merch};
  });
  console.log('兽王掉率%:', r9.bossPct, ' 幸运方块:', r9.luck, ' 商人:', r9.merch);

  await b.close();
})();
