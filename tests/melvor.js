/* Melvor 式新功能专项测试：放置 / 技能 / 离线收益 / 商店 */
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
  const ok=(cond,msg)=>{ if(cond){pass++;console.log('  ✅',msg||'true')} else {fail++;console.log('  ❌',msg||'false')} };
  const bad=(n,x)=>{fail++;console.log('  ❌',n,x||'')};

  console.log('== 1. 放置系统 ==');
  // 启动砍柴放置
  await page.evaluate(()=>{ startAuto('chop'); });
  const started = await page.evaluate(()=>G.autoAction==='chop');
  ok(started, 'startAuto 启动砍柴');
  const wood0 = await page.evaluate(()=>G.res.wood);
  ok(wood0>4, '启动即执行一次 (木材'+wood0+')');
  // 等 3.5 秒（2 个 tick）
  await new Promise(r=>setTimeout(r,3500));
  const wood1 = await page.evaluate(()=>G.res.wood);
  ok(wood1>wood0, `自动循环产出 (${wood0}→${wood1})`);
  const activeBar = await page.evaluate(()=>{
    const b=document.getElementById('activebar');
    return b.style.display!=='none' && document.getElementById('activeName').textContent.includes('砍柴');
  });
  ok(activeBar, '顶部横幅显示进行中');
  // 停止
  await page.evaluate(()=>stopAuto());
  const stopped = await page.evaluate(()=>G.autoAction===null);
  ok(stopped, 'stopAuto 停止');
  const wood2 = await page.evaluate(()=>G.res.wood);
  await new Promise(r=>setTimeout(r,1800));
  const wood3 = await page.evaluate(()=>G.res.wood);
  ok(wood2===wood3, '停止后不再产出');

  console.log('== 2. 技能系统 ==');
  // 连续砍柴获得 XP（用累计经验：lvl*100 + xp，避免升级时扣减导致 xp 看似减少）
  const before = await page.evaluate(()=>({lvl:G.skills.chop.lvl, xp:G.skills.chop.xp, total:G.skills.chop.lvl*100+G.skills.chop.xp}));
  for(let i=0;i<3;i++) await page.evaluate(()=>doAction('chop'));
  const after = await page.evaluate(()=>({lvl:G.skills.chop.lvl, xp:G.skills.chop.xp, total:G.skills.chop.lvl*100+G.skills.chop.xp}));
  ok(after.total>before.total, `砍柴获得累计经验 (Lv.${before.lvl}+${before.xp}→Lv.${after.lvl}+${after.xp})`);
  // 强制升级
  const lvlUp = await page.evaluate(()=>{
    G.skills.chop.xp = xpNeed(1)*3; // 足够升 2 级
    const before=G.skills.chop.lvl;
    addXp('chop', 5);
    return {before, after:G.skills.chop.lvl};
  });
  ok(lvlUp.after>lvlUp.before, `技能升级 (Lv.${lvlUp.before}→Lv.${lvlUp.after})`);
  // 等级加成生效：对比 Lv.1 与 Lv.10 的砍柴平均产量
  const bonus = await page.evaluate(()=>{
    const avg=(lv)=>{
      G.skills.chop.lvl=lv; G.skills.chop.xp=0;
      G.hour=8; G.food=100; G.water=100; G.stam=100;
      let sum=0; const base=G.res.wood;
      for(let i=0;i<15;i++){ const w=G.res.wood; doAction('chop'); sum+=G.res.wood-w; }
      return sum/15;
    };
    const low=avg(1), high=avg(10);
    return {low:Math.round(low), high:Math.round(high)};
  });
  ok(bonus.high > bonus.low, `等级加成生效：Lv.1 均产 ${bonus.low} → Lv.10 均产 ${bonus.high}`);
  // 技能页弹窗
  await page.evaluate(()=>openSkills());
  await new Promise(r=>setTimeout(r,200));
  const skillTxt = await page.evaluate(()=>document.getElementById('modalcard').textContent);
  ok(/砍伐|战斗/.test(skillTxt), '技能一览页渲染');
  await page.evaluate(()=>closeModal());

  console.log('== 3. 即时进食/饮水 ==');
  await page.evaluate(()=>{ G.res.cooked=5; G.food=20; doAction('eat'); });
  const foodAfter = await page.evaluate(()=>G.food);
  ok(foodAfter>20, `进食回饱食 (20→${foodAfter})`);
  await page.evaluate(()=>{ G.res.clean=5; G.water=20; doAction('drink'); });
  const waterAfter = await page.evaluate(()=>G.water);
  ok(waterAfter>20, `饮水回水分 (20→${waterAfter})`);

  console.log('== 4. 金币 & 商店 ==');
  await page.evaluate(()=>{ G.res.wood=10; askSell('wood'); document.getElementById('sellNum').value=2; confirmSell(); });
  const gold = await page.evaluate(()=>G.gold);
  ok(gold===2, `出售木材 2 个得 2 金币 (实际${gold})`);
  await page.evaluate(()=>{ G.gold=12; buyItem('herb'); });
  const herb = await page.evaluate(()=>G.res.herb);
  ok(herb>=3, `黑市购买草药 (草药${herb})`);
  const gold2 = await page.evaluate(()=>G.gold);
  ok(gold2===0, `金币扣减 (剩${gold2})`);
  // 金币不足提示不报错
  await page.evaluate(()=>buyItem('leather'));
  ok(true, '金币不足时安全返回');
  // 背包页出售按钮渲染（v1.28.0：未获取过的资源隐藏，先标记获取过常见资源）
  await page.evaluate(()=>{
    // 模拟获取过全部可卖资源（否则新过滤逻辑会隐藏 0 数量物品）
    ['wood','stone','food','cooked','water','clean','herb','metal','leather','alloy','copperOre','silverOre','goldOre','copper','silver','gold'].forEach(k=>{
      if(!G.stats.ownedRes) G.stats.ownedRes={};
      G.stats.ownedRes[k]=1;
    });
    G.res.wood=10; G.res.stone=10; G.res.food=10; G.res.metal=10; G.res.leather=10; G.res.alloy=5;
    switchTab('bag');
  });
  await new Promise(r=>setTimeout(r,200));
  const sellBtns = await page.evaluate(()=>document.querySelectorAll('.bagrow .sell').length);
  ok(sellBtns>=7, `背包页有 ${sellBtns} 个出售按钮`);

  console.log('== 5. 离线收益结算 ==');
  const offline = await page.evaluate(()=>{
    G.items.trap=true; G.items.axe=true;
    G.stam=0; G.hp=50;
    const woodB=G.res.wood;
    const foodB=G.res.food;
    settleOffline(6*3600000); // 6小时
    return {woodGain:G.res.wood-woodB, foodGain:G.res.food-foodB, hp:G.hp, stam:G.stam};
  });
  ok(offline.woodGain>=6, `离线6小时获木材 ${offline.woodGain}`);
  ok(offline.foodGain>=6, `离线6小时捕兽夹产食物 ${offline.foodGain}`);
  ok(offline.stam>=80, `离线恢复精力 (${offline.stam})`);
  ok(offline.hp>0, '离线不致死');

  console.log('== 6. 存档迁移 fmt1→2 ==');
  // 构造 v1.1.0 存档（无 skills/gold/lastSeen）
  const oldG = {v:1, day:6, hour:10, season:0, weather:0,
    hp:70, food:50, water:60, stam:90,
    ill:false, lightWound:false, heavyWound:false,
    res:{wood:30, stone:10, food:5, cooked:0, water:0, clean:3, herb:2, metal:1, leather:0},
    items:{axe:true, knife:false, fire:true, puri:false, rod:false, trap:false, bed:false, kit:false, iron:false},
    stats:{explore:5, hunt:0, craft:1, kills:0, cook:0, days:6, events:2},
    milestones:{}, dead:false, deathReason:''};
  const migrate = await page.evaluate((og)=>{
    const raw=JSON.stringify({tag:'EMBER', fmt:1, ver:'1.1.0', g:og});
    const code='EMBER:'+btoa(unescape(encodeURIComponent(raw)));
    openImport();
    document.getElementById('importArea').value=code;
    doImport();
    return {day:G.day, axe:G.items.axe, skills:!!G.skills, skillLv:G.skills.chop.lvl, gold:G.gold, fmt:G.v, hasLastSeen:!!G.lastSeen};
  }, oldG);
  ok(migrate.day===6 && migrate.axe===true, '旧档数据完整');
  ok(migrate.skills && migrate.skillLv===1, '迁移补全技能系统 (Lv.'+migrate.skillLv+')');
  ok(migrate.gold===0 && migrate.hasLastSeen, '迁移补全金币/时间戳');
  ok(migrate.fmt===11, '存档格式升级到 fmt='+migrate.fmt);

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== Melvor 新功能测试: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
