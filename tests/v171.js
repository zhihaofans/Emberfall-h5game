/* v1.7.1 修复专项：批量出售弹窗退出 + 商店余额实时更新 */
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

  console.log('== 1. 批量出售后弹窗正常退出 ==');
  const r1 = await page.evaluate(()=>{
    G.res.wood=50;
    askSell('wood');
    setSellQty('all');
    confirmSell();
    const modalClosed = !document.getElementById('modal').classList.contains('show');
    const bodyOverflow = document.body.style.overflow;
    const focused = document.activeElement ? document.activeElement.tagName : 'none';
    return {modalClosed, bodyOverflow, focused, gold:G.gold, wood:G.res.wood};
  });
  ok(r1.modalClosed, '批量出售后弹窗已关闭');
  ok(r1.bodyOverflow==='', '背景滚动已解锁');
  ok(r1.focused!=='INPUT', '输入框已失焦 (焦点在 '+r1.focused+')');
  ok(r1.gold===50 && r1.wood===0, `交易正确 (金币${r1.gold}/木材${r1.wood})`);
  // 弹窗关闭后仍可正常行动
  await page.evaluate(()=>{ G.stam=100; G.hour=8; });
  const canAct = await page.evaluate(()=>{ doAction('chop'); return G.res.wood>0; });
  ok(canAct, '出售后游戏操作正常');

  console.log('== 2. 弹窗打开时背景锁定 ==');
  const lock = await page.evaluate(()=>{
    G.res.wood=10;
    askSell('wood');
    const locked=document.body.style.overflow==='hidden';
    closeModal();
    const unlocked=document.body.style.overflow==='';
    return {locked, unlocked};
  });
  ok(lock.locked && lock.unlocked, '打开锁定/关闭解锁');

  console.log('== 3. 商店余额实时更新 ==');
  const shop = await page.evaluate(()=>{
    G.gold=40;
    openShop();
    const before=document.getElementById('shopGold').textContent;
    buyItem('herb'); // 12
    const after1=document.getElementById('shopGold').textContent;
    const herbBtn=document.getElementById('shopBtn_herb');
    const leatherBtn=document.getElementById('shopBtn_leather'); // 22
    const state1={herbDisabled:herbBtn.disabled, leatherDisabled:leatherBtn.disabled};
    buyItem('leather'); // 22 → 剩6
    const after2=document.getElementById('shopGold').textContent;
    const state2={leatherDisabled:document.getElementById('shopBtn_leather').disabled,
                  herbDisabled:document.getElementById('shopBtn_herb').disabled,
                  metalDisabled:document.getElementById('shopBtn_metal').disabled};
    closeModal();
    return {before, after1, after2, state1, state2, gold:G.gold};
  });
  ok(shop.before==='💰40', '初始余额显示 40');
  ok(shop.after1==='💰28', `购买草药后余额 ${shop.before} → ${shop.after1}`);
  ok(shop.after2==='💰6', `再买皮革后余额 → ${shop.after2}`);
  ok(shop.state1.leatherDisabled===false, '余额40时可买皮革(22)');
  ok(shop.state2.metalDisabled===true && shop.state2.leatherDisabled===true, '余额6时金属(16)/皮革(22)按钮自动禁用');
  ok(shop.gold===6, `最终金币 ${shop.gold}`);

  console.log('== 4. 版本与更新日志 ==');
  const ver=await page.evaluate(()=>GAME_VERSION);
  ok(ver==='1.10.0', 'GAME_VERSION = '+ver);
  await page.evaluate(()=>openChangelog());
  await new Promise(r=>setTimeout(r,200));
  const cl=await page.evaluate(()=>document.getElementById('modalcard').textContent);
  ok(/v1\.7\.1/.test(cl), '更新日志含 v1.7.1');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.7.1 bug 修复专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
