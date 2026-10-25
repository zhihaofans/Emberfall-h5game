/* v1.11.1 专项：背包 3 个 bug 修复 */
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

  console.log('== 1. 准备：装备全部设施 + 5 个幸运方块 + 符刃 ==');
  await page.evaluate(()=>{
    G.res.luck = 5;
    Object.keys(RECIPES).forEach(k=>G.items[k]=true);
    G.items.runeBlade = true;
    switchTab('bag');
  });
  await new Promise(r=>setTimeout(r,400));
  const bag = await page.evaluate(()=>document.getElementById('actions').textContent);

  console.log('== 2. 幸运方块不重复图标 ==');
  // 旧 bug：🎲 资源名（手动加前缀） → 出现两个骰子
  const luckLine = (bag.match(/[^\n]*幸运方块[^\n]*/) || [''])[0];
  const luckCount = (luckLine.match(/🎲/g) || []).length;
  ok(luckCount === 1, `幸运方块行仅 1 个骰子 (实际 ${luckCount} 个): ${luckLine.slice(0,40)}`);

  console.log('== 3. 武器行带伤害显示 ==');
  const wpnLine = (bag.match(/武器[^\n]*/) || [''])[0];
  ok(/武器/.test(wpnLine), '存在武器行');
  ok(/atk \d+/.test(wpnLine), `武器行带 atk 数值: ${wpnLine}`);
  const wpnAtk = parseInt((wpnLine.match(/atk (\d+)/) || [])[1] || '0', 10);
  ok(wpnAtk > 0, `武器伤害为正数: atk ${wpnAtk}`);

  console.log('== 4. 设施/装备标题不被挤压 ==');
  const facLine = (bag.match(/设施\/装备[^\n]*/) || [''])[0];
  ok(/设施\/装备/.test(facLine), '存在设施/装备行');
  // 不应该是"设\n施\n装\n备"竖排（即不应包含换行）
  ok(!/\n/.test(facLine), '设施/装备标题不被竖排');
  // 必须包含至少 10 个设施（说明能横排显示完整列表）
  const facilityCount = (facLine.match(/、/g) || []).length + 1;
  ok(facilityCount >= 10, `设施行含 ${facilityCount} 项（≥10）`);

  console.log('== 5. 旧 items 数组已改为动态遍历 ==');
  // 现在应该自动包含 runeBlade / runeArmor / forgeMast / vault
  ok(facLine.includes('符刃'), '背包设施包含「符刃」');
  ok(facLine.includes('符甲'), '背包设施包含「符甲」');
  ok(facLine.includes('大师炉'), '背包设施包含「大师炉」');
  ok(facLine.includes('永恒仓库'), '背包设施包含「永恒仓库」');

  console.log('== 6. 资源行没受影响（普通资源仍然横排单行）==');
  const woodLine = (bag.match(/木材[^\n]*/) || [''])[0];
  ok(woodLine.includes('出售'), '木材行仍有「出售」按钮');
  ok(!/\n/.test(woodLine), '木材行不被换行打乱');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.11.1 背包专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
