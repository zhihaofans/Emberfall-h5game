const puppeteer=require('puppeteer-core');
let pass=0, fail=0;
function ok(c, n){ if(c){ pass++; console.log('✅ '+n); } else { fail++; console.log('❌ '+n); } }
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  p.on('pageerror',e=>console.log('PAGEERR:', e.message));
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));

  console.log('== 1. 主菜单 4 个按钮 ==');
  const r1 = await p.evaluate(()=>{
    const opts=doraMainOpts();
    return {count:opts.length, labels:opts.map(o=>o.label)};
  });
  ok(r1.count===4, '主菜单 4 个按钮');
  ok(r1.labels.some(l=>l.includes('送礼')) && r1.labels.some(l=>l.includes('口袋')) && r1.labels.some(l=>l.includes('闲聊')) && r1.labels.some(l=>l.includes('离开')), '主菜单 4 大类齐全');

  console.log('== 2. 送礼子菜单 4 + 返回 ==');
  const r2 = await p.evaluate(()=>{
    const opts=doraGiftOpts();
    return {count:opts.length, last:opts[opts.length-1].label, gifts:opts.slice(0,-1).map(o=>o.label)};
  });
  ok(r2.count===5, '5 个选项 (4 礼物 + 1 返回)');
  ok(r2.last.includes('返回'), '最后一项是返回');

  console.log('== 3. 口袋子菜单（数量 + 返回）==');
  const r3 = await p.evaluate(()=>{
    newGame();
    const opts=doraPocketOpts();
    return {count:opts.length, last:opts[opts.length-1].label, items:opts.slice(0,-1).filter(o=>!o.label.includes('暂无')).length};
  });
  ok(r3.last.includes('返回'), '最后一项是返回');
  ok(r3.count>=2, '至少有 1 商品 + 返回 ('+r3.count+')');

  console.log('== 4. 点击主菜单「送礼」→ 子菜单渲染 ==');
  const r4 = await p.evaluate(()=>{
    newGame();
    G.npcDora={fav:0};
    showEvent({title:'🤖 猫耳机器人', text:'测试', opts:doraMainOpts()});
    // 模拟点击「送礼」按钮的 eff
    const mainOpt=doraMainOpts().find(o=>o.label.includes('送礼'));
    if(mainOpt && mainOpt.eff) mainOpt.eff();
    const txt=document.getElementById('evwrap').textContent;
    const btnCount = document.querySelectorAll('#evwrap .evbtn').length;
    return {txt:txt.slice(0,80), btnCount, hasGifts:txt.includes('送 🔩金属')};
  });
  ok(r4.hasGifts, '子菜单含礼物选项');
  ok(r4.btnCount===5, '子菜单 5 按钮 (4 礼物+1返回)');

  console.log('== 5. 点击「返回」→ 回到主菜单 ==');
  const r5 = await p.evaluate(()=>{
    newGame();
    G.npcDora={fav:0};
    showEvent({title:'🤖', text:'X', opts:doraGiftOpts()});
    const backOpt = doraGiftOpts().find(o=>o.label.includes('返回'));
    if(backOpt && backOpt.eff) backOpt.eff();
    const txt=document.getElementById('evwrap').textContent;
    return {hasMain:txt.includes('送礼（4 种礼物）') && txt.includes('万能口袋'), btnCount:document.querySelectorAll('#evwrap .evbtn').length};
  });
  ok(r5.hasMain, '返回后显示主菜单');
  ok(r5.btnCount===4, '主菜单 4 按钮');

  console.log('== 6. 点击「闲聊」→ 直接 +1 好感 ==');
  const r6 = await p.evaluate(()=>{
    newGame();
    G.npcDora={fav:0};
    const mainOpt=doraMainOpts().find(o=>o.label.includes('闲聊'));
    mainOpt.eff();
    return {fav:G.npcDora.fav};
  });
  ok(r6.fav===1, '闲聊 +1 好感');

  console.log('== 7. 实际事件流：机器猫事件 → 主菜单 ==');
  const r7 = await p.evaluate(()=>{
    newGame();
    G.npcDora={fav:0};
    // 模拟进入 dora 事件
    const raw=EXPLORE_EVENTS.find(e=>e.id==='dora');
    // 临时：清空 dora 厨具概率（避免测试 1% 命中干扰）
    const origRandom=Math.random; Math.random=()=>0.5; // 大于 0.15 不触发
    showEvent({...raw, opts:doraMainOpts()});
    Math.random=origRandom;
    const txt=document.getElementById('evwrap').textContent;
    return {btnCount:document.querySelectorAll('#evwrap .evbtn').length, hasFav:txt.includes('好感度')};
  });
  ok(r7.btnCount===4, '事件弹窗直接显示 4 按钮主菜单');
  ok(r7.hasFav, '弹窗显示好感度');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();
