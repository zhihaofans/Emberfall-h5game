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

  console.log('== 1. 钱包吞噬者成就定义 ==');
  const r1 = await p.evaluate(()=>{
    return {ms: !!MS.goldEater, name: MS.goldEater};
  });
  ok(r1.ms && r1.name.includes('钱包吞噬者'), '成就定义存在: '+r1.name);

  console.log('== 2. NaN 触发钱包吞噬者 ==');
  const r2 = await p.evaluate(()=>{
    G.milestones={};
    G.gold=NaN;
    renderAll();
    return {gold:G.gold, goldEater:!!G.milestones.goldEater};
  });
  ok(r2.gold===0, '金币 NaN → 0');
  ok(r2.goldEater, '钱包吞噬者成就触发');

  console.log('== 3. 正常金币不触发 ==');
  const r3 = await p.evaluate(()=>{
    G.milestones={};
    G.gold=500;
    renderAll();
    return {goldEater:!!G.milestones.goldEater};
  });
  ok(!r3.goldEater, '正常金币不触发');

  console.log('== 4. 进度页只显示已达成成就 ==');
  const r4 = await p.evaluate(()=>{
    G.milestones={d3:1, craft1:1, boss:1};
    openProgress();
    return document.getElementById('modalcard').innerText;
  });
  ok(r4.includes('已达成'), '顶部计数显示「已达成」');
  ok(r4.includes('生存 3 天') && r4.includes('第一件制作') && r4.includes('击败兽王'), '显示已达成成就名');
  ok(!r4.includes('钓鱼 10 次'), '未达成成就不直接显示');
  ok(r4.includes('查看剩余') && r4.includes('未解锁'), '顶部显示剩余数量');

  console.log('== 5. 剩余成就可展开 ==');
  const r5 = await p.evaluate(()=>{
    G.milestones={d3:1};
    openProgress();
    const hidden=document.getElementById('leftAchList');
    const before=hidden.style.display;
    toggleLeftAch();
    const after=hidden.style.display;
    toggleLeftAch();
    return {before, after, hasItems:hidden.textContent.length>10};
  });
  ok(r5.before==='none' && r5.after==='' , '展开/收起切换正常');
  ok(r5.hasItems, '剩余成就列表有内容');

  console.log('== 6. 全部达成显示庆祝 ==');
  const r6 = await p.evaluate(()=>{
    // 模拟全部达成
    const achKeys=['d3','d7','d15','d30','craft1','kill1','allcraft','boss','up1','fish1','fish10','fish50','fish100','fishBig','fishTreas','fishRune','fishBlueprint','fishLv25','totem1','totem3','totem10','armor1','armorIron','armorSteel','armorAll','oreCopper','oreSilver','oreGold','smelt1','ingotAll','for1','for10','for50','rui1','rui10','rui50','riv1','riv10','riv50','hil1','hil10','hil50','pyr1','pyr10','pyr50','mummy1','tomb1','goldroom1','pharaoh1','pharaoh2','pharaoh3','robbed1','goldEater'];
    G.milestones={};
    achKeys.forEach(k=>G.milestones[k]=1);
    openProgress();
    return document.getElementById('modalcard').textContent;
  });
  ok(r6.includes('全部达成'), '全部达成显示 🎉');

  console.log('== 7. 进度页不显示灰条目（未达成不渲染）==');
  const r7 = await p.evaluate(()=>{
    G.milestones={};
    openProgress();
    const txt=document.getElementById('modalcard').innerText;
    return {hasBlank: txt.includes('⬜'), hasLeftBtn: txt.includes('查看剩余 53 个')};
  });
  ok(!r7.hasBlank, '主列表无 ⬜ 灰条目');
  ok(r7.hasLeftBtn, '剩余 53 个按钮显示');

  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
})();
