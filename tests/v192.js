/* v1.9.2 修复专项：探索事件弹窗 + 全面扫描 */
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

  console.log('== 1. 探索事件 5 条 opts 描述均正常解析 ==');
  const r1 = await page.evaluate(()=>{
    const out={};
    EXPLORE_EVENTS.forEach(e=>{
      if(e.opts){
        e.opts.forEach((o,i)=>{
          if(/\$\{/.test(o.d||'')) out[e.name+'#'+i]=(o.d||'');
        });
      }
    });
    return out;
  });
  const bugKeys = Object.keys(r1);
  ok(bugKeys.length===0, `无未解析的 \${} 残留 (${bugKeys.length} 处)`);

  console.log('== 2. 实际打开事件弹窗，显示文案 ==');
  // 反复触发每个事件，断言文字含图标名
  const r2 = await page.evaluate(()=>{
    const out={};
    EXPLORE_EVENTS.forEach(e=>{
      e.opts && e.opts.forEach((o,i)=>{
        pendingEvent=e; showEvent(e);
        const ev=document.querySelectorAll('.evbtn .d');
        const txts=[...ev].map(el=>el.textContent).join('|');
        out[(e.id||'opt')+'_'+i]=txts;
        closeModal();
      });
    });
    return out;
  });
  ok(Object.values(r2).every(t=>!/\$\{/.test(t)), '事件弹窗描述全部无 ${}');
  const iconSample=Object.entries(r2).find(([k,v])=>/🍖|🔩|🌿/.test(v));
  ok(!!iconSample, `描述含资源图标: ${iconSample?iconSample[1].slice(0,50):'NONE'}`);

  console.log('== 3. 全面扫描 log/输出位置无 ${} 残留 ==');
  const r3 = await page.evaluate(()=>{
    // 收集所有用户可见文本里的 ${} 字面
    const samples={};
    // 触发各种事件，看日志和弹窗
    logBuffer=[];
    G.items.axe=true; G.skills.chop.lvl=1;
    for(let i=0;i<5;i++){ G.hour=8; G.food=100; G.water=100; G.stam=100; doAction('chop'); }
    samples.chop=logBuffer.map(l=>l.m).join('|');
    logBuffer=[];
    doAction('mineOre');
    samples.mine=logBuffer.map(l=>l.m).join('|');
    logBuffer=[];
    doAction('eat');
    samples.eat=logBuffer.map(l=>l.m).join('|');
    // 幸运方块全部 16 个事件
    logBuffer=[];
    LUCK_EVENTS.forEach(e=>{ try{e.eff(G)}catch(_){} });
    samples.luck=logBuffer.map(l=>l.m).join('|');
    // 卖出日志
    logBuffer=[];
    G.res.wood=10; askSell('wood'); document.getElementById('sellNum').value=3; confirmSell();
    samples.sell=logBuffer.map(l=>l.m).join('|');
    // 商店购买
    logBuffer=[];
    G.gold=999; buyItem('herb');
    samples.shop=logBuffer.map(l=>l.m).join('|');
    return samples;
  });
  let bad=0;
  for(const [k,v] of Object.entries(r3)){
    if(/\$\{/.test(v)){ bad++; console.log('  残留位置:',k,v.slice(0,100)); }
  }
  ok(bad===0, `所有日志/弹窗文案无 \${} 残留 (${bad} 处)`);

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.9.2 修复专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
