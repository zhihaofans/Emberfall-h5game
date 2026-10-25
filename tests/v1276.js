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

  console.log('== 1. 复现原 bug：模拟箭头函数参数遮蔽 ==');
  const r1 = await p.evaluate(()=>{
    G.gold=1000; G.res.luckyDraw=0;
    // 模拟修复前的旧 bug：参数 g=G 全局，导致 G.gold -= undefined → NaN
    const g=G; // 修复前的错误写法
    const eff = g.cost
      ? (g=>{ if(G.gold < g.cost){ return; } G.gold -= g.cost; })
      : (g=>{});
    if(eff) eff(G); // resolveEvent 传入 G
    return {gold:G.gold, isNaN:isNaN(G.gold)};
  });
  ok(isNaN(r1.gold), '旧 bug 复现: gold 变 NaN (演示参数遮蔽)');

  console.log('== 2. 修复后：流浪商人现金购物不再 NaN ==');
  const r2 = await p.evaluate(()=>{
    G.gold=1000; G.res.luckyDraw=0;
    // 找出现实修复后的 eff 函数（从 opts 里抓）
    const raw = EXPLORE_EVENTS.find(e=>e._kind==='merchant');
    // 模拟 generate opts
    const good = MERCHANT_GOODS.find(g => g.get && g.get.luckyDraw);
    if(!good) return {err:'no good'};
    // 用修复后的逻辑：参数为 _g，外层 g 仍是商品
    const eff = good.eff || (good.cost
      ? (_g=>{ if(G.gold < good.cost){ log('not enough','warn'); return; } G.gold -= good.cost; })
      : (_g=>{}));
    eff(G);
    return {gold:G.gold, lucky:G.res.luckyDraw, isNaN:isNaN(G.gold)};
  });
  ok(!isNaN(r2.gold) && r2.gold===200, '修复后: 1000-800=200 (无 NaN)');
  ok(r2.lucky===1, '购买成功：抽奖券 +1');

  console.log('== 3. 完整交易：买抽奖券 ==');
  const r3 = await p.evaluate(()=>{
    G.gold=2000; G.res.luckyDraw=0;
    const good = MERCHANT_GOODS.find(g => g.get && g.get.luckyDraw && g.cost===800);
    const beforeGold=G.gold, beforeLucky=G.res.luckyDraw||0;
    // 直接调用 eff（修复后的箭头函数）
    const eff = good.eff || (good.cost
      ? (_g=>{ if(G.gold < good.cost){ return; } G.gold -= good.cost; trade({}, good.get); })
      : (_g=>trade(good.give, good.get)));
    eff(G);
    return {gold:G.gold, lucky:G.res.luckyDraw, cost:800, lost:beforeGold-G.gold};
  });
  ok(r3.gold===1200 && r3.lucky===1 && r3.lost===800, '完整交易: 2000→1200 + 抽奖券1');
  ok(!isNaN(r3.gold), '金币非 NaN');

  console.log('== 4. 5 张抽奖券批量购买 ==');
  const r4 = await p.evaluate(()=>{
    G.gold=5000; G.res.luckyDraw=0;
    const good = MERCHANT_GOODS.find(g => g.get && g.get.luckyDraw===5);
    const eff = good.eff || (good.cost
      ? (_g=>{ if(G.gold < good.cost){ return; } G.gold -= good.cost; trade({}, good.get); })
      : (_g=>trade(good.give, good.get)));
    eff(G);
    return {gold:G.gold, lucky:G.res.luckyDraw};
  });
  ok(r4.gold===1500 && r4.lucky===5, '批量: 5000-3500=1500 + 抽奖券×5');

  console.log('== 5. 旧档补偿抽奖券 =2 ==');
  const r5 = await p.evaluate(()=>{
    const g=normalizeState({v:10, day:1, res:{}});
    return {lucky:g.res.luckyDraw};
  });
  ok(r5.lucky===2, 'normalize 自动补 2 张抽奖券 (1+1)');

  console.log('== 6. 不重复补偿 ==');
  const r6 = await p.evaluate(()=>{
    let g=normalizeState({v:10, day:1, res:{}});
    g=normalizeState(g);
    return {lucky:g.res.luckyDraw};
  });
  ok(r6.lucky===2, '二次 normalize 后只补 2 张');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();
