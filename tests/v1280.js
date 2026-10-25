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

  console.log('== 1. ownedRes 记录机制 ==');
  const r1 = await p.evaluate(()=>{
    newGame();
    G.stats.ownedRes={};
    addRes('metal',3);
    return {metal:!!G.stats.ownedRes.metal, wood:!!G.stats.ownedRes.wood, cur:G.res.metal};
  });
  ok(r1.metal && !r1.wood, 'addRes 记录获取过的资源 (metal 记录, wood 未记录)');
  ok(r1.cur===3, '金属数量 3');

  console.log('== 2. 制作面板过滤：无材料时隐藏高级配方 ==');
  const r2 = await p.evaluate(()=>{
    newGame();
    G.stats.ownedRes={wood:1, stone:1, food:1}; // 只有基础材料
    switchTab('craft');
    const txt=document.getElementById('actions').textContent;
    return {
      hasForge: txt.includes('铁匠炉'), // cost 含 stone → 有交集显示
      hasRuneBlade: txt.includes('符刃'), // cost alloy+rune 无交集 → 隐藏
      hasAxe: txt.includes('石斧'), // cost wood+stone ✓
    };
  });
  ok(r2.hasAxe, '有 wood/stone 显示石斧（基础配方）');
  ok(r2.hasForge, '有 stone 交集显示铁匠炉（stone+metal 任一种即可）');
  ok(!r2.hasRuneBlade, '无 alloy/rune 隐藏符刃（终极配方）');

  console.log('== 3. 获取过材料后显示 ==');
  const r3 = await p.evaluate(()=>{
    newGame();
    G.stats.ownedRes={wood:1, stone:1, food:1, metal:1}; // 有 metal 了
    switchTab('craft');
    const txt=document.getElementById('actions').textContent;
    return {hasForge: txt.includes('铁匠炉'), hasIronAxe: txt.includes('铁斧')};
  });
  ok(r3.hasForge, '有 metal 后显示铁匠炉');
  ok(r3.hasIronAxe, '有 metal 后显示铁斧');

  console.log('== 4. 已解锁配方永远显示 ==');
  const r4 = await p.evaluate(()=>{
    newGame();
    G.items.steel=true; G.stats.ownedRes={wood:1};
    switchTab('craft');
    const txt=document.getElementById('actions').textContent;
    return {hasSteel: txt.includes('钢刀')};
  });
  ok(r4.hasSteel, '已解锁的钢刀显示（无钢材料也显示）');

  console.log('== 5. 背包物品隐藏 ==');
  const r5 = await p.evaluate(()=>{
    newGame();
    G.stats.ownedRes={};
    G.res.metal=0; G.res.leather=0; G.res.food=2; G.res.wood=4; G.res.stone=2;
    switchTab('bag');
    const txt=document.getElementById('actions').textContent;
    return {hasMetal: txt.includes('金属'), hasLeather: txt.includes('皮革'), hasFood: txt.includes('生食')};
  });
  ok(!r5.hasMetal && !r5.hasLeather, '未获取过且为 0 的金属/皮革隐藏');
  ok(r5.hasFood, '有数量的生食显示');

  console.log('== 6. 获取过后永久显示（数量归 0 也保留）==');
  const r6 = await p.evaluate(()=>{
    newGame();
    G.stats.ownedRes={leather:1};
    G.res.leather=0;
    switchTab('bag');
    const txt=document.getElementById('actions').textContent;
    return {hasLeather: txt.includes('皮革')};
  });
  ok(r6.hasLeather, '获取过皮革 → 数量 0 也显示');

  console.log('== 7. 区域默认只有 1 个 ==');
  const r7 = await p.evaluate(()=>{
    newGame();
    G.day=1;
    renderZone();
    const btns=Array.from(document.querySelectorAll('#zonebar .zonebtn'));
    return {
      count: btns.length,
      unlocked: btns.filter(b=>b.textContent.includes('🔒')).length,
      forest: btns.some(b=>b.textContent.includes('森林')),
    };
  });
  ok(r7.count===5, '按钮总 5 个（含锁定）');
  ok(r7.unlocked===4, '锁定 4 个（河/废墟/山丘/金字塔）');
  ok(r7.forest, '森林可用');

  console.log('== 8. 第 3 天解锁河边 ==');
  const r8 = await p.evaluate(()=>{
    newGame(); G.day=3; curZone='forest';
    renderZone();
    const btns=Array.from(document.querySelectorAll('#zonebar .zonebtn'));
    const river=btns.find(b=>b.textContent.includes('河边'));
    return {riverLocked: river && river.textContent.includes('🔒')};
  });
  ok(!r8.riverLocked, '第 3 天河边解锁');

  console.log('== 9. 锁定按钮点击提示 ==');
  const r9 = await p.evaluate(()=>{
    newGame(); G.day=1;
    renderZone();
    const lockBtn=Array.from(document.querySelectorAll('#zonebar .zonebtn')).find(b=>b.textContent.includes('🔒'));
    let msg='';
    const orig=toast; toast=(t)=>{ msg=t; };
    lockBtn.click();
    toast=orig;
    return {msg};
  });
  ok(r9.msg && r9.msg.includes('解锁'), '锁定按钮点击提示解锁条件');

  console.log('== 10. 第 25 天金字塔解锁 ==');
  const r10 = await p.evaluate(()=>{
    newGame(); G.day=25;
    renderZone();
    const btns=Array.from(document.querySelectorAll('#zonebar .zonebtn'));
    const pyr=btns.find(b=>b.textContent.includes('金字塔'));
    return {pyrLocked: pyr && pyr.textContent.includes('🔒')};
  });
  ok(!r10.pyrLocked, '第 25 天金字塔解锁');

  console.log('== 11. 旧档 normalize 兜底 ownedRes ==');
  const r11 = await p.evaluate(()=>{
    const g=normalizeState({v:10, day:50, res:{wood:1}});
    return {owned:typeof g.stats.ownedRes==='object'};
  });
  ok(r11.owned, '旧档自动补 ownedRes');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();
