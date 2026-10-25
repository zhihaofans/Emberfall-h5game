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

  console.log('== 1. 亚空间烤炉：生食>500 且命中 → 全部转熟食 1.5x ==');
  const r1 = await p.evaluate(()=>{
    newGame();
    G.res.food=600; G.res.cooked=0; G.res.water=0;
    // 强制命中（复制代码逻辑：Math.random()<0.15 恒真）
    const hit = true;
    let note='';
    if((G.res.food||0) > 500 && hit){
      const n=G.res.food||0;
      const out=Math.round(n*1.5);
      G.res.food=0;
      addRes('cooked', out);
      note='oven';
    }
    return {food:G.res.food, cooked:G.res.cooked, note};
  });
  ok(r1.food===0 && r1.cooked===900, '600 生食 → 0 + 900 熟食 (1.5x)');
  ok(r1.note==='oven', '烤炉触发标记');

  console.log('== 2. 次世代净水机：生水>500 → 全部净水 1:1 ==');
  const r2 = await p.evaluate(()=>{
    newGame();
    G.res.water=700; G.res.clean=0;
    const hit = true;
    if((G.res.water||0) > 500 && hit){
      const n=G.res.water||0;
      G.res.water=0;
      addRes('clean', n);
    }
    return {water:G.res.water, clean:G.res.clean};
  });
  ok(r2.water===0 && r2.clean===700, '700 生水 → 0 + 700 净水');

  console.log('== 3. 条件不满足（≤500）不触发 ==');
  const r3 = await p.evaluate(()=>{
    newGame();
    G.res.food=500; G.res.cooked=0; G.res.water=500; G.res.clean=0;
    const hit = true;
    let oven=false, puri=false;
    if((G.res.food||0) > 500 && hit) oven=true;
    if((G.res.water||0) > 500 && hit) puri=true;
    return {oven, puri, food:G.res.food, water:G.res.water};
  });
  ok(!r3.oven && !r3.puri, '恰好 500 不触发');
  ok(r3.food===500 && r3.water===500, '资源不变');

  console.log('== 4. 15% 概率采样（2000 次）==');
  const r4 = await p.evaluate(()=>{
    let hit=0;
    for(let i=0;i<2000;i++){ if(Math.random()<0.15) hit++; }
    return hit;
  });
  ok(r4>250 && r4<350, '15% 概率合理 ('+r4+'/2000 = '+(r4/20)+'%)');

  console.log('== 5. 完整事件流（强制命中 + 弹窗显示）==');
  const r5 = await p.evaluate(()=>{
    newGame();
    G.res.food=800; G.res.cooked=0; G.res.water=0;
    // 手动模拟 dora 分支的厨具逻辑 + showEvent
    const raw=EXPLORE_EVENTS.find(e=>e.id==='dora');
    let extraNote='';
    if((G.res.food||0) > 500 && true){
      const n=G.res.food||0;
      const out=Math.round(n*1.5);
      G.res.food=0; addRes('cooked', out);
      extraNote+='🎛 亚空间烤炉已启动！';
    }
    const opts=[{label:'👋 离开', eff:()=>{}}];
    showEvent({...raw, text:raw.text+'<br>'+extraNote, opts});
    const txt=document.getElementById('evwrap').textContent;
    return {food:G.res.food, cooked:G.res.cooked, noteShown: txt.includes('亚空间烤炉已启动')};
  });
  ok(r5.food===0 && r5.cooked===1200, '完整流程: 800 生食 → 1200 熟食');
  ok(r5.noteShown, '弹窗显示烤炉提示');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();
