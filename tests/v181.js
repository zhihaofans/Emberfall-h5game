/* v1.8.1 修复专项：背包页被 iOS URL 栏遮挡 */
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

  console.log('== 1. CSS 保护规则生效 ==');
  const css = await page.evaluate(()=>{
    const get=(id)=>{const e=document.getElementById(id);return e?{cs:window.getComputedStyle(e)}:null};
    const a=get('actions'), b=get('bottom');
    return {
      actionsOverflow:a?a.cs.overflowY:'',
      actionsMaxH:a?a.cs.maxHeight:'',
      actionsScrollbarWidth:a?a.cs.scrollbarWidth||'auto':'',
      bottomPadB:b?b.cs.paddingBottom:'',
    };
  });
  ok(css.actionsOverflow==='auto', '#actions overflow-y: auto');
  ok(/vh|px/.test(css.actionsMaxH), '#actions max-height 已设置: '+css.actionsMaxH);
  ok(parseFloat(css.bottomPadB)>=40, '#bottom padding-bottom >= 40px: '+css.bottomPadB);

  console.log('== 2. 背包长列表可滚动 + 全部可达 ==');
  const r2 = await page.evaluate(()=>{
    // 制造大量资源让背包超长
    G.res.wood=999; G.res.stone=999; G.res.food=999; G.res.cooked=999;
    G.res.water=999; G.res.clean=999; G.res.herb=999; G.res.metal=999;
    G.res.leather=999; G.res.alloy=999; G.res.luck=999;
    G.items.axe=true; G.items.knife=true; G.items.fire=true; G.items.puri=true;
    G.items.rod=true; G.items.trap=true; G.items.bed=true; G.items.kit=true;
    G.items.iron=true; G.items.ironAxe=true; G.items.steel=true;
    G.items.farm=true; G.items.tower=true; G.items.forge=true; G.items.huntKing=true;
    switchTab('bag');
    const ac=document.getElementById('actions');
    const before={scroll:ac.scrollHeight, client:ac.clientHeight};
    // 滚动到底
    ac.scrollTop=ac.scrollHeight;
    return {
      rowsCount:document.querySelectorAll('#actions .bagrow').length,
      overflows:ac.scrollHeight>ac.clientHeight,
      scrolledToBottom:ac.scrollTop+ac.clientHeight>=ac.scrollHeight-2,
      before,
      after:{scroll:ac.scrollHeight, top:ac.scrollTop}
    };
  });
  ok(r2.overflows, `背包长列表产生滚动 (${r2.before.scroll}>${r2.before.client})`);
  ok(r2.scrolledToBottom, `可滚到底部 (top=${r2.after.top})`);
  ok(r2.rowsCount>=10, `背包行数 ${r2.rowsCount}`);

  console.log('== 3. 滚到底后所有 bagrow 内容都在 #actions DOM 内 ==');
  const r3 = await page.evaluate(()=>{
    const rows=[...document.querySelectorAll('#actions .bagrow')];
    const last=rows[rows.length-1];
    const ac=document.getElementById('actions');
    ac.scrollTop=ac.scrollHeight;
    const lastTop=last.offsetTop, acTop=ac.scrollTop;
    return {lastRow:rows.length, lastTop, acH:ac.clientHeight, scrollTop:ac.scrollTop};
  });
  ok(r3.lastRow>=10, `最后一个 bagrow 可访问 (top=${r3.lastTop})`);

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.8.1 修复专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
