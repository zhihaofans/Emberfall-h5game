/* v1.14.0 专项：钓鱼成就 / 治疗满血判定 / 行动页库存显示 */
const puppeteer = require('puppeteer-core');
const URL = require('./_env').URL;

(async ()=>{
  const browser = await puppeteer.launch({
    executablePath:require('./_env').CHROMIUM,
    headless:'new', args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']
  });
  const page = await browser.newPage();
  await page.setViewport({width:390,height:844});
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto(URL, {waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,400));

  let pass=0, fail=0;
  const ok=(c,m)=>{ if(c){pass++;console.log('  ✅',m)} else {fail++;console.log('  ❌',m)} };

  console.log('== 1. 版本号 ==');
  const ver = await page.evaluate(()=>GAME_VERSION);
  ok(ver==='1.25.0', 'GAME_VERSION = '+ver);

  console.log('== 2. 治疗满血判定 ==');
  const healFull = await page.evaluate(()=>{
    G.hp=100; G.res.herb=5;
    doAction('heal');
    return {hp:G.hp, herb:G.res.herb};
  });
  ok(healFull.hp===100 && healFull.herb===5, `满血治疗不耗草药: HP=${healFull.hp}, 草药=${healFull.herb}`);

  const healLow = await page.evaluate(()=>{
    G.hp=50; G.res.herb=5;
    doAction('heal');
    return {hp:G.hp, herb:G.res.herb};
  });
  ok(healLow.hp>50 && healLow.herb<5, `非满血治疗正常: HP ${50}→${healLow.hp}, 草药 5→${healLow.herb}`);

  console.log('== 3. 行动页库存显示 ==');
  const stock = await page.evaluate(()=>{
    G.res.food=15; G.res.water=20; G.res.herb=7;
    renderActions();
    const txt=document.getElementById('actions').textContent;
    return {
      cook: txt.includes('🍖15'),
      boil: txt.includes('💧20'),
      heal: txt.includes('🌿7'),
    };
  });
  ok(stock.cook, '烹饪按钮显示 🍖15');
  ok(stock.boil, '烧水按钮显示 💧20');
  ok(stock.heal, '治疗按钮显示 🌿7');

  console.log('== 4. 钓鱼成就（钓到 15 条鱼）==');
  const fishAch = await page.evaluate(()=>{
    G.items.rod=true; G.skills.fish.lvl=1;
    G.stats.fish=0; G.stats.fishTreas=0;
    let n=0;
    while(n<300 && (G.stats.fish||0)<15){
      G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false; G.hp=100;
      doAction('fish');
      n++;
    }
    return {
      fishCount: G.stats.fish,
      fish1: !!G.milestones.fish1,
      fish10: !!G.milestones.fish10,
      fish50: !!G.milestones.fish50,
    };
  });
  ok(fishAch.fishCount>=15, `钓到鱼 ${fishAch.fishCount} 条`);
  ok(fishAch.fish1, '成就「首次钓到鱼」触发');
  ok(fishAch.fish10, '成就「钓鱼 10 次」触发');
  ok(!fishAch.fish50, '「钓鱼 50 次」未提前触发');

  console.log('== 5. 钓鱼成就（100 条鱼）==');
  const fish100 = await page.evaluate(()=>{
    G.stats.fish=99;
    let n=0;
    while(n<800 && (G.stats.fish||0)<100){
      G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false; G.hp=100;
      doAction('fish');
      n++;
    }
    return {fishCount:G.stats.fish, fish100:!!G.milestones.fish100};
  });
  ok(fish100.fish100, `成就「钓鱼 100 次」触发 (count=${fish100.fishCount})`);

  console.log('== 6. 宝藏/符石/图纸成就 ==');
  const treas = await page.evaluate(()=>{
    // 静默 log 加速循环（log 每轮操作 DOM，很慢）
    const origLog = log;
    log = ()=>{};
    G.items.rod=true; G.skills.fish.lvl=50;
    G.stats.fishTreas=0; G.stats.fishBig=0;
    for(let i=0;i<500;i++){
      G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false; G.hp=100;
      doAction('fish');
    }
    log = origLog;
    return {
      treas: G.stats.fishTreas,
      big: G.stats.fishBig,
      fishTreas: !!G.milestones.fishTreas,
      fishRune: !!G.milestones.fishRune,
      fishBlueprint: !!G.milestones.fishBlueprint,
      fishBig: !!G.milestones.fishBig,
    };
  });
  ok(treas.treas>0, `钓到宝藏 ${treas.treas} 次`);
  ok(treas.fishTreas, '成就「钓到第一件宝藏」触发');
  ok(treas.fishBig, `成就「钓到罕见大鱼」触发 (${treas.big} 次大鱼)`);

  console.log('== 7. 进度总览含钓鱼成就 ==');
  const prog = await page.evaluate(()=>{
    openProgress();
    return document.getElementById('modalcard').textContent;
  });
  ok(prog.includes('首次钓到鱼'), '进度页含「首次钓到鱼」');
  ok(prog.includes('钓到宝藏'), '进度页含「钓到宝藏」');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.14.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
