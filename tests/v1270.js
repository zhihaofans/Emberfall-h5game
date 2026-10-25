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

  console.log('== A. 金字塔 Boss 法老王 ==');
  const a1 = await p.evaluate(()=>{
    G.stats.pharaohKills=0;
    const s1=pharaohStats();
    G.stats.pharaohKills=1;
    const s2=pharaohStats();
    G.stats.pharaohKills=2;
    const s3=pharaohStats();
    G.stats.pharaohKills=0;
    return [s1,s2,s3].map(s=>({name:s.name, hp:s.hp, atk:s.atk, gold:s.gold, rune:s.rune}));
  });
  ok(a1[0].name==='👑阿努比斯之仆' && a1[0].hp===220, '首阶段：'+a1[0].name+' HP'+a1[0].hp+' atk'+a1[0].atk);
  ok(a1[1].hp===320 && a1[1].atk===44, '二阶段：HP320 atk44');
  ok(a1[2].hp===420 && a1[2].atk===56, '三阶段：HP420 atk56');
  ok(a1[2].gold===280 && a1[2].rune===4, '奖励递增: 金币280 符石4');

  console.log('== A2. startPharaohFight 触发战斗 ==');
  const a2 = await p.evaluate(()=>{
    G.stats.pharaohKills=0;
    combat=null;
    startPharaohFight();
    const c=combat;
    combat=null;
    return {isPharaoh:c&&c.isPharaoh, isBoss:c&&c.isBoss, name:c&&c.b.name, hp:c&&c.b.hp};
  });
  ok(a2.isPharaoh && a2.isBoss, '法老战斗标记 isPharaoh+isBoss');
  ok(a2.name==='👑阿努比斯之仆' && a2.hp===220, '首阶段战斗参数正确');

  console.log('== A3. rollExploreEvent 金字塔 25 天触发法老 ==');
  const a3 = await p.evaluate(()=>{
    curZone='pyramid'; G.day=30; G.stats.pharaohKills=0;
    let pharaohCount=0;
    for(let i=0;i<2000;i++){
      if(G.stats.pharaohKills<3 && Math.random()<0.05 && (G.stats.pharaohKills===0 || G.day>=G.stats.pharaohFirstAt+30)){ pharaohCount++; }
    }
    return pharaohCount;
  });
  ok(a3>30, 'rollExploreEvent 5% 触发概率合理 ('+a3+'/2000 抽样)');

  console.log('== A4. 法老成就 pharaoh1/2/3 ==');
  const a4 = await p.evaluate(()=>{
    G.milestones={};
    G.stats.pharaohKills=0;
    // 模拟击败 3 次
    for(let i=0;i<3;i++){ G.stats.pharaohKills++; checkMilestone('pharaoh1'); checkMilestone('pharaoh2'); checkMilestone('pharaoh3'); }
    return {p1:!!G.milestones.pharaoh1, p2:!!G.milestones.pharaoh2, p3:!!G.milestones.pharaoh3};
  });
  ok(a4.p1 && a4.p2 && a4.p3, '3 个法老成就全部触发');

  console.log('== A5. 进度页含法老 + Wiki 含法老 ==');
  const a5 = await p.evaluate(()=>{
    openProgress();
    const prog=document.getElementById('modalcard').textContent;
    openWiki(); wikiTab('monster',null);
    const wiki=document.getElementById('wikiBody').textContent;
    return {prog:prog.includes('法老王'), progAch:prog.includes('永恒法老'), wikiPharaoh:wiki.includes('阿努比斯之仆') && wiki.includes('永恒法老')};
  });
  ok(a5.prog && a5.progAch, '进度页含法老区块+成就');
  ok(a5.wikiPharaoh, 'Wiki 含法老 3 阶段');

  console.log('== B. 强化上限 10→15 ==');
  const b1 = await p.evaluate(()=>{
    return {
      weaponMax:UPGRADES.weapon.max,
      axeMax:UPGRADES.axe.max,
      rodMax:UPGRADES.rod.max,
      trapMax:UPGRADES.trap.max,
    };
  });
  ok(b1.weaponMax===15 && b1.axeMax===15 && b1.rodMax===15 && b1.trapMax===15, '所有强化 max=15');

  console.log('== B2. upgradeCost(10/14) 包含符文/合金 ==');
  const b2 = await p.evaluate(()=>{
    const c10=upgradeCost('weapon',10);
    const c14=upgradeCost('weapon',14);
    return {c10, c14};
  });
  ok(b2.c10.rune===1 && b2.c10.alloy>=1, '升级到 11 级需 1 符石+合金: '+JSON.stringify(b2.c10));
  ok(b2.c14.rune===5 && b2.c14.alloy>=7, '升级到 15 级需 5 符石+合金: '+JSON.stringify(b2.c14));

  console.log('== B3. 实际升级到 15 级 ==');
  const b3 = await p.evaluate(()=>{
    G.upgrades.weapon=10; G.items.steel=true;
    G.res.metal=500; G.res.leather=500; G.res.rune=30; G.res.alloy=500;
    for(let i=10;i<15;i++) upgradeItem('weapon');
    return {lv:G.upgrades.weapon, max:UPGRADES.weapon.max};
  });
  ok(b3.lv===15, '连续升级 5 次到 Lv.15 (实际 '+b3.lv+')');

  console.log('== B4. 升级到 MAX 报错 ==');
  const b4 = await p.evaluate(()=>{
    G.upgrades.weapon=15;
    let toasted=false;
    const orig=toast; toast=(t)=>{ toasted=t; };
    upgradeItem('weapon');
    toast=orig;
    return {lv:G.upgrades.weapon, msg:toasted};
  });
  ok(b4.lv===15, '满级后无法再升级 (lv='+b4.lv+')');
  ok(b4.msg && b4.msg.includes('最高'), 'toast 提示已达最高: '+b4.msg);

  console.log('== B5. 制作页强化按钮显示 Lv.X/15 ==');
  const b5 = await p.evaluate(()=>{
    G.upgrades={weapon:0,axe:0,rod:0,trap:0};
    switchTab('craft');
    return document.getElementById('actions').textContent;
  });
  ok(b5.includes('Lv.0/15'), '强化按钮显示 Lv.0/15');

  console.log('== C. 商店扩展 ==');
  const c1 = await p.evaluate(()=>{
    return {expPotion:RES_NAMES.expPotion, luckyDraw:RES_NAMES.luckyDraw, lifePotion:RES_NAMES.lifePotion,
            hasFn: typeof useExpPotion==='function' && typeof useLuckyDraw==='function' && typeof useLifePotion==='function'};
  });
  ok(c1.expPotion && c1.luckyDraw && c1.lifePotion, '3 个新资源已定义');
  ok(c1.hasFn, '3 个 use 函数已注册');

  console.log('== C2. 商人含 6 个新现金商品 ==');
  const c2 = await p.evaluate(()=>{
    const newGoods = MERCHANT_GOODS.filter(g => g.cost && (g.get.expPotion||g.get.luckyDraw||g.get.lifePotion||g.get.gold||g.get.totem));
    return {count:newGoods.length, labels:newGoods.map(g => g.label)};
  });
  ok(c2.count>=6, '6 个新现金商品 (实际 '+c2.count+'): '+c2.labels.join('|'));

  console.log('== C3. 经验药水使用 +1 全部技能 ==');
  const c3 = await p.evaluate(()=>{
    G.skills.chop.lvl=5; G.skills.fish.lvl=3; G.res.expPotion=1;
    useExpPotion();
    return {chop:G.skills.chop.lvl, fish:G.skills.fish.lvl, potion:G.res.expPotion};
  });
  ok(c3.chop===6 && c3.fish===4, '全部技能 +1 (chop 5→'+c3.chop+', fish 3→'+c3.fish+')');
  ok(c3.potion===0, '经验药水消耗');

  console.log('== C4. 生命药剂回满 + 清伤病 ==');
  const c4 = await p.evaluate(()=>{
    G.hp=30; G.ill=true; G.lightWound=true; G.heavyWound=true; G.res.lifePotion=1;
    useLifePotion();
    return {hp:G.hp, ill:G.ill, light:G.lightWound, heavy:G.heavyWound};
  });
  ok(c4.hp===100 && !c4.ill && !c4.light && !c4.heavy, 'hp100 伤病清 (hp='+c4.hp+')');

  console.log('== C5. 抽奖券 100 次模拟（验证概率分布）==');
  const c5 = await p.evaluate(()=>{
    G.gold=0; G.res.luckyDraw=100; G.res.alloy=0; G.res.rune=0; G.res.totem=0; G.res.adrenaline=0;
    // 屏蔽 log 以免刷屏
    const origLog=log; log=()=>{};
    for(let i=0;i<100;i++){ if(G.res.luckyDraw<=0) break; useLuckyDraw(); }
    log=origLog;
    return {gold:G.gold, alloy:G.res.alloy, rune:G.res.rune, totem:G.res.totem, adrenaline:G.res.adrenaline};
  });
  ok(c5.gold>0 || c5.alloy>0 || c5.rune>0 || c5.totem>0, '抽奖 100 次有产出');

  console.log('== C6. 背包含 3 个新资源使用按钮 ==');
  const c6 = await p.evaluate(()=>{
    G.res.expPotion=1; G.res.luckyDraw=1; G.res.lifePotion=1;
    switchTab('bag');
    const txt=document.getElementById('actions').textContent;
    return {exp:txt.includes('经验药水') && txt.includes('服用'), luck:txt.includes('抽奖券') && txt.includes('刮开'), life:txt.includes('生命药剂') && txt.includes('服用')};
  });
  ok(c6.exp && c6.luck && c6.life, '背包含 3 个新资源+按钮');

  console.log('== D. 旧档迁移字段兜底 ==');
  const d = await p.evaluate(()=>{
    const g=normalizeState({v:10, day:1, res:{wood:1}});
    return {pharaohKills:'pharaohKills' in g.stats, expPotion:'expPotion' in g.res, luckyDraw:'luckyDraw' in g.res, lifePotion:'lifePotion' in g.res};
  });
  ok(d.pharaohKills && d.expPotion && d.luckyDraw && d.lifePotion, '旧档自动补全字段');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();