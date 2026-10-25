/* v1.12.1 专项：图纸过滤 / 满时不进食 / 小屏 1 列 / release.sh */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
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
  ok(ver==='1.25.0', 'GAME_VERSION = '+ver);

  console.log('== 2. 流浪商人图纸过滤 ==');
  // 模拟所有配方已制作
  const fullFilter = await page.evaluate(()=>{
    // 暂存当前 items
    const saved = {...G.items};
    // 全部置 true
    Object.keys(RECIPES).forEach(k=>G.items[k]=true);
    const goods = pickMerchantGoods(4, G);
    // 恢复
    G.items = saved;
    return {
      count: goods.length,
      hasBlueprint: goods.some(g=>g.label.includes('随机图纸')),
      hasT4Blueprint: goods.some(g=>g.label.includes('高级图纸')),
    };
  });
  ok(!fullFilter.hasBlueprint, '全制作后「随机图纸」被过滤');
  ok(!fullFilter.hasT4Blueprint, '全制作后「高级图纸」被过滤');

  // 部分制作时图纸应出现（多次抽签至少出现一次）
  const partialFilter = await page.evaluate(()=>{
    const saved = {...G.items};
    Object.keys(RECIPES).forEach(k=>G.items[k]=true);
    G.items.axe = false; // 留 1 个未制作
    let appeared = false;
    for(let i=0;i<20;i++){
      const goods = pickMerchantGoods(4, G);
      if(goods.some(g=>g.label.includes('随机图纸') || g.label.includes('高级图纸'))){
        appeared = true; break;
      }
    }
    G.items = saved;
    return {appeared};
  });
  ok(partialFilter.appeared, '有未制作配方时 20 次抽签内图纸商品至少出现一次');

  // eff 函数：抽到 unowned 配方
  const effTest = await page.evaluate(()=>{
    const saved = {...G.items};
    Object.keys(RECIPES).forEach(k=>G.items[k]=true);
    G.items.axe = false;
    G.res.alloy = 10;
    // 模拟：执行"用 5 合金换 1 随机图纸"的 eff
    const blueprint = MERCHANT_GOODS.find(g=>g.label.includes('随机图纸'));
    const alloyBefore = G.res.alloy;
    const axeBefore = G.items.axe;
    blueprint.eff(G);
    return {
      alloyAfter: G.res.alloy,
      axeAfter: G.items.axe,
      learned: G.items.axe && G.res.alloy === alloyBefore - 5,
    };
  });
  ok(effTest.learned, `随机图纸 eff 正常学习配方: 合金 ${effTest.alloyAfter}, 石斧 ${effTest.axeAfter}`);

  console.log('== 3. 满时不进食/饮水 ==');
  const eatFull = await page.evaluate(()=>{
    G.food=100; G.water=50; G.res.cooked=5; G.res.clean=5;
    const foodBefore = G.food;
    const cookedBefore = G.res.cooked;
    doAction('eat');
    return {food: G.food, cooked: G.res.cooked, foodBefore, cookedBefore};
  });
  ok(eatFull.food === 100 && eatFull.cooked === 5, `饱食满时进食被拦截: food=${eatFull.food}, cooked=${eatFull.cooked}`);

  const drinkFull = await page.evaluate(()=>{
    G.food=50; G.water=100; G.res.cooked=5; G.res.clean=5;
    const waterBefore = G.water;
    const cleanBefore = G.res.clean;
    doAction('drink');
    return {water: G.water, clean: G.res.clean};
  });
  ok(drinkFull.water === 100 && drinkFull.clean === 5, `水分满时饮水被拦截: water=${drinkFull.water}, clean=${drinkFull.clean}`);

  // 不满时应正常
  const eatNormal = await page.evaluate(()=>{
    G.food=80; G.water=50; G.res.cooked=5;
    doAction('eat');
    return {food: G.food};
  });
  ok(eatNormal.food > 80, `不满时进食正常: food ${80}→${eatNormal.food}`);

  console.log('== 4. 小屏 2 列布局（v1.12.2 优化：从 1 列改为 2 列）==');
  const layout = await page.evaluate(()=>{
    const btns = document.querySelectorAll('#actions .actbtn');
    const first = btns[0], second = btns[1];
    return {
      firstW: first?first.getBoundingClientRect().width:0,
      secondW: second?second.getBoundingClientRect().width:0,
      firstY: first?first.getBoundingClientRect().top:0,
      secondY: second?second.getBoundingClientRect().top:0,
      winW: window.innerWidth,
    };
  });
  ok(layout.firstW > 140 && layout.firstW < 200, `按钮宽 ${layout.firstW.toFixed(0)}px，2 列布局（窗口 ${layout.winW}px）`);
  ok(Math.abs(layout.firstY - layout.secondY) < 5, `第 1/2 个按钮同行: top ${layout.firstY.toFixed(0)} vs ${layout.secondY.toFixed(0)}`);

  // 桌面大屏仍 3 列
  await page.setViewport({width:1024,height:768});
  await new Promise(r=>setTimeout(r,200));
  const desktop = await page.evaluate(()=>{
    const btn = document.querySelector('#actions .actbtn');
    return btn?btn.getBoundingClientRect().width:0;
  });
  ok(desktop < 400, `桌面端按钮宽 ${desktop.toFixed(0)}px（多列布局）`);
  await page.setViewport({width:390,height:844});

  console.log('== 5. release.sh 脚本存在 ==');
  const hasSh = fs.existsSync(require('./_env').ROOT + '/release.sh');
  const isExec = hasSh ? (fs.statSync(require('./_env').ROOT + '/release.sh').mode & 0o111) !== 0 : false;
  ok(hasSh, 'release.sh 存在');
  ok(isExec, 'release.sh 有执行权限');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.12.1 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
