/* v1.19.0 专项：月圆之夜 + 怪物进化 */
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

  console.log('== 2. 月圆判定（每 15 天）==');
  const moon = await page.evaluate(()=>{
    G.day=15; const f15=isFullMoon();
    G.day=16; const f16=isFullMoon();
    G.day=30; const f30=isFullMoon();
    G.day=45; const f45=isFullMoon();
    return {f15, f16, f30, f45};
  });
  ok(moon.f15 && moon.f30 && moon.f45, '第 15/30/45 天为月圆');
  ok(!moon.f16, '第 16 天非月圆');

  console.log('== 3. 月圆进化数据 ==');
  const mb = await page.evaluate(()=>MOON_BEASTS);
  ok(mb.dog.name.includes('嗜血凶犬') && mb.dog.hp===35 && mb.dog.atk===15, '嗜血凶犬 HP35 ATK15');
  ok(mb.wolf.name.includes('月狼') && mb.wolf.hp===55 && mb.wolf.atk===22, '月狼 HP55 ATK22');
  ok(mb.dog.metal>=1 && mb.wolf.metal>=2, '进化怪掉金属');

  console.log('== 4. 月圆日战斗全进化 ==');
  const evo = await page.evaluate(()=>{
    G.day=15; curZone='forest';
    let evolved=0, total=0;
    for(let i=0;i<300;i++){
      const idx=Math.random()<.5?0:1;
      let bb=BEASTS[idx];
      if(isFullMoon() && bb.name==='野狗') bb=Object.assign({},bb,MOON_BEASTS.dog);
      else if(isFullMoon() && bb.name==='灰狼') bb=Object.assign({},bb,MOON_BEASTS.wolf);
      total++;
      if(bb.name.includes('凶犬')||bb.name.includes('月狼')) evolved++;
    }
    return {evolved, total};
  });
  ok(evo.evolved===evo.total, `月圆日战斗 100% 进化 (${evo.evolved}/${evo.total})`);

  console.log('== 5. 非月圆不进化 ==');
  const noEvo = await page.evaluate(()=>{
    G.day=16;
    let evolved=false;
    for(let i=0;i<300;i++){
      const idx=Math.random()<.5?0:1;
      let bb=BEASTS[idx];
      if(isFullMoon() && bb.name==='野狗') bb=Object.assign({},bb,MOON_BEASTS.dog);
      else if(isFullMoon() && bb.name==='灰狼') bb=Object.assign({},bb,MOON_BEASTS.wolf);
      if(bb.name.includes('凶犬')||bb.name.includes('月狼')) evolved=true;
    }
    return evolved;
  });
  ok(!noEvo, '非月圆日无进化');

  console.log('== 6. 月圆夜弹窗 ==');
  const evPopup = await page.evaluate(()=>{
    G.day=15;
    showMoonNightEvent();
    return {txt:document.getElementById('evwrap').textContent, btns:document.querySelectorAll('#evwrap .evbtn').length};
  });
  ok(evPopup.txt.includes('月圆之夜'), '弹窗标题「月圆之夜」');
  ok(evPopup.btns===3, `3 个选项 (实际 ${evPopup.btns})`);

  console.log('== 7. 三个选项处理 ==');
  const opt = await page.evaluate(()=>{
    G.stam=100; G.hp=100;
    G.day=15;
    resolveMoonNight(0); // 躲藏
    const hide={stam:G.stam};
    G.res.food=10;
    resolveMoonNight(2); // 扔食物
    const feed={food:G.res.food, combat:!!combat};
    combat=null;
    resolveMoonNight(1); // 主动出击 → startCombat
    const fight=!!combat && combat.b;
    return {hide, feed, fight};
  });
  ok(opt.hide.stam===90, `躲藏精力-10 (${opt.hide.stam})`);
  ok(opt.feed.food===5, `扔食物消耗5 (剩${opt.feed.food})`);
  ok(opt.fight, '主动出击触发战斗');

  console.log('== 8. 主动出击打的是进化狼（月圆日）==');
  const fightWolf = await page.evaluate(()=>{
    G.day=15;
    resolveMoonNight(1);
    const name=combat.b.name;
    combat=null;
    return name;
  });
  ok(fightWolf.includes('凶犬')||fightWolf.includes('月狼'), `月圆出击遭遇进化怪: ${fightWolf}`);

  console.log('== 9. Wiki 含月圆说明 ==');
  const wiki = await page.evaluate(()=>{ openWiki(); wikiTab('monster',null); return document.getElementById('wikiBody').textContent; });
  ok(wiki.includes('月圆进化'), 'Wiki 含「月圆进化」');
  ok(wiki.includes('月狼') && wiki.includes('嗜血凶犬'), 'Wiki 含两种进化形态');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.19.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
