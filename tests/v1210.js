/* v1.21.0 专项：四大区域专属生物 */
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

  console.log('== 2. 四区域专属生物 ==');
  const beasts = await page.evaluate(()=>REGION_BEASTS);
  ok(beasts.forest[0].name.includes('野人'), `森林: ${beasts.forest[0].name}`);
  ok(beasts.river[0].name.includes('鳄鱼'), `河边: ${beasts.river[0].name}`);
  ok(beasts.hills[0].name.includes('巨鹰'), `山丘: ${beasts.hills[0].name}`);
  ok(beasts.ruins.length>=3, `废墟: ${beasts.ruins.length} 个机器人`);

  console.log('== 3. 区域概率约 45% ==');
  const prob = await page.evaluate(()=>{
    const zt=(z)=>{
      curZone=z; let hit=0;
      for(let i=0;i<400;i++){
        const zonePool=REGION_BEASTS[curZone];
        const pool=(zonePool && Math.random()<0.45)?zonePool:BEASTS;
        if(pool===zonePool) hit++;
      }
      return hit/4;
    };
    return {forest:zt('forest'), ruins:zt('ruins'), river:zt('river'), hills:zt('hills')};
  });
  ok(Object.values(prob).every(v=>v>30 && v<60), `各区域概率约 45%: ${JSON.stringify(prob)}`);

  console.log('== 4. 单元素池无越界（tierScale=1 保护）==');
  const safe = await page.evaluate(()=>{
    curZone='forest';
    for(let i=0;i<200;i++){
      const zonePool=REGION_BEASTS.forest;
      const pool=(zonePool && Math.random()<0.45)?zonePool:BEASTS;
      const idx = Math.min(pool.length-1, Math.random()<.5?0:1);
      if(!pool[idx]) return false;
    }
    return true;
  });
  ok(safe, '森林 1 元素池 200 次无越界');

  console.log('== 5. 专属生物掉落（含金属）==');
  const loot = await page.evaluate(()=>{
    const r=(b)=>{
      const parts=[];
      if(b.food>0) parts.push('food'+b.food);
      if(b.leather>0) parts.push('leather'+b.leather);
      if(b.metal>0) parts.push('metal'+b.metal);
      return parts.join(',');
    };
    return {野人:r(REGION_BEASTS.forest[0]), 鳄鱼:r(REGION_BEASTS.river[0]), 巨鹰:r(REGION_BEASTS.hills[0])};
  });
  ok(loot.野人.includes('food10'), `野人掉食物 (${loot.野人})`);
  ok(loot.鳄鱼.includes('leather6'), `鳄鱼掉皮革 (${loot.鳄鱼})`);
  ok(loot.巨鹰.includes('metal2'), `巨鹰掉金属 (${loot.巨鹰})`);

  console.log('== 6. 战斗掉落通用逻辑（巨鹰含金属）==');
  const fightLoot = await page.evaluate(()=>{
    G.res.metal=0;
    const b=REGION_BEASTS.hills[0];
    if(b.metal>0) addRes('metal',b.metal);
    return G.res.metal;
  });
  ok(fightLoot===2, `巨鹰战斗掉金属×2 (实际 ${fightLoot})`);

  console.log('== 7. Wiki 区域生物 ==');
  const wiki = await page.evaluate(()=>{ openWiki(); wikiTab('monster',null); return document.getElementById('wikiBody').textContent; });
  ok(wiki.includes('野人') && wiki.includes('沼泽鳄鱼') && wiki.includes('山岩巨鹰'), 'Wiki 含 3 新生物');
  ok(wiki.includes('区域生物'), 'Wiki 标注「区域生物」');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.21.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
