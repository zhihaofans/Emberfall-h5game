/* v1.5.0 专项：强化系统 / 合金合成 / 三阶武器 / fmt3→4迁移 */
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

  console.log('== 1. 合金合成链（熔炼）==');
  const smelt = await page.evaluate(()=>{
    G.items.forge=true; G.res.metal=10; G.res.stone=10; G.res.alloy=0;
    doAction('smelt');
    return {alloy:G.res.alloy, metal:G.res.metal, stone:G.res.stone};
  });
  ok(smelt.alloy>=1, `熔炼产出合金 (合金${smelt.alloy})`);
  ok(smelt.metal<10 && smelt.stone<10, '熔炼消耗金属与石头');
  // 无铁匠炉时熔炼被拦截
  const blocked = await page.evaluate(()=>{
    G.items.forge=false; G.res.metal=5;
    const m=G.res.metal;
    doAction('smelt');
    return G.res.metal===m;
  });
  ok(blocked, '无铁匠炉时熔炼被拦截');

  console.log('== 2. 强化系统 ==');
  const up1 = await page.evaluate(()=>{
    G.items.ironAxe=true; G.res.metal=10; G.res.wood=10;
    G.upgrades.axe=0;
    upgradeItem('axe');
    return {lv:G.upgrades.axe, metal:G.res.metal, ms:!!G.milestones.up1};
  });
  ok(up1.lv===1, '强化斧头 Lv.1');
  ok(up1.metal===8, `强化消耗材料 (金属剩${up1.metal})`);
  ok(up1.ms, '获得「第一次强化」里程碑');
  // 材料递增：Lv.1→2 需要更多
  const up2 = await page.evaluate(()=>{
    G.res.metal=20; G.res.wood=20; G.upgrades.axe=1;
    upgradeItem('axe');
    return {lv:G.upgrades.axe, metal:G.res.metal, wood:G.res.wood};
  });
  ok(up2.lv===2 && up2.metal===16 && up2.wood===16, `强化材料递增 (金属20→${up2.metal}, 木材20→${up2.wood})`);
  // 未满10级可继续
  const maxed = await page.evaluate(()=>{
    G.upgrades.axe=10; G.res.metal=999; G.res.wood=999;
    upgradeItem('axe');
    return G.upgrades.axe;
  });
  ok(maxed===10, 'Lv.10 封顶不可再强化');

  console.log('== 3. 强化效果生效 ==');
  const effect = await page.evaluate(()=>{
    // 斧头强化提升砍柴产量
    const avg=(up)=>{
      G.items.axe=true; G.items.ironAxe=true;
      G.skills.chop.lvl=1; G.hour=8; G.food=100; G.water=100; G.stam=100;
      G.upgrades.axe=up;
      const base=G.res.wood; let s=0;
      for(let i=0;i<10;i++){ const w=G.res.wood; doAction('chop'); s+=G.res.wood-w; }
      return s/10;
    };
    return {l0:Math.round(avg(0)), l10:Math.round(avg(10))};
  });
  ok(effect.l10>effect.l0, `斧头强化 Lv.10 产量(${effect.l10}) > Lv.0(${effect.l0})`);
  // 捕兽夹强化提升每日产出
  const trapUp = await page.evaluate(()=>{
    G.items.trap=true; G.upgrades.trap=10;
    G.hour=23; G.day=1; G.res.metal=99; G.res.stone=99; G.res.wood=99;
    logBuffer=[]; nextDay();
    const line=logBuffer.find(l=>l.m.includes('捕兽夹捕获'));
    return line? line.m : '';
  });
  ok(/捕获了.+生食 ×\d{2}/.test(trapUp), `捕兽夹强化后每日产出提升 (${trapUp})`);

  console.log('== 4. 三阶传说武器「猎王刀」==');
  const hk = await page.evaluate(()=>{
    G.items.steel=true; G.res.alloy=10; G.res.leather=10;
    G.hour=8; G.stam=100;
    doCraft('huntKing');
    return {made:G.items.huntKing, atk:weaponAtk().name, alloy:G.res.alloy, leather:G.res.leather};
  });
  ok(hk.made && hk.atk.includes('猎王刀'), '猎王刀制作成功且为当前武器');
  ok(hk.alloy===2 && hk.leather===4, `消耗合金/皮革 (剩${hk.alloy}/${hk.leather})`);

  console.log('== 5. 制作页分组与强化区 ==');
  const craftUI = await page.evaluate(()=>{
    switchTab('craft');
    return {
      seps:[...document.querySelectorAll('.craft-sep')].map(e=>e.textContent),
      upBtns:[...document.querySelectorAll('#actions .actbtn')].filter(b=>b.textContent.includes('强化')).length,
    };
  });
  ok(craftUI.seps.length>=4, '制作页含 基础/进阶/传说/强化 分组');
  ok(craftUI.upBtns>=4, `强化区 4 个强化按钮 (实际${craftUI.upBtns})`);

  console.log('== 6. 存档迁移 fmt3→4 ==');
  const mig = await page.evaluate(()=>{
    const g={v:3, day:26, hour:10, season:0, weather:0,
      hp:80, food:60, water:70, stam:90,
      ill:false, lightWound:false, heavyWound:false,
      res:{wood:40, stone:20, food:5, cooked:0, water:0, clean:3, herb:2, metal:8, leather:2, alloy:0},
      items:{axe:true, knife:true, fire:true, puri:true, rod:true, trap:true, bed:true, kit:true, iron:true,
             ironAxe:true, steel:true, farm:true, tower:true, forge:true},
      stats:{explore:10, hunt:2, craft:12, kills:1, cook:0, days:26, events:6},
      skills:{chop:{lvl:5,xp:5}, mine:{lvl:3,xp:0}, hunt:{lvl:2,xp:0}, fish:{lvl:1,xp:0}, explore:{lvl:3,xp:0}, cook:{lvl:1,xp:0}, combat:{lvl:1,xp:0}},
      gold:15, lastSeen:Date.now(), autoAction:null, offToday:{fire:false,puri:false,trap:false},
      milestones:{}, dead:false, deathReason:''};
    const code='EMBER:'+btoa(unescape(encodeURIComponent(JSON.stringify({tag:'EMBER', fmt:3, ver:'1.4.1', g}))));
    openImport(); document.getElementById('importArea').value=code; doImport();
    return {day:G.day, huntKing:G.items.huntKing, upgrades:G.upgrades, fmt:G.v};
  });
  ok(mig.day===26, '旧档数据保留 (第'+mig.day+'天)');
  ok(mig.huntKing===false && mig.upgrades.weapon===0, '迁移补全猎王刀与强化字段');
  ok(mig.fmt===4, '存档格式升级到 fmt='+mig.fmt);

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.5.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
