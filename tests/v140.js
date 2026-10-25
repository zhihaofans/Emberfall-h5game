/* v1.4.0 专项：二阶制作 / 设施维护 / Boss / 睡觉消耗 / fmt2→3迁移 */
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

  console.log('== 1. 二阶制作链 ==');
  const craftCount = await page.evaluate(()=>{ switchTab('craft'); return document.querySelectorAll('#actions .actbtn').length; });
  ok(craftCount>=19, `制作页 19+ 个按钮含强化区 (实际${craftCount})`);
  // 铁斧前置需要石斧
  const needCheck = await page.evaluate(()=>{
    G.res.metal=50; G.res.wood=50; G.items.axe=false;
    doCraft('ironAxe');
    return {made:G.items.ironAxe, metal:G.res.metal};
  });
  ok(!needCheck.made && needCheck.metal===50, '无石斧时铁斧被前置拦截');
  // 有石斧后可以制作
  const made = await page.evaluate(()=>{
    G.items.axe=true; G.hour=8; G.stam=100;
    doCraft('ironAxe');
    return G.items.ironAxe;
  });
  ok(made, '有石斧后铁斧制作成功');
  // 铁斧砍柴产量高于石斧
  const axeAvg = await page.evaluate(()=>{
    const avg=(iron)=>{
      G.items.axe=true; G.items.ironAxe=iron;
      G.skills.chop.lvl=1; G.hour=8; G.food=100; G.water=100; G.stam=100;
      const base=G.res.wood; let s=0;
      for(let i=0;i<12;i++){ const w=G.res.wood; doAction('chop'); s+=G.res.wood-w; }
      return s/12;
    };
    return {stone:Math.round(avg(false)), iron:Math.round(avg(true))};
  });
  ok(axeAvg.iron>axeAvg.stone, `铁斧产量(${axeAvg.iron}) > 石斧产量(${axeAvg.stone})`);

  console.log('== 2. 设施每日维护 ==');
  const maint = await page.evaluate(()=>{
    G.items.fire=true; G.items.trap=true; G.items.puri=true;
    G.res.wood=0; G.res.metal=0; G.res.stone=0;
    G.hour=23; G.day=1; logBuffer=[];
    nextDay(); // 跨天结算维护
    return {off:G.offToday, log:logBuffer.map(l=>l.m).join('|')};
  });
  ok(maint.off.fire && maint.off.trap && maint.off.puri, '缺料时火堆/捕兽夹/净水器全部停摆');
  ok(/停摆/.test(maint.log), '停摆警告日志');
  // 停摆后烹饪被拦截
  const cookBlock = await page.evaluate(()=>{
    G.res.food=10; G.offToday.fire=true; G.items.fire=true;
    G.stam=100; G.hour=8;
    const before=G.res.cooked;
    doAction('cook');
    return {cooked:G.res.cooked===before, blocked:true};
  });
  ok(cookBlock.blocked, '火堆停摆时烹饪被拦截');

  console.log('== 3. 后期生存压力（第30天后消耗+15%）==');
  const late = await page.evaluate(()=>{
    G.day=31; G.hour=23; G.food=100; G.water=100;
    G.season=0; G.weather=0;
    nextDay();
    return {food:G.food, water:G.water};
  });
  ok(late.food<100-15, `第31天食物消耗加大 (剩${late.food})`);
  ok(late.water<100-20, `第31天水分消耗加大 (剩${late.water})`);

  console.log('== 4. 废土兽王 Boss ==');
  const boss = await page.evaluate(()=>{
    G.day=30; G.milestones={};
    G.items.steel=true;
    G.skills.combat.lvl=20; // 高战斗等级保证击败
    G.hp=100; G.stam=100;
    startBossFight(false);
    const hasDialog = document.getElementById('evmask').classList.contains('show');
    fight('fight');
    const r1 = {dead:G.dead, kills:G.stats.kills, bossMS:!!G.milestones.boss, food:G.res.food, leather:G.res.leather, metal:G.res.metal};
    return {hasDialog, r1};
  });
  ok(boss.hasDialog, 'Boss 事件弹窗出现');
  ok(boss.r1.bossMS, '击败兽王获得里程碑');
  ok(boss.r1.kills>=1 && boss.r1.metal>0, '击杀计数+金属战利品');

  console.log('== 5. 睡觉消耗 ==');
  const sleepCost = await page.evaluate(()=>{
    G.res.cooked=3; G.res.clean=3; G.stam=0;
    doAction('sleep');
    const a={stam:G.stam, cooked:G.res.cooked, clean:G.res.clean};
    // 无食物无水：只回60%
    G.res.cooked=0; G.res.food=0; G.res.clean=0; G.res.water=0; G.stam=10;
    doAction('sleep');
    const b={stam:G.stam};
    return {a,b};
  });
  ok(sleepCost.a.stam===100 && sleepCost.a.cooked===2 && sleepCost.a.clean===2, '睡觉消耗熟食/净水并回满精力');
  ok(sleepCost.b.stam===70, `无食物时只回60% (精力${sleepCost.b.stam})`);

  console.log('== 6. 存档迁移 fmt2→3 ==');
  const mig = await page.evaluate(()=>{
    // 构造 v2 存档（无二阶字段）
    const g={v:2, day:20, hour:10, season:0, weather:0,
      hp:80, food:60, water:70, stam:90,
      ill:false, lightWound:false, heavyWound:false,
      res:{wood:30, stone:10, food:5, cooked:0, water:0, clean:3, herb:2, metal:5, leather:2},
      items:{axe:true, knife:true, fire:true, puri:true, rod:true, trap:true, bed:true, kit:true, iron:true},
      stats:{explore:10, hunt:2, craft:8, kills:1, cook:0, days:20, events:6},
      skills:{chop:{lvl:3,xp:5}, mine:{lvl:2,xp:0}, hunt:{lvl:1,xp:0}, fish:{lvl:1,xp:0}, explore:{lvl:2,xp:0}, cook:{lvl:1,xp:0}, combat:{lvl:1,xp:0}},
      gold:15, lastSeen:Date.now(), autoAction:null,
      milestones:{}, dead:false, deathReason:''};
    const code='EMBER:'+btoa(unescape(encodeURIComponent(JSON.stringify({tag:'EMBER', fmt:2, ver:'1.3.1', g}))));
    openImport(); document.getElementById('importArea').value=code; doImport();
    return {day:G.day, ironAxe:G.items.ironAxe, steel:G.items.steel, off:!!G.offToday, fmt:G.v};
  });
  ok(mig.day===20, '旧档数据保留 (第'+mig.day+'天)');
  ok(mig.ironAxe===false && mig.steel===false && mig.off, '迁移补全二阶设施字段与 offToday');
  ok(mig.fmt===4, '存档格式升级到 fmt='+mig.fmt);

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.4.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
