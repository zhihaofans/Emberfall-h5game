/* v1.9.0 专项：物品图标 + build code */
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

  console.log('== 1. 资源图标定义 ==');
  const icons = await page.evaluate(()=>{
    const hasIcon=(k,ch)=>RES_NAMES[k]&&RES_NAMES[k].startsWith(ch);
    return {
      wood:hasIcon('wood','🪵'), stone:hasIcon('stone','🪨'), food:hasIcon('food','🍖'),
      clean:hasIcon('clean','🚰'), herb:hasIcon('herb','🌿'), metal:hasIcon('metal','🔩'),
      luck:hasIcon('luck','🎲'), alloy:hasIcon('alloy','⚙️'), leather:hasIcon('leather','👜'),
    };
  });
  let iconOk=0; for(const k in icons) if(icons[k]) iconOk++;
  ok(iconOk===9, `9 种资源均有图标 (${iconOk}/9)`);

  console.log('== 2. 动态日志带图标 ==');
  const logIcon = await page.evaluate(()=>{
    G.items.axe=true; G.skills.chop.lvl=1; G.hour=8; G.food=100; G.water=100; G.stam=100;
    logBuffer=[];
    doAction('chop');
    doAction('mineOre');
    const txt=logBuffer.map(l=>l.m).join('|');
    return {hasWood:txt.includes('🪵木材'), hasStone:txt.includes('🪨石头'), sample:logBuffer.filter(l=>l.c==='good').map(l=>l.m).join('|')};
  });
  ok(logIcon.hasWood && logIcon.hasStone, `日志含图标: ${logIcon.sample}`);

  console.log('== 3. 背包页带图标 ==');
  await page.evaluate(()=>{ G.res.wood=5; G.res.alloy=3; G.res.luck=2; G.items.steel=true; G.items.huntKing=true; switchTab('bag'); });
  await new Promise(r=>setTimeout(r,300));
  const bagIcon = await page.evaluate(()=>{
    const rows=[...document.querySelectorAll('#actions .bagrow')].map(r=>r.textContent);
    const all=rows.join('|');
    return {
      wood:all.includes('🪵木材'), alloy:all.includes('⚙️合金'), luck:all.includes('🎲幸运方块'),
      steel:all.includes('⚔️钢刀'), huntKing:all.includes('🔱猎王刀'),
      weapon:all.includes('武器') ? rows.find(r=>r.includes('武器')) : '',
    };
  });
  ok(bagIcon.wood && bagIcon.alloy && bagIcon.luck, '背包资源行带图标');
  ok(bagIcon.steel && bagIcon.huntKing, '设施/装备行带图标');

  console.log('== 4. 制作页材料带图标 ==');
  await page.evaluate(()=>switchTab('craft'));
  await new Promise(r=>setTimeout(r,300));
  const craftIcon = await page.evaluate(()=>{
    const btns=[...document.querySelectorAll('#actions .actbtn')];
    const knife=btns.find(b=>b.textContent.includes('石刀'));
    const forge=btns.find(b=>b.textContent.includes('铁匠炉'));
    return {knifeTxt:knife?knife.querySelector('.sub').textContent:'', forgeTxt:forge?forge.querySelector('.sub').textContent:''};
  });
  ok(craftIcon.knifeTxt.includes('🪨石头') && craftIcon.knifeTxt.includes('🪵木材'), `石刀材料带图标: ${craftIcon.knifeTxt}`);
  ok(craftIcon.forgeTxt.includes('🪨') && craftIcon.forgeTxt.includes('🔩'), `铁匠炉材料带图标: ${craftIcon.forgeTxt}`);

  console.log('== 5. build code 显示 ==');
  const build = await page.evaluate(()=>{
    newGame(); // 重置开局日志
    const startLog=document.getElementById('logwrap').textContent;
    openMenu();
    const menu=document.getElementById('modalcard').textContent;
    closeModal();
    return {code:BUILD_CODE, startLog:startLog.includes('(build '+BUILD_CODE+')'), menu:menu.includes('(build '+BUILD_CODE+')')};
  });
  ok(typeof build.code==='number' && build.code>0, `BUILD_CODE = ${build.code}`);
  ok(build.startLog, '开局日志含 build code');
  ok(build.menu, '菜单含 build code');

  console.log('== 6. 商店商品带图标 ==');
  const shopIcon = await page.evaluate(()=>{
    openShop();
    const t=document.getElementById('modalcard').textContent;
    closeModal();
    return t;
  });
  ok(shopIcon.includes('🌿草药') && shopIcon.includes('🎲幸运方块'), '商店商品带图标');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.9.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
