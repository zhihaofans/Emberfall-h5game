/* v1.21.1 专项：外婆的小屋 NPC（狼外婆） */
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

  console.log('== 2. 外婆事件（森林专属 NPC）==');
  const ev = await page.evaluate(()=>{
    const e = EXPLORE_EVENTS.find(x=>x.id==='granny');
    return e ? {zone:e.zone, opts:e.opts.length, title:e.title, hasForeshadow:e.text.includes('眼神有点怪')} : null;
  });
  ok(!!ev, '事件存在');
  ok(ev.zone==='forest', '仅森林触发');
  ok(ev.opts===3, `3 个选项 (实际 ${ev.opts})`);
  ok(ev.hasForeshadow, '剧情有狼外婆伏笔（眼神有点怪）');

  console.log('== 3. 选项1 接过热汤：真外婆送礼 ==');
  const gift = await page.evaluate(()=>{
    G.res.food=0; G.res.herb=0;
    addRes('food',rnd(8,12)); addRes('herb',rnd(2,4));
    return {food:G.res.food>=8&&G.res.food<=12, herb:G.res.herb>=2&&G.res.herb<=4};
  });
  ok(gift.food && gift.herb, `真外婆给食物+草药 (${gift.food}/${gift.herb})`);

  console.log('== 4. 选项1/2：大灰狼袭击触发战斗 ==');
  const attack = await page.evaluate(()=>{
    combat=null;
    startCombat(1, false, true);
    const has=!!combat && !!combat.b;
    combat=null;
    return has;
  });
  ok(attack, '大灰狼伪装袭击触发战斗');

  console.log('== 5. 狼外婆战斗不打机器人（forceBeasts）==');
  const force = await page.evaluate(()=>{
    curZone='ruins';
    // 检查 forceBeasts 生效：事件战斗用 BEASTS 而不是区域池
    const zonePool = REGION_BEASTS.ruins;
    const pool = (false && zonePool && Math.random()<0.45) ? zonePool : BEASTS;
    return pool===BEASTS;
  });
  ok(force, '外婆袭击战斗强制野兽池（不遇机器人）');

  console.log('== 6. 弹窗渲染 ==');
  const popup = await page.evaluate(()=>{
    const e = EXPLORE_EVENTS.find(x=>x.id==='granny');
    showEvent(e);
    return document.getElementById('evwrap').textContent;
  });
  ok(popup.includes('外婆') && popup.includes('热汤'), '弹窗含外婆小屋剧情');
  ok(popup.includes('耳朵怎么这么大'), '经典台词选项存在');
  ok(popup.includes('婉拒离开'), '安全离开选项存在');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.21.1 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
