// 各行动产出对拍：新实现（doEat 等）vs 旧 doAction 的 switch 分支
//
// 做法：把旧 switch 整段切出来包成函数，在 vm 里用桩函数真跑，
// 比较 state 里被改动的字段与日志文本。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { ACTIONS } from '../../src/core/data/actions.mjs';
import { RECIPES } from '../../src/core/data/recipes.mjs';
import { resNames } from '../../src/core/data/resources.mjs';
import { doEat, doDrink, doSleep, doHeal, doFetch, doCook, doBoil } from '../../src/core/actions.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'legacy/survival.html'), 'utf8');
const NOW = 1_700_000_000_000;
const R = 0.42;

/** 把旧 switch 包成函数，桩掉所有外围依赖 */
function buildOldCases() {
  const doStart = html.indexOf('function doAction(kind){');
  const swStart = html.indexOf('  switch(kind){', doStart);
  const start = swStart + '  switch(kind){'.length;   // 跳过 switch 头，只取 case 体
  const end = html.indexOf('  if(a.time>0) passTime(a.time);', start);
  if (doStart < 0 || swStart < 0 || end < 0) throw new Error('切片失败');
  const body = html.slice(start, end);

  const env = {
    ACTIONS, RECIPES,
    __RES_NAMES: resNames(),
    __R: R,
    __logs: [], __toasts: [], __ach: [], __combat: [], __xp: [],
  };
  vm.createContext(env);
  vm.runInContext(`
    Math.random = () => __R;
    globalThis.RES_NAMES = __RES_NAMES;
    function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
    function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a}
    function addRes(k,n){ if(!(k in G.res)) G.res[k]=0; G.res[k]+=n; if(n>0&&G.stats){ if(!G.stats.ownedRes) G.stats.ownedRes={}; G.stats.ownedRes[k]=1 } }
    function spend(k,n){ if((G.res[k]||0)>=n){ G.res[k]-=n; return true } return false }
    function has(k){ return !!G.items[k] }
    function skillLvl(){ return 1 }
    function addXp(s,n){ __xp.push({skill:s, n:n}) }
    function log(m,c){ __logs.push({text:m, cls:c||'sys'}) }
    function toast(m){ __toasts.push(m) }
    function stopAuto(){}
    function checkMilestone(id){ __ach.push(id) }
    function checkFishAchieve(kind){ __ach.push('fish:'+(kind||'')) }
    function checkStageAchieve(){ __ach.push('stage') }
    function checkZoneAchieve(){}
    function startCombat(n){ __combat.push(n) }
    function doExplore(){}
    function runCase(kind){ switch(kind){ ${body}
    }
    globalThis.__runCase = runCase;
  `, env);
  return env;
}
const env = buildOldCases();

function oldRun(state, kind) {
  env.G = state;
  env.__logs.length = 0;
  env.__toasts.length = 0;
  env.__ach.length = 0;
  env.__combat.length = 0;
  env.__xp.length = 0;
  env.__runCase(kind);
  return {
    logs: JSON.parse(JSON.stringify(env.__logs)),
    toasts: JSON.parse(JSON.stringify(env.__toasts)),
    ach: [...env.__ach],
    combat: [...env.__combat],
    xp: JSON.parse(JSON.stringify(env.__xp)),
  };
}

const name = (k) => resNames()[k];

/** 生成一组有差异的状态用于对拍 */
function scenarios() {
  const out = [];
  const base = () => createNewState(NOW);

  const a = base();
  a.food = 40; a.water = 40; a.res.cooked = 3; a.res.clean = 3; a.res.food = 10; a.res.water = 10;
  a.res.herb = 6; a.hp = 40; a.stam = 20; a.ill = true; a.heavyWound = true;
  out.push(['丰衣足食', a]);

  const b = base();
  b.food = 10; b.water = 10; b.res.cooked = 0; b.res.clean = 0; b.res.food = 4; b.res.water = 5;
  b.res.herb = 2; b.hp = 80; b.stam = 60;
  out.push(['只有生食生水', b]);

  const c = base();
  c.food = 100; c.water = 100; c.res.food = 0; c.res.water = 0; c.res.cooked = 0; c.res.clean = 0;
  c.res.herb = 0; c.hp = 100;
  out.push(['满状态但没存货', c]);

  const d = base();
  d.items.bed = true; d.items.kit = true; d.items.puri = true;
  d.food = 30; d.water = 30; d.res.cooked = 5; d.res.clean = 5; d.res.herb = 8; d.hp = 30;
  d.lightWound = true;
  out.push(['有床/药箱/净水器', d]);

  return out;
}

