/* v1.30.0 怪物图鉴解锁（遭遇才显示属性/掉落）专项测试 */
const puppeteer=require('puppeteer-core');
let pass=0, fail=0;
function ok(c, n){ if(c){ pass++; console.log('✅ '+n); } else { fail++; console.log('❌ '+n); } }
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  const errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));

  console.log('== 1. 版本与存档结构 ==');
  const r1 = await p.evaluate(()=>({ver:GAME_VERSION, build:BUILD_CODE, fmt:SAVE_FMT}));
  ok(r1.ver==='2.0.0', 'GAME_VERSION = '+r1.ver);
  ok(r1.build===102, 'BUILD_CODE = '+r1.build);
  ok(r1.fmt===11, 'SAVE_FMT = '+r1.fmt);
  const r1b = await p.evaluate(()=>{ newGame(); return {best:JSON.stringify(G.bestiary), hasFn:typeof wikiSeen==='function' && typeof wikiUnlocked==='function' && typeof legacyBestiary==='function'}; });
  ok(r1b.best==='{}', '新档 bestiary 为空对象');
  ok(r1b.hasFn, 'wikiSeen/wikiUnlocked/legacyBestiary 函数存在');

  console.log('== 2. 百科渲染：未解锁全部打码 ==');
  const r2 = await p.evaluate(()=>{
    newGame(); openWiki();
    const body=document.getElementById('wikiBody');
    const txt=body.textContent;
    return {hasLock:txt.includes('🔒 未遭遇'), hasQ:txt.includes('？？？'), hasHpLeak:txt.includes('❤️ 生命 <b>20'), html:body.innerHTML};
  });
  ok(r2.hasLock, '未解锁条目显示「🔒 未遭遇」');
  ok(r2.hasQ, '未解锁条目属性/掉落显示「？？？」');
  ok(!r2.hasHpLeak, '未解锁时野狗 HP 数值不泄露');
  ok((r2.html.match(/🔒 未遭遇/g)||[]).length>=15, '打码条目数 >=15（'+(r2.html.match(/🔒 未遭遇/g)||[]).length+'）');

  console.log('== 3. wikiSeen 解锁后渲染显示数值 ==');
  const r3 = await p.evaluate(()=>{
    newGame();
    wikiSeen('beast0'); // 野狗
    const h=monsterHTML();
    return {unlocked:wikiUnlocked('beast0'), hasHp:h.includes('❤️ 生命 <b>20</b>'), hasDrop:h.includes('🎁 掉落：'), stillLock:h.includes('🔒 未遭遇')};
  });
  ok(r3.unlocked, 'wikiSeen 后 wikiUnlocked 为 true');
  ok(r3.hasHp && r3.hasDrop, '解锁后显示具体属性与掉落');
  ok(r3.stillLock, '其他未解锁条目仍带锁');

  console.log('== 4. legacyBestiary 老档迁移规则 ==');
  const r4 = await p.evaluate(()=>{
    const b1=legacyBestiary({stats:{kills:5, zoneCnt:{forest:2, river:1, hills:0, ruins:1, pyramid:4}, bossKills:1, pharaohKills:0}});
    const b2=legacyBestiary({stats:{kills:10, zoneCnt:{ruins:6, pyramid:6}, bossKills:3, pharaohKills:2}});
    return {
      beastAll: !!(b1['beast0']&&b1['beast1']&&b1['beast2']&&b1['beast3']),
      zoneF:!!b1['zone-forest'], zoneR:!!b1['zone-river'], zoneH:!!b1['zone-hills'],
      rob0:!!b1['rob0'], rob1:!!b1['rob1'], rob2:!!b1['rob2'],
      pyr0:!!b1['pyr0'], pyr1:!!b1['pyr1'], pyr2:!!b1['pyr2'],
      boss0:!!b1['boss0'], boss1:!!b1['boss1'],
      ph0:!!b1['pharaoh0'], moonDog1:!!b1['moon-dog'], moonWolf1:!!b1['moon-wolf'],
      moonDog2:!!b2['moon-dog'], moonWolf2:!!b2['moon-wolf'],
      robAll2:!!(b2['rob0']&&b2['rob1']&&b2['rob2']), pyrAll2:!!(b2['pyr0']&&b2['pyr1']&&b2['pyr2']),
      bossAll2:!!(b2['boss0']&&b2['boss1']&&b2['boss2']), ph1_2:!!b2['pharaoh1'], ph2_2:!!b2['pharaoh2'],
    };
  });
  ok(r4.beastAll, 'kills=5 解锁全部 4 野兽');
  ok(r4.zoneF && r4.zoneR && !r4.zoneH, '探索过森林/河边解锁，未探索山丘不解锁');
  ok(r4.rob0 && !r4.rob1 && !r4.rob2, '废墟探索 1 次只解锁锈蚀哨兵');
  ok(r4.pyr0 && r4.pyr1 && !r4.pyr2, '金字塔探索 4 次解锁前 2 档');
  ok(r4.boss0 && !r4.boss1, 'bossKills=1 解锁兽王一阶段');
  ok(!r4.ph0 && !r4.moonDog1 && !r4.moonWolf1, '无法老/月圆战绩则不解锁');
  ok(r4.moonDog2 && r4.moonWolf2, 'kills=10 解锁月圆两怪');
  ok(r4.robAll2 && r4.pyrAll2, '废墟/金字塔探索 6 次解锁全部档位');
  ok(r4.bossAll2 && r4.ph1_2 && !r4.ph2_2, 'bossKills=3 解锁兽王全阶段；pharaohKills=2 解锁法老前 2 阶段');

  console.log('== 5. migrateFrom fmt=10 老档自动迁移 ==');
  const r5 = await p.evaluate(()=>{
    const g={v:10, day:20, hp:80, food:60, water:70, stam:90, res:{wood:10}, items:{axe:true},
      stats:{kills:3, zoneCnt:{forest:1}, bossKills:0, pharaohKills:0}, skills:{}, gold:5, lastSeen:Date.now(), autoAction:null, adrenalineLeft:0, offToday:{}, npcDora:{fav:0}, milestones:{}, dead:false};
    const out=migrateFrom(g, 10);
    return {fmt:out.v, beast0:!!out.bestiary['beast0'], beast1:!!out.bestiary['beast1'], beast3:!out.bestiary['beast3'], zoneF:!!out.bestiary['zone-forest']};
  });
  ok(r5.fmt===11, 'fmt=10 老档升级到 fmt='+r5.fmt);
  ok(r5.beast0 && r5.beast1 && r5.beast3, '老档按 kills=3 补解锁 beast0/1，未解锁 beast3');
  ok(r5.zoneF, '老档按森林探索次数补解锁区域怪');

  console.log('== 6. 遭遇标记：Boss 与法老 ==');
  const r6 = await p.evaluate(()=>{
    newGame();
    startBossFight(false);                 // 首遇兽王 → boss0
    const b0=!!G.bestiary['boss0'];
    G.stats.bossKills=1; startBossFight(false);  // 二阶段 → boss1
    const b1=!!G.bestiary['boss1'];
    startPharaohFight();                   // 首遇法老 → pharaoh0
    const p0=!!G.bestiary['pharaoh0'];
    G.stats.pharaohKills=2; startPharaohFight(); // 三阶段 → pharaoh2
    const p2=!!G.bestiary['pharaoh2'];
    return {b0,b1,p0,p2};
  });
  ok(r6.b0 && r6.b1, '遭遇兽王一/二阶段分别解锁 boss0/boss1');
  ok(r6.p0 && r6.p2, '遭遇法老一/三阶段分别解锁 pharaoh0/pharaoh2');

  console.log('== 7. startCombat 遭遇即解锁 ==');
  const r7 = await p.evaluate(()=>{
    newGame();
    for(let i=0;i<25;i++) startCombat(1);
    const ids=Object.keys(G.bestiary);
    return {count:ids.length, ids:ids.join(',')};
  });
  ok(r7.count>=1, '多次遭遇后 bestiary 非空（'+r7.count+' 个条目：'+r7.ids+'）');

  console.log('== 8. 月圆遭遇解锁（满月日强制）==');
  const r8 = await p.evaluate(()=>{
    newGame();
    // 模拟月圆：第一次遭遇强制 idx=0（野狗→凶犬），第二次 idx=1（灰狼→月狼）
    G.day=15;
    const orig=Math.random;
    let calls=0;
    Math.random=()=>{ calls++; return calls===1 ? 0.99 : 0; }; // 第1次:避开 zonePool; 第2次:idx=0(野狗)
    startCombat(1);
    calls=0;
    Math.random=()=>{ calls++; return calls===1 ? 0.99 : 1; }; // 第1次:避开 zonePool; 第2次:idx=1(灰狼)
    startCombat(1);
    Math.random=orig;
    return {moonDog:!!G.bestiary['moon-dog'], moonWolf:!!G.bestiary['moon-wolf'], beast0:!!G.bestiary['beast0'], beast1:!!G.bestiary['beast1']};
  });
  ok(r8.moonDog, '月圆夜遭遇野狗 → 解锁 moon-dog');
  ok(r8.moonWolf, '月圆夜遭遇灰狼 → 解锁 moon-wolf');
  ok(r8.beast0 && r8.beast1, '进化前原形 beast0/beast1 同步解锁');

  ok(errors.length===0, '全程无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
  process.exit(fail>0?1:0);
})();
