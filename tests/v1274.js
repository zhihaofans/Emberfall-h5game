const puppeteer=require('puppeteer-core');
let pass=0, fail=0;
function ok(c, n){ if(c){ pass++; console.log('✅ '+n); } else { fail++; console.log('❌ '+n); } }
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  p.on('pageerror',e=>console.log('PAGEERR:', e.message));
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));

  console.log('== 1. renderAll 全局护甲：NaN → 0 ==');
  const r1 = await p.evaluate(()=>{
    G.gold=NaN;
    renderAll();
    return {gold:G.gold};
  });
  ok(r1.gold===0, 'NaN 自动归 0 (实际 '+r1.gold+')');

  console.log('== 2. Infinity 也归 0 ==');
  const r2 = await p.evaluate(()=>{
    G.gold=Infinity;
    renderAll();
    return {gold:G.gold};
  });
  ok(r2.gold===0, 'Infinity 归 0 (实际 '+r2.gold+')');

  console.log('== 3. hp/food/water/stam NaN 保护 ==');
  const r3 = await p.evaluate(()=>{
    G.hp=NaN; G.food=NaN; G.water=NaN; G.stam=NaN;
    renderAll();
    return {hp:G.hp, food:G.food, water:G.water, stam:G.stam};
  });
  ok(r3.hp===0 && r3.food===0 && r3.water===0 && r3.stam===0, '生命/饱食/水分/精力 NaN→0');

  console.log('== 4. 顶部 UI 不显示 NaN ==');
  const r4 = await p.evaluate(()=>{
    G.gold=NaN; renderAll();
    return {ui:el('dayinfo').textContent};
  });
  ok(!r4.ui.includes('NaN'), '顶部 UI 不含 NaN ('+r4.ui.slice(0,80)+')');

  console.log('== 5. 旧档 normalize 自动补偿 ==');
  const r5 = await p.evaluate(()=>{
    const g=normalizeState({v:10, day:115, gold:NaN, res:{}});
    return {totem:g.res.totem, lucky:g.res.luckyDraw, gold:g.gold, comp:!!g.__v1274_comp};
  });
  ok(r5.totem>=1 && r5.lucky>=1, '补偿: 图腾='+r5.totem+' 抽奖券='+r5.lucky);
  ok(r5.gold===0, 'NaN 金币自动归 0 (实际 '+r5.gold+')');
  ok(r5.comp, '__v1274_comp 标记存在');

  console.log('== 6. 二次 normalize 不重复补偿 ==');
  const r6 = await p.evaluate(()=>{
    let g=normalizeState({v:10, day:115, res:{}});
    g=normalizeState(g);
    return {totem:g.res.totem, lucky:g.res.luckyDraw};
  });
  ok(r6.totem===1 && r6.lucky===2, '二次 normalize 后不重复补 (图腾='+r6.totem+', 抽奖='+r6.lucky+')');

  console.log('== 7. 整型 gold 不被误判 ==');
  const r7 = await p.evaluate(()=>{
    G.gold=12345; renderAll();
    return {gold:G.gold, ui:el('dayinfo').textContent.includes('12345')};
  });
  ok(r7.gold===12345 && r7.ui, '正常整数 12345 显示正常');

  console.log('== 8. UI 实时刷新护甲 ==');
  const r8 = await p.evaluate(()=>{
    G.gold=1; renderAll();
    const before=el('dayinfo').textContent.includes('💰1');
    G.gold=NaN; renderAll();
    const after=el('dayinfo').textContent.includes('💰0');
    return {before, after};
  });
  ok(r8.before && r8.after, '正常显示 1，NaN 后变 0');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();