test('进食 / 饮水：与旧实现一致（含生病判定）', () => {
  for (const [label, s] of scenarios()) {
    for (const kind of ['eat', 'drink']) {
      const old = oldRun(JSON.parse(JSON.stringify(s)), kind);

      const fresh = JSON.parse(JSON.stringify(s));
      const r = kind === 'eat' ? doEat(fresh, { random: () => R }) : doDrink(fresh, { random: () => R });

      assert.deepEqual(r.logs, old.logs, `${label} / ${kind}：日志不一致`);
      assert.equal(fresh.food, JSON.parse(JSON.stringify(env.G)).food, `${label} / ${kind}：饱食不一致`);
      assert.equal(fresh.water, JSON.parse(JSON.stringify(env.G)).water, `${label} / ${kind}：水分不一致`);
      assert.equal(fresh.ill, JSON.parse(JSON.stringify(env.G)).ill, `${label} / ${kind}：疾病状态不一致`);
      if (old.toasts.length) assert.equal(r.refused, old.toasts[0], `${label} / ${kind}：拒绝原因不一致`);
    }
  }
});

test('睡觉：与旧实现一致（床铺加成 / 缺粮水只回 60%）', () => {
  for (const [label, s] of scenarios()) {
    const old = oldRun(JSON.parse(JSON.stringify(s)), 'sleep');
    const after = JSON.parse(JSON.stringify(env.G));

    const fresh = JSON.parse(JSON.stringify(s));
    const r = doSleep(fresh);

    assert.deepEqual(r.logs, old.logs, `${label}：日志不一致`);
    for (const k of ['stam', 'hp', 'food', 'water']) {
      assert.equal(fresh[k], after[k], `${label}：${k} 不一致`);
    }
    assert.deepEqual(fresh.res, after.res, `${label}：资源不一致`);
  }
});

test('治疗：与旧实现一致（药箱翻倍 / 治病降伤）', () => {
  for (const [label, s] of scenarios()) {
    const old = oldRun(JSON.parse(JSON.stringify(s)), 'heal');
    const after = JSON.parse(JSON.stringify(env.G));

    const fresh = JSON.parse(JSON.stringify(s));
    const r = doHeal(fresh, { random: () => R }, name);

    assert.deepEqual(r.logs, old.logs, `${label}：日志不一致`);
    for (const k of ['hp', 'ill', 'heavyWound', 'lightWound']) {
      assert.equal(fresh[k], after[k], `${label}：${k} 不一致`);
    }
    assert.deepEqual(fresh.res, after.res, `${label}：资源不一致`);
    if (old.toasts.length) assert.equal(r.refused, old.toasts[0], `${label}：拒绝原因不一致`);
  }
});

test('取水 / 烹饪 / 烧水：与旧实现一致', () => {
  for (const [label, s] of scenarios()) {
    for (const kind of ['fetch', 'cook', 'boil']) {
      const old = oldRun(JSON.parse(JSON.stringify(s)), kind);
      const after = JSON.parse(JSON.stringify(env.G));

      const fresh = JSON.parse(JSON.stringify(s));
      const r = kind === 'fetch' ? doFetch(fresh, { random: () => R }, name)
        : kind === 'cook' ? doCook(fresh, { random: () => R }, name)
          : doBoil(fresh, { random: () => R }, name);

      assert.deepEqual(r.logs, old.logs, `${label} / ${kind}：日志不一致`);
      assert.deepEqual(fresh.res, after.res, `${label} / ${kind}：资源不一致`);
      assert.equal(fresh.ill, after.ill, `${label} / ${kind}：疾病状态不一致`);
      assert.equal(fresh.stats.cook, after.stats.cook, `${label} / ${kind}：烹饪计数不一致`);
    }
  }
});

