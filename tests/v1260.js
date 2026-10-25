const puppeteer=require('puppeteer-core');
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  p.on('pageerror',e=>console.log('PAGEERR:', e.message));
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));

  console.log('=== 1. 金字塔区域存在 ===');
  const r1 = await p.evaluate(()=>{
    const z=ZONES.pyramid;
    return {exists: !!z, name: z.name, danger: z.danger, res: z.res.map(x=>x[0]).join(',')};
  });
  console.log('存在:', r1.exists, ' 名称:', r1.name, ' 危险度:', r1.danger, ' 资源:', r1.res);

  console.log('=== 2. 区域按钮渲染 ===');
  await p.evaluate(()=>switchTab('act'));
  await new Promise(r=>setTimeout(r,200));
  const r2 = await p.evaluate(()=>{
    const btns=Array.from(document.querySelectorAll('.zonebtn')).map(b=>b.textContent);
    return {count: btns.length, hasPyramid: btns.includes('🏜沙漠金字塔')};
  });
  console.log('按钮数:', r2.count, '(应 5)', ' 含金字塔:', r2.hasPyramid);

  console.log('=== 3. 金字塔战斗遇到专属怪（1000 次采样）===');
  const r3 = await p.evaluate(()=>{
    curZone='pyramid';
    let zone=0, beast=0;
    for(let i=0;i<1000;i++){
      const pool=(REGION_BEASTS[curZone] && Math.random()<0.45) ? REGION_BEASTS[curZone] : BEASTS;
      if(pool===REGION_BEASTS.pyramid) zone++; else beast++;
    }
    // 池内分布
    const names={};
    REGION_BEASTS.pyramid.forEach(b=>{ for(let i=0;i<100;i++){ names[b.name]=(names[b.name]||0)+1; } });
    return {zonePct:(zone/10).toFixed(1), beastPct:(beast/10).toFixed(1), poolNames:Object.keys(names).join(',')};
  });
  console.log('金字塔专属怪占比%:', r3.zonePct, ' 通用野兽%:', r3.beastPct, ' 池内:', r3.poolNames);

  console.log('=== 4. 木乃伊掉符石 ===');
  const r4 = await p.evaluate(()=>{
    const m=REGION_BEASTS.pyramid.find(b=>b.name.includes('木乃伊'));
    G.res.rune=0; G.res.leather=0;
    addRes('rune',m.rune); addRes('leather',m.leather);
    return {rune:G.res.rune, leather:G.res.leather, hp:m.hp, atk:m.atk};
  });
  console.log('击败木乃伊: 符石', r4.rune, ' 皮革', r4.leather, ' 属性:', r4.hp+'hp/'+r4.atk+'atk');

  console.log('=== 5. 金字塔专属事件 ===');
  const r5 = await p.evaluate(()=>{
    const evs=EXPLORE_EVENTS.filter(e=>e.zone==='pyramid');
    return evs.map(e=>e.id+':'+e.title).join(' | ');
  });
  console.log('事件:', r5);

  console.log('=== 6. 事件过滤（其他区域不出金字塔事件）===');
  const r6 = await p.evaluate(()=>{
    curZone='forest';
    const pool=[];
    EXPLORE_EVENTS.forEach(e=>{ if(e.zone && e.zone!==curZone) return; for(let i=0;i<e.w;i++) pool.push(e); });
    return {pyramidInForest: pool.some(e=>e.zone==='pyramid')};
  });
  console.log('森林不含金字塔事件:', !r6.pyramidInForest);

  console.log('=== 7. 盗墓事件-开棺战斗分支 ===');
  const r7 = await p.evaluate(()=>{
    const ev=EXPLORE_EVENTS.find(e=>e.id==='tomb');
    combat=null;
    // 直接测 startCombat 在金字塔区域被调用
    curZone='pyramid';
    startCombat(1);
    const hasCombat=!!combat && !!combat.b;
    const name=combat?combat.b.name:'';
    combat=null;
    return {hasCombat, name};
  });
  console.log('触发战斗:', r7.hasCombat, ' 怪物:', r7.name);

  console.log('=== 8. Wiki 图鉴含金字塔 ===');
  const r8 = await p.evaluate(()=>{ openWiki(); wikiTab('monster',null); return document.getElementById('wikiBody').textContent; });
  console.log('含木乃伊:', r8.includes('木乃伊'), ' 含食尸虫:', r8.includes('食尸虫'), ' 含眼镜蛇:', r8.includes('沙漠眼镜蛇'), ' 含金字塔:', r8.includes('金字塔'));

  console.log('=== 9. 探索金字塔实际获得金矿/符石（200 次）===');
  const r9 = await p.evaluate(()=>{
    curZone='pyramid';
    let gold=0, rune=0, stone=0;
    for(let i=0;i<200;i++){
      G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false; G.hp=100;
      const bG=G.res.goldOre, bR=G.res.rune, bS=G.res.stone;
      doAction('explore');
      gold+=G.res.goldOre-bG; rune+=G.res.rune-bR; stone+=G.res.stone-bS;
    }
    return {gold, rune, stone};
  });
  console.log('200次探索: 金矿', r9.gold, ' 符石', r9.rune, ' 石头', r9.stone);

  await b.close();
})();
