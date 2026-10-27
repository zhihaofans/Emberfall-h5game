// 黑市商店的购买逻辑（纯函数：不碰 DOM、不碰 localStorage）。
//
// 为什么单独一个模块：商店的「能不能买 / 买了扣多少 / 效果怎么生效」属于规则，
// 渲染层只负责画按钮。旧文件把这些混在 `buyItem()` 里直接改全局 G 并 toast，
// 拆出来之后可以被单测覆盖，也能被别的入口（如未来的批量购买）复用。

import { SHOP } from './data/shop.mjs';
import { applyEffects } from './effects.mjs';

/** @typedef {import('./types.mjs').LogEntry} LogEntry */

/** 商品表按 id 索引（SHOP 是对象字面量，TS 推断不出字符串索引签名） */
/** @type {Record<string, {name: string, cost: number, effects: any[]}>} */
const TABLE = SHOP;

/**
 * 取一件商品；未知 id 返回 null。
 * @param {string} id
 * @returns {any|null}
 */
export function shopItem(id) {
  return TABLE[id] ?? null;
}

/**
 * 能否购买：只判金币，不判是否已拥有（消耗品可以重复买）。
 * @param {any} state
 * @param {string} id
 * @returns {{ok: boolean, reason?: string}}
 */
export function canBuyShop(state, id) {
  const item = shopItem(id);
  if (!item) return { ok: false, reason: '没有这件商品' };
  if ((state.gold || 0) < item.cost) return { ok: false, reason: '金币不足，先卖点资源吧' };
  return { ok: true };
}

/**
 * 是否还有买得起的商品（商店界面用来判断"还能不能继续买"）。
 * @param {any} state
 * @returns {boolean}
 */
export function canBuyAnyShop(state) {
  return Object.keys(SHOP).some((id) => canBuyShop(state, id).ok);
}

/**
 * 买下一件商品：扣金币 → 执行效果 → 记一条购买日志。
 *
 * 与旧 `buyItem()` 等价：金币不足时不做任何改动（旧实现只 toast 后 return），
 * 成功时的日志文案、`good` 分类、扣款顺序都与旧版一致。
 *
 * @param {any} state
 * @param {string} id
 * @returns {{logs: LogEntry[], refused?: string, spent: number}}
 */
export function buyShopItem(state, id) {
  const item = shopItem(id);
  if (!item) return { logs: [], refused: '没有这件商品', spent: 0 };

  const chk = canBuyShop(state, id);
  if (!chk.ok) return { logs: [], refused: chk.reason, spent: 0 };

  state.gold = (state.gold || 0) - item.cost;
  const logs = applyEffects(state, item.effects ?? []);
  logs.push({ text: `💰 在黑市购买了 ${item.name}。`, cls: 'good' });
  return { logs, spent: item.cost };
}
