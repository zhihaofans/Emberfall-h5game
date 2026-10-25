/* v1.9.1 修复专项：幸运方块日志模板字符串 */
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

  console.log('== 1. 反复开启幸运方块，6 个有 bug 的事件都不再出现 ${} ==');
  // 强制所有事件都触发几次，验证日志文本
  const badEvents=['金属富矿','皮革大礼','纯净水泉','食物满仓','合金之心','珍稀草药'];
  const seen = {};
  // 直接调用每个事件的 eff
  const samples = await page.evaluate(()=>{
    const out={};
    const lucks=G.res.luck||0;
    LUCK_EVENTS.forEach(e=>{
      // 暂存 logBuffer，注入资源确保事件成功
      logBuffer=[];
      // 重置 G 部分状态避免 hp 太低
      const hp0=G.hp, gold0=G.gold;
      G.hp=100; G.gold=0;
      try{ e.eff(G); }catch(err){}
      const txt=logBuffer.map(l=>l.m).join('|');
      out[e.name]=txt;
      G.hp=hp0; G.gold=gold0;
    });
    return out;
  });
  for(const name of badEvents){
    const txt=samples[name]||'';
    ok(!txt.includes('${RES_NAMES'), `${name} 日志无未解析的 \${} (${txt.slice(0,80)})`);
  }

  console.log('== 2. 6 个事件实际显示资源名（图标+名字）==');
  ok(samples['金属富矿'].includes('🔩金属'), `金属富矿含 ⚙️合金？${samples['金属富矿'].slice(0,60)}`.replace('⚙️合金','🔩金属'));
  ok(samples['皮革大礼'].includes('👜皮革'), `皮革大礼含 👜皮革`);
  ok(samples['纯净水泉'].includes('🚰净水'), `纯净水泉含 🚰净水`);
  ok(samples['食物满仓'].includes('🍖生食'), `食物满仓含 🍖生食`);
  ok(samples['合金之心'].includes('⚙️合金'), `合金之心含 ⚙️合金`);
  ok(samples['珍稀草药'].includes('🌿草药'), `珍稀草药含 🌿草药`);

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.9.1 修复专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
