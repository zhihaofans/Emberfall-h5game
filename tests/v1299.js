/* v1.30.1 制作面板：未达等级先显示等级要求，达标后显示材料 专项测试 */
const puppeteer=require('puppeteer-core');
let pass=0, fail=0;
function ok(c, n){ if(c){ pass++; console.log('✅ '+n); } else { fail++; console.log('❌ '+n); } }
(async()=>{
  const b=await puppeteer.launch({executablePath:require('./_env').CHROMIUM,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const p=await b.newPage();
  await p.setViewport({width:390,height:844});
  const errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(require('./_env').URL,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));

  console.log('== 1. 版本号 ==');
  const r1 = await p.evaluate(()=>({ver:GAME_VERSION, build:BUILD_CODE, fmt:SAVE_FMT}));
  ok(r1.ver==='2.0.0', 'GAME_VERSION = '+r1.ver);
  ok(r1.build===102, 'BUILD_CODE = '+r1.build);
  ok(r1.fmt===11, 'SAVE_FMT = '+r1.fmt);

  console.log('== 2. 未达等级：显示等级要求，不显示材料 ==');
  const r2 = await p.evaluate(()=>{
    newGame(); switchTab('craft');
    const btns=[...document.querySelectorAll('#actions .actbtn')];
    const axe=btns.find(x=>x.textContent.includes('🪓石斧'));
    const trap=btns.find(x=>x.textContent.includes('🪤捕兽夹'));
    const bed=btns.find(x=>x.textContent.includes('🛏️床铺'));
    const sub=(el)=>el?el.querySelector('.sub').textContent:'';
    return {
      axeSub:sub(axe), axeCls:axe?axe.className:'',
      trapSub:sub(trap), bedSub:sub(bed),
    };
  });
  ok(r2.axeSub.includes('需要 砍伐 Lv.3（当前 Lv.1）'), '石斧显示「需要 砍伐 Lv.3（当前 Lv.1）」：'+r2.axeSub);
  ok(!r2.axeSub.includes('石头'), '石斧未达等级时不显示材料');
  ok(r2.axeCls.includes('actbtn-dis'), '石斧按钮为灰暗禁用样式');
  ok(r2.trapSub.includes('需要 狩猎 Lv.3'), '捕兽夹显示等级要求');
  ok(r2.bedSub.includes('需要 探索 Lv.5'), '床铺显示等级要求');

  console.log('== 3. 等级达标后：切换为显示材料 ==');
  const r3 = await p.evaluate(()=>{
    newGame(); G.skills.chop.lvl=3; renderActions();
    const btns=[...document.querySelectorAll('#actions .actbtn')];
    const axe=btns.find(x=>x.textContent.includes('🪓石斧'));
    const sub=axe.querySelector('.sub').textContent;
    return {sub, cls:axe.className};
  });
  ok(r3.sub.includes('石头'), '达标后显示材料：'+r3.sub);
  ok(!r3.sub.includes('需要 砍伐'), '达标后不再显示等级要求');
  ok(r3.cls.includes('actbtn-dis'), '材料不足（石头2/8）按钮仍为禁用样式');
  ok(r3.sub.includes('(2)'), '显示当前库存数量');

  console.log('== 4. 等级达标+材料齐全：正常可点 ==');
  const r4 = await p.evaluate(()=>{
    newGame(); G.skills.chop.lvl=3; G.res.stone=20; G.res.wood=20; renderActions();
    const btns=[...document.querySelectorAll('#actions .actbtn')];
    const axe=btns.find(x=>x.textContent.includes('🪓石斧'));
    return {cls:axe.className, sub:axe.querySelector('.sub').textContent};
  });
  ok(!r4.cls.includes('actbtn-dis'), '材料齐全按钮无禁用样式');
  ok(r4.sub.includes('石头8'), '显示材料需求');

  console.log('== 5. needLv=1 配方开局直接显示材料 ==');
  const r5 = await p.evaluate(()=>{
    newGame(); switchTab('craft');
    const btns=[...document.querySelectorAll('#actions .actbtn')];
    const knife=btns.find(x=>x.textContent.includes('🔪石刀'));
    const fire=btns.find(x=>x.textContent.includes('🔥火堆'));
    const rod=btns.find(x=>x.textContent.includes('🎣鱼竿'));
    return {knife:knife?knife.querySelector('.sub').textContent:'', fire:fire?fire.querySelector('.sub').textContent:'', rod:rod?rod.querySelector('.sub').textContent:''};
  });
  ok(r5.knife.includes('石头') && !r5.knife.includes('需要 狩猎'), '石刀（Lv.1）开局显示材料');
  ok(r5.fire.includes('木材') && !r5.fire.includes('需要 探索'), '火堆（Lv.1）开局显示材料');
  ok(r5.rod.includes('木材') && !r5.rod.includes('需要 渔猎'), '鱼竿（Lv.1）开局显示材料');

  console.log('== 6. 点击未达标按钮：仍弹等级不足提示（doCraft 保留）==');
  const r6 = await p.evaluate(()=>{
    newGame();
    const before=G.skills.chop.lvl;
    doCraft('axe'); // 未达等级点石斧
    return {stillLv:before===G.skills.chop.lvl, made:G.items.axe===false};
  });
  ok(r6.stillLv && r6.made, '未达等级点制作不生效（toast 提示）');

  ok(errors.length===0, '全程无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n专项: '+pass+' 通过 / '+fail+' 失败');
  await b.close();
  process.exit(fail>0?1:0);
})();
