// 时间 / 生存结算单测
//
// applyPassive 用 vm 对拍真实旧实现；季节/天气/每日消耗按规则表验证（含边界与"原样保留"的怪行为）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { seasonOf, rollWeather, dailyConsume, advanceHour, applyPassive, SEASONS, WEATHERS } from '../../src/core/time.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

/* ---------- 旧 applyPassive（在 vm 里跑真实现） ---------- */
function buildOldPassive() {
  const env = { __logs: [] };
  vm.createContext(env);
  const a = html.indexOf('function applyPassive()');
  const b = html.indexOf('/* ---------------- 随机事件', a);
  const code = `
    function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
    function isAdrenaline(){ return (G.adrenalineLeft||0) > 0; }
    function log(m,c){ __logs.push({text:m, cls:c||'sys'}) }
    ${html.slice(a, b)}
    globalThis.__apply = applyPassive;
  `;
  vm.runInContext(code, env);
  return env;
}
const oldEnv = buildOldPassive();

test('applyPassive：与旧实现逐字段对上（多组状态）', () => {
  const cases = [
    { food: 0, water: 0, hp: 100, ill: false, heavyWound: false, lightWound: false, adrenalineLeft: 0 },
    { food: 10, water: 10, hp: 50, ill: true, heavyWound: false, lightWound: false, adrenalineLeft: 0 },
    { food: 50, water: 50, hp: 50, ill: false, heavyWound: true, lightWound: true, adrenalineLeft: 0 },
    { food: 50, water: 50, hp: 50, ill: true, heavyWound: false, lightWound: true, adrenalineLeft: 0 },
    { food: 0, water: 0, hp: 5, ill: true, heavyWound: true, lightWound: false, adrenalineLeft: 3 },
    { food: 100, water: 100, hp: 100, ill: false, heavyWound: false, lightWound: false, adrenalineLeft: 0 },
  ];
  for (const c of cases) {
    const oldState = { ...c };
    oldEnv.G = oldState;
    oldEnv.__logs.length = 0;
    oldEnv.__apply();
    const oldLogs = JSON.parse(JSON.stringify(oldEnv.__logs));

    const newState = { ...c };
    const newLogs = applyPassive(newState);

    assert.equal(newState.hp, oldState.hp, `hp 不一致（${JSON.stringify(c)}）`);
    assert.deepEqual(newLogs, oldLogs, `日志不一致（${JSON.stringify(c)}）`);
  }
});

test('applyPassive：血量不会低于 0', () => {
  const s = { food: 0, water: 0, hp: 3, ill: true, heavyWound: true, lightWound: false, adrenalineLeft: 0 };
  applyPassive(s);
  assert.equal(s.hp, 0);
});

test('seasonOf：每 10 天一季，40 天一轮', () => {
  assert.equal(seasonOf(1), 0);
  assert.equal(seasonOf(10), 0);
  assert.equal(seasonOf(11), 1);
  assert.equal(seasonOf(30), 2);
  assert.equal(seasonOf(31), 3);
  assert.equal(seasonOf(41), 0);   // 回到春天
  assert.equal(seasonOf(80), 3);
});

test('rollWeather：冬季分布含四种，非冬季跳过暴雨（原样保留）', () => {
  // 冬季：0/1/2/3/4 全都有可能
  const winter = [0.1, 0.5, 0.8, 0.9, 0.99].map((r) => rollWeather(3, () => r));
  assert.deepEqual(winter, [0, 1, 2, 3, 4]);

  // 非冬季：0/1/2/4 —— 没有 3（暴雨），这是原实现的分布
  const summer = [0.1, 0.6, 0.95].map((r) => rollWeather(0, () => r));
  assert.deepEqual(summer, [0, 1, 4]);
  assert.ok(!summer.includes(3));
  for (let season = 0; season < 3; season++) {
    const got = [0.1, 0.6, 0.8, 0.95].map((r) => rollWeather(season, () => r));
    assert.ok(!got.includes(3), `非冬季不该出现暴雨（season=${season}）`);
  }
});

test('rollWeather 结果始终是合法天气索引', () => {
  for (let season = 0; season < 4; season++) {
    for (let i = 0; i <= 100; i++) {
      const w = rollWeather(season, () => i / 100);
      assert.ok(w >= 0 && w < WEATHERS.length, `非法天气索引 ${w}`);
    }
  }
});

test('dailyConsume：天气 / 后期压力 / 永恒仓库 / 肾上腺素', () => {
  assert.deepEqual(dailyConsume({ weather: 0, day: 1, hasVault: false, adrenaline: false }), { food: 15, water: 20 });
  assert.deepEqual(dailyConsume({ weather: 4, day: 1, hasVault: false, adrenaline: false }), { food: 18, water: 28 });
  // 第 30 天起 +15%
  assert.deepEqual(dailyConsume({ weather: 0, day: 31, hasVault: false, adrenaline: false }), { food: 17, water: 23 });
  // 永恒仓库减半
  assert.deepEqual(dailyConsume({ weather: 0, day: 1, hasVault: true, adrenaline: false }), { food: 8, water: 10 });
  // 肾上腺素：完全不掉
  assert.deepEqual(dailyConsume({ weather: 4, day: 99, hasVault: false, adrenaline: true }), { food: 0, water: 0 });
});

test('advanceHour：跨零点是几天就返回几，肾上腺素同步递减', () => {
  const s = createNewState(NOW);
  s.hour = 22;
  s.adrenalineLeft = 5;
  assert.equal(advanceHour(s, 4), 1);
  assert.equal(s.hour, 2);
  assert.equal(s.adrenalineLeft, 1);

  s.hour = 8;
  s.adrenalineLeft = 0;
  assert.equal(advanceHour(s, 2), 0);
  assert.equal(s.hour, 10);

  s.hour = 20;
  assert.equal(advanceHour(s, 30), 2);
  assert.equal(s.hour, 2);
});

test('SEASONS / WEATHERS 与旧文件一致', () => {
  const oldS = /const SEASONS = (\[[^\]]*\])/.exec(html)[1].replace(/'/g, '"');
  const oldW = /const WEATHERS = (\[[^\]]*\])/.exec(html)[1].replace(/'/g, '"');
  assert.deepEqual(SEASONS, JSON.parse(oldS));
  assert.deepEqual(WEATHERS, JSON.parse(oldW));
});
