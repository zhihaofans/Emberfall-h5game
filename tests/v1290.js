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

  console.log('== 1. NPC 状态默认 + 好感度等级 ==');
  const r1 = await p.evaluate(()=>{
    newGame();
    return {fav:G.npcDora.fav, lvl:doraInfo().lvl, name:doraInfo().name};
  });
  ok(r1.fav===0 && r1.lvl===1 && r1.name==='陌生', '初始 0 好感 Lv.1 陌生');

  console.log('== 2. 好感度升级到 Lv.6 ==');
  const r2 = await p.evaluate(()=>{
    newGame();
    addDoraFav(300);
    const info=doraInfo();
    return {lvl:info.lvl, name:info.name, max:info.max, dora6:!!G.milestones.dora6};
  });
  ok(r2.lvl===6 && r2.name==='家人' && r2.max, '300 好感 Lv.6 家人');
  ok(r2.dora6, '成就「口袋里的朋友」触发');

  console.log('== 3. 分级解锁口袋商品 ==');
  const r3 = await p.evaluate(()=>{
    newGame();
    const l1=doraGoods().length;
    addDoraFav(50); // Lv.3
    const l3=doraGoods().length;
    const l3Names=doraGoods().map(g=>g.name);
    addDoraFav(250); // Lv.6
    const l6=doraGoods().length;
    const l6HasBlade=doraGoods().some(g=>g.name.includes('符刃'));
    return {l1, l3, l6, l3Names, l6HasBlade};
  });
  ok(r3.l1===2, 'Lv.1 只有基础 2 个 ('+r3.l1+')');
  ok(r3.l3>=4, 'Lv.3 解锁到保命道具 ('+r3.l3+' 个)');
  ok(r3.l6===10, 'Lv.6 全部解锁 ('+r3.l6+' 个)');
  ok(r3.l6HasBlade, 'Lv.5 符刃图纸解锁');

  console.log('== 4. 送礼 + 好感 ==');
  const r4 = await p.evaluate(()=>{
    newGame();
    G.res.metal=10; G.res.rune=3; G.res.food=20; G.res.alloy=5;
    const bFav=G.npcDora.fav;
    spend('metal',5); addDoraFav(8);
    spend('rune',1); addDoraFav(25);
    return {fav:G.npcDora.fav, metal:G.res.metal, rune:G.res.rune};
  });
  ok(r4.fav===33, '送礼后好感 33 (8+25)');
  ok(r4.metal===5 && r4.rune===2, '材料正确扣除');

  console.log('== 5. 口袋交换（金币+材料）==');
  const r5 = await p.evaluate(()=>{
    newGame();
    G.gold=2000; G.res.alloy=20; G.res.luckyDraw=0;
    // Lv.2 抽奖券：500金+5合金
    addDoraFav(20); // Lv.2
    const good=doraGoods().find(g=>g.name.includes('抽奖券'));
    G.gold-=good.cost;
    for(const k in good.give) spend(k,good.give[k]);
    if(good.get){ for(const k in good.get) addRes(k,good.get[k]); }
    return {gold:G.gold, alloy:G.res.alloy, lucky:G.res.luckyDraw};
  });
  ok(r5.gold===1500 && r5.alloy===15 && r5.lucky===1, '抽奖券: 2000-500=1500金, 合金20-5=15, 抽奖券1');

  console.log('== 6. 事件存在（废墟专属）==');
  const r6 = await p.evaluate(()=>{
    const ev=EXPLORE_EVENTS.find(e=>e.id==='dora');
    return {exists:!!ev, zone:ev?ev.zone:'', kind:ev?ev._kind:''};
  });
  ok(r6.exists && r6.zone==='ruins' && r6.kind==='dora', 'dora 事件（废墟专属）');

  console.log('== 7. showEvent 动态选项渲染 ==');
  const r7 = await p.evaluate(()=>{
    newGame();
    const raw=EXPLORE_EVENTS.find(e=>e.id==='dora');
    // 模拟 rollExploreEvent 中 dora 分支
    const dora=doraInfo();
    const opts=[];
    opts.push({label:'🤝 送 🔩金属×5', d:'好感+8', eff:()=>{}});
    opts.push({label:'🎒 用 5 生食换 3 净水', d:'Lv.1', eff:()=>{}});
    opts.push({label:'💬 闲聊', d:'好感+1', eff:()=>{}});
    opts.push({label:'👋 离开', d:'下次再来', eff:()=>{}});
    const dora2=doraInfo();
    showEvent({...raw, text: raw.text+'<br><span>🤖 好感度：'+dora2.name+'（'+dora2.fav+'）</span>', opts});
    return {
      btns: document.querySelectorAll('#evwrap .evbtn').length,
      txt: document.getElementById('evwrap').textContent,
      hasFav: document.getElementById('evwrap').textContent.includes('好感度'),
    };
  });
  ok(r7.btns===4, '弹窗 4 个选项');
  ok(r7.hasFav, '显示好感度状态');

  console.log('== 8. 进度总览显示好感度 ==');
  const r8 = await p.evaluate(()=>{
    newGame(); addDoraFav(30);
    openProgress();
    return document.getElementById('modalcard').textContent;
  });
  ok(r8.includes('猫耳机器人') && r8.includes('眼熟'), '进度页含机器人好感度');

  console.log('== 9. 旧档 normalize 兜底 npcDora ==');
  const r9 = await p.evaluate(()=>{
    const g=normalizeState({v:10, day:1, res:{wood:1}});
    return {npc:g.npcDora && g.npcDora.fav===0};
  });
  ok(r9.npc, '旧档自动补 npcDora');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();
