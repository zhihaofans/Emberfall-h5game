// 制作 / 强化 / 装备 / 附魔（纯逻辑）
//
// 对应 survival.html 的 doCraft / upgradeItem / craftArmor / armorDmgMult /
// recipeVisible / enchantItem / upgradeEnchantTbl。
//
// 约定：返回 { logs, achievements?, refused?, time? }
//   - refused：原实现里 `toast(...); return` 的文案
//   - achievements：要触发的成就 / 阶段检查（'craft1' / 'stage' / 'allcraft' …）
//   - time：本次操作要推进的小时数（原实现调用 passTime 的地方）

import { RECIPES } from './data/recipes.mjs';
import { UPGRADES, upgradeCost } from './data/upgrades.mjs';
import { SKILL_NAMES } from './data/skills.mjs';
import {
  ARMOR_MATS, ARMOR_MAT_INFO, ARMOR_SLOTS, ENCHANT_TBL_MAX,
  ENCHANTS, enchantCost, enchantTblCost, armorSlotKey,
} from './data/armor.mjs';
import { addRes, spend, has, skillLvl } from './state.mjs';
import { resNames } from './data/resources.mjs';

/**
 * 材料是否足够（对应旧 hasRes(cost)）。
 * @param {any} state
 * @param {Record<string, number>} cost
 * @returns {boolean}
 */
export function hasRes(state, cost) {
  for (const k in cost) if ((state.res[k] || 0) < cost[k]) return false;
  return true;
}

/**
 * 某部位当前材质（'none' 表示空）。
 * @param {any} state
 * @param {string} slot
 * @returns {string}
 */
export function armorSlotMat(state, slot) {
  return state.items[armorSlotKey(slot)] || 'none';
}

/**
 * 总减伤倍率：4 部位乘算 × 符甲(1/3) × 保护附魔，下限 0.1。
 * @param {any} state
 * @returns {number}
 */
export function armorDmgMult(state) {
  let m = 1;
  for (const s in ARMOR_SLOTS) {
    const info = ARMOR_MAT_INFO[armorSlotMat(state, s)];
    if (info) m *= info.dmg;
  }
  const rune = state.items.runeArmor ? 1 / 3 : 1;
  const ench = 1 - ((state.enchant && state.enchant.armor) || 0) * 0.08;
  return Math.max(0.1, m * rune * ench);
}

/**
 * 配方是否在面板可见（v1.28.0）：已解锁永远显示；未解锁需拥有/获取过至少一种材料。
 * @param {any} state
 * @param {string} id
 * @returns {boolean}
 */
export function recipeVisible(state, id) {
  const r = RECIPES[id];
  if (!r || !r.cost) return true;
  return Object.keys(r.cost).some(
    (t) => (state.res[t] || 0) >= 1 || (state.stats && state.stats.ownedRes && state.stats.ownedRes[t]),
  );
}

/**
 * 制作一件配方。
 * @param {any} state
 * @param {string} id
 * @returns {{logs: {text: string, cls: string}[], achievements?: string[], refused?: string, time?: number}}
 */
export function doCraft(state, id) {
  const logs = [];
  const r = RECIPES[id];
  if (!r) return { logs };

  if (state.items[id]) return { logs, refused: '已经制作过了' };
  if (r.need && !state.items[r.need]) {
    return { logs, refused: '需要先制作' + RECIPES[r.need].name };
  }
  if (r.needLv && r.skill && skillLvl(state, r.skill) < r.needLv) {
    const lv = skillLvl(state, r.skill);
    return {
      logs,
      refused: `需要 ${SKILL_NAMES[r.skill] || r.skill} Lv.${r.needLv} 才能制作（当前 Lv.${lv}）`,
    };
  }
  if (!hasRes(state, r.cost)) return { logs, refused: '材料不足' };

  for (const k in r.cost) spend(state, k, r.cost[k]);
  state.items[id] = true;
  state.stats.craft++;
  logs.push({ text: `🔨 制作完成：${r.name}！${r.desc}`, cls: 'good' });
  if (id === 'fire') logs.push({ text: '你点燃了火堆，这是夜晚的温暖与安全。', cls: 'info' });
  if (id === 'ironAxe') logs.push({ text: '铁斧在手，砍树如切豆腐。', cls: 'info' });
  if (id === 'steel') logs.push({ text: '钢刀寒光凛冽，野兽见了绕道走。', cls: 'info' });

  const achievements = ['craft1', 'stage'];
  if (Object.keys(RECIPES).every((k) => state.items[k])) achievements.push('allcraft');
  return { logs, achievements, time: r.time };
}

/**
 * 强化一件装备。
 * @param {any} state
 * @param {string} key
 * @returns {{logs: {text: string, cls: string}[], achievements?: string[], refused?: string, time?: number}}
 */
