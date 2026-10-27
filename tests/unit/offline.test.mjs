// 离线结算：与 legacy/survival.html 的 settleOffline() 逐字段对拍
//
// 旧实现直接改全局 G 并 log；新实现返回 {logs, gains} 由 UI 写日志。
// 同一个初始 state + 同一段离线时长，**state 与日志必须完全一致**。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { resNames } from '../../src/core/data/resources.mjs';
import { settleOffline, OFFLINE_MAX_HOURS, OFFLINE_MIN_HOURS } from '../../src/core/offline.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'legacy/survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

function sliceBetween(from, to) {
  const a = html.indexOf(from);
  const b = html.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`切片失败: ${from} → ${to}`);
  return html.slice(a, b);
}

const LEGACY = sliceBetween('function settleOffline(ms){', 'function save(){');

/**
 * 在 vm 里跑旧实现。
 * @param {any} state
 * @param {number} ms
 */
function legacySettle(state, ms) {
  const env = { G: state, __RES_NAMES: resNames(), __logs: [] };
  vm.createContext(env);
  vm.runInContext(`
    const RES_NAMES = __RES_NAMES;
    function has(k){ return !!G.items[k]; }
    function clamp(v,lo,hi){ return Math.max(lo, Math.min(hi, v)); }
    function addRes(k,n){ if(!(k in G.res)) G.res[k]=0; G.res[k]+=n; if(n>0&&G.stats){ if(!G.stats.ownedRes) G.stats.ownedRes={}; G.stats.ownedRes[k]=1 } }
    function log(m,c){ __logs.push({text:m, cls:c||'sys'}); }
    ${LEGACY}
    globalThis.__settle = settleOffline;
  `, env);
  env.__settle(ms);
  // vm 里创建的对象跨 realm，deepEqual 会因 prototype 不同误报；序列化后就地归一
  return { state: env.G, logs: JSON.parse(JSON.stringify(env.__logs)) };
}

/** 同一起点的两份 state */
function pair() {
  const a = createNewState(NOW);
  a.food = 80; a.water = 80; a.stam = 40; a.hp = 100; a.day = 12; a.season = 0;
  a.items.trap = true; a.items.farm = true; a.items.puri = true; a.items.axe = true;
  return [a, structuredClone(a)];
}

function compare(ms, setup) {
  const [oldState, newState] = pair();
  if (setup) { setup(oldState); setup(newState); }
  const old = legacySettle(oldState, ms);
  const fresh = settleOffline(newState, ms);
  assert.deepEqual(newState, old.state, `state 不一致（${ms}ms）`);
  assert.deepEqual(fresh.logs, old.logs, `日志不一致（${ms}ms）`);
  return { old, fresh, state: newState };
}

test('8 小时内：产出、消耗、日志与旧实现逐字段一致', () => {
  const { fresh } = compare(6 * 3600 * 1000);
  assert.equal(fresh.settled, true);
  assert.equal(fresh.hours, 6);
  assert.match(fresh.logs.at(-1).text, /你离开了 6 小时/);
});

test('半小时粒度：2.9 小时按 2.5 小时结算', () => {
  const { fresh } = compare(2.9 * 3600 * 1000);
  assert.equal(fresh.hours, 2.5);
  assert.match(fresh.logs.at(-1).text, /2\.5 小时/);
});

test('超过 8 小时按 8 小时封顶', () => {
  const { fresh } = compare(48 * 3600 * 1000);
  assert.equal(fresh.hours, OFFLINE_MAX_HOURS);
  assert.match(fresh.logs.at(-1).text, /8 小时/);
});

test('不到 9 分钟不结算（state 不变、无日志）', () => {
  const [oldState, newState] = pair();
  const before = structuredClone(newState);
  const fresh = settleOffline(newState, (OFFLINE_MIN_HOURS - 0.01) * 3600 * 1000);
  assert.equal(fresh.settled, false);
  assert.deepEqual(fresh.logs, []);
  assert.deepEqual(newState, before);
  // 旧实现同样什么都不做
  const old = legacySettle(oldState, (OFFLINE_MIN_HOURS - 0.01) * 3600 * 1000);
  assert.deepEqual(old.logs, []);
});

test('冬季没有火堆：掉血封顶到 20，且日志顺序与旧实现一致', () => {
  const { fresh, state } = compare(3 * 3600 * 1000, (s) => { s.season = 3; s.items.fire = false; });
  assert.equal(fresh.logs[0].cls, 'bad');
  assert.match(fresh.logs[0].text, /寒冬/);
  assert.ok(state.hp >= 20);
});

test('没有设施：只有消耗与「平安无事」，仍与旧实现一致', () => {
  const { fresh } = compare(4 * 3600 * 1000, (s) => {
    s.items = { ...s.items, trap: false, farm: false, puri: false, axe: false, ironAxe: false };
  });
  assert.deepEqual(fresh.gains, []);
  assert.match(fresh.logs.at(-1).text, /平安无事/);
});

test('死亡状态：不做寒冬扣血，其余照旧', () => {
  compare(5 * 3600 * 1000, (s) => { s.dead = true; s.season = 3; s.items.fire = false; });
});