test('ACTIONS 里每个可手动执行的行动都有对应实现（防止漏搬）', () => {
  const implemented = new Set(['eat', 'drink', 'sleep', 'heal', 'fetch', 'cook', 'boil']);
  const pending = ['explore', 'chop', 'hunt', 'fish', 'smelt', 'mineOre', 'smeltOre'];
  for (const k of Object.keys(ACTIONS)) {
    assert.ok(implemented.has(k) || pending.includes(k), `行动 ${k} 既没实现也不在待搬清单里`);
  }
  assert.equal(implemented.size + pending.length, Object.keys(ACTIONS).length);
});

/* -------------------- 第二批：砍柴 / 狩猎 / 熔炼 / 采矿 / 炼锭 -------------------- */

import { doChop, doHunt, doSmelt, doMineOre, doSmeltOre } from '../../src/core/actions.mjs';

/** 这些行动的状态组合（工具/强化/附魔/存货各不相同） */
function combatScenarios() {
  const out = [];
  const base = () => createNewState(NOW);

  const bare = base();
  bare.res.metal = 6; bare.res.stone = 10; bare.res.goldOre = 1; bare.res.silverOre = 1;
  out.push(['赤手空拳', bare]);

  const armed = base();
  armed.items.axe = true; armed.items.ironAxe = true; armed.items.knife = true;
  armed.items.forge = true;
  armed.upgrades.axe = 3; armed.enchant.tool = 2;
  armed.res.metal = 6; armed.res.stone = 10; armed.res.goldOre = 1; armed.res.silverOre = 1;
  out.push(['铁斧 + 强化 + 附魔', armed]);

  const noMat = base();
  noMat.items.forge = true;
  noMat.res.metal = 0; noMat.res.stone = 0;
  out.push(['没材料', noMat]);

  return out;
}

test('砍柴：产量与旧实现一致（斧头/等级/强化/附魔）', () => {
  for (const [label, s] of combatScenarios()) {
    const old = oldRun(JSON.parse(JSON.stringify(s)), 'chop');
    const after = JSON.parse(JSON.stringify(env.G));

    const fresh = JSON.parse(JSON.stringify(s));
    const r = doChop(fresh, { random: () => R }, name);

    assert.deepEqual(r.logs, old.logs, `${label}：日志不一致`);
    assert.equal(fresh.res.wood, after.res.wood, `${label}：木材数量不一致`);
  }
});

test('狩猎：成功/失败/扭伤三分支与旧实现一致', () => {
  for (const [label, s] of combatScenarios()) {
    const old = oldRun(JSON.parse(JSON.stringify(s)), 'hunt');
    const after = JSON.parse(JSON.stringify(env.G));

    const fresh = JSON.parse(JSON.stringify(s));
    const r = doHunt(fresh, { random: () => R }, name);

    assert.deepEqual(r.logs, old.logs, `${label}：日志不一致`);
    assert.equal(fresh.res.food, after.res.food, `${label}：食物数量不一致`);
    assert.equal(fresh.hp, after.hp, `${label}：生命不一致`);
    assert.equal(fresh.stats.hunt, after.stats.hunt, `${label}：狩猎计数不一致`);
  }
});

test('熔炼：金属+石头→合金，材料不足时只提示', () => {
  for (const [label, s] of combatScenarios()) {
    const old = oldRun(JSON.parse(JSON.stringify(s)), 'smelt');
    const after = JSON.parse(JSON.stringify(env.G));

    const fresh = JSON.parse(JSON.stringify(s));
    const r = doSmelt(fresh, { random: () => R }, name);

    assert.deepEqual(r.logs, old.logs, `${label}：日志不一致`);
    assert.deepEqual(fresh.res, after.res, `${label}：资源不一致`);
  }
});

