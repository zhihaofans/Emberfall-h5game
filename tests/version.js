/* 版本号 & 旧存档兼容 专项测试 */
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

  console.log('== 1. 版本号显示 ==');
  const ver = await page.evaluate(()=>GAME_VERSION);
  ok(ver==='2.0.0', 'GAME_VERSION = '+ver);
  const startLog = await page.evaluate(()=>document.getElementById('logwrap').textContent);
  ok(startLog.includes('v'+ver), '开局日志含版本号');
  await page.evaluate(()=>openMenu());
  await new Promise(r=>setTimeout(r,200));
  const menuText = await page.evaluate(()=>document.getElementById('modalcard').textContent);
  ok(menuText.includes('v'+ver), '菜单含版本号');
  await page.evaluate(()=>closeModal());

  console.log('== 2. 新格式导出 ==');
  await page.evaluate(()=>{ G.day=5; save(); });
  await page.evaluate(()=>openExport());
  await new Promise(r=>setTimeout(r,200));
  const code = await page.evaluate(()=>document.getElementById('exportArea').value);
  ok(code.startsWith('EMBER:'), '导出前缀 EMBER:');
  await page.evaluate(()=>closeModal());

  console.log('== 3. 导入旧版 EMBER1 存档（v1.0.0 格式）==');
  // 构造一个 v1.0.0 风格的旧存档：tag=EMBER1, v=1, g 缺少部分新字段
  const oldG = {v:1, day:12, hour:6, season:1, weather:0,
    hp:60, food:40, water:55, stam:80,
    ill:false, lightWound:false, heavyWound:false,
    res:{wood:20, stone:8, food:3, cooked:0, water:2, clean:5, herb:1, metal:2, leather:0},
    items:{axe:true, knife:false, fire:true, puri:false, rod:false, trap:false, bed:false, kit:false, iron:false},
    stats:{explore:9, hunt:1, craft:2, kills:0, cook:0, days:12, events:3},
    milestones:{d3:1, d7:1}, dead:false, deathReason:''};
  const oldCode = 'EMBER1:' + await page.evaluate((g)=>btoa(unescape(encodeURIComponent(JSON.stringify({tag:'EMBER1', v:1, g})))),
    JSON.parse(JSON.stringify(oldG)));
  await page.evaluate((c)=>{
    document.getElementById('importArea') && null;
    openImport();
    setTimeout(()=>{
      document.getElementById('importArea').value=c;
      doImport();
    },50);
  }, oldCode);
  await new Promise(r=>setTimeout(r,500));
  const afterOld = await page.evaluate(()=>({day:G.day, hp:G.hp, wood:G.res.wood, axe:G.items.axe, fmt:localStorage.getItem('ember_save_v1')}));
  ok(afterOld.day===12 && afterOld.axe===true, '旧存档数据完整导入 (第'+afterOld.day+'天, 石斧保留)');
  const savedJson = JSON.parse(afterOld.fmt);
  ok(savedJson.tag==='EMBER' && savedJson.fmt===11, '落盘已升级为最新格式');
  const logTxt = await page.evaluate(()=>document.getElementById('logwrap').textContent);
  ok(/自动升级/.test(logTxt), '日志提示"旧版存档已自动升级"');

  console.log('== 4. 脏存档兜底（缺字段不崩）==');
  const dirty = await page.evaluate(()=>{
    const d={tag:'EMBER', fmt:1, g:{day:8, hp:999, res:null}}; // 缺一堆字段 + 数值越界
    const code='EMBER:'+btoa(unescape(encodeURIComponent(JSON.stringify(d))));
    openImport();
    document.getElementById('importArea').value=code;
    doImport();
    return {day:G.day, hp:G.hp, wood:G.res.wood, stam:G.stam, items:G.items.knife===false};
  });
  ok(dirty.day===8 && dirty.hp===100 && dirty.wood===4 && dirty.stam===100 && dirty.items, '脏存档被兜底修复不崩溃');

  console.log('== 5. 迁移框架（fmt=0 假想旧格式）==');
  const f0 = await page.evaluate(()=>{
    const d={tag:'EMBER', fmt:0, g:{day:3, hp:50, food:10, water:20, stam:30}};
    const code='EMBER:'+btoa(unescape(encodeURIComponent(JSON.stringify(d))));
    openImport();
    document.getElementById('importArea').value=code;
    doImport();
    return {day:G.day, hp:G.hp, fmt:G.v};
  });
  ok(f0.day===3 && f0.hp===50 && f0.fmt===11, 'fmt=0 存档迁移到最新格式 (fmt='+f0.fmt+')');

  ok(errors.length===0, '全程无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== 版本兼容测试: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
