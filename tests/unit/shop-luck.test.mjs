// 行为对拍：商店 / 幸运方块 —— 旧实现（闭包函数）vs 新实现（声明式指令）
//
// 做法：在 vm 里重建旧文件的运行环境（G / addRes / clamp / rnd / log / RES_NAMES），
// 把旧表的 eff 真跑一遍；再用 applyEffects 跑新表。同一个随机数下，
// **整个 state 与日志列表必须完全一致**。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { applyEffects } from '../../src/core/effects.mjs';
import { resNames } from '../../src/core/data/resources.mjs';
import { SHOP } from '../../src/core/data/shop.mjs';
import { LUCK_EVENTS } from '../../src/core/data/luck-events.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');
const NOW = 1_700_000_000_000;
const R = 0.42; // 固定随机数

function sliceBetween(from, to) {
  const a = html.indexOf(from);
  const b = html.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`切片失败: ${from} → ${to}`);
  return html.slice(a, b);
}

/** 在 vm 里重建旧文件的环境，返回 { env, SHOP, LUCK_EVENTS } */
function buildOldEnv() {
  const env = { __RES_NAMES: resNames(), __R: R, __logs: [] };
  vm.createContext(env);
  const script = `
    Math.random = () => __R;
    globalThis.RES_NAMES = __RES_NAMES;
    function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
    function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a}
    function addRes(k,n){ if(!(k in G.res)) G.res[k]=0; G.res[k]+=n; if(n>0&&G.stats){ if(!G.stats.ownedRes) G.stats.ownedRes={}; G.stats.ownedRes[k]=1 } }
    function log(m,c){ __logs.push({text:m, cls:c||'sys'}) }
    ${sliceBetween('const SHOP = {', '/* 幸运方块事件池')}
    ${sliceBetween('const LUCK_EVENTS = [', 'const RECIPES = {')}
    globalThis.__out = { SHOP, LUCK_EVENTS };
  `;
  vm.runInContext(script, env);
  return env;
}

const env = buildOldEnv();

test('商店：14 项，逐项对拍（state + 日志完全一致）', () => {
  assert.equal(Object.keys(SHOP).length, 14);
  assert.deepEqual(Object.keys(SHOP), Object.keys(env.__out.SHOP));

  for (const [id, item] of Object.entries(SHOP)) {
    const state = createNewState(NOW);
    env.G = state;
    env.__logs.length = 0;
    const old = env.__out.SHOP[id];
    assert.equal(old.name, item.name, `${id} 名称不一致`);
    assert.equal(old.cost, item.cost, `${id} 价格不一致`);

    old.eff();
    const oldLogs = JSON.parse(JSON.stringify(env.__logs));

    const fresh = createNewState(NOW);
    const newLogs = applyEffects(fresh, item.effects, { random: () => R });

    assert.deepEqual(fresh, state, `${id} 执行后的状态不一致`);
    assert.deepEqual(newLogs, oldLogs, `${id} 日志不一致`);
  }
});

test('幸运方块：18 项，逐项对拍（含小偷偷取）', () => {
  assert.equal(LUCK_EVENTS.length, 18);
  assert.equal(env.__out.LUCK_EVENTS.length, 18);

  LUCK_EVENTS.forEach((item, i) => {
    const old = env.__out.LUCK_EVENTS[i];
    assert.equal(old.name, item.name, `第 ${i} 项名称不一致`);
    assert.equal(old.w, item.w, `${item.name} 权重不一致`);

    const state = createNewState(NOW);
    env.G = state;
    env.__logs.length = 0;
    old.eff();
    const oldLogs = JSON.parse(JSON.stringify(env.__logs));

    const fresh = createNewState(NOW);
    const newLogs = applyEffects(fresh, item.effects, { random: () => R });

    assert.deepEqual(fresh, state, `${item.name} 执行后的状态不一致`);
    assert.deepEqual(newLogs, oldLogs, `${item.name} 日志不一致`);
  });
});

test('幸运方块权重：好 21 / 坏 13（与旧表一致）', () => {
  // 注意：数组里"好/坏"并不是按位置连续排列的（不死图腾、肾上腺素排在后面但效果是好的），
  // 所以按名称分类，不能按 slice。
  const GOOD = new Set([
    '金属富矿', '皮革大礼', '纯净水泉', '食物满仓', '金币雨', '合金之心',
    '全愈圣水', '珍稀草药', '隐藏宝箱', '不死图腾', '肾上腺素',
  ]);
  const sum = (list, pick) => list.filter(pick).reduce((a, e) => a + e.w, 0);

  const good = sum(LUCK_EVENTS, (e) => GOOD.has(e.name));
  const bad = sum(LUCK_EVENTS, (e) => !GOOD.has(e.name));
  const oldGood = sum(env.__out.LUCK_EVENTS, (e) => GOOD.has(e.name));
  const oldBad = sum(env.__out.LUCK_EVENTS, (e) => !GOOD.has(e.name));

  assert.equal(good, 21);
  assert.equal(bad, 13);
  assert.equal(good + bad, 34, '权重总和应保持不变');
  assert.deepEqual([good, bad], [oldGood, oldBad]);
  assert.equal(new Set(LUCK_EVENTS.map((e) => e.name)).size, 18, '名称应唯一');
});

test('每一项效果引用的资源都存在（防止拼错 id）', () => {
  const names = resNames();
  const all = [
    ...Object.values(SHOP).flatMap((s) => s.effects),
    ...LUCK_EVENTS.flatMap((e) => e.effects),
  ];
  for (const e of all) {
    if (e.op === 'res') assert.ok(e.res in names, `效果引用了未定义的资源 ${e.res}`);
  }
});
