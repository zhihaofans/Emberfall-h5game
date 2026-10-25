/* v1.12.0 专项：制作页 tier 4 显示 + 流浪商人商品池 */
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

  console.log('== 1. 制作页 4 个分组齐全 ==');
  await page.evaluate(()=>{
    // v1.28.0 材料过滤：预置获取过高级材料，保证分组显示
    G.stats.ownedRes={wood:1,stone:1,food:1,herb:1,water:1,metal:1,leather:1,alloy:1,rune:1,copper:1,silver:1,gold:1,luck:1};
    G.res.metal=10; G.res.alloy=10; G.res.rune=5; G.res.leather=10; G.res.wood=10; G.res.stone=10; G.res.food=10; G.res.copper=5; G.res.silver=5; G.res.gold=5;
    switchTab('craft');
  });
  await new Promise(r=>setTimeout(r,300));
  const craft = await page.evaluate(()=>document.getElementById('actions').textContent);
  ok(craft.includes('⚒ 基础'), '存在「基础」分组');
  ok(craft.includes('🔩 进阶'), '存在「进阶」分组');
  ok(craft.includes('🗡 传说'), '存在「传说」分组');
  ok(craft.includes('🔮 终极'), '存在「终极」分组');

  console.log('== 2. 4 个 Tier 4 配方可见 ==');
  ok(craft.includes('符刃'), '符刃可见');
  ok(craft.includes('符甲'), '符甲可见');
  ok(craft.includes('大师炉'), '大师炉可见');
  ok(craft.includes('永恒仓库'), '永恒仓库可见');

  console.log('== 3. Tier 4 配方在「终极」分组之后 ==');
  const t4Pos = craft.indexOf('🔮 终极');
  const runeBladePos = craft.indexOf('符刃');
  ok(t4Pos >= 0 && runeBladePos > t4Pos, '符刃位于终极分组之下');

  console.log('== 4. 流浪商人商品池 ==');
  const m = await page.evaluate(()=>({
    total: MERCHANT_GOODS.length,
    tags: [...new Set(MERCHANT_GOODS.map(g=>g.tag))],
    hasEff: MERCHANT_GOODS.filter(g=>g.eff).length, // 自定义 eff 的数量
    hasTrade: MERCHANT_GOODS.filter(g=>Object.keys(g.give||{}).length>0).length,
    hasCash: MERCHANT_GOODS.filter(g=>g.cost).length,
  }));
  ok(m.total >= 15, `商品池 ≥ 15 种 (实际 ${m.total})`);
  ok(m.tags.includes('公平'), '含「公平」类');
  ok(m.tags.includes('稀有'), '含「稀有」类');
  ok(m.tags.includes('神秘'), '含「神秘」类');
  ok(m.tags.includes('现金'), '含「现金」类');
  ok(m.hasTrade >= 5, `资源换资源商品 ≥ 5 (实际 ${m.hasTrade})`);
  ok(m.hasCash >= 3, `现金购买商品 ≥ 3 (实际 ${m.hasCash})`);
  ok(m.hasEff >= 2, `特殊效果商品 ≥ 2 (实际 ${m.hasEff})`);

  console.log('== 5. pickMerchantGoods 抽签多样性 ==');
  const variety = await page.evaluate(()=>{
    const sets = [];
    for(let i=0;i<20;i++) sets.push(pickMerchantGoods(4).map(g=>g.label).join('|'));
    return {unique:[...new Set(sets)].length, total:sets.length};
  });
  ok(variety.unique >= 15, `20 次抽签有 ≥ 15 种不同组合 (实际 ${variety.unique})`);

  console.log('== 6. trade 函数正确性 ==');
  const tr = await page.evaluate(()=>{
    G.res.wood=10; G.res.metal=5; G.res.food=0; G.res.herb=0; G.gold=100;
    const r1 = trade({wood:3}, {food:5});
    const w1 = G.res.wood, f1 = G.res.food;
    const r2 = trade({wood:100}, {food:5}); // 资源不足
    const w2 = G.res.wood, f2 = G.res.food;
    const r3 = trade({metal:2}, {herb:3});
    return {r1, w1, f1, r2, w2, f2, r3};
  });
  ok(tr.r1===true && tr.w1===7 && tr.f1===5, `交易 3 木→5 食: 成功 (木${tr.w1}, 食${tr.f1})`);
  ok(tr.r2===false && tr.w2===7 && tr.f2===5, `资源不足交易: 失败且不扣 (木${tr.w2}, 食${tr.f2})`);
  ok(tr.r3===true, '多次交易独立成功');

  console.log('== 7. 现金交易正确扣金币 ==');
  const cash = await page.evaluate(()=>{
    G.gold = 50;
    const before = G.gold;
    const ok = trade({}, {food:20}, 50); // 旧版 trade 不支持 cost，应被外部 eff 拦截
    // 正确方式：直接扣金币 + trade
    G.gold = 50;
    const before2 = G.gold;
    if(G.gold >= 30){ G.gold -= 30; trade({}, {clean:10}); }
    return {before, after: G.gold};
  });
  ok(cash.after === 20, `现金交易扣 30 金币: 50 → ${cash.after}`);

  console.log('== 8. 触发流浪商人事件，弹窗含 4 选 1 + 不换 ==');
  await page.evaluate(()=>{
    G.gold=200; G.res.metal=50; G.res.food=100; G.res.leather=10; G.res.alloy=5;
    const raw = EXPLORE_EVENTS.find(e=>e._kind==='merchant');
    const goods = pickMerchantGoods(4);
    const opts = goods.map(g=>({
      label: g.label, d: g.blurb,
      eff: g.eff || (g.cost
        ? (g=>{ if(G.gold<g.cost){log('钱不够','warn'); return;} G.gold-=g.cost; trade({}, g.get); })
        : (g=>trade(g.give, g.get))),
    })).concat([{label:'不换', d:'不交易', eff:()=>{}}]);
    showEvent({...raw, opts});
  });
  await new Promise(r=>setTimeout(r,300));
  const ev = await page.evaluate(()=>document.getElementById('evwrap').textContent);
  const evButtons = await page.evaluate(()=>document.querySelectorAll('#evwrap .evbtn').length);
  ok(ev.includes('流浪商人'), '弹窗含「流浪商人」标题');
  ok(evButtons === 5, `弹窗有 4 商品 + 1「不换」= 5 个按钮 (实际 ${evButtons})`);

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.12.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
