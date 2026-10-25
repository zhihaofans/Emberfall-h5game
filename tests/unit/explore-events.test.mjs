// 探索事件对拍：28 个事件的每个选项 vs 旧 eff 闭包
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { EXPLORE_EVENTS } from '../../src/core/data/explore-events.mjs';
import { RECIPES } from '../../src/core/data/recipes.mjs';
import { WEAPONS } from '../../src/core/data/weapons.mjs';
import { resNames } from '../../src/core/data/resources.mjs';
import { pickExploreEvent, resolveOption, lostOpts } from '../../src/core/explore-events.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

function buildOld() {
  const a = html.indexOf('const EXPLORE_EVENTS = [');
  const b = html.indexOf('/* 迷路事件选项', a);
  if (a < 0 || b < 0) throw new Error('切片失败');

  const env = {
    RES_NAMES: resNames(), RECIPES, WEAPONS,
    __R: 0.42, __logs: [], __ach: [], __combat: [],
  };
  vm.createContext(env);
  vm.runInContext(`
    Math.random = () => __R;
    function log(m,c){ __logs.push({text:m, cls:c||'sys'}) }
    function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a}
    function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
    function addRes(k,n){ if(!(k in G.res)) G.res[k]=0; G.res[k]+=n; if(n>0&&G.stats){ if(!G.stats.ownedRes) G.stats.ownedRes={}; G.stats.ownedRes[k]=1 } }
    function spend(k,n){ if((G.res[k]||0)>=n){ G.res[k]-=n; return true } return false }
    function checkMilestone(id){ __ach.push(id) }
    function startCombat(n, night, beasts){ __combat.push({n:n, night:!!night, beasts:!!beasts}) }
    function skillLvl(k){ return (G.skills[k] && G.skills[k].lvl) || 1 }
    function weaponAtk(){
      const base = G.items.runeBlade ? WEAPONS.runeBlade : (G.items.huntKing ? WEAPONS.huntKing : (G.items.steel ? WEAPONS.steel : (G.items.iron ? WEAPONS.iron : (G.items.knife ? WEAPONS.knife : WEAPONS.none))));
      const sharp = (G.enchant && G.enchant.weapon)||0;
      return {name:base.name, atk:Math.round(base.atk*(1+sharp*0.10)), baseAtk:base.atk, mult:base.mult, sharp};
    }
    ${html.slice(a, b).replace(/const EXPLORE_EVENTS =/, 'globalThis.EXPLORE_EVENTS =')}
  `, env);
  return env;
}
const env = buildOld();

function richState() {
  const s = createNewState(NOW);
  for (const k of Object.keys(s.res)) s.res[k] = 50;
  s.gold = 5000;
  s.hp = 100;
  s.stam = 100;
  s.items.rod = true;
  s.items.ironAxe = true;
  s.items.knife = true;
  s.skills.hunt.lvl = 5;
  return s;
}

function oldRun(state, eventId, idx, r) {
  env.G = state;
  env.__logs.length = 0;
  env.__ach.length = 0;
  env.__combat.length = 0;
  env.__R = r;
  const ev = env.EXPLORE_EVENTS.find((e) => e.id === eventId);
  ev.opts[idx].eff(state);
  return {
    logs: JSON.parse(JSON.stringify(env.__logs)),
    ach: [...env.__ach],
    combat: env.__combat.length,
    state: JSON.parse(JSON.stringify(env.G)),
  };
}

test('数据：28 个事件、id 唯一、三个动态事件 opts 为空', () => {
  assert.equal(EXPLORE_EVENTS.length, 28);
  assert.equal(new Set(EXPLORE_EVENTS.map((e) => e.id)).size, 28);
  const dyn = EXPLORE_EVENTS.filter((e) => e.opts.length === 0).map((e) => e.id).sort();
  assert.deepEqual(dyn, ['dora', 'lost', 'merchant']);
});

