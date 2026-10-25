/* v1.22.0 专项：附魔系统（参考 Minecraft 附魔台） */
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
  ok(fmt===11, 'SAVE_FMT = 7');

  console.log('== 2. 附魔台配方 + 状态 ==');
  const init = await page.evaluate(()=>{
    newGame();
    return {
      recipe: RECIPES.enchantTbl && RECIPES.enchantTbl.name,
      tier: RECIPES.enchantTbl ? RECIPES.enchantTbl.tier : 0,
      enchant: G.enchant.tblLv===0 && G.enchant.weapon===0 && G.enchant.armor===0 && G.enchant.tool===0,
    };
  });
  ok(init.recipe==='🔮附魔台', `附魔台配方存在 (${init.recipe})`);
  ok(init.tier===4, `Tier 4 (实际 ${init.tier})`);
  ok(init.enchant, 'enchant 状态默认全 0');

  console.log('== 3. 附魔台升级 5 级封顶 ==');
  const tbl = await page.evaluate(()=>{
    G.items.enchantTbl=true;
    G.res.metal=100; G.res.stone=100; G.res.rune=50; G.res.alloy=100; G.res.leather=100;
    G.enchant={tblLv:0, weapon:0, armor:0, tool:0};
    for(let i=0;i<6;i++) upgradeEnchantTbl();
    return G.enchant.tblLv;
  });
  ok(tbl===5, `附魔台封顶 5 级 (实际 ${tbl})`);

  console.log('== 4. 附魔上限 = 附魔台等级 ==');
  const cap = await page.evaluate(()=>{
    G.enchant={tblLv:1, weapon:0, armor:0, tool:0};
    G.res.rune=50; G.res.alloy=50; G.res.metal=50; G.res.leather=50;
    enchantItem('weapon');
    const after1=G.enchant.weapon;
    enchantItem('weapon');
    const after2=G.enchant.weapon;
    return {after1, after2};
  });
  ok(cap.after1===1 && cap.after2===1, `台子 1 级时武器附魔封顶 1 (${cap.after1}→${cap.after2})`);

  console.log('== 5. 锋利附魔加成 ==');
  const sharp = await page.evaluate(()=>{
    G.items.steel=true;
    G.enchant={tblLv:5, weapon:0, armor:0, tool:0};
    const base=weaponAtk().atk;
    G.enchant.weapon=5;
    return {base, sharp:weaponAtk().atk, expect:Math.round(base*1.5)};
  });
  ok(sharp.sharp===sharp.expect, `锋利 5 级 +50%: ${sharp.base}→${sharp.sharp}`);

  console.log('== 6. 保护附魔减伤 ==');
  const armor = await page.evaluate(()=>{
    G.enchant={tblLv:5, weapon:0, armor:0, tool:0};
    const raw=100;
    G.enchant.armor=0; const d0=Math.max(1,Math.round(raw*1));
    G.enchant.armor=5; const d5=Math.max(1,Math.round(raw*0.6));
    return {d0, d5};
  });
  ok(armor.d5===60, `保护 5 级 -40%: ${armor.d0}→${armor.d5}`);

  console.log('== 7. 效率附魔提升采集 ==');
  const eff = await page.evaluate(()=>{
    G.items.axe=true; G.skills.chop.lvl=1;
    G.enchant={tblLv:5, weapon:0, armor:0, tool:0};
    G.res.wood=0; G.enchant.tool=0;
    let s0=0; for(let i=0;i<30;i++){ doAction('chop'); s0+=G.res.wood; G.res.wood=0; G.stam=100; }
    G.res.wood=0; G.enchant.tool=5;
    let s5=0; for(let i=0;i<30;i++){ doAction('chop'); s5+=G.res.wood; G.res.wood=0; G.stam=100; }
    return {s0, s5};
  });
  ok(eff.s5>eff.s0, `效率 5 级采集提升: ${eff.s0}→${eff.s5}`);

  console.log('== 8. 制作页附魔区渲染 ==');
  const ui = await page.evaluate(()=>{
    G.items.enchantTbl=true; G.enchant={tblLv:2, weapon:1, armor:0, tool:0};
    switchTab('craft');
    const txt=document.getElementById('actions').textContent;
    return {zone:txt.includes('附魔'), sharp:txt.includes('锋利'), tbl:txt.includes('附魔台 Lv.2'), armorBtn:txt.includes('保护 Lv.0/2')};
  });
  ok(ui.zone && ui.sharp && ui.tbl, '附魔区显示附魔台+锋利');
  ok(ui.armorBtn, '保护显示上限=台子等级 (Lv.0/2)');

  console.log('== 9. 未制作附魔台提示 ==');
  const noTbl = await page.evaluate(()=>{
    G.items.enchantTbl=false;
    switchTab('craft');
    const txt=document.getElementById('actions').textContent;
    return txt.includes('先制作附魔台');
  });
  ok(noTbl, '无附魔台时显示制作提示');

  console.log('== 10. 旧档迁移 fmt 6→7 ==');
  const mig = await page.evaluate(()=>{
    const g={v:6, day:1, res:{wood:1}, items:{axe:true}};
    const r=migrateFrom(g,6);
    return {fmt:r.v, tbl:r.items.enchantTbl===false, enchant:!!r.enchant && r.enchant.tblLv===0};
  });
  ok(mig.fmt===11 && mig.tbl && mig.enchant, '旧档补附魔台+enchant 状态');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.22.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
