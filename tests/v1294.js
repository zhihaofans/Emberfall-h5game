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

  console.log('== 1. 烹饪无生食：不扣精力不推时间 ==');
  const r1 = await p.evaluate(()=>{
    newGame();
    G.items.fire=true; G.res.food=0; G.res.wood=10;
    G.stam=50; G.hour=8; G.day=1;
    doAction('cook');
    return {stam:G.stam, hour:G.hour, day:G.day};
  });
  ok(r1.stam===50, '精力不变 ('+r1.stam+')');
  ok(r1.hour===8 && r1.day===1, '时间不变 ('+r1.hour+'时 第'+r1.day+'天)');

  console.log('== 2. 烧水无生水：不扣精力 ==');
  const r2 = await p.evaluate(()=>{
    newGame();
    G.items.fire=true; G.res.water=0; G.res.wood=10;
    G.stam=50; G.hour=8;
    doAction('boil');
    return {stam:G.stam, hour:G.hour};
  });
  ok(r2.stam===50 && r2.hour===8, '精力/时间不变');

  console.log('== 3. 熔炼无金属：不扣精力 ==');
  const r3 = await p.evaluate(()=>{
    newGame();
    G.items.forge=true; G.res.metal=0; G.res.stone=20;
    G.stam=50; G.hour=8;
    doAction('smelt');
    return {stam:G.stam};
  });
  ok(r3.stam===50, '精力不变 ('+r3.stam+')');

  console.log('== 4. 熔炼石头不够：不扣精力 ==');
  const r4 = await p.evaluate(()=>{
    newGame();
    G.items.forge=true; G.res.metal=5; G.res.stone=1;
    G.stam=50; G.hour=8;
    doAction('smelt');
    return {stam:G.stam, metal:G.res.metal, stone:G.res.stone};
  });
  ok(r4.stam===50 && r4.metal===5 && r4.stone===1, '精力/材料不变');

  console.log('== 5. 炼锭无矿石：不扣精力 ==');
  const r5 = await p.evaluate(()=>{
    newGame();
    G.items.forge=true;
    G.res.goldOre=0; G.res.silverOre=0; G.res.copperOre=0;
    G.stam=50; G.hour=8;
    doAction('smeltOre');
    return {stam:G.stam};
  });
  ok(r5.stam===50, '精力不变 ('+r5.stam+')');

  console.log('== 6. 治疗满血/无草药：不扣精力 ==');
  const r6 = await p.evaluate(()=>{
    newGame();
    G.hp=100; G.res.herb=5; G.stam=50;
    doAction('heal');
    const s1=G.stam;
    G.hp=50; G.res.herb=0; G.stam=50;
    doAction('heal');
    return {fullHp:s1, noHerb:G.stam};
  });
  ok(r6.fullHp===50, '满血治疗不扣精力 ('+r6.fullHp+')');
  ok(r6.noHerb===50, '无草药治疗不扣精力 ('+r6.noHerb+')');

  console.log('== 7. 有材料时正常执行 ==');
  const r7 = await p.evaluate(()=>{
    newGame();
    G.items.fire=true; G.res.food=10; G.res.wood=10;
    G.stam=50; G.hour=8;
    const bFood=G.res.food, bCooked=G.res.cooked||0;
    doAction('cook');
    return {stam:G.stam, cooked:(G.res.cooked||0)-bCooked};
  });
  ok(r7.stam<50 && r7.cooked>0, '有生食正常烹饪（扣精力+产出）');

  console.log('== 8. 自动循环空材料自动停止 ==');
  const r8 = await p.evaluate(()=>{
    newGame();
    G.items.fire=true; G.res.food=0; G.res.wood=10;
    G.autoAction='cook';
    doAction('cook');
    return {auto:G.autoAction};
  });
  ok(r8.auto===null, 'autoAction 停止');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();
