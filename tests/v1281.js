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

  console.log('== 1. autoLv 配置 ==');
  const r1 = await p.evaluate(()=>({
    chop:ACTIONS.chop.autoLv, fetch:ACTIONS.fetch.autoLv,
    hunt:ACTIONS.hunt.autoLv, fish:ACTIONS.fish.autoLv, mine:ACTIONS.mineOre.autoLv, cook:ACTIONS.cook.autoLv, boil:ACTIONS.boil.autoLv,
    smelt:ACTIONS.smelt.autoLv, smeltOre:ACTIONS.smeltOre.autoLv,
  }));
  ok(r1.chop===3 && r1.fetch===3, '砍柴/取水 3 级 ('+r1.chop+'/'+r1.fetch+')');
  ok(r1.hunt===5 && r1.fish===5 && r1.mine===5 && r1.cook===5 && r1.boil===5, '狩猎/捕鱼/采矿/烹饪/烧水 5 级');
  ok(r1.smelt===8 && r1.smeltOre===8, '熔炼/炼锭 8 级');

  console.log('== 2. 未达标点击只执行一次（不进入自动循环）==');
  const r2 = await p.evaluate(()=>{
    newGame();
    G.skills.chop.lvl=1; // 未达 3
    G.res.wood=0;
    onActionBtn('chop');
    return {auto:G.autoAction, wood:G.res.wood, ran:true};
  });
  ok(r2.ran, '点击执行');
  ok(r2.auto===null, '未进入自动循环 (autoAction='+r2.auto+')');
  ok(r2.wood>0, '手动执行产出木材 ('+r2.wood+')');

  console.log('== 3. 达标后点击进入自动循环 ==');
  const r3 = await p.evaluate(()=>{
    newGame();
    G.skills.chop.lvl=5; // 达标
    onActionBtn('chop');
    const entered=G.autoAction==='chop';
    stopAuto();
    return {entered};
  });
  ok(r3.entered, '砍柴 5 级点击进入自动循环');

  console.log('== 4. 熔炼 8 级门槛 ==');
  const r4 = await p.evaluate(()=>{
    newGame();
    G.skills.mine.lvl=7;
    G.items.iron=true; G.items.forge=true; G.res.metal=10; G.res.stone=20;
    onActionBtn('smelt');
    const locked=G.autoAction!=='smelt';
    stopAuto();
    G.skills.mine.lvl=9;
    onActionBtn('smelt');
    const unlocked=G.autoAction==='smelt';
    stopAuto();
    return {locked, unlocked};
  });
  ok(r4.locked, '采掘 7 级熔炼不自动');
  ok(r4.unlocked, '采掘 9 级熔炼自动');

  console.log('== 5. 按钮副标显示 🔒 提示 ==');
  const r5 = await p.evaluate(()=>{
    newGame();
    G.skills.chop.lvl=1;
    switchTab('act');
    const btn=Array.from(document.querySelectorAll('#actions .actbtn')).find(b=>b.textContent.includes('砍柴'));
    return {txt: btn?btn.textContent:''};
  });
  ok(r5.txt.includes('🔒') && r5.txt.includes('解锁自动'), '砍柴按钮显示 🔒 Lv.3 解锁自动');

  console.log('== 6. 达标后副标恢复正常 ==');
  const r6 = await p.evaluate(()=>{
    newGame();
    G.skills.chop.lvl=5;
    switchTab('act');
    const btn=Array.from(document.querySelectorAll('#actions .actbtn')).find(b=>b.textContent.includes('砍柴'));
    return {txt: btn?btn.textContent:''};
  });
  ok(!r6.txt.includes('🔒'), '达标后无 🔒 提示');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();
