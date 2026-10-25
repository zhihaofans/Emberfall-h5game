/* v1.13.0 专项：Minecraft 式钓鱼战利品表 */
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

  console.log('== 1. 版本号 ==');
  const ver = await page.evaluate(()=>GAME_VERSION);
  ok(ver==='1.25.0', 'GAME_VERSION = '+ver);

  console.log('== 2. luck 资源默认值修复 ==');
  const luckDef = await page.evaluate(()=>{
    // newGame 会设置全局 G
    const g1 = (function(){ newGame(); return G; })();
    const normalize = normalizeState({day:1,res:{wood:1}});
    return {
      newGame: g1.res.luck===0,
      normalize: normalize.res.luck>=100, // v1.17.1 起 normalizeState 会补偿 100 luck
    };
  });
  ok(luckDef.newGame, 'newGame 后 luck=0');
  ok(luckDef.normalize, 'normalizeState 兜底 luck≥100（含 v1.17.1 补偿）');

  console.log('== 3. 钓鱼需要鱼竿 ==');
  const noRod = await page.evaluate(()=>{
    G.items.rod=false;
    const resBefore={...G.res};
    doAction('fish');
    return JSON.stringify(G.res)===JSON.stringify(resBefore);
  });
  ok(noRod, '无鱼竿时钓鱼不产出');

  console.log('== 4. 钓鱼战利品多样性（500 次采样）==');
  const stats = await page.evaluate(()=>{
    G.items.rod=true; G.skills.fish.lvl=30;
    const acc={food:0,leather:0,stone:0,wood:0,metal:0,luck:0,rune:0,clean:0,herb:0,alloy:0,gold:0,empty:0,learned:0};
    // 记录日志出现过的关键文本
    let logTxt='';
    const origLog = log;
    window.__fishLogs = [];
    for(let i=0;i<500;i++){
      // 每轮恢复状态：doAction 会推进时间，不恢复会饿死/耗尽精力
      G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false; G.hp=100;
      const before={...G.res};
      const bGold=G.gold;
      const bItems={...G.items};
      doAction('fish');
      acc.food += G.res.food-before.food;
      acc.leather += G.res.leather-before.leather;
      acc.stone += G.res.stone-before.stone;
      acc.wood += G.res.wood-before.wood;
      acc.metal += G.res.metal-before.metal;
      acc.luck += G.res.luck-before.luck;
      acc.rune += G.res.rune-before.rune;
      acc.clean += G.res.clean-before.clean;
      acc.herb += G.res.herb-before.herb;
      acc.alloy += G.res.alloy-before.alloy;
      acc.gold += G.gold-bGold;
      // 检测是否学会新配方
      for(const k in G.items){ if(G.items[k] && bItems[k]===false) acc.learned++; }
    }
    return acc;
  });
  console.log('  500 次采样结果:', JSON.stringify(stats));
  const variety = Object.keys(stats).filter(k=>k!=='empty' && stats[k]>0).length;
  ok(variety >= 8, `500 次钓鱼出现 ≥ 8 种收益 (实际 ${variety}/11)`);
  ok(stats.food > 0, '钓到鱼（食物）');
  ok(stats.gold > 0, '钓到钱袋（金币）');
  ok(stats.luck > 0, '钓到幸运方块');
  ok(stats.clean > 0, '钓到密封水壶（净水）');

  console.log('== 5. 等级影响宝藏率 ==');
  const lvEffect = await page.evaluate(()=>{
    // 低等级 vs 高等级：统计宝藏(金币/符石/幸运方块)出现次数
    const sample=(lv)=>{
      G.items.rod=true; G.skills.fish.lvl=lv;
      let treas=0;
      for(let i=0;i<400;i++){
        G.stam=100; G.hour=8; G.food=100; G.water=100; G.dead=false; G.hp=100;
        const bGold=G.gold, bLuck=G.res.luck, bRune=G.res.rune;
        doAction('fish');
        if(G.gold>bGold || G.res.luck>bLuck || G.res.rune>bRune) treas++;
      }
      return treas;
    };
    const low=sample(1), high=sample(50);
    return {low, high};
  });
  ok(lvEffect.high > lvEffect.low, `高等级宝藏率更高: Lv.1=${lvEffect.low} vs Lv.50=${lvEffect.high}`);

  console.log('== 6. 无 JS 报错 ==');
  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.13.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
