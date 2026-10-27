// 探索与夜间事件对拍
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { ZONES } from '../../src/core/data/zones.mjs';
import { NIGHT_EVENTS } from '../../src/core/data/events-night.mjs';
import { resNames } from '../../src/core/data/resources.mjs';
import { exploreZone, rollNightEvent, rollExploreEvent } from '../../src/core/explore.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'legacy/survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

function sliceBetween(from, to) {
  const a = html.indexOf(from);
  const b = html.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`切片失败: ${from} → ${to}`);
  return html.slice(a, b);
}

function buildOld() {
  const env = {
    ZONES, NIGHT_EVENTS, RES_NAMES: resNames(),
    __R: 0.42, __logs: [], __events: 0, __combat: [], __ach: [],
    __curZone: 'forest',
  };
  vm.createContext(env);
  vm.runInContext(`
    Math.random = () => __R;
    globalThis.curZone = 'forest';
    function log(m,c){ __logs.push({text:m, cls:c||'sys'}) }
    function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a}
    function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
    function addRes(k,n){ if(!(k in G.res)) G.res[k]=0; G.res[k]+=n; if(n>0&&G.stats){ if(!G.stats.ownedRes) G.stats.ownedRes={}; G.stats.ownedRes[k]=1 } }
    function has(k){ return !!G.items[k] }
    function skillLvl(k){ return (G.skills[k] && G.skills[k].lvl) || 1 }
    function isFullMoon(){ return G && G.day % 15 === 0 }
    function checkMilestone(id){ __ach.push(id) }
    function rollExploreEvent(){ __events++ }
    function startCombat(n, night){ __combat.push('normal:'+n+':'+night) }
    function startBossFight(night){ __combat.push('boss:'+night) }
    function renderAll(){} function save(){}
    ${sliceBetween('function doExplore(){', '/* 幸运方块使用 */')}
    ${sliceBetween('function rollNightEvent(){', '/* 月圆之夜专属事件')}
    globalThis.__api = { doExplore, rollNightEvent };
  `, env);
  return env;
}
const env = buildOld();

function oldExplore(state, zone, r) {
  env.G = state;
  env.__logs.length = 0;
  env.__events = 0;
  env.__R = r;
  vm.runInContext(`curZone = ${JSON.stringify(zone)}`, env);
  env.__api.doExplore();
  return { logs: JSON.parse(JSON.stringify(env.__logs)), events: env.__events, state: JSON.parse(JSON.stringify(env.G)) };
}

function oldNight(state, r) {
  env.G = state;
  env.__logs.length = 0;
  env.__ach.length = 0;
  env.__combat.length = 0;
  env.__R = r;
  env.__api.rollNightEvent();
  return {
    logs: JSON.parse(JSON.stringify(env.__logs)),
    ach: [...env.__ach],
    combat: [...env.__combat],
    state: JSON.parse(JSON.stringify(env.G)),
  };
}

test('区域探索：产出 / 天气惩罚 / 掉落，与旧实现一致', () => {
  for (const zone of Object.keys(ZONES)) {
    for (const r of [0.1, 0.42, 0.9]) {
      for (const weather of [0, 3, 4]) {
        const base = createNewState(NOW);
        base.weather = weather;
        base.hour = 12;

        const fresh = JSON.parse(JSON.stringify(base));
        const old = oldExplore(base, zone, r);
        const res = exploreZone(fresh, { zone, ctx: { random: () => r } });

        assert.deepEqual(res.logs, old.logs, `${zone}/${r}/weather=${weather}：日志不一致`);
        assert.deepEqual(fresh, old.state, `${zone}/${r}/weather=${weather}：状态不一致`);
      }
    }
  }
});

test('区域探索：工具加成（斧头多一次、瞭望塔/铁匠炉/大师炉）', () => {
  const base = createNewState(NOW);
  base.items.axe = true;
  base.items.tower = true;
  base.items.forge = true;
  base.items.forgeMast = true;
  const fresh = JSON.parse(JSON.stringify(base));

  const old = oldExplore(base, 'hills', 0.1);
  const res = exploreZone(fresh, { zone: 'hills', ctx: { random: () => 0.1 } });

  assert.deepEqual(res.logs, old.logs);
  assert.deepEqual(fresh, old.state);
});

