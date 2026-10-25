// 装备与附魔数据（唯一数据源）
//
// 对应 survival.html 的 ARMOR_MATS / ARMOR_MAT_INFO / ARMOR_SLOTS /
// enchantTblCost / ENCHANTS / enchantCost / ENCHANT_TBL_MAX。
// 原 ENCHANTS 里带着 `effect: k => 1 + G.enchant.weapon * 0.10` 的闭包，
// 这里改成纯数值 `perLevel`，由战斗/采集模块按公式计算。

/** 材质升级链（从低到高） */
export const ARMOR_MATS = ['leather', 'copper', 'iron', 'silver', 'gold', 'steel'];

/** 每种材质的显示名、单件减伤、制作成本 */
export const ARMOR_MAT_INFO = {
  leather: { name: '🦺皮', dmg: 0.97, cost: { leather: 6 } },
  copper: { name: '🥉铜', dmg: 0.95, cost: { copper: 4, leather: 1 } },
  iron: { name: '🛡铁', dmg: 0.92, cost: { metal: 5, leather: 1 } },
  silver: { name: '🥈银', dmg: 0.90, cost: { silver: 4, leather: 1 } },
  gold: { name: '🥇金', dmg: 0.88, cost: { gold: 4, leather: 1 } },
  steel: { name: '⚙️钢', dmg: 0.85, cost: { alloy: 5, leather: 1 } },
};

/** 四个部位 */
export const ARMOR_SLOTS = {
  head: { name: '头盔' },
  body: { name: '胸甲' },
  legs: { name: '裤子' },
  boots: { name: '靴子' },
};

/**
 * 部位 → 存档字段名（armorHead / armorBody / …）
 * @param {string} slot
 * @returns {string}
 */
export function armorSlotKey(slot) {
  return 'armor' + slot[0].toUpperCase() + slot.slice(1);
}

/** 附魔台上限 */
export const ENCHANT_TBL_MAX = 5;

/**
 * 三种附魔。`perLevel` 是每级的效果幅度，实际计算在战斗/采集模块里做。
 */
export const ENCHANTS = {
  weapon: { name: '🗡 锋利', desc: '武器伤害 +10%/级', base: { rune: 2, alloy: 2 }, perLevel: 0.10 },
  armor: { name: '🛡 保护', desc: '受击伤害 -8%/级', base: { rune: 2, leather: 3 }, perLevel: 0.08 },
  tool: { name: '⚒ 效率', desc: '采集产量 +8%/级', base: { rune: 2, metal: 3 }, perLevel: 0.08 },
};

/**
 * 附魔升到下一级的成本（线性放大）。
 * @param {string} kind
 * @param {number} lv 当前等级（0 起）
 * @returns {Record<string, number>}
 */
export function enchantCost(kind, lv) {
  /** @type {Record<string, number>} */
  const c = {};
  const b = ENCHANTS[kind].base;
  for (const k in b) c[k] = b[k] * (lv + 1);
  return c;
}

/**
 * 附魔台升到下一级的成本。
 * @param {number} lv 当前等级（0 起）
 * @returns {{stone: number, metal: number, rune: number}}
 */
export function enchantTblCost(lv) {
  return { stone: 4 * (lv + 1), metal: 2 * (lv + 1), rune: lv + 1 };
}
