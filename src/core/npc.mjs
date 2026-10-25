// NPC：猫耳机器人（好感度 / 万能口袋 / 送礼）与流浪商人（商品池 / 交易）
//
// 对应 survival.html 的 doraInfo / addDoraFav / doraGoods / doraGiftOpts / doraPocketOpts
// 与 pickMerchantGoods / trade。选项渲染留在表现层，这里给出「能不能选 / 选了之后发生什么」。

import { DORA_LEVELS, DORA_GOODS, DORA_GIFTS, MERCHANT_GOODS } from './data/npc.mjs';
import { RECIPES } from './data/recipes.mjs';
import { addRes, spend } from './state.mjs';
import { resNames } from './data/resources.mjs';

/** @typedef {{text: string, cls: string}} LogEntry */

/**
 * 当前好感度信息。
 * @param {any} state
 * @returns {{fav: number, lvl: number, name: string, nextNeed: number, max: boolean}}
 */
export function doraInfo(state) {
  if (!state.npcDora) state.npcDora = { fav: 0 };
  const fav = state.npcDora.fav || 0;
  let cur = DORA_LEVELS[0];
  for (const L of DORA_LEVELS) if (fav >= L.need) cur = L;
  const next = DORA_LEVELS.find((L) => L.lvl === cur.lvl + 1) || null;
  return {
    fav,
    lvl: cur.lvl,
    name: cur.name,
    nextNeed: next ? next.need - fav : 0,
    max: !next,
  };
}

/**
 * 加好感度；跨级时写日志，满级触发 dora6 成就。
 * @param {any} state
 * @param {number} n
 * @returns {{logs: LogEntry[], achievements: string[]}}
 */
export function addDoraFav(state, n) {
  if (!state.npcDora) state.npcDora = { fav: 0 };
  const before = doraInfo(state);
  state.npcDora.fav = (state.npcDora.fav || 0) + n;
  const after = doraInfo(state);
  const logs = [];
  const achievements = [];
  if (after.lvl > before.lvl) {
    logs.push({ text: `🤖 猫耳机器人的眼睛亮了亮：「好感度提升！我们现在是「${after.name}」啦！」`, cls: 'good' });
    if (after.lvl >= 6) achievements.push('dora6');
  }
  return { logs, achievements };
}

/**
 * 当前好感度可买的商品。
 * @param {any} state
 * @returns {typeof DORA_GOODS}
 */
export function doraGoods(state) {
  const cur = doraInfo(state).lvl;
  return DORA_GOODS.filter((g) => g.lvl <= cur);
}

/**
 * 送礼选项是否可选（材料是否够）。
 * @param {any} state
 * @param {number} idx
 * @returns {boolean}
 */
export function canGift(state, idx) {
  const gt = DORA_GIFTS[idx];
  if (!gt) return false;
  return Object.keys(gt.need).every((c) => (state.res[c] || 0) >= gt.need[c]);
}

/**
 * 送礼。
 * @param {any} state
 * @param {number} idx
 * @returns {{logs: LogEntry[], achievements: string[], refused?: string}}
 */
export function giftDora(state, idx) {
  const gt = DORA_GIFTS[idx];
  if (!gt) return { logs: [], achievements: [] };
  if (!canGift(state, idx)) return { logs: [], achievements: [], refused: '材料不足' };

  for (const k in gt.need) spend(state, k, gt.need[k]);
  const r = addDoraFav(state, gt.fav);
  const logs = [...r.logs, { text: `🤖 猫耳机器人收下了礼物，好感度 +${gt.fav}。`, cls: 'good' }];
  return { logs, achievements: r.achievements };
}

/**
 * 万能口袋商品是否买得起。
 * @param {any} state
 * @param {any} gd
 * @returns {boolean}
 */
export function canBuyDoraGood(state, gd) {
  if (!gd) return false;
  const goldOk = gd.cost === 0 || (state.gold || 0) >= gd.cost;
  const giveOk = Object.keys(gd.give || {}).every((c) => (state.res[c] || 0) >= gd.give[c]);
  return goldOk && giveOk;
}

/**
 * 购买一件口袋商品（会自动加 1 点好感）。
 * @param {any} state
 * @param {any} gd
 * @returns {{logs: LogEntry[], achievements: string[], refused?: string}}
 */
