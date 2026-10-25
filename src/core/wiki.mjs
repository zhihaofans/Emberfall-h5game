// 怪物图鉴（纯逻辑）
//
// 对应 survival.html 的 wikiSeen / wikiUnlocked；渲染（wikiRow 的遮罩）在表现层。
// 图鉴 id 的命名约定见 BEASTS / ROBOTS / REGION_BEASTS / MOON_BEASTS 与 Boss 三阶段。

import { BEASTS, ROBOTS, REGION_BEASTS, MOON_BEASTS } from './data/monsters.mjs';
import { bestiaryIds } from './combat.mjs';

/**
 * 图鉴条目 id 的权威清单（21 条）：
 *   beast0–3 通用野兽 · rob0–2 废墟机器人 · zone-forest/river/hills 区域特色怪
 *   pyr0–2 金字塔怪 · moon-dog/moon-wolf 月圆进化 · boss0–2 兽王三阶段 · pharaoh0–2 法老三阶段
 */
export const BESTIARY_IDS = (() => {
  const ids = [];
  BEASTS.forEach((_, i) => ids.push('beast' + i));
  ['forest', 'river', 'hills'].forEach((z) => ids.push('zone-' + z));
  (REGION_BEASTS.pyramid || []).forEach((_, i) => ids.push('pyr' + i));
  ROBOTS.forEach((_, i) => ids.push('rob' + i));
  Object.keys(MOON_BEASTS).forEach((k) => ids.push('moon-' + k));
  [0, 1, 2].forEach((i) => ids.push('boss' + i));
  [0, 1, 2].forEach((i) => ids.push('pharaoh' + i));
  return ids;
})();

/**
 * 记录一次遭遇（遭遇即解锁）。同一只怪可以累计次数。
 * @param {any} state
 * @param {string} id
 */
export function markSeen(state, id) {
  if (!state.bestiary) state.bestiary = {};
  state.bestiary[id] = (state.bestiary[id] || 0) + 1;
}

/**
 * 是否已解锁。
 * @param {any} state
 * @param {string} id
 * @returns {boolean}
 */
export function isUnlocked(state, id) {
  return !!(state.bestiary && state.bestiary[id]);
}

/**
 * 按一次遭遇结果批量解锁（配合 combat 的 pickMonster）。
 * @param {any} state
 * @param {{pool: string, idx: number, monster: any}} picked
 * @returns {string[]} 本次解锁的 id
 */
export function markEncounter(state, picked) {
  const ids = bestiaryIds(picked);
  for (const id of ids) markSeen(state, id);
  return ids;
}

/**
 * 图鉴进度（用于界面显示"已解锁 N/21"）。
 * @param {any} state
 * @returns {{unlocked: number, total: number}}
 */
export function wikiProgress(state) {
  const unlocked = BESTIARY_IDS.filter((id) => isUnlocked(state, id)).length;
  return { unlocked, total: BESTIARY_IDS.length };
}
