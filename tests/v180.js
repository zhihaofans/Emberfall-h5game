/* v1.8.0 专项：幸运方块 / 双击放大保护 / 旧档保护 */
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

  console.log('== 1. 幸运方块资源与物品 ==');
  const r1 = await page.evaluate(()=>{
    return {
      name: RES_NAMES.luck,
      events: typeof LUCK_EVENTS==='object' && LUCK_EVENTS.length,
      shop: !!SHOP.luck,
    };
  });
  ok(r1.name.includes('幸运方块'), `资源名: ${r1.name}`);
  ok(r1.events>=15, `事件池 ${r1.events} 个`);
  ok(r1.shop, '黑市可购买');

  console.log('== 2. 使用幸运方块（加权随机）==');
  const r2 = await page.evaluate(()=>{
    G.res.wood=20; G.res.metal=10; G.res.leather=5; G.hp=80;
    G.res.luck=5;
    const beforeGold=G.gold, beforeWood=G.res.wood, beforeMetal=G.res.metal;
    // 反复开启，验证产出/消耗逻辑
    for(let i=0;i<4;i++) useLuck();
    return {
      luck:G.res.luck,
      totalGold:G.gold-beforeGold,
      totalWood:G.res.wood-beforeWood,
      totalMetal:G.res.metal-beforeMetal,
      log:logBuffer.slice(-10).map(l=>l.m).join('|')
    };
  });
  ok(r2.luck===1, `消耗 4 个（剩 ${r2.luck}）`);
  ok(r2.log.includes('开启幸运方块'), '日志提示开启');

  console.log('== 3. 坏事件能伤害玩家 ==');
  const r3 = await page.evaluate(()=>{
    G.hp=100; G.ill=false;
    // 反复开到坏事件
    let tried=0, hurt=false;
    while(tried<30 && !hurt){
      G.res.luck=1; G.hp=100;
      const hpBefore=G.hp;
      useLuck();
      if(G.hp<hpBefore){ hurt=true; break; }
      tried++;
    }
    return {tried, hurt};
  });
  ok(r3.hurt, `坏事件生效（${r3.tried} 次内受伤）`);

  console.log('== 4. 背包页"使用"按钮 ==');
  await page.evaluate(()=>{ G.res.luck=3; switchTab('bag'); });
  await new Promise(r=>setTimeout(r,300));
  const r4 = await page.evaluate(()=>{
    const btns=[...document.querySelectorAll('#actions .bagrow .sell')];
    const luckRow=btns.find(b=>b.parentElement.textContent.includes('幸运方块'));
    return {hasLuckRow:!!luckRow, btnText:luckRow?luckRow.textContent:''};
  });
  ok(r4.hasLuckRow && r4.btnText.includes('使用'), '背包页有"使用"按钮');

  console.log('== 5. 双击放大保护（touch-action: manipulation）==');
  const r5 = await page.evaluate(()=>{
    // 检查全局 CSS 是否包含 touch-action: manipulation
    const sheets=[...document.styleSheets];
    let found=false;
    try{
      for(const sh of sheets){
        for(const r of sh.cssRules){
          if(r.cssText && r.cssText.includes('touch-action') && r.cssText.includes('manipulation')){
            found=true; break;
          }
        }
        if(found) break;
      }
    }catch(e){}
    return {found};
  });
  ok(r5.found, 'CSS 含 touch-action: manipulation（禁止双击缩放）');

  console.log('== 6. 旧档保护（导入存档跳过离线结算）==');
  const r6 = await page.evaluate(()=>{
    // 模拟：构造一个 30 天前保存的旧存档（食物充足）
    const oldG={v:4, day:40, hour:18, season:2, weather:0,
      hp:80, food:80, water:80, stam:80, ill:false, lightWound:false, heavyWound:false,
      res:{wood:50, stone:30, food:5, cooked:5, water:3, clean:10, herb:5, metal:10, leather:5, alloy:2, luck:1},
      items:{axe:true, knife:true, fire:true, puri:true, rod:true, trap:true, bed:true, kit:true, iron:true, ironAxe:true, steel:true, farm:true, tower:true, forge:true, huntKing:true},
      stats:{explore:50, hunt:10, craft:20, kills:3, cook:5, days:40, events:20},
      skills:{chop:{lvl:10,xp:5}, mine:{lvl:8,xp:0}, hunt:{lvl:5,xp:0}, fish:{lvl:3,xp:0}, explore:{lvl:7,xp:0}, cook:{lvl:4,xp:0}, combat:{lvl:3,xp:0}},
      upgrades:{weapon:2, axe:3, rod:1, trap:0},
      gold:200, lastSeen:Date.now()-1000, autoAction:null, offToday:{fire:false,puri:false,trap:false},
      milestones:{d3:1,d7:1,d15:1,d30:1,craft1:1,kill1:1}, dead:false, deathReason:'', v:4};
    const code='EMBER:'+btoa(unescape(encodeURIComponent(JSON.stringify({tag:'EMBER', fmt:4, ver:'1.8.0', g:oldG}))));
    openImport();
    document.getElementById('importArea').value=code;
    doImport();
    const ls=localStorage.getItem('ember_save_v1');
    const stored=JSON.parse(ls);
    return {
      day:G.day, food:G.food, water:G.water,
      hasImportedFlag: !!stored._imported,
      luck:G.res.luck
    };
  });
  // 导入后 _imported 标记存在
  await new Promise(r=>setTimeout(r,200));
  const r6b = await page.evaluate(()=>{
    const ls=localStorage.getItem('ember_save_v1');
    return !!JSON.parse(ls)._imported;
  });
  ok(r6b, '导入存档写入 _imported=1 标记');
  // 接下来模拟"刷新页面" → loadSave 检测标记，跳过 settleOffline
  const r6c = await page.evaluate(()=>{
    const before={day:G.day, food:G.food, water:G.water};
    // 修改 lastSeen 为 30 天前模拟长时间
    G.lastSeen=Date.now() - 30*24*3600000;
    localStorage.setItem('ember_save_v1', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('ember_save_v1')), {g:Object.assign({},JSON.parse(localStorage.getItem('ember_save_v1')).g,{lastSeen:G.lastSeen})})));
    loadSave();
    return {day:G.day, food:G.food, water:G.water};
  });
  ok(r6c.day===40, `刷新后 day 不变 (${r6c.day})`);
  // 食物不会因为 30 天离线被扣成 0（之前 food=80，settleOffline 会扣 h*2=60 → 剩 20；现在跳过 → 保持原样）
  ok(r6c.food>50, `旧档食物未被大量扣除 (剩${r6c.food})`);
  // 验证 loadSave 后 _imported 标记已被清掉
  await new Promise(r=>setTimeout(r,200));
  const r6d = await page.evaluate(()=>{
    return !!JSON.parse(localStorage.getItem('ember_save_v1'))._imported;
  });
  ok(!r6d, 'loadSave 后 _imported 标记已清除');

  console.log('== 7. 版本号 ==');
  const ver=await page.evaluate(()=>GAME_VERSION);
  ok(ver==='1.10.0', 'GAME_VERSION = '+ver);

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.8.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
