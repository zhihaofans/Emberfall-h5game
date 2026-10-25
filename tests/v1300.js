/* v1.30.2 迷路事件：丢硬币选路 + 闭眼转圈 专项测试 */
const puppeteer=require('puppeteer-core');
let pass=0, fail=0;
function ok(c, n){ if(c){ pass++; console.log('✅ '+n); } else { fail++; console.log('❌ '+n); } }
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  const errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));

  console.log('== 1. 版本号 ==');
  const r1 = await p.evaluate(()=>({ver:GAME_VERSION, build:BUILD_CODE, fmt:SAVE_FMT}));
  ok(r1.ver==='2.0.0', 'GAME_VERSION = '+r1.ver);
  ok(r1.build===102, 'BUILD_CODE = '+r1.build);
  ok(r1.fmt===11, 'SAVE_FMT = '+r1.fmt);

  console.log('== 2. lostOpts 结构 ==');
  const r2 = await p.evaluate(()=>{
    newGame(); G.gold=200;
    const opts=lostOpts();
    return {count:opts.length, labels:opts.map(o=>o.label), disabled:opts.map(o=>!!o.disabled)};
  });
  ok(r2.count===3, '3 个选项');
  ok(r2.labels[0].includes('继续前进') && r2.labels[1].includes('丢硬币') && r2.labels[2].includes('闭眼转圈'), '选项顺序：继续前进/丢硬币/闭眼转圈');

  console.log('== 3. 金币不足 → 丢硬币禁用 ==');
  const r3 = await p.evaluate(()=>{
    newGame(); G.gold=50;
    const opts=lostOpts();
    const coin=opts[1];
    return {disabled:coin.disabled, d:coin.d};
  });
  ok(r3.disabled, '金币 50 时丢硬币选项禁用');
  ok(r3.d.includes('金币不够'), '禁用原因提示「金币不够」');

  console.log('== 4. 金币足够 → 可丢硬币 ==');
  const r4 = await p.evaluate(()=>{
    newGame(); G.gold=200;
    return {disabled:lostOpts()[1].disabled};
  });
  ok(!r4.disabled, '金币 200 时丢硬币可选');

  console.log('== 5. 丢硬币正面：-100 金币，精力不扣，随机小发现 ==');
  const r5 = await p.evaluate(()=>{
    newGame(); G.gold=200; G.stam=80;
    let calls=0;
    const orig=Math.random;
    Math.random=()=>{ calls++; return calls===1?0.1:0; }; // 1st:正面(<0.5) 2nd:finds[0]=food
    lostOpts()[1].eff(G);
    Math.random=orig;
    return {gold:G.gold, stam:G.stam, food:G.res.food, calls};
  });
  ok(r5.gold===100, '金币 200→100');
  ok(r5.stam===80, '正面精力不扣');
  ok(r5.food>=3 && r5.food<=6, '获得生食 ×'+(r5.food)+'（3~6）');

  console.log('== 6. 丢硬币反面：-100 金币，精力-10 ==');
  const r6 = await p.evaluate(()=>{
    newGame(); G.gold=200; G.stam=80;
    const orig=Math.random; Math.random=()=>0.9; // 反面(>=0.5)
    lostOpts()[1].eff(G);
    Math.random=orig;
    return {gold:G.gold, stam:G.stam};
  });
  ok(r6.gold===100, '金币 200→100');
  ok(r6.stam===70, '反面精力 80→70');

  console.log('== 7. 闭眼转圈 4 方向 ==');
  const r7 = await p.evaluate(()=>{
    const results=[];
    // 东：Math.random=0 → 精力-5 + food
    newGame(); G.stam=90; G.hp=100;
    let o=Math.random; Math.random=()=>0; lostOpts()[2].eff(G); Math.random=o;
    results.push({dir:'东', stam:G.stam, hp:G.hp, food:G.res.food});
    // 南：0.25 → 精力-5
    newGame(); G.stam=90; G.hp=100;
    o=Math.random; Math.random=()=>0.25; lostOpts()[2].eff(G); Math.random=o;
    results.push({dir:'南', stam:G.stam, hp:G.hp});
    // 西：0.5 → 精力-10 + 生命-5
    newGame(); G.stam=90; G.hp=100;
    o=Math.random; Math.random=()=>0.5; lostOpts()[2].eff(G); Math.random=o;
    results.push({dir:'西', stam:G.stam, hp:G.hp});
    // 北：0.99 → 精力-15
    newGame(); G.stam=90; G.hp=100;
    o=Math.random; Math.random=()=>0.99; lostOpts()[2].eff(G); Math.random=o;
    results.push({dir:'北', stam:G.stam, hp:G.hp});
    return results;
  });
  ok(r7[0].stam===85 && r7[0].food>=2 && r7[0].food<=4, '东：精力-5 + 生食×'+(r7[0].food||0));
  ok(r7[1].stam===85 && r7[1].hp===100, '南：仅精力-5');
  ok(r7[2].stam===80 && r7[2].hp===95, '西：精力-10 + 生命-5');
  ok(r7[3].stam===75, '北：精力-15');

  console.log('== 8. 事件实际触发弹窗（lost 走动态分支）==');
  const r8 = await p.evaluate(()=>{
    newGame(); G.gold=100;
    const raw=EXPLORE_EVENTS.find(e=>e.id==='lost');
    // 直接模拟 rollExploreEvent 的分支逻辑：showEvent({...raw, opts:lostOpts()})
    showEvent({...raw, opts:lostOpts()});
    const btns=[...document.querySelectorAll('#evwrap .evbtn')];
    return {count:btns.length, labels:btns.map(x=>x.textContent.slice(0,20))};
  });
  ok(r8.count===3, '弹窗 3 个选项');
  ok(r8.labels.some(l=>l.includes('丢硬币')) && r8.labels.some(l=>l.includes('闭眼转圈')), '包含新选项');

  ok(errors.length===0, '全程无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
  process.exit(fail>0?1:0);
})();
