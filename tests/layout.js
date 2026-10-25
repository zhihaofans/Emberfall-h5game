/* 布局优化验证：区域高度测量 + 折叠功能 */
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

  const m = await page.evaluate(()=>{
    const g=(id)=>{const e=document.getElementById(id);return e?e.getBoundingClientRect().height:0};
    return {win:window.innerHeight, status:g('statusbar'), bottom:g('bottom'), log:g('logwrap'),
            actions:g('actions'), zone:g('zonebar'), tabs:g('tabs')};
  });
  console.log('  窗口', m.win, '状态栏', m.status.toFixed(0), '日志', m.log.toFixed(0), '底部', m.bottom.toFixed(0));
  console.log('  底部明细: tabs', m.tabs.toFixed(0), 'zonebar', m.zone.toFixed(0), 'actions', m.actions.toFixed(0));
  const logRatio = m.log / m.win;
  ok(logRatio > 0.32, `日志区占比 ${(logRatio*100).toFixed(0)}% (>32%, 2列布局保留足够日志)`);
  ok(m.bottom < 600, `底部面板 ${m.bottom.toFixed(0)}px (<600px, 2列可滚动)`);
  ok(m.status < 90, `状态栏 ${m.status.toFixed(0)}px (<90px)`);
  ok(m.log > 250, `日志区 ${m.log.toFixed(0)}px (>250px, 不消失)`);

  // 行动按钮 2 列布局（v1.12.2 小屏优化：介于 1 列和 3 列之间的平衡点）
  const cols = await page.evaluate(()=>{
    const btn=document.querySelector('#actions .actbtn');
    return btn?btn.getBoundingClientRect().width:0;
  });
  ok(cols>140 && cols<200, `按钮宽度 ${cols.toFixed(0)}px，2 列布局生效（180px 左右）`);

  await page.screenshot({path:'/tmp/s5_compact.png'});

  // 折叠功能
  await page.evaluate(()=>document.getElementById('btnFold').click());
  await new Promise(r=>setTimeout(r,200));
  const folded = await page.evaluate(()=>({
    actionsDisplay:document.getElementById('actions').style.display,
    zoneDisplay:document.getElementById('zonebar').style.display,
    logH:document.getElementById('logwrap').getBoundingClientRect().height,
    icon:document.getElementById('btnFold').textContent
  }));
  ok(folded.actionsDisplay==='none' && folded.zoneDisplay==='none', '折叠后 actions/zonebar 隐藏');
  ok(folded.icon==='▴', '折叠图标切换为 ▴');
  const foldedRatio = folded.logH / 844;
  ok(foldedRatio > 0.75, `折叠后日志占比 ${(foldedRatio*100).toFixed(0)}% (>75%)`);
  await page.screenshot({path:'/tmp/s6_folded.png'});
  // 再展开
  await page.evaluate(()=>document.getElementById('btnFold').click());
  await new Promise(r=>setTimeout(r,200));
  const expanded = await page.evaluate(()=>document.getElementById('actions').style.display!=='none');
  ok(expanded, '再次点击恢复展开');

  // 折叠状态下仍能正常行动
  await page.evaluate(()=>document.getElementById('btnFold').click());
  await page.evaluate(()=>doAction('chop'));
  const wood = await page.evaluate(()=>G.res.wood);
  ok(wood>=7, '折叠状态下行动仍生效 (木材'+wood+')');
  await page.evaluate(()=>document.getElementById('btnFold').click());

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== 布局测试: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
