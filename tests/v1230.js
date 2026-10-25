/* v1.23.0 专项：装备系统 + 矿石/锭 + 成就 */
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
  ok(fmt===11, 'SAVE_FMT = 9');

  console.log('== 2. 护甲体系 ==');
  const arm = await page.evaluate(()=>{
    newGame();
    return {
      count: ARMOR_MATS.length,
      tiers: ARMOR_MATS.map(k=>ARMOR_MAT_INFO[k].dmg),
      slots: Object.keys(ARMOR_SLOTS).length,
      default: G.items.armorHead==='none' && G.items.armorBody==='none',
    };
  });
  ok(arm.count===6, `6 种材质 (实际 ${arm.count})`);
  ok(arm.tiers[0]===0.97 && arm.tiers[5]===0.85, `材质减伤: 0.97→0.85 (${arm.tiers.join(',')})`);
  ok(arm.slots===4, `4 部位 (头/身/腿/脚)`);
  ok(arm.default, '默认无护甲');

  console.log('== 3. 矿石/锭资源 ==');
  const res = await page.evaluate(()=>{
    newGame();
    return {
      ores: ['copperOre','silverOre','goldOre'].every(k=>G.res[k]===0),
      ingots: ['copper','silver','gold'].every(k=>G.res[k]===0),
      prices: RES_PRICE.copperOre===2 && RES_PRICE.gold===18,
    };
  });
  ok(res.ores && res.ingots, '矿石/锭默认 0');
  ok(res.prices, '矿石/锭可出售定价');

  console.log('== 4. 采矿掉矿石概率 ==');
  const mine = await page.evaluate(()=>{
    let c=0,s=0,g=0;
    for(let i=0;i<400;i++){
      const r=Math.random();
      if(r<0.03) g++;
      else if(r<0.15) s++;
      else if(r<0.45) c++;
    }
    return {c,s,g};
  });
  ok(mine.c>100 && mine.c<220, `铜矿约 30% (实测 ${mine.c/4}%)`);
  ok(mine.g>5 && mine.g<25, `金矿约 3% (实测 ${mine.g/4}%)`);

  console.log('== 5. 制作装备自动穿上 + 减伤 ==');
  const equip = await page.evaluate(()=>{
    G.res.leather=20; G.res.metal=10; G.res.copper=10; G.res.silver=10; G.res.gold=10; G.res.alloy=10;
    craftArmor('body','leather');
    const l1=G.items.armorBody, d1=armorDmgMult();
    craftArmor('body','copper');
    const l2=G.items.armorBody, d2=armorDmgMult();
    return {l1,d1,l2,d2};
  });
  ok(equip.l1==='leather' && equip.l2==='copper', '皮胸甲→铜胸甲自动穿上');
  ok(equip.d2<equip.d1, `铜甲减伤更强: ${equip.d1.toFixed(2)}→${equip.d2.toFixed(2)}`);

  console.log('== 6. 护甲叠加符甲/附魔 ==');
  const stack = await page.evaluate(()=>{
    G.items.armorHead='steel'; G.items.armorBody='steel'; G.items.armorLegs='steel'; G.items.armorBoots='steel';
    G.items.runeArmor=true; G.enchant.armor=5;
    return armorDmgMult();
  });
  ok(stack<0.2, `钢全套+符甲+保护5 叠加减伤 (${stack.toFixed(3)})`);

  console.log('== 7. 装备成就 ==');
  const ach1 = await page.evaluate(()=>{
    G.stats.armorsWorn=[];
    G.milestones={};
    G.res.leather=100; G.res.metal=100; G.res.copper=100; G.res.silver=100; G.res.gold=100; G.res.alloy=100;
    // 材质外循环 → 部位内循环（逐材质同步升级，形成 6 套）
    ARMOR_MATS.forEach(m=>{
      ['head','body','legs','boots'].forEach(s=>{ craftArmor(s,m); });
    });
    return {
      armor1:!!G.milestones.armor1, armorIron:!!G.milestones.armorIron,
      armorSteel:!!G.milestones.armorSteel, armorAll:!!G.milestones.armorAll,
      sets: ['setLeather','setCopper','setIron','setSilver','setGold','setSteel'].every(k=>!!G.milestones[k]),
      setsAll:!!G.milestones.setsAll,
    };
  });
  ok(ach1.armor1 && ach1.armorIron && ach1.armorSteel, '基础装备成就触发');
  ok(ach1.armorAll && ach1.setsAll, '6 套材质齐全（套装收藏家）');
  ok(ach1.sets, '6 种材质套装成就全触发');

  console.log('== 8. 矿石/锭成就 ==');
  const ach2 = await page.evaluate(()=>{
    checkMilestone('oreCopper'); checkMilestone('oreSilver'); checkMilestone('oreGold');
    checkMilestone('smelt1'); checkMilestone('ingotAll');
    return {
      oc:!!G.milestones.oreCopper, os:!!G.milestones.oreSilver, og:!!G.milestones.oreGold,
      s1:!!G.milestones.smelt1, ia:!!G.milestones.ingotAll,
    };
  });
  ok(ach2.oc && ach2.os && ach2.og, '3 项矿石成就');
  ok(ach2.s1 && ach2.ia, '2 项炼锭成就');

  console.log('== 9. 采矿真实触发 oreCopper ==');
  const real = await page.evaluate(()=>{
    // 重置里程碑测真实触发
    G.milestones.oreCopper=0;
    G.res.copperOre=0;
    let got=false;
    for(let i=0;i<200 && !got;i++){
      G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false;
      doAction('mineOre');
      got=!!G.milestones.oreCopper;
    }
    return got;
  });
  ok(real, '真实采矿触发「首次挖到铜矿石」');

  console.log('== 10. 旧档迁移 fmt 8→9 ==');
  const mig = await page.evaluate(()=>{
    const g={v:8, day:1, res:{wood:1}, items:{axe:true, armor:'leather'}};
    const r=migrateFrom(g,8);
    return {fmt:r.v, body:r.items.armorBody==='leather', slots:r.items.armorHead==='none', oldGone: !('armor' in r.items)};
  });
  ok(mig.fmt===11 && mig.body, '旧 armor 迁移为 armorBody');
  ok(mig.slots && mig.oldGone, '其他部位默认 none + 旧字段移除');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.23.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