test('区域探索：事件触发位置与旧实现一致（onEvent 被调用的时机）', () => {
  const base = createNewState(NOW);
  let called = 0;
  const fresh = JSON.parse(JSON.stringify(base));
  exploreZone(fresh, { zone: 'forest', ctx: { random: () => 0.1 }, onEvent: () => { called++; } });

  const old = oldExplore(JSON.parse(JSON.stringify(base)), 'forest', 0.1);
  assert.equal(called, old.events, '事件触发次数不一致');
});

test('夜晚：金币过万被偷光（含 robbed1 成就）', () => {
  const base = createNewState(NOW);
  base.gold = 20000;

  const fresh = JSON.parse(JSON.stringify(base));
  const old = oldNight(base, 0.05);
  const r = rollNightEvent(fresh, { ctx: { random: () => 0.05 } });

  assert.deepEqual(r.logs, old.logs);
  assert.deepEqual(r.achievements, old.ach);
  assert.equal(fresh.gold, 1);
  assert.deepEqual(fresh, old.state);
});

test('夜晚：满月 70% 触发专属事件 / 否则提示', () => {
  const base = createNewState(NOW);
  base.day = 15;

  // 0.42 < 0.7 → 触发月圆事件
  const r1 = rollNightEvent(JSON.parse(JSON.stringify(base)), { ctx: { random: () => 0.42 } });
  assert.equal(r1.moonEvent, true);

  // 0.9 > 0.7 → 只提示
  const fresh = JSON.parse(JSON.stringify(base));
  const old = oldNight(JSON.parse(JSON.stringify(base)), 0.9);
  const r2 = rollNightEvent(fresh, { ctx: { random: () => 0.9 } });
  assert.equal(r2.moonEvent, undefined);
  assert.deepEqual(r2.logs, old.logs);
});

test('夜晚：35% 直接跳过 / 兽王遭遇', () => {
  const base = createNewState(NOW);
  base.day = 40;
  base.stats.bossKills = 0;
  base.stats.bossFirstAt = 0;

  // 0.42 > 0.35 → 继续判定；兽王概率 0.05，0.42 不中 → 抽夜间事件
  const fresh = JSON.parse(JSON.stringify(base));
  const old = oldNight(JSON.parse(JSON.stringify(base)), 0.42);
  const r = rollNightEvent(fresh, { ctx: { random: () => 0.42 } });
  assert.deepEqual(r.logs, old.logs);
  assert.deepEqual(fresh, old.state);

  // 0.1 < 0.35 → 这一夜平安无事，直接返回（没有日志）
  const skip = rollNightEvent(JSON.parse(JSON.stringify(base)), { ctx: { random: () => 0.1 } });
  assert.deepEqual(skip.logs, []);
  assert.equal(skip.combat, undefined);
});

test('夜晚：四种事件（夜袭/寒夜/小偷/宁静）与旧实现一致', () => {
  for (const r of [0.1, 0.3, 0.42, 0.6, 0.8]) {
    for (const season of [0, 3]) {
      for (const fire of [false, true]) {
        const base = createNewState(NOW);
        base.day = 7;
        base.season = season;
        base.items.fire = fire;
        base.gold = 100;
        base.res.food = 10;

        const fresh = JSON.parse(JSON.stringify(base));
        const old = oldNight(base, r);
        const now = rollNightEvent(fresh, { ctx: { random: () => r } });

        assert.deepEqual(now.logs, old.logs, `r=${r}/season=${season}/fire=${fire}：日志不一致`);
        assert.deepEqual(fresh, old.state, `r=${r}/season=${season}/fire=${fire}：状态不一致`);
        assert.equal(now.combat ? 'combat' : 'none', old.combat.length ? 'combat' : 'none', `r=${r}：战斗触发不一致`);
      }
    }
  }
});

test('rollExploreEvent：落到"抽事件"分支不抛错（曾漏 import pickExploreEvent）', () => {
  const s = createNewState(NOW);
  s.day = 1; // 低于兽王(30 天)/法老(25 天)门槛，只走后两段判定

  // forest 的 danger 是 0.18：0.9 不进战斗，应当继续抽事件
  const r = rollExploreEvent(s, 'forest', { ctx: { random: () => 0.9 } });
  assert.equal(r.kind, 'event', `期望抽到事件，实际 ${r.kind}`);
  assert.ok(r.event && r.event.id, '抽到的事件要带 id');

  // 换成 0.01 就该进战斗分支
  const r2 = rollExploreEvent(s, 'forest', { ctx: { random: () => 0.01 } });
  assert.equal(r2.kind, 'combat');
});
