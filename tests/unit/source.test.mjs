// 源码文本解析工具的单测（纯字符串处理，不跑浏览器）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { objectBody, topLevelKeys, flatKeys } from '../../tools/lib/source.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');

test('objectBody 能取出真实数据表', () => {
  const body = objectBody(html, 'RES_NAMES');
  assert.ok(body && body.length > 100);
  assert.equal(topLevelKeys(body).length, 23); // 当前资源总数
});

test('objectBody 找不到时返回 null（不抛错）', () => {
  assert.equal(objectBody(html, 'NOT_A_TABLE'), null);
});

test('topLevelKeys 只取顶层键，忽略嵌套对象的键', () => {
  const body = `a:1, b:{inner:2, deep:{x:3}}, c:['d:4'], e:5`;
  assert.deepEqual(topLevelKeys(body), ['a', 'b', 'c', 'e']);
});

test('flatKeys 用于扁平对象（如 newGame().res）', () => {
  const keys = flatKeys('wood:4, stone:2, rune:0');
  assert.deepEqual([...keys], ['wood', 'stone', 'rune']);
});

test('资源表在 5 处派生位置都有同一批键', () => {
  const names = topLevelKeys(objectBody(html, 'RES_NAMES'));
  const prices = topLevelKeys(objectBody(html, 'RES_PRICE'));
  const where = topLevelKeys(objectBody(html, 'GET_WHERE'));
  const ngStart = html.indexOf('function newGame');
  const nsStart = html.indexOf('function normalizeState');
  const ng = flatKeys(/res:\{([^}]*)\}/.exec(html.slice(ngStart))[1]);
  const ns = flatKeys(/res:\{([^}]*)\}/.exec(html.slice(nsStart))[1]);

  const missing = (set) => names.filter((k) => !set.has(k));
  // RES_PRICE 缺项 = 该资源不可出售（渲染层 `if(!RES_PRICE[k]) return;`），属设计允许
  const NOT_SELLABLE = new Set(['totem', 'adrenaline']);
  assert.deepEqual(missing(new Set(prices)).filter((k) => !NOT_SELLABLE.has(k)), [], 'RES_PRICE 出现意外缺键');
  assert.deepEqual(missing(new Set(where)), [], 'GET_WHERE 缺键');
  assert.deepEqual(missing(ng), [], 'newGame().res 缺键');
  assert.deepEqual(missing(ns), [], 'normalizeState().res 缺键');
});
