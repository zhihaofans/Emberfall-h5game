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

  console.log('== 1. 石刀 needLv=1（可开局制作）==');
  const r1 = await p.evaluate(()=>{
    newGame();
    G.skills.hunt.lvl=1;
    G.res.stone=10; G.res.wood=10;
    doCraft('knife');
    return {made:!!G.items.knife, needLv:RECIPES.knife.needLv};
  });
  ok(r1.needLv===1, '石刀 needLv=1');
  ok(r1.made, '狩猎 1 级成功制作石刀');

  console.log('== 2. 石刀后可狩猎 ==');
  const r2 = await p.evaluate(()=>{
    newGame();
    G.items.knife=true;
    G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false; G.hp=100;
    const bFood=G.res.food||0;
    doAction('hunt');
    return {auto:true, food:(G.res.food||0)-bFood, xp:G.skills.hunt.xp>0};
  });
  ok(r2.food>=0 && r2.xp, '石刀狩猎正常执行');

  console.log('== 3. 鱼竿 needLv=1（可开局制作）==');
  const r3 = await p.evaluate(()=>{
    newGame();
    G.skills.fish.lvl=1;
    G.res.wood=20; G.res.metal=5;
    doCraft('rod');
    return {made:!!G.items.rod, needLv:RECIPES.rod.needLv};
  });
  ok(r3.needLv===1, '鱼竿 needLv=1');
  ok(r3.made, '渔猎 1 级成功制作鱼竿');

  console.log('== 4. 无死锁回归：全链路模拟 20 天 ==');
  const r4 = await p.evaluate(()=>{
    newGame();
    G.day=1; G.hour=8; G.stam=100; G.food=100; G.water=100; G.hp=100; G.dead=false;
    let days=0;
    while(days<20){
      days++;
      G.hour=8; G.stam=100; G.food=100; G.water=100; G.hp=100; G.dead=false;
      // 每天 14 次行动：先凑材料做基础武器，再做对应技能；定期探索废墟拿金属
      for(let i=0;i<14;i++){
        G.stam=100;
        if(!G.items.knife || !G.items.rod){
          // 先凑石刀材料（stone≥6 + wood≥4 → 直接制作）
          if(!G.items.knife && G.res.stone>=6 && G.res.wood>=4){ doCraft('knife'); }
          else if(!G.items.rod && G.res.wood>=10 && G.res.metal>=3){ doCraft('rod'); }
          else if(!G.items.knife && G.res.stone<6) doAction('mineOre');
          else if(!G.items.knife && G.res.wood<4) doAction('chop');
          else if(!G.items.rod && G.res.metal<3){ curZone='ruins'; doAction('explore'); curZone='forest'; } // 探索废墟拿金属
          else if(!G.items.rod && G.res.wood<10) doAction('chop');
          else if(!G.items.knife) doAction('mineOre');
          else if(!G.items.rod) doAction('chop');
          else doAction('chop');
        } else {
          const r=Math.random();
          if(r<0.45) doAction('hunt');
          else if(r<0.8) doAction('fish');
          else if(r<0.9) doAction('chop');
          else doAction('mineOre');
        }
      }
    }
    return {
      knife:!!G.items.knife, rod:!!G.items.rod,
      huntLv:G.skills.hunt.lvl, fishLv:G.skills.fish.lvl,
    };
  });
  ok(r4.knife && r4.rod, '20 天内做出石刀+鱼竿 ('+(r4.knife?'刀':'无')+','+(r4.rod?'竿':'无')+')');
  ok(r4.huntLv>=3, '狩猎练到 3 级+ ('+r4.huntLv+')');
  ok(r4.fishLv>=3, '渔猎练到 3 级+ ('+r4.fishLv+')');

  console.log('== 5. 无死锁：狩猎 3 级可做捕兽夹 ==');
  const r5 = await p.evaluate(()=>{
    newGame();
    G.skills.hunt.lvl=3;
    G.res.metal=6; G.res.wood=6;
    doCraft('trap');
    return {made:!!G.items.trap};
  });
  ok(r5.made, '狩猎 3 级做捕兽夹');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();
