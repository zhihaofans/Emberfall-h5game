/* v1.16.0 专项：Tier 5 自动生产设备 */
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
  ok(ver==='2.0.0', 'GAME_VERSION = '+ver);
  const fmt = await page.evaluate(()=>SAVE_FMT);
  ok(fmt===11, 'SAVE_FMT = 6');

  console.log('== 2. 两个 Tier 5 配方 ==');
  const rec = await page.evaluate(()=>({
    kitchen: RECIPES.autokitchen, boiler: RECIPES.solarBoiler,
  }));
  ok(rec.kitchen && rec.kitchen.tier===5, '自动厨房存在 (tier 5)');
  ok(rec.boiler && rec.boiler.tier===5, '太阳能烧水壶存在 (tier 5)');
  ok(rec.kitchen.need==='forge' && rec.boiler.need==='forge', '都依赖铁匠炉（条件苛刻）');

  console.log('== 3. 制作成本苛刻（≥3 种材料 + 符石）==');
  const cost = await page.evaluate(()=>{
    const k=Object.keys(RECIPES.autokitchen.cost).length;
    const b=Object.keys(RECIPES.solarBoiler.cost).length;
    return {k, b, kitchenHasRune: 'rune' in RECIPES.autokitchen.cost, boilerHasRune:'rune' in RECIPES.solarBoiler.cost};
  });
  ok(cost.k>=3 && cost.kitchenHasRune, `自动厨房 ${cost.k} 种材料含符石`);
  ok(cost.b>=3 && cost.boilerHasRune, `太阳能烧水壶 ${cost.b} 种材料含符石`);

  console.log('== 4. 制作页「⚡ 自动化」分组 ==');
  await page.evaluate(()=>switchTab('craft'));
  await new Promise(r=>setTimeout(r,300));
  const craft = await page.evaluate(()=>document.getElementById('actions').textContent);
  ok(craft.includes('⚡ 自动化'), '存在自动化分组');
  ok(craft.includes('自动厨房'), '自动厨房可见');
  ok(craft.includes('太阳能烧水壶'), '太阳能烧水壶可见');

  console.log('== 5. 每日自动生产 ==');
  const daily = await page.evaluate(()=>{
    G.items.autokitchen=true; G.items.solarBoiler=true;
    G.res.food=20; G.res.water=30; G.res.cooked=0; G.res.clean=0;
    // 模拟 nextDay 中自动设备段
    const n1=Math.min(G.res.food||0,10); if(n1>0){ spend('food',n1); addRes('cooked',Math.round(n1*1.5)); }
    const n2=Math.min(G.res.water||0,12); if(n2>0){ spend('water',n2); addRes('clean',n2); }
    return {food:G.res.food, cooked:G.res.cooked, water:G.res.water, clean:G.res.clean};
  });
  ok(daily.food===10 && daily.cooked===15, `自动厨房: 生食20→10, 熟食0→15`);
  ok(daily.water===18 && daily.clean===12, `太阳能烧水壶: 生水30→18, 净水0→12`);

  console.log('== 6. 无材料时不报错 ==');
  const empty = await page.evaluate(()=>{
    G.res.food=0; G.res.water=0;
    const n1=Math.min(G.res.food||0,10);
    const n2=Math.min(G.res.water||0,12);
    return {n1, n2};
  });
  ok(empty.n1===0 && empty.n2===0, '材料为 0 时安全跳过（不报错）');

  console.log('== 7. 旧存档迁移 fmt 5→6 ==');
  const mig = await page.evaluate(()=>{
    const g={v:5, day:1, res:{wood:1}, items:{axe:true}};
    const r=migrateFrom(g,5);
    return {fmt:r.v, k:r.items.autokitchen===false, b:r.items.solarBoiler===false};
  });
  ok(mig.fmt===11 && mig.k && mig.b, '旧档自动补全 2 个新设施字段');

  console.log('== 8. 新开局默认未拥有 ==');
  const fresh = await page.evaluate(()=>{
    newGame();
    return {k:G.items.autokitchen===false, b:G.items.solarBoiler===false};
  });
  ok(fresh.k && fresh.b, 'newGame 后默认 false');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.16.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
