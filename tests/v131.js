/* v1.3.1 修复专项：废墟探索不再显示 undefined */
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

  console.log('== 1. 废墟探索不再出现 undefined ==');
  // 切到废墟，连做 30 次探索
  await page.evaluate(()=>{ curZone='ruins'; logBuffer=[]; });
  for(let i=0;i<30;i++) await page.evaluate(()=>doAction('explore'));
  const logs = await page.evaluate(()=>logBuffer.map(l=>l.m).join('|'));
  ok(!/undefined/i.test(logs), '30 次废墟探索日志无 undefined');

  console.log('== 2. 兜底防御：未注册资源 key 显示自身名 ==');
  // 直接循环调用 doExplore 内部函数，注入含未注册 key 的假区域
  const defense = await page.evaluate(()=>{
    logBuffer=[];
    const fakeZone={name:'测试区', res:[['foo',2,4],['bar',1,3]], danger:0};
    const saved=ZONES.ruins; ZONES.ruins=fakeZone;
    curZone='ruins';
    for(let i=0;i<20;i++){ try{ doExplore(); }catch(e){} }
    ZONES.ruins=saved; curZone='forest';
    return logBuffer.map(l=>l.m).join('|');
  });
  ok(/foo|bar/.test(defense), '未注册 key 显示自身名: '+defense.slice(0,120));
  ok(!/undefined/i.test(defense), '兜底后无 undefined');

  console.log('== 3. 未定价资源出售安全返回 ==');
  const safeSell = await page.evaluate(()=>{
    G.res.foo=3;
    askSell('foo'); // 未定价资源：弹窗应提示且不打开
    const modalOpen = document.getElementById('modal').classList.contains('show');
    closeModal();
    return {gold:G.gold, foo:G.res.foo, modalOpen};
  });
  ok(safeSell.foo===3 && Number.isFinite(safeSell.gold) && !safeSell.modalOpen, '未定价资源安全返回（无 NaN、不弹窗）');

  console.log('== 4. 版本与更新日志 ==');
  const ver=await page.evaluate(()=>GAME_VERSION);
  ok(ver==='1.10.0', 'GAME_VERSION = '+ver);
  await page.evaluate(()=>openChangelog());
  await new Promise(r=>setTimeout(r,200));
  const cl=await page.evaluate(()=>document.getElementById('modalcard').textContent);
  ok(/v1\.3\.1/.test(cl), '更新日志含 v1.3.1');
  ok(/undefined/.test(cl), '更新日志注明 undefined 修复');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.3.1 bug 修复专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
