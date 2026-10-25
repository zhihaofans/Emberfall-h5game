/* v1.3.0 专项：制作材料库存显示 + 更新日志 */
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

  console.log('== 1. 制作页材料库存显示 ==');
  // 默认开局库存：wood4 stone2，石斧需 stone5 wood3 → 都不足
  await page.evaluate(()=>switchTab('craft'));
  await new Promise(r=>setTimeout(r,200));
  const craftInfo = await page.evaluate(()=>{
    const btns=[...document.querySelectorAll('#actions .actbtn')];
    const axe=btns.find(b=>b.textContent.includes('石斧'));
    const fire=btns.find(b=>b.textContent.includes('火堆'));
    return {
      axeHtml: axe? axe.querySelector('.sub').innerHTML : '',
      axeTxt: axe? axe.querySelector('.sub').textContent : '',
      fireTxt: fire? fire.querySelector('.sub').textContent : '',
    };
  });
  // 石斧: 石头5(2) 木材3(4)
  ok(/石头<span style="color:var\(--bad\);font-weight:700">5<\/span><span style="opacity:.65">\(2\)<\/span>/.test(craftInfo.axeHtml), '石头需求5红色+库存(2)');
  ok(/木材3<span style="opacity:.65">\(4\)<\/span>/.test(craftInfo.axeHtml), '木材需求3充足为白色+库存(4)');
  ok(craftInfo.axeTxt.includes('石头5(2)') && craftInfo.axeTxt.includes('木材3(4)'), '文本含括号库存: '+craftInfo.axeTxt);

  // 库存充足后数字恢复普通色
  const enough = await page.evaluate(()=>{
    G.res.stone=10; G.res.wood=10;
    switchTab('craft'); switchTab('craft');
    const btn=[...document.querySelectorAll('#actions .actbtn')].find(b=>b.textContent.includes('石斧'));
    return btn.querySelector('.sub').innerHTML;
  });
  ok(!enough.includes('var(--bad)'), '库存充足时无红色标记');

  console.log('== 2. 更新日志 ==');
  await page.evaluate(()=>openMenu());
  await new Promise(r=>setTimeout(r,200));
  const menuTxt = await page.evaluate(()=>document.getElementById('modalcard').textContent);
  ok(menuTxt.includes('更新日志'), '菜单含更新日志入口');
  await page.evaluate(()=>{ closeModal(); openChangelog(); });
  await new Promise(r=>setTimeout(r,200));
  const logTxt = await page.evaluate(()=>document.getElementById('modalcard').textContent);
  ok(/v1\.3\.[01]/.test(logTxt) && /v1\.2\.0/.test(logTxt) && /v1\.0\.0/.test(logTxt), '更新日志含 1.3.x/1.2.0/1.0.0');
  ok(logTxt.includes('放置自动循环') && logTxt.includes('本地存档'), '更新日志内容正确');
  ok(/末日余烬/.test(logTxt), '更新日志标题正常');
  await page.evaluate(()=>closeModal());

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.3.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