test('采矿：石头保底 + 矿石概率 + 成就标记与旧实现一致', () => {
  for (const [label, s] of combatScenarios()) {
    const old = oldRun(JSON.parse(JSON.stringify(s)), 'mineOre');
    const after = JSON.parse(JSON.stringify(env.G));
    const oldAch = [...env.__ach];

    const fresh = JSON.parse(JSON.stringify(s));
    const r = doMineOre(fresh, { random: () => R }, name);

    assert.deepEqual(r.logs, old.logs, `${label}：日志不一致`);
    assert.deepEqual(fresh.res, after.res, `${label}：资源不一致`);
    assert.equal(fresh.stats.ores, after.stats.ores, `${label}：采矿计数不一致`);
    assert.deepEqual(r.achievements, oldAch, `${label}：成就标记不一致`);
  }
});

test('炼锭：优先金→银→铜，没矿石时只提示', () => {
  for (const [label, s] of combatScenarios()) {
    const old = oldRun(JSON.parse(JSON.stringify(s)), 'smeltOre');
    const after = JSON.parse(JSON.stringify(env.G));
    const oldAch = [...env.__ach];

    const fresh = JSON.parse(JSON.stringify(s));
    const r = doSmeltOre(fresh, name);

    assert.deepEqual(r.logs, old.logs, `${label}：日志不一致`);
    assert.deepEqual(fresh.res, after.res, `${label}：资源不一致`);
    assert.equal(fresh.stats.ingots, after.stats.ingots, `${label}：炼锭计数不一致`);
    assert.deepEqual(r.achievements, oldAch, `${label}：成就标记不一致`);
  }
});

/* -------------------- 钓鱼：五条分支逐一对拍 -------------------- */

import { doFish } from '../../src/core/actions.mjs';

/** 取一组覆盖不同分支的随机值 */
const FISH_ROLLS = [
  ['不咬钩', 0.99],
  ['钓到怪物', 0.02],
  ['宝藏', 0.05],
  ['垃圾', 0.30],
  ['鱼', 0.80],
];

test('钓鱼：五条分支与旧实现一致（日志/成就/经验/战斗/状态）', () => {
  const base = createNewState(NOW);
  base.items.rod = true;
  base.res.metal = 0;
  base.upgrades.rod = 0;

  for (const [label, r] of FISH_ROLLS) {
    env.__R = r;
    const old = oldRun(JSON.parse(JSON.stringify(base)), 'fish');
    const after = JSON.parse(JSON.stringify(env.G));

    const fresh = JSON.parse(JSON.stringify(base));
    const now = doFish(fresh, { random: () => r });

    assert.deepEqual(now.logs, old.logs, `${label}：日志不一致`);
    assert.deepEqual(now.achievements, old.ach, `${label}：成就标记不一致`);
    assert.deepEqual(now.xp, old.xp, `${label}：经验不一致`);
    assert.equal(!!now.combat, old.combat.length > 0, `${label}：战斗触发不一致`);
    assert.deepEqual(fresh.res, after.res, `${label}：资源不一致`);
    assert.equal(fresh.gold, after.gold, `${label}：金币不一致`);
    assert.deepEqual(fresh.stats, after.stats, `${label}：统计不一致`);
  }
  env.__R = R;
});

test('钓鱼：强化鱼竿会改变不咬钩概率（按旧公式）', () => {
  const s = createNewState(NOW);
  s.items.rod = true;

  // 不咬钩阈值 = 0.7 + lv*0.012 + up*0.06；lv=1、up=0 时是 0.712
  // 给一个介于两者之间的随机值：0.75 —— 无强化时"不咬钩"，强化 3 级后阈值 0.892 → 仍不咬钩
  const low = doFish(JSON.parse(JSON.stringify(s)), { random: () => 0.75 });
  assert.equal(low.logs[0].text, '水面平静，鱼不咬钩。');

  s.upgrades.rod = 5;   // 阈值 = 0.7 + 0.012 + 0.3 = 1.012 > 0.75 → 一定咬钩
  const high = doFish(JSON.parse(JSON.stringify(s)), { random: () => 0.75 });
  assert.notEqual(high.logs[0].text, '水面平静，鱼不咬钩。');
});
