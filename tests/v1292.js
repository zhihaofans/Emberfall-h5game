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

  console.log('== 1. 基础配方 needLv 配置 ==');
  const r1 = await p.evaluate(()=>({
    axe:RECIPES.axe, knife:RECIPES.knife, fire:RECIPES.fire, puri:RECIPES.puri,
    rod:RECIPES.rod, trap:RECIPES.trap, bed:RECIPES.bed, kit:RECIPES.kit, iron:RECIPES.iron,
  }));
  const check = (k, lv, skill) => r1[k] && r1[k].needLv===lv && r1[k].skill===skill;
  ok(check('fire',1,'explore') && check('knife',1,'hunt') && check('rod',1,'fish'), '火堆/石刀/鱼竿 Lv.1（避免死锁）');
  ok(check('axe',3,'chop') && check('puri',3,'mine') && check('trap',3,'hunt') && check('kit',3,'explore'), '石斧/净水器/捕兽夹/药箱 Lv.3');
  ok(check('bed',5,'explore') && check('iron',5,'mine'), '床铺/铁刀 Lv.5');

  console.log('== 2. needLv 门控生效 ==');
  const r2 = await p.evaluate(()=>{
    newGame();
    G.skills.chop.lvl=2; // 不到 3
    G.res.stone=100; G.res.wood=100;
    const bAxe=doCraft('axe');
    G.skills.chop.lvl=5;
    G.res.stone=100; G.res.wood=100;
    const aAxe=doCraft('axe');
    return {before:bAxe, after:aAxe, has:G.items.axe};
  });
  ok(!r2.before && r2.has, 'Lv.2 砍伐不能做石斧 → 升 Lv.5 后成功');
  ok(r2.after!==false, '升级后成功制作');

  console.log('== 3. 材料成本提升 ==');
  const r3 = await p.evaluate(()=>({
    axe:RECIPES.axe.cost, iron:RECIPES.iron.cost, bed:RECIPES.bed.cost,
  }));
  ok(r3.axe.wood===5 && r3.axe.stone===8, '石斧: wood 5 stone 8');
  ok(r3.iron.metal===10, '铁刀: metal 10');
  ok(r3.bed.wood===15 && r3.bed.leather===6, '床铺: wood 15 leather 6');

  console.log('== 4. 砍柴产出 -15% ==');
  const r4 = await p.evaluate(()=>{
    newGame();
    G.items.axe=true;
    G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false; G.hp=100; G.skills.chop.lvl=1;
    let total=0;
    for(let i=0;i<100;i++){
      G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false; G.hp=100;
      const b=G.res.wood||0;
      doAction('chop');
      total += (G.res.wood||0)-b;
    }
    return {total, avg:(total/100).toFixed(1)};
  });
  ok(r4.avg>5 && r4.avg<12, '100 次砍柴(ax 路径)平均 '+r4.avg+' 木（基础 5-9×技能加成，预期 7-11）');

  console.log('== 5. 模拟第 10 天做基础配方进度 ==');
  const r5 = await p.evaluate(()=>{
    newGame();
    // 模拟 10 天动作：每天 8-10 次行动（混合砍柴/采石/狩猎/探索）
    G.day=1; G.stam=100; G.food=100; G.water=100; G.hp=100; G.dead=false; G.hour=8;
    for(let day=1;day<=10;day++){
      G.day=day; G.hour=8; G.food=100; G.water=100; G.hp=100; G.stam=100; G.dead=false;
      for(let i=0;i<10;i++){
        G.stam=100;
        const r=Math.random();
        if(r<0.4) doAction('chop');
        else if(r<0.7) doAction('mineOre');
        else if(r<0.85) doAction('hunt');
        else doAction('explore');
      }
      nextDay();
    }
    return {
      chopLv: G.skills.chop.lvl, mineLv: G.skills.mine.lvl, huntLv: G.skills.hunt.lvl, exploreLv: G.skills.explore.lvl,
      wood: G.res.wood, stone: G.res.stone, metal: G.res.metal, leather: G.res.leather, herb: G.res.herb,
    };
  });
  console.log('Lv:', JSON.stringify(r5));
  ok(r5.chopLv<7 && r5.mineLv<7, '10 天后技能 <Lv.7（不会太快达到床铺/铁刀门槛）');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();
