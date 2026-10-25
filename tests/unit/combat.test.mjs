// 战斗数值与遭遇选择对拍
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { WEAPONS } from '../../src/core/data/weapons.mjs';
import { BEASTS, ROBOTS, REGION_BEASTS, MOON_BEASTS } from '../../src/core/data/monsters.mjs';
import { weaponAtk, bossStats, pharaohStats, isFullMoon, pickMonster, bestiaryIds } from '../../src/core/combat.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

function extractFn(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`找不到 ${name}`);
  const nextFn = html.indexOf('\nfunction ', start + 1);
  const nextComment = html.indexOf('\n/*', start + 1);
  const end = Math.min(...[nextFn, nextComment].filter((i) => i > 0));
  return html.slice(start, end);
}

/** vm：数值函数 + 遭遇选择（startCombat 截到 combat=... 之前） */
function buildOld() {
  const scStart = html.indexOf('function startCombat(');
  // 切到渲染 UI 之前（保留图鉴解锁部分，用于对拍 bestiaryIds）
  const scEnd = html.indexOf("  const w=document.getElementById('evwrap');", scStart);
  const scBody = html.slice(scStart, scEnd) + '\n  __last = { b: b, pool: pool, idx: idx };\n}\n';

  const env = {
    WEAPONS, BEASTS, ROBOTS, REGION_BEASTS, MOON_BEASTS,
    __R: 0.42, __seen: [],
  };
  vm.createContext(env);
  vm.runInContext(`
    Math.random = () => __R;
    function wikiSeen(id){ __seen.push(id) }
    function log(){}
    function weaponAtk(){
      const base = G.items.runeBlade ? WEAPONS.runeBlade : (G.items.huntKing ? WEAPONS.huntKing : (G.items.steel ? WEAPONS.steel : (G.items.iron ? WEAPONS.iron : (G.items.knife ? WEAPONS.knife : WEAPONS.none))));
      const sharp = (G.enchant && G.enchant.weapon)||0;
      return {name:base.name, atk:Math.round(base.atk*(1+sharp*0.10)), baseAtk:base.atk, mult:base.mult, sharp};
    }
    function isFullMoon(){ return G && G.day % 15 === 0; }
    ${extractFn('bossStats')}
    ${extractFn('pharaohStats')}
    var __last = null;
    var combat = null;
    var curZone = null;
    ${scBody}
    globalThis.__pick = function(tierScale, night, forceBeasts, zone){
      __seen.length = 0;
      __last = null;
      curZone = zone;
      startCombat(tierScale, night, forceBeasts);
      return __last;
    };
  `, env);
  return env;
}
const env = buildOld();

test('武器：6 种武器 × 锋利 0–5 级与旧实现一致', () => {
  const fields = ['knife', 'iron', 'steel', 'huntKing', 'runeBlade'];
  for (const w of [null, ...fields]) {
    for (const sharp of [0, 1, 3, 5]) {
      const s = createNewState(NOW);
      for (const f of fields) s.items[f] = false;
      if (w) s.items[w] = true;
      s.enchant.weapon = sharp;

      env.G = s;
      const old = env.weaponAtk ? env.weaponAtk() : null;
      const now = weaponAtk(s);
      if (old) assert.deepEqual(now, JSON.parse(JSON.stringify(old)), `${w}/${sharp}`);
      else assert.ok(now.atk > 0);
    }
  }
});

test('武器：锋利加成按 10%/级', () => {
  const s = createNewState(NOW);
  s.items.steel = true;
  s.enchant.weapon = 5;
  const w = weaponAtk(s);
  assert.equal(w.baseAtk, 28);
  assert.equal(w.atk, Math.round(28 * 1.5));
});

test('Boss：兽王与法老三阶段数值与旧实现一致', () => {
  for (const kills of [0, 1, 2, 5]) {
    const s = createNewState(NOW);
    s.stats.bossKills = kills;
    s.stats.pharaohKills = kills;
    env.G = s;
    assert.deepEqual(bossStats(s), JSON.parse(JSON.stringify(env.bossStats())), `兽王 k=${kills}`);
    assert.deepEqual(pharaohStats(s), JSON.parse(JSON.stringify(env.pharaohStats())), `法老 k=${kills}`);
  }
});

test('满月：每 15 天', () => {
  assert.equal(isFullMoon(15), true);
  assert.equal(isFullMoon(30), true);
  assert.equal(isFullMoon(14), false);
  assert.equal(isFullMoon(1), false);
});

test('遭遇选择：区域特色怪 45% / 档位 / 满月进化 —— 与旧实现一致', () => {
  const zones = [undefined, 'forest', 'river', 'hills', 'ruins', 'pyramid'];
  const rolls = [0.1, 0.3, 0.42, 0.6, 0.9];
  for (const zone of zones) {
    for (const r of rolls) {
      for (const tierScale of [1, 0.5, 2]) {
        for (const moon of [false, true]) {
          const s = createNewState(NOW);
          s.day = moon ? 15 : 7;

          env.__R = r;
          env.__seen.length = 0;
          env.G = s;
          const old = JSON.parse(JSON.stringify(env.__pick(tierScale, false, false, zone)));

          const now = pickMonster(s, { zone, tierScale, random: () => r });
          assert.deepEqual(now.monster, old.b, `${zone}/${r}/${tierScale}/moon=${moon}：怪物不一致`);
          assert.equal(now.idx, old.idx, `${zone}/${r}：索引不一致`);

          const ids = bestiaryIds(now);
          assert.deepEqual(ids, env.__seen, `${zone}/${r}：图鉴解锁 id 不一致`);
        }
      }
    }
  }
  env.__R = 0.42;
});

test('遭遇选择：forceBeasts 强制野兽池', () => {
  const s = createNewState(NOW);
  s.day = 7;
  env.__R = 0.1;
  env.G = s;
  const old = JSON.parse(JSON.stringify(env.__pick(1, false, true, 'forest')));
  const now = pickMonster(s, { zone: 'forest', forceBeasts: true, random: () => 0.1 });
  assert.deepEqual(now.monster, old.b);
  assert.equal(now.pool, 'beasts');
});
