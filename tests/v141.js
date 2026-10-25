/* v1.4.1 修复专项：设施停摆日志括号为空 */
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

  console.log('== 1. 全部缺料时显示真正缺少的材料 ==');
  // 捕兽夹只缺金属，金属=0 → 日志应显示「缺少材料（金属×1）」而非空括号
  const r1 = await page.evaluate(()=>{
    G.items.trap=true; G.items.puri=true; G.items.fire=true;
    G.res.metal=0; G.res.stone=0; G.res.wood=0;
    G.hour=23; G.day=5; logBuffer=[];
    nextDay();
    return logBuffer.map(l=>l.m).join('|');
  });
  ok(!/缺少材料（\s*\）/ .test(r1), '停摆日志不再出现空括号');
  ok(/缺少材料（.+金属×1）/.test(r1), '捕兽夹显示缺少材料「金属×1」');
  ok(/缺少材料（.+石头×1）/.test(r1), '净水器显示缺少材料「石头×1」');
  ok(/缺少材料（.+木材×1）/.test(r1), '火堆显示缺少材料「木材×1」');

  console.log('== 2. 部分缺料时正确提示 ==');
  // 火堆需要 wood:1，库存 wood=0 metal=5（trap 满足）→ 火堆缺料，trap 正常
  const r2 = await page.evaluate(()=>{
    G.items.trap=true; G.items.fire=true; G.items.puri=false;
    G.res.metal=5; G.res.wood=0; G.res.stone=0;
    G.hour=23; G.day=6; logBuffer=[];
    nextDay();
    return {log:logBuffer.map(l=>l.m).join('|'), offFire:G.offToday.fire, offTrap:G.offToday.trap};
  });
  ok(r2.offFire && !r2.offTrap, '火堆停摆但捕兽夹正常');
  ok(!/缺少材料（\s*\）/ .test(r2.log), '无空括号');
  ok(/火堆因缺少材料（.+木材×1）/.test(r2.log), '火堆正确提示缺木材');

  console.log('== 3. 全部不缺料时不显示警告 ==');
  const r3 = await page.evaluate(()=>{
    G.items.trap=true; G.items.fire=true; G.items.puri=true;
    G.res.metal=5; G.res.wood=5; G.res.stone=5;
    G.hour=23; G.day=7; logBuffer=[];
    nextDay();
    return {log:logBuffer.map(l=>l.m).join('|'), offFire:G.offToday.fire, offTrap:G.offToday.trap, offPuri:G.offToday.puri};
  });
  ok(!r3.offFire && !r3.offTrap && !r3.offPuri, '材料充足时无设施停摆');
  ok(!/停摆/.test(r3.log), '无停摆警告日志');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.4.1 bug 修复专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
