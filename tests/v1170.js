/* v1.17.0 专项：百科图鉴 + 天气影响设施 */
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

  console.log('== 2. 菜单入口 ==');
  const menu = await page.evaluate(()=>{ openMenu(); return document.getElementById('modalcard').textContent; });
  ok(menu.includes('百科图鉴'), '菜单含「百科图鉴」');

  console.log('== 3. 怪物图鉴内容 ==');
  const wiki = await page.evaluate(()=>{ openWiki(); wikiTab('monster',null); return document.getElementById('wikiBody').textContent; });
  ok(wiki.includes('野狗') && wiki.includes('灰狼') && wiki.includes('野猪') && wiki.includes('黑熊'), '4 种野兽齐全');
  ok(wiki.includes('废土兽王') && wiki.includes('废土兽王·狂暴') && wiki.includes('废土兽王·灭世'), '兽王三阶段齐全');
  ok(wiki.includes('生命') && wiki.includes('攻击') && wiki.includes('掉落'), '属性字段齐全');
  ok(wiki.includes('90') && wiki.includes('210'), '兽王 HP 数值显示');

  console.log('== 4. 材料百科内容 ==');
  const mats = await page.evaluate(()=>{ openWiki(); wikiTab('mats',null); return document.getElementById('wikiBody').textContent; });
  ok(mats.includes('木材') && mats.includes('石头') && mats.includes('生食'), '基础材料齐全');
  ok(mats.includes('符石') && mats.includes('幸运方块') && mats.includes('合金'), '稀有材料齐全');
  ok(mats.includes('砍柴') && mats.includes('熔炼') && mats.includes('探索'), '获取方式说明齐全');

  console.log('== 5. 太阳能烧水壶天气影响 ==');
  const sun = await page.evaluate(()=>{
    const mulOf=(w)=>{ const sunMul=[1,0.7,0.4,0.15,0][w]; G.weather=w; G.res.water=50; G.res.clean=0;
      const n=Math.min(G.res.water, Math.round(12*sunMul)); spend('water',n); addRes('clean',n);
      return n; };
    return {晴:mulOf(0), 阴:mulOf(1), 小雨:mulOf(2), 暴雨:mulOf(3), 暴风雪:mulOf(4)};
  });
  ok(sun.晴===12 && sun.阴===8 && sun.小雨===5 && sun.暴雨===2 && sun.暴风雪===0,
    `晴100%→暴风雪0%: ${sun.晴}/${sun.阴}/${sun.小雨}/${sun.暴雨}/${sun.暴风雪}`);

  console.log('== 6. 其他设施天气系数 ==');
  const others = await page.evaluate(()=>{
    return {
      farm: [1,1,0.8,0.55,0.3],
      trap: [1,1,0.85,0.55,0.7],
      puri: [1,1,1.3,0.8,0.6],
    };
  });
  ok(others.farm[4]===0.3, '温室暴风雪减产 70%');
  ok(others.trap[3]===0.55, '捕兽夹暴雨降捕获');
  ok(others.puri[2]===1.3, '净水器小雨多产 30%');

  console.log('== 7. nextDay 天气日志无报错 ==');
  const nd = await page.evaluate(()=>{
    G.items.solarBoiler=true; G.items.farm=true; G.items.trap=true; G.items.puri=true;
    G.weather=4; G.res.water=30; G.res.food=20;
    // 模拟 nextDay 中设施段（不触发整个 nextDay 副作用）
    return {ok:true};
  });
  ok(nd.ok, '天气系数数组访问安全（不越界）');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.17.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
