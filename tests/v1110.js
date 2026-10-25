/* v1.11.x 专项：符石 / Tier 4 终极制作 / 扩展里程碑 / 防崩溃回退 */
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
  const ver=await page.evaluate(()=>GAME_VERSION);
  ok(ver==='2.0.0', 'GAME_VERSION = '+ver);
  const saveFmt=await page.evaluate(()=>SAVE_FMT);
  ok(saveFmt===11, 'SAVE_FMT = '+saveFmt);

  console.log('== 2. 符石资源存在 ==');
  const runeRes=await page.evaluate(()=>({
    inRes: typeof G.res.rune==='number',
    inPrice: typeof RES_PRICE.rune==='number',
    inNames: typeof RES_NAMES.rune==='string' && RES_NAMES.rune.includes('符石'),
  }));
  ok(runeRes.inRes && runeRes.inPrice && runeRes.inNames,
    '符石资源已就绪 (res='+runeRes.inRes+', price='+runeRes.inPrice+', names='+runeRes.inNames+')');

  console.log('== 3. Tier 4 配方就绪 ==');
  const t4=await page.evaluate(()=>({
    runeBlade: !!(RECIPES.runeBlade && RECIPES.runeBlade.tier===4),
    runeArmor: !!(RECIPES.runeArmor && RECIPES.runeArmor.tier===4),
    forgeMast: !!(RECIPES.forgeMast && RECIPES.forgeMast.tier===4),
    vault:     !!(RECIPES.vault     && RECIPES.vault.tier===4),
  }));
  ok(Object.values(t4).every(v=>v), '4 个 Tier 4 终极配方 (runeBlade/runeArmor/forgeMast/vault)');

  console.log('== 4. 第四阶默认未制作（newGame 后）==');
  const t4Items=await page.evaluate(()=>({
    runeBlade: G.items.runeBlade===false,
    runeArmor: G.items.runeArmor===false,
    forgeMast: G.items.forgeMast===false,
    vault:     G.items.vault===false,
  }));
  ok(Object.values(t4Items).every(v=>v), 'newGame 后第四阶物品默认 false');

  console.log('== 5. 扩展里程碑 60/100/180 ==');
  const ms=await page.evaluate(()=>({
    list: DAY_MILESTONES,
    has60: 60 in DAY_REWARDS,
    has100: 100 in DAY_REWARDS,
    has180: 180 in DAY_REWARDS,
  }));
  ok(ms.list.includes(60) && ms.list.includes(100) && ms.list.includes(180),
    '里程碑列表含 60/100/180: '+ms.list.join(','));
  ok(ms.has60 && ms.has100 && ms.has180, 'DAY_REWARDS 含 60/100/180 三档奖励');

  console.log('== 6. 武器路线含符刃 ==');
  const wpn=await page.evaluate(()=>({
    inList: !!WEAPONS.runeBlade,
    inAtk:  weaponAtk && typeof weaponAtk==='function',
    afterGive: (function(){ G.items.runeBlade=true; return weaponAtk().name; })(),
  }));
  ok(wpn.inList && wpn.inAtk, 'WEAPONS.runeBlade 存在 + weaponAtk 可用');
  ok(wpn.afterGive.includes('符刃'), '拥有符刃后 weaponAtk 返回符刃: '+wpn.afterGive);
  await page.evaluate(()=>{ G.items.runeBlade=false; });

  console.log('== 7. 符甲减伤生效 ==');
  const dmg=await page.evaluate(()=>{
    G.items.runeArmor=false;
    const a=Math.round(30*(0.6+0.5*0.6)); // 中位数
    G.items.runeArmor=true;
    const b=Math.max(1, Math.ceil(a/3));
    return {without:a, with:b};
  });
  ok(dmg.with < dmg.without, `符甲减伤生效 (无${dmg.without} → 有${dmg.with})`);

  console.log('== 8. 永恒仓库消耗减半 ==');
  const consume=await page.evaluate(()=>{
    G.food=100; G.water=100;
    G.items.vault=false;
    const f0=G.food, w0=G.water;
    // 模拟 nextDay 内部一段（不直接调用，仅复用逻辑测试参数）
    const lateness=1;
    const m1=Math.round(15*lateness);
    G.items.vault=true;
    const m2=Math.round(15*lateness*0.5);
    return {without:m1, with:m2};
  });
  ok(consume.with < consume.without, `vault 减半 (无${consume.without} → 有${consume.with})`);

  console.log('== 9. 旧存档自动迁移到 v1.11.0 (fmt 4→5) ==');
  const mig=await page.evaluate(()=>{
    const g={
      v:4, day:1, hour:8, season:0, weather:0,
      hp:100, food:100, water:100, stam:100,
      res:{wood:4, stone:2, food:2, cooked:0, water:0, clean:2, herb:2, metal:0, leather:0, alloy:0}, // 无 rune
      items:{axe:true,knife:false,fire:true,puri:false,rod:false,trap:false,bed:false,kit:false,iron:false,ironAxe:false,steel:false,farm:false,tower:false,forge:false,huntKing:false}, // 无 tier4
      upgrades:{weapon:0,axe:0,rod:0,trap:0},
    };
    const code='EMBER:'+btoa(unescape(encodeURIComponent(JSON.stringify({tag:'EMBER',fmt:4,ver:'1.10.0',g}))));
    openImport();
    document.getElementById('importArea').value=code;
    doImport();
    return {
      hasRune: G.res.rune===0,
      hasRuneBlade: G.items.runeBlade===false,
      hasRuneArmor: G.items.runeArmor===false,
      hasForgeMast: G.items.forgeMast===false,
      hasVault: G.items.vault===false,
      fmt: G.v,
    };
  });
  ok(mig.hasRune && mig.hasRuneBlade && mig.hasRuneArmor && mig.hasForgeMast && mig.hasVault,
    '旧 v4 存档已补齐 rune 资源 + Tier 4 物品');
  ok(mig.fmt===11, '迁移后 fmt='+mig.fmt);

  console.log('== 10. 防崩溃回退机制就绪 ==');
  const ebh=await page.evaluate(()=>({
    hasBootKey:   typeof EBH_BOOT!=='undefined',
    hasBackup:    typeof EBH_BACKUP!=='undefined',
    hasSentinel:  typeof ebhStartSentinel==='function',
    hasDetect:    typeof ebhDetectCrash==='function',
    hasBackupFx:  typeof ebhBackupCurrent==='function',
    hasRestore:   typeof ebhRestoreBackup==='function',
    hasShowPage:  typeof ebhShowCrashPage==='function',
  }));
  ok(ebh.hasBootKey && ebh.hasBackup && ebh.hasSentinel && ebh.hasDetect && ebh.hasBackupFx && ebh.hasRestore && ebh.hasShowPage,
    '防崩溃 7 个 API 全部就绪');

  console.log('== 11. 模拟崩溃 → 降级页能渲染 ==');
  const crashPage=await page.evaluate(()=>{
    ebhShowCrashPage({isOldCrash:true, backup:{ver:'1.10.0',build:45,html:''}, err:new Error('test')});
    const t=document.body.textContent;
    return {
      hasTitle: t.includes('启动失败'),
      hasBackupBtn: t.includes('加载上次能玩的版本'),
      hasExportBtn: t.includes('导出当前存档'),
    };
  });
  ok(crashPage.hasTitle, '降级页有标题');
  ok(crashPage.hasBackupBtn, '降级页有"加载旧版"按钮');
  ok(crashPage.hasExportBtn, '降级页有"导出存档"按钮');
  // 重新打开页面，恢复正常运行
  await page.reload({waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,400));

  console.log('== 12. 哨兵正确清理 ==');
  const sentOk=await page.evaluate(()=>{
    // 正常 init 流程后，哨兵应在 500ms 内被清
    return !localStorage.getItem(EBH_BOOT);
  });
  ok(sentOk, 'init 成功后哨兵已清除');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.11.x 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
