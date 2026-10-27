// 资源表单测：**零漂移对拍**
//
// 迁移期最关键的一条：新表派生出来的结果必须与 survival.html 里现有的 5 处逐键逐值一致。
// 任何一项对不上都说明搬运时改错了数，必须红。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { objectBody, flatPairs } from '../../tools/lib/source.mjs';
import { RESOURCES, RES_IDS, resNames, resPrices, getWhere, defaultRes } from '../../src/core/data/resources.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'legacy/survival.html'), 'utf8');

// 从旧文件里读出的 5 处
const oldNames = flatPairs(objectBody(html, 'RES_NAMES'));
const oldPrices = flatPairs(objectBody(html, 'RES_PRICE'));
const oldWhere = flatPairs(objectBody(html, 'GET_WHERE'));
const oldNewGame = flatPairs(/res:\{([^}]*)\}/.exec(html.slice(html.indexOf('function newGame')))[1]);
const oldNormalize = flatPairs(/res:\{([^}]*)\}/.exec(html.slice(html.indexOf('function normalizeState')))[1]);

test('资源表结构：23 条，id 唯一且非空', () => {
  assert.equal(RESOURCES.length, 23);
  assert.equal(new Set(RES_IDS).size, 23);
  for (const r of RESOURCES) {
    assert.ok(r.id && r.name, `资源 ${r.id} 缺 id 或 name`);
    assert.ok(Number.isInteger(r.init) && r.init >= 0, `资源 ${r.id} 的 init 非法`);
  }
});

test('零漂移：RES_NAMES 逐键逐值一致', () => {
  assert.deepEqual(resNames(), oldNames);
});

test('零漂移：RES_PRICE 逐键逐值一致（不可出售的不进表）', () => {
  assert.deepEqual(resPrices(), oldPrices);
});

test('零漂移：GET_WHERE 逐键逐值一致', () => {
  assert.deepEqual(getWhere(), oldWhere);
});

test('零漂移：存档默认值 = newGame().res = normalizeState().res', () => {
  assert.deepEqual(defaultRes(), oldNewGame);
  assert.deepEqual(defaultRes(), oldNormalize);
});

test('不可出售的资源只有 totem / adrenaline', () => {
  const notSellable = RESOURCES.filter((r) => r.price === null).map((r) => r.id);
  assert.deepEqual(notSellable.sort(), ['adrenaline', 'totem']);
});

test('派生表的键集合与资源表完全一致', () => {
  const ids = new Set(RES_IDS);
  assert.deepEqual(new Set(Object.keys(resNames())), ids);
  assert.deepEqual(new Set(Object.keys(getWhere())), ids);
  assert.deepEqual(new Set(Object.keys(defaultRes())), ids);
  // 价格表允许少（不可出售），但不能多出未知键
  for (const k of Object.keys(resPrices())) assert.ok(ids.has(k), `价格表出现未知键 ${k}`);
});