export function upgradeItem(state, key) {
  const logs = [];
  const u = UPGRADES[key];
  if (!u) return { logs };

  if (u.need && !state.items[u.need]) {
    return { logs, refused: '需要先制作' + RECIPES[u.need].name };
  }
  const lv = state.upgrades[key] || 0;
  const max = u.max || 10;
  if (lv >= max) return { logs, refused: '已达最高强化等级（Lv.' + max + '）' };

  const cost = upgradeCost(key, lv);
  if (!hasRes(state, cost)) return { logs, refused: '材料不足' };

  for (const k in cost) spend(state, k, cost[k]);
  state.upgrades[key] = lv + 1;
  state.stats.craft++;

  const names = resNames();
  const costTxt = Object.keys(cost).map((k) => names[k] + '×' + cost[k]).join(' ');
  logs.push({ text: `⬆ ${u.name} → Lv.${lv + 1}/${max}！${u.desc}（耗 ${costTxt}）`, cls: 'good' });
  return { logs, achievements: ['up1', 'stage'], time: 2 };
}

/**
 * 制作并穿上护甲（材质链：必须已装备上一级材质）。
 * @param {any} state
 * @param {string} slot
 * @param {string} mat
 * @returns {{logs: {text: string, cls: string}[], achievements?: string[], refused?: string}}
 */
export function craftArmor(state, slot, mat) {
  const logs = [];
  const sk = armorSlotKey(slot);
  const idx = ARMOR_MATS.indexOf(mat);
  if (idx < 0 || !ARMOR_SLOTS[slot]) return { logs };

  const cur = armorSlotMat(state, slot);
  if (cur === mat) {
    return { logs, refused: '已经装备' + ARMOR_MAT_INFO[mat].name + ARMOR_SLOTS[slot].name };
  }
  if (idx > 0) {
    const needPrev = ARMOR_MATS[idx - 1];
    if (cur !== needPrev) {
      return {
        logs,
        refused: `升级链：需先装备${ARMOR_MAT_INFO[needPrev].name}${ARMOR_SLOTS[slot].name}`,
      };
    }
  }
  const cost = ARMOR_MAT_INFO[mat].cost;
  if (!hasRes(state, cost)) return { logs, refused: '材料不足' };

  for (const k in cost) spend(state, k, cost[k]);
  state.items[sk] = mat;
  state.stats.craft++;
  if (!state.stats.armorsWorn) state.stats.armorsWorn = [];
  const tag = slot + ':' + mat;
  if (!state.stats.armorsWorn.includes(tag)) state.stats.armorsWorn.push(tag);

  const full = Object.keys(ARMOR_SLOTS).every((s) => armorSlotMat(state, s) === mat);
  logs.push({
    text: `🛡 你穿上了${ARMOR_MAT_INFO[mat].name}${ARMOR_SLOTS[slot].name}${full ? '（套装达成！）' : ''}。`,
    cls: 'good',
  });
  return { logs, achievements: ['armor1', 'armorSet'] };
}

/**
 * 提升某一类附魔（受附魔台等级限制）。
 * @param {any} state
 * @param {string} kind
 * @returns {{logs: {text: string, cls: string}[], refused?: string, time?: number}}
 */
export function enchantItem(state, kind) {
  const logs = [];
  if (!state.items.enchantTbl) return { logs, refused: '需要先制作🔮附魔台' };

  const cur = state.enchant[kind] || 0;
  const cap = state.enchant.tblLv || 0;
  if (cur >= cap) return { logs, refused: '附魔台等级不足，请先升级附魔台' };

  const cost = enchantCost(kind, cur);
  if (!hasRes(state, cost)) return { logs, refused: '材料不足' };

  for (const k in cost) spend(state, k, cost[k]);
  state.enchant[kind] = cur + 1;
  state.stats.craft++;
  logs.push({ text: `✨ ${ENCHANTS[kind].name} 附魔提升到 Lv.${cur + 1}！${ENCHANTS[kind].desc}`, cls: 'good' });
  return { logs, time: 1 };
}

/**
 * 升级附魔台（上限 5 级）。
 * @param {any} state
 * @returns {{logs: {text: string, cls: string}[], refused?: string, time?: number}}
 */
export function upgradeEnchantTbl(state) {
  const logs = [];
  if (!state.items.enchantTbl) return { logs, refused: '需要先制作🔮附魔台' };

  const cur = state.enchant.tblLv || 0;
  if (cur >= ENCHANT_TBL_MAX) return { logs, refused: '附魔台已满级' };

  const cost = enchantTblCost(cur);
  if (!hasRes(state, cost)) return { logs, refused: '材料不足' };

  for (const k in cost) spend(state, k, cost[k]);
  state.enchant.tblLv = cur + 1;
  logs.push({ text: `🔮 附魔台升级到 Lv.${cur + 1}/5！现在可附魔至 ${cur + 1} 级。`, cls: 'good' });
  return { logs, time: 2 };
}
