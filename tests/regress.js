/* 里程碑 bug 回归测试 */
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
  const ok=(cond,msg)=>{ if(cond){pass++;console.log('  ✅',msg||'true')} else {fail++;console.log('  ❌',msg||'false')} };
  const bad=(n,x)=>{fail++;console.log('  ❌',n,x||'')};

  // 第2天：不应出现里程碑 undefined
  const d2 = await page.evaluate(()=>{
    logBuffer=[]; G.day=2; G.milestones={}; checkMilestone(G.day);
    return logBuffer.map(l=>l.m).join('|');
  });
  ok(!/undefined/.test(d2) && d2==='', '第2天不触发里程碑 (日志: "'+d2+'")');

  // 第3天：出现"生存 3 天"
  const d3 = await page.evaluate(()=>{
    logBuffer=[]; G.day=3; checkMilestone(G.day);
    return logBuffer.map(l=>l.m).join('|');
  });
  ok(/生存 3 天/.test(d3), '第3天触发"生存 3 天" ('+d3+')');

  // 第4天：不再重复
  const d4 = await page.evaluate(()=>{
    logBuffer=[]; G.day=4; checkMilestone(G.day);
    return logBuffer.map(l=>l.m).join('|');
  });
  ok(d4==='', '第4天不再触发 ('+d4+')');

  // 第15天：一次触发 3/7/15
  const d15 = await page.evaluate(()=>{
    logBuffer=[]; G.day=15; G.milestones={}; checkMilestone(G.day);
    return logBuffer.map(l=>l.m).join('|');
  });
  ok(/生存 3 天/.test(d15)&&/生存 7 天/.test(d15)&&/生存 15 天/.test(d15)&&!/30 天/.test(d15), '第15天触发3/7/15 ('+d15+')');

  // 30天：触发 30
  const d30 = await page.evaluate(()=>{
    logBuffer=[]; G.day=30; G.milestones={}; checkMilestone(G.day);
    return logBuffer.map(l=>l.m).join('|');
  });
  ok(/生存 30 天/.test(d30), '第30天触发"生存 30 天"');

  // craft1 / kill1 仍正常
  const c = await page.evaluate(()=>{
    logBuffer=[]; G.milestones={}; checkMilestone('craft1');
    return logBuffer.map(l=>l.m).join('|');
  });
  ok(/制作第一件物品/.test(c), 'craft1 正常 ('+c+')');

  // 真实推演：从存档 day=1 连续过 2 天（第2、3天），全程无 undefined
  const full = await page.evaluate(()=>{
    logBuffer=[]; G.day=1; G.milestones={};
    G.day++; checkMilestone(G.day);   // 模拟到第2天
    G.day++; checkMilestone(G.day);   // 模拟到第3天
    return logBuffer.map(l=>l.m).join('|');
  });
  ok(!/undefined/.test(full) && /生存 3 天/.test(full), '连续推进无undefined ('+full+')');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== 回归结果: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