test('数据：每个选项都声明了 effects 或 run（空 effects 表示"什么都不做"）', () => {
  for (const e of EXPLORE_EVENTS) {
    e.opts.forEach((o, i) => {
      const ok = Array.isArray(o.effects) || typeof o.run === 'string';
      assert.ok(ok, `${e.id}#${i} 既没有 effects 也没有 run`);
      assert.ok(o.label, `${e.id}#${i} 缺 label`);
    });
  }
});

test('逐事件逐选项对拍（富状态 × 3 个随机值）', () => {
  let checked = 0;
  for (const ev of EXPLORE_EVENTS) {
    if (!ev.opts.length) continue;
    for (let idx = 0; idx < ev.opts.length; idx++) {
      for (const r of [0.1, 0.42, 0.9]) {
        const base = richState();
        const fresh = JSON.parse(JSON.stringify(base));
        const old = oldRun(JSON.parse(JSON.stringify(base)), ev.id, idx, r);
        const now = resolveOption(fresh, ev, idx, { random: () => r });

        assert.deepEqual(now.logs, old.logs, `${ev.id}#${idx} r=${r}：日志不一致`);
        assert.deepEqual(now.achievements, old.ach, `${ev.id}#${idx} r=${r}：成就不一致`);
        assert.equal(now.combat.length, old.combat, `${ev.id}#${idx} r=${r}：战斗触发不一致`);
        assert.deepEqual(fresh, old.state, `${ev.id}#${idx} r=${r}：状态不一致`);
        checked++;
      }
    }
  }
  assert.ok(checked > 100, `对拍组合太少：${checked}`);
});

test('条件不足：与旧实现的提示文案一致', () => {
  const cases = [
    ['surv', 0, { food: 0 }],
    ['vending', 0, { gold: 0 }],
    ['mummycurse', 1, { food: 0 }],
    ['fishschool', 1, { rod: false }],
    ['orevein', 1, { ironAxe: false }],
  ];
  for (const [id, idx, patch] of cases) {
    const base = richState();
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'gold') base.gold = v;
      else if (k === 'rod' || k === 'ironAxe') base.items[k] = v;
      else base.res[k] = v;
    }
    const fresh = JSON.parse(JSON.stringify(base));
    const old = oldRun(JSON.parse(JSON.stringify(base)), id, idx, 0.42);
    const now = resolveOption(fresh, evById(id), idx, { random: () => 0.42 });

    assert.deepEqual(now.logs, old.logs, `${id}#${idx}：提示不一致`);
    assert.deepEqual(fresh, old.state, `${id}#${idx}：不应改动状态`);
  }
});

function evById(id) {
  return EXPLORE_EVENTS.find((e) => e.id === id);
}

test('事件抽取：按权重、区域过滤，与旧池一致', () => {
  for (const zone of ['forest', 'river', 'ruins', 'hills', 'pyramid']) {
    for (const r of [0.1, 0.42, 0.9]) {
      // 旧实现同款池子
      const pool = [];
      env.EXPLORE_EVENTS.forEach((e) => {
        if (e.zone && e.zone !== zone) return;
        for (let i = 0; i < e.w; i++) pool.push(e);
      });
      const expected = pool[Math.floor(r * pool.length)].id;

      const got = pickExploreEvent(zone, () => r).id;
      assert.equal(got, expected, `${zone}/${r}`);
    }
  }
});

test('迷路动态选项：金币足够/不足时的禁用状态', () => {
  const rich = richState();
  const optsRich = lostOpts(rich);
  assert.equal(optsRich.length, 3);
  assert.equal(optsRich[1].disabled, false);

  const poor = createNewState(NOW);
  poor.gold = 50;
  const optsPoor = lostOpts(poor);
  assert.equal(optsPoor[1].disabled, true);
  assert.match(optsPoor[1].d, /金币不够（50\/100）/);

  // 禁用时执行应保持"不消耗"
  const before = JSON.parse(JSON.stringify(poor));
  const r = resolveOption(poor, { opts: optsPoor }, 1, { random: () => 0.1 });
  assert.ok(r.refused);
  assert.deepEqual(poor, before);
});
