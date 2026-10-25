const puppeteer=require('puppeteer-core');
let pass=0, fail=0;
function ok(cond, name){ if(cond){ pass++; console.log('✅ '+name); } else { fail++; console.log('❌ '+name); } }
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  p.on('pageerror',e=>console.log('PAGEERR:', e.message));
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));

  console.log('== 1. 区域成就配置 ==');
  const cfg = await p.evaluate(()=>({
    pyramidAch: ZONES.pyramid.ach.join(','),
    hasAllZones: Object.keys(ZONES).every(z=>ZONES[z].ach),
    zoneCntDef: (function(){ newGame(); return G.stats.zoneCnt!==undefined; })(),
  }));
  ok(cfg.pyramidAch==='pyr1,pyr10,pyr50', '金字塔 ach 配置 ('+cfg.pyramidAch+')');
  ok(cfg.hasAllZones, '5 区域均有 ach 配置');
  ok(cfg.zoneCntDef, 'newGame 有 zoneCnt');

  console.log('== 2. 探索触发区域成就 ==');
  const r2 = await p.evaluate(()=>{
    curZone='pyramid';
    G.stats.zoneCnt={};
    let n=0;
    while(n<80 && !(G.milestones.pyr1 && G.milestones.pyr10 && G.milestones.pyr50)){
      G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false; G.hp=100;
      doAction('explore'); n++;
    }
    return {n, pyr1:!!G.milestones.pyr1, pyr10:!!G.milestones.pyr10, pyr50:!!G.milestones.pyr50, cnt:G.stats.zoneCnt.pyramid};
  });
  ok(r2.pyr1, 'pyr1 首次探索金字塔');
  ok(r2.pyr10, 'pyr10 探索 10 次');
  ok(r2.pyr50, 'pyr50 探索 50 次 (实际 '+r2.n+' 次)');
  ok(r2.cnt>=50, 'zoneCnt.pyramid='+r2.cnt+' 计数正确');

  console.log('== 3. 其他区域不误触发金字塔成就 ==');
  const r3 = await p.evaluate(()=>{
    curZone='forest';
    G.milestones={}; // 清空成就，验证森林只触发森林成就
    G.stats.zoneCnt={};
    for(let i=0;i<10;i++){ G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false; G.hp=100; doAction('explore'); }
    return {pyr:!!G.milestones.pyr1, for1:!!G.milestones.for1, for10:!!G.milestones.for10};
  });
  ok(!r3.pyr, '森林探索不触发金字塔成就');
  ok(r3.for1 && r3.for10, '森林成就正常 (for1='+r3.for1+', for10='+r3.for10+')');

  console.log('== 4. 木乃伊击杀成就 ==');
  const r4 = await p.evaluate(()=>{
    checkMilestone('mummy1');
    return !!G.milestones.mummy1;
  });
  ok(r4, 'mummy1 木乃伊杀手');

  console.log('== 5. 开棺盗墓成就 ==');
  const r5 = await p.evaluate(()=>{
    const ev=EXPLORE_EVENTS.find(e=>e.id==='tomb');
    ev.opts[0].eff(G);
    return !!G.milestones.tomb1;
  });
  ok(r5, 'tomb1 盗墓贼');

  console.log('== 6. 黄金密室成就 ==');
  const r6 = await p.evaluate(()=>{
    const ev=EXPLORE_EVENTS.find(e=>e.id==='goldroom');
    ev.opts[1].eff(G);
    return !!G.milestones.goldroom1;
  });
  ok(r6, 'goldroom1 寻宝者');

  console.log('== 7. 进度页显示区域成就 ==');
  const r7 = await p.evaluate(()=>{
    openProgress();
    return document.getElementById('modalcard').textContent;
  });
  ok(r7.includes('金字塔首次') && r7.includes('木乃伊杀手') && r7.includes('盗墓贼') && r7.includes('寻宝者'), '进度页含金字塔成就');
  ok(r7.includes('森林 50 次') && r7.includes('山丘 50 次'), '进度页含其他区域成就');

  console.log('== 8. 旧档迁移 zoneCnt ==');
  const r8 = await p.evaluate(()=>{
    const g=normalizeState({v:10, day:1, res:{wood:1}, stats:{explore:3}});
    return {zoneCnt: !!g.stats.zoneCnt, obj: typeof g.stats.zoneCnt==='object'};
  });
  ok(r8.zoneCnt && r8.obj, '旧档自动补 zoneCnt');

  console.log('== 9. 白名单完整 ==');
  const r9 = await p.evaluate(()=>{
    const keys=['for1','for10','for50','rui1','rui10','rui50','riv1','riv10','riv50','hil1','hil10','hil50','pyr1','pyr10','pyr50','mummy1','tomb1','goldroom1'];
    return keys.filter(k=>!(k in MS));
  });
  ok(r9.length===0, 'MS 定义完整 (缺失: '+(r9.join('、')||'无')+')');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();
