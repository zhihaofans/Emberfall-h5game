/* v1.10.0 专项：进度总览 */
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

  console.log('== 1. 菜单入口 ==');
  await page.evaluate(()=>openMenu());
  await new Promise(r=>setTimeout(r,200));
  const menu=await page.evaluate(()=>document.getElementById('modalcard').textContent);
  ok(menu.includes('进度总览'), '菜单含「进度总览」入口');
  await page.evaluate(()=>closeModal());

  console.log('== 2. 进度总览 7 大区块 ==');
  await page.evaluate(()=>{ G.day=12; openProgress(); });
  await new Promise(r=>setTimeout(r,300));
  const blocks=await page.evaluate(()=>{
    const t=document.getElementById('modalcard').textContent;
    return {
      hasDay:t.includes('生存天数'), hasCraft:t.includes('制作进度'),
      hasUp:t.includes('强化进度'), hasSkill:t.includes('技能等级'),
      hasWpn:t.includes('武器路线'), hasBoss:t.includes('废土兽王'),
      hasAch:t.includes('成就'),
      next:(t.match(/⏭ 下一个大事件[^（]*（还差 \d+ 天）/)||[''])[0],
      rows:document.querySelectorAll('.prow').length,
      bars:document.querySelectorAll('.pbar').length,
    };
  });
  ok(blocks.hasDay && blocks.hasCraft && blocks.hasUp && blocks.hasSkill && blocks.hasWpn && blocks.hasBoss && blocks.hasAch, '7 大区块齐全');
  ok(blocks.rows>=7, `区块数 ${blocks.rows}`);
  ok(blocks.bars>=5, `进度条数 ${blocks.bars}`);

  console.log('== 3. 下一个大事件提示 ==');
  ok(blocks.next.includes('15 天'), `提示下一个天数目标: ${blocks.next}`);

  console.log('== 4. 制作/强化/技能进度百分比 ==');
  const pct=await page.evaluate(()=>{
    const rows=[...document.querySelectorAll('.prow')];
    const pnum=[...document.querySelectorAll('.pnum')].map(e=>e.textContent);
    return pnum;
  });
  ok(pct.some(p=>p.includes('12/100')), `生存进度 12/100 (${pct[0]})`);
  ok(pct.some(p=>p.includes('/22')), '制作进度含 /22 (含 Tier 4 终极制作)');

  console.log('== 5. 进度随游戏推进更新 ==');
  await page.evaluate(()=>{
    G.day=31; G.milestones.d7=1; G.milestones.d15=1; G.milestones.d30=1;
    G.items.axe=true; G.items.knife=true; G.items.fire=true;
    G.upgrades.weapon=5; G.skills.chop.lvl=20;
    openProgress();
  });
  await new Promise(r=>setTimeout(r,300));
  const prog2=await page.evaluate(()=>{
    const t=document.getElementById('modalcard').textContent;
    return {
      next:t.includes('60 天'),
      craft3:t.includes('3/22'),
      up5:t.includes('5/40'),
      skill20:t.includes('Lv.20'),
      wpn:!![...document.querySelectorAll('.wpn')].find(e=>e.textContent.includes('🔪石刀')&&e.className.includes('owned')),
    };
  });
  ok(prog2.next, '31天后提示下一个 60 天');
  ok(prog2.craft3, '制作 3/22 正确');
  ok(prog2.up5, '强化 5/40 正确');
  ok(prog2.skill20, '技能 Lv.20 正确');
  ok(prog2.wpn, '已拥有石刀高亮');

  console.log('== 6. 全部完成后提示 ==');
  const done=await page.evaluate(()=>{
    G.day=100; G.milestones.d60=1; G.milestones.d100=1;
    openProgress();
    const t=document.getElementById('modalcard').textContent;
    return t.includes('已达成全部天数目标');
  });
  ok(done, '100 天后显示全部天数达成');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.10.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
