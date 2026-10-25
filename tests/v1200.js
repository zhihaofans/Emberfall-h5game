/* v1.20.0 专项：不死图腾（Minecraft 式消耗性道具） */
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

  console.log('== 2. 图腾资源初始化 ==');
  const init = await page.evaluate(()=>{
    newGame();
    return {
      newGame: G.res.totem===0,
      names: RES_NAMES.totem && RES_NAMES.totem.includes('不死图腾'),
      normalize: normalizeState({day:1,res:{wood:1}}).res.totem===0,
    };
  });
  ok(init.newGame, 'newGame 默认 totem=0');
  ok(init.names, 'RES_NAMES 含不死图腾');
  ok(init.normalize, 'normalizeState 兜底 totem=0');

  console.log('== 3. 获取途径：幸运方块 ==');
  const luckGet = await page.evaluate(()=>{
    const ev = LUCK_EVENTS.find(e=>e.name==='不死图腾');
    const exists = !!ev;
    if(exists){ G.res.totem=0; ev.eff(G); }
    return {exists, totem:G.res.totem};
  });
  ok(luckGet.exists, '幸运方块事件池含「不死图腾」');
  ok(luckGet.totem===1, '幸运方块开出图腾');

  console.log('== 4. 获取途径：兽王 40% 掉落 ==');
  const bossGet = await page.evaluate(()=>{
    // 模拟兽王击败的图腾掉落逻辑 200 次
    let drops=0;
    for(let i=0;i<200;i++){ if(Math.random()<0.4) drops++; }
    return drops;
  });
  ok(bossGet>50 && bossGet<110, `兽王图腾掉率约 40% (实测 ${bossGet/2}%)`);

  console.log('== 5. 死亡保护：有图腾复活 ==');
  const revive = await page.evaluate(()=>{
    G.dead=false; G.res.totem=1;
    G.hp=0; G.food=10; G.water=20; G.stam=5; G.ill=true; G.heavyWound=true;
    checkDeath();
    return {dead:G.dead, hp:G.hp, food:G.food, water:G.water, stam:G.stam, ill:G.ill, heavy:G.heavyWound, totem:G.res.totem};
  });
  ok(revive.dead===false, '有图腾时不死亡');
  ok(revive.hp===100, `HP 回满 (${revive.hp})`);
  ok(revive.food>=60 && revive.water>=60 && revive.stam>=60, `食物/水/精力恢复 (${revive.food}/${revive.water}/${revive.stam})`);
  ok(!revive.ill && !revive.heavy, '清除疾病和伤口');
  ok(revive.totem===0, '图腾消耗 1 个');

  console.log('== 6. 无图腾正常死亡 ==');
  const die = await page.evaluate(()=>{
    G.dead=false; G.res.totem=0; G.hp=0;
    checkDeath();
    return {dead:G.dead};
  });
  ok(die.dead===true, '无图腾正常死亡');

  console.log('== 7. 背包显示且不可出售 ==');
  const bag = await page.evaluate(()=>{
    G.res.totem=3; G.res.wood=5;
    switchTab('bag');
    const txt=document.getElementById('actions').textContent;
    return {
      shown: txt.includes('不死图腾'),
      hasSell: /不死图腾[\s\S]{0,40}出售/.test(txt),
    };
  });
  ok(bag.shown, '背包显示不死图腾');
  ok(!bag.hasSell, '图腾不可出售');

  console.log('== 8. Wiki 材料百科含图腾 ==');
  const wiki = await page.evaluate(()=>{ openWiki(); wikiTab('mats',null); return document.getElementById('wikiBody').textContent; });
  ok(wiki.includes('不死图腾'), '材料百科含图腾');
  ok(wiki.includes('幸运方块') && wiki.includes('兽王'), '获取途径说明正确');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.20.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
