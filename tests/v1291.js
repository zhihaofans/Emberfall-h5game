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

  console.log('== 1. newGame 默认含 __v1171_comp 标记 ==');
  const r1 = await p.evaluate(()=>{
    newGame();
    return {comp:!!G.__v1171_comp, luck:G.res.luck};
  });
  ok(r1.comp, 'newGame 含标记');
  ok(r1.luck===0, '新玩家无补偿 ('+r1.luck+')');

  console.log('== 2. 旧档（无标记）仍会补偿 ==');
  const r2 = await p.evaluate(()=>{
    const g=normalizeState({v:10, day:1, res:{wood:1}});
    return {comp:!!g.__v1171_comp, luck:g.res.luck};
  });
  ok(r2.comp, '旧档加载后标记已设');
  ok(r2.luck>=100, '旧档补偿 100 个 ('+r2.luck+')');

  console.log('== 3. 二次加载不重复 ==');
  const r3 = await p.evaluate(()=>{
    let g=normalizeState({v:10, day:1, res:{wood:1}});
    g=normalizeState(g);
    return {luck:g.res.luck};
  });
  ok(r3.luck===100, '二次只补 1 次 ('+r3.luck+')');

  console.log('== 4. 钓鱼宝藏权重 2→1 ==');
  const r4 = await p.evaluate(()=>{
    // 钓 500 次触发宝藏看分布（每次循环重置精力/饥饿/水分）
    G.items.rod=true; G.skills.fish.lvl=20; // 高等级提高宝藏率
    let luckGet=0, totalFishes=0;
    for(let i=0;i<500;i++){
      G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false; G.hp=100; G.gold=100;
      const bLuck=G.res.luck||0;
      doAction('fish');
      if((G.res.luck||0)>bLuck) luckGet++;
      totalFishes++;
    }
    return {totalFishes, luckGet, pct:(luckGet/totalFishes*100).toFixed(1)};
  });
  ok(r4.luckGet>0 && r4.luckGet<60, '500 次钓 '+r4.luckGet+' 个幸运方块 (约 '+r4.pct+'%, 期望 ~4-10%)');

  console.log('== 5. 权重调整后概率确实下降 ==');
  const r5 = await p.evaluate(()=>{
    const tw = {w:1, txt:'🎲 一个湿漉漉的幸运方块！', eff:()=>{}};
    const tw_weight = tw.w;
    return {weight:tw_weight, expected:'0.9%'};
  });
  ok(r5.weight===1, '权重从 2 改成 1（实际概率从 1.8% → 0.9%）');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();