export function buyDoraGood(state, gd) {
  const logs = [];
  const achievements = [];
  const names = resNames();
  if (!gd) return { logs, achievements };
  if (!canBuyDoraGood(state, gd)) return { logs, achievements, refused: '金币或材料不足' };

  if (gd.cost > 0) state.gold -= gd.cost;
  for (const k in gd.give || {}) spend(state, k, gd.give[k]);

  if (gd.key === 'runeBladeRecipe') {
    if (!state.items.runeBlade) {
      state.items.runeBlade = true;
      logs.push({ text: '🔮 你学会了符刃的制作方法！（终极武器）', cls: 'good' });
    } else {
      addRes(state, 'rune', 5);
      addRes(state, 'luckyDraw', 1);
      logs.push({ text: '🔮 你已经会符刃了……送你 5 符石 + 1 抽奖券。', cls: 'good' });
    }
  } else if (gd.get) {
    const getTxt = Object.keys(gd.get).map((c) => `${names[c]}×${gd.get[c]}`).join('+');
    for (const k in gd.get) addRes(state, k, gd.get[k]);
    logs.push({ text: `🤖 猫耳机器人从口袋里掏出：${getTxt}！`, cls: 'good' });
  }

  const fav = addDoraFav(state, 1);
  logs.push(...fav.logs);
  achievements.push(...fav.achievements);
  return { logs, achievements };
}

/* ------------------------------ 流浪商人 ------------------------------ */

/**
 * 商人当前可卖的商品（过滤掉"所有配方都学会了"时才隐藏的图纸类）。
 * @param {any} state
 * @returns {typeof MERCHANT_GOODS}
 */
export function merchantGoods(state) {
  const allLearned = Object.keys(RECIPES).filter((k) => !state.items[k]).length === 0;
  return MERCHANT_GOODS.filter((g) => !(g.hideWhenAllLearned && allLearned));
}

/**
 * 随机抽 n 件不重复商品（洗牌后取前 n）。
 * @param {any} state
 * @param {number} n
 * @param {() => number} [random]
 * @returns {typeof MERCHANT_GOODS}
 */
export function pickMerchantGoods(state, n, random = Math.random) {
  const pool = merchantGoods(state).slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}

/**
 * 交易是否成立（金币与材料都够）。
 * @param {any} state
 * @param {any} good
 * @returns {boolean}
 */
export function canTrade(state, good) {
  if (!good) return false;
  if (good.cost && (state.gold || 0) < good.cost) return false;
  return Object.keys(good.give || {}).every((c) => (state.res[c] || 0) >= good.give[c]);
}

/**
 * 执行一笔交易（扣金币/材料，给货）。
 * @param {any} state
 * @param {any} good
 * @returns {boolean}
 */
function trade(state, good) {
  if (!canTrade(state, good)) return false;
  if (good.cost) state.gold -= good.cost;
  for (const k in good.give || {}) spend(state, k, good.give[k]);
  for (const k in good.get || {}) addRes(state, k, good.get[k]);
  return true;
}

/**
 * 买下商人的一件商品（含两种特殊图纸）。
 * @param {any} state
 * @param {any} good
 * @param {{random?: () => number}} [ctx]
 * @returns {{logs: LogEntry[], refused?: string}}
 */
export function buyMerchant(state, good, ctx = {}) {
  const random = ctx.random ?? Math.random;
  const logs = [];
  const names = resNames();
  if (!good) return { logs };

  if (good.key === 'randomRecipe') {
    const unowned = Object.keys(RECIPES).filter((k) => !state.items[k]);
    if (!unowned.length) {
      return { logs: [{ text: '📜 商人翻了翻图纸集：「你都学完了……算我白跑。」', cls: 'warn' }] };
    }
    if (!trade(state, good)) return { logs, refused: '金币或材料不足' };
    const pick = unowned[Math.floor(random() * unowned.length)];
    state.items[pick] = true;
    logs.push({ text: `📜 商人递过一张羊皮纸：「恭喜，你学会了 ${RECIPES[pick].name} 的制作方法！」`, cls: 'good' });
    return { logs };
  }

  if (good.key === 'advancedRecipe') {
    if (!trade(state, good)) return { logs, refused: '金币或材料不足' };
    const t4 = ['runeBlade', 'runeArmor', 'forgeMast', 'vault'];
    const cand = t4.filter((k) => !state.items[k]);
    const pick = cand.length
      ? cand[Math.floor(random() * cand.length)]
      : (Object.keys(RECIPES).filter((k) => !state.items[k])[0] || null);
    if (!pick) return { logs: [{ text: '📜 商人：「你啥都会了……罢了。」', cls: 'warn' }] };
    state.items[pick] = true;
    logs.push({ text: `📜 高级图纸到手：${RECIPES[pick].name}（终极制作已解锁）`, cls: 'good' });
    return { logs };
  }

  if (!trade(state, good)) return { logs, refused: '金币或材料不足' };
  const getTxt = Object.keys(good.get || {}).map((c) => `${names[c]}×${good.get[c]}`).join('+');
  logs.push({ text: `🧙 交易完成：${getTxt}`, cls: 'good' });
  return { logs };
}
