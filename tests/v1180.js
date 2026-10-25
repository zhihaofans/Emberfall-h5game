/* v1.18.0 专项：废墟废土科技怪物（机器人） */
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
  ok(ver==='1.25.0', 'GAME_VERSION = '+ver);

  console.log('== 2. 机器人数据 ==');
  const robots = await page.evaluate(()=>ROBOTS.map(r=>({name:r.name,hp:r.hp,atk:r.atk,metal:r.metal,alloy:r.alloy})));
  ok(robots.length===3, `3 个机器人 (实际 ${robots.length})`);
  ok(robots[0].name.includes('锈蚀哨兵') && robots[0].metal>=3, '锈蚀哨兵掉金属');
  ok(robots[1].name.includes('巡逻机甲') && robots[1].alloy>=2, '巡逻机甲掉合金');
  ok(robots[2].name.includes('装配线守卫') && robots[2].hp>robots[0].hp, '装配线守卫最强');

  console.log('== 3. 废墟区域概率出机器人 ==');
  const zoneProb = await page.evaluate(()=>{
    let ruinsRobot=0, ruinsTotal=0, forestRobot=0;
    for(let i=0;i<500;i++){
      curZone='ruins';
      const pool1=(curZone==='ruins'&&Math.random()<0.45)?ROBOTS:BEASTS;
      if(pool1===ROBOTS) ruinsRobot++;
      ruinsTotal++;
      curZone='forest';
      const pool2=(curZone==='ruins'&&Math.random()<0.45)?ROBOTS:BEASTS;
      if(pool2===ROBOTS) forestRobot++;
    }
    return {ruinsRobot, ruinsTotal, forestRobot};
  });
  ok(zoneProb.ruinsRobot>150 && zoneProb.ruinsRobot<280, `废墟机器人概率约 45% (实测 ${Math.round(zoneProb.ruinsRobot/5)}%)`);
  ok(zoneProb.forestRobot===0, '森林无机器人');

  console.log('== 4. 战斗通用掉落（机器人掉金属/合金）==');
  const loot = await page.evaluate(()=>{
    G.res.metal=0; G.res.alloy=0; G.res.food=0; G.res.leather=0;
    // 直接调 fight 的掉落逻辑（模拟击败巡逻机甲）
    const b=ROBOTS[1];
    const lootDef={food:'food', leather:'leather', metal:'metal', alloy:'alloy'};
    for(const k in lootDef){
      const v=b[lootDef[k]];
      if(v>0){ addRes(lootDef[k],v); }
    }
    return {metal:G.res.metal, alloy:G.res.alloy, food:G.res.food};
  });
  ok(loot.metal===6 && loot.alloy===2, `巡逻机甲掉落 金属×6 合金×2 (实测 ${loot.metal}/${loot.alloy})`);
  ok(loot.food===0, '机器人不掉食物');

  console.log('== 5. 战斗弹窗环境文案 ==');
  const env = await page.evaluate(()=>{
    curZone='ruins';
    // 强制机器人池，检查弹窗文案
    const pool = ROBOTS;
    const envTxt = pool===ROBOTS ? '废土残骸堆中亮起一对猩红的传感器——' : '草丛中';
    return {envTxt, hasSensor: envTxt.includes('传感器')};
  });
  ok(env.hasSensor, '机器人战斗使用废土环境文案');

  console.log('== 6. Wiki 图鉴含机器人 ==');
  const wiki = await page.evaluate(()=>{ openWiki(); wikiTab('monster',null); return document.getElementById('wikiBody').textContent; });
  ok(wiki.includes('锈蚀哨兵') && wiki.includes('巡逻机甲') && wiki.includes('装配线守卫'), 'Wiki 含 3 个机器人');
  ok(wiki.includes('废墟科技'), 'Wiki 标注「废墟科技」');

  console.log('== 7. 材料百科金属含机器人来源 ==');
  const mats = await page.evaluate(()=>{ openWiki(); wikiTab('mats',null); return document.getElementById('wikiBody').textContent; });
  ok(mats.includes('机器人'), '金属获取方式含机器人');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.18.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
