// 黑市商店：分组顺序 + 购买行为（新实现 vs 旧文件 openShop / buyItem）
//
// 旧文件把「渲染顺序、扣款、效果、日志」全写在 openShop/buyItem 里：
//   - 两组商品的 id 数组直接写在模板字符串里 → 这里从 survival.html 切出来逐项对拍
//   - 金币不足只 toast、不改 state；成功时先扣金币再执行效果，最后 log 一条购买日志
// 新实现把规则收进 core/shop.mjs，渲染层只画按钮。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNewState } from '../../src/core/save.mjs';
import { applyEffects } from '../../src/core/effects.mjs';
import { SHOP, SHOP_GROUPS } from '../../src/core/data/shop.mjs';
import { buyShopItem, canBuyShop, canBuyAnyShop } from '../../src/core/shop.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

/** 从旧文件的 openShop() 里切出分区标题与两串商品 id */
function oldShopGroups() {
  const a = html.indexOf('function openShop(){');
  const b = html.indexOf('function buyItem(', a);
  if (a < 0 || b < 0) throw new Error('切片失败: openShop → buyItem');
  const src = html.slice(a, b);

  const titles = [...src.matchAll(/class="craft-sep">([^<]+)</g)].map((m) => m[1].trim());
  const ids = [...src.matchAll(/\[((?:'[A-Za-z0-9_]+',?)+)\]/g)]
    .map((m) => [...m[1].matchAll(/'([A-Za-z0-9_]+)'/g)].map((x) => x[1]));

  if (titles.length !== ids.length) {
    throw new Error(`切片结果不对：${titles.length} 个标题 / ${ids.length} 组商品`);
  }
  return titles.map((title, i) => ({ title, ids: ids[i] }));
}

test('分组：标题与顺序与旧 openShop 逐项一致，并集 = SHOP 全部 14 项', () => {
  const old = oldShopGroups();
  assert.equal(old.length, 2, '旧实现是两组');
  assert.deepEqual(
    SHOP_GROUPS.map((g) => ({ title: g.title, ids: g.ids })),
    old,
    '分组标题或商品顺序与旧实现不一致',
  );

  const flat = SHOP_GROUPS.flatMap((g) => g.ids);
  assert.equal(flat.length, Object.keys(SHOP).length, '有商品没进分组或重复分组');
  assert.equal(new Set(flat).size, flat.length, '分组里有重复 id');
  assert.deepEqual([...flat].sort(), Object.keys(SHOP).sort(), '分组与 SHOP 的键集合不一致');
  assert.equal(Object.keys(SHOP).length, 14);
});

test('逐件购买：扣金币、效果与 applyEffects 一致、日志恰好一条', () => {
  for (const id of Object.keys(SHOP)) {
    const it = SHOP[id];
    const state = createNewState(NOW);
    state.gold = 100_000;

    // 对照：同一份 state 只跑效果，不扣钱
    const exp = structuredClone(state);
    applyEffects(exp, it.effects);

    const r = buyShopItem(state, id);
    assert.equal(r.refused, undefined, `${id} 不应被拒绝`);
    assert.equal(r.spent, it.cost, `${id} 扣款金额`);
    assert.equal(state.gold, exp.gold - it.cost, `${id} 金币没按价扣除`);
    assert.deepEqual(state.res, exp.res, `${id} 资源变化与效果不一致`);
    assert.deepEqual(state.stats.ownedRes, exp.stats.ownedRes, `${id} ownedRes 不一致`);
    assert.equal(state.ill, exp.ill, `${id} 疾病状态不一致`);
    assert.equal(state.lightWound, exp.lightWound, `${id} 轻伤状态不一致`);
    assert.equal(state.heavyWound, exp.heavyWound, `${id} 重伤状态不一致`);

    assert.equal(r.logs.length, 1, `${id} 应该只产出一条购买日志`);
    assert.equal(r.logs[0].text, `💰 在黑市购买了 ${it.name}。`);
    assert.equal(r.logs[0].cls, 'good');
  }
});

test('金币不足：不动 state，提示文案与旧 buyItem 一致', () => {
  const state = createNewState(NOW);
  state.gold = SHOP.rune.cost - 1;
  const before = structuredClone(state);

  const r = buyShopItem(state, 'rune');
  assert.equal(r.refused, '金币不足，先卖点资源吧');
  assert.equal(r.spent, 0);
  assert.deepEqual(r.logs, []);
  assert.deepEqual(state, before, '金币不足时 state 不应有任何变化');
  assert.equal(canBuyShop(state, 'rune').ok, false);
});

test('未知商品：拒绝且不动 state', () => {
  const state = createNewState(NOW);
  state.gold = 9999;
  const before = structuredClone(state);

  const r = buyShopItem(state, 'nope');
  assert.equal(r.refused, '没有这件商品');
  assert.deepEqual(r.logs, []);
  assert.deepEqual(state, before);
  assert.equal(canBuyShop(state, 'nope').ok, false);
});

test('边界：金币刚好够买一次 → 买完就买不起任何东西', () => {
  const it = SHOP.herb;
  const state = createNewState(NOW);
  state.gold = it.cost;
  assert.equal(canBuyAnyShop(state), true);

  const r = buyShopItem(state, 'herb');
  assert.equal(r.refused, undefined);
  assert.equal(state.gold, 0);
  assert.equal(canBuyShop(state, 'herb').ok, false);
  assert.equal(canBuyAnyShop(state), false, '0 金币时不应还有可买商品');
});
