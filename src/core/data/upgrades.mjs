// 强化表：4 类可强化的装备，上限 15 级
//
// 与 survival.html 的 UPGRADES / upgradeCost 逐一对应。

/** @type {Record<string, {name: string, desc: string, base: Record<string, number>, need: string, max: number}>} */
export const UPGRADES = {
  "weapon": {"name":"强化武器","desc":"每级 武器伤害 +10%","base":{"metal":4,"leather":1},"need":"steel","max":15},
  "axe": {"name":"强化斧头","desc":"每级 砍柴产量 +10%","base":{"metal":2,"wood":2},"need":"ironAxe","max":15},
  "rod": {"name":"强化鱼竿","desc":"每级 捕鱼成功率 +6%","base":{"metal":1},"need":"rod","max":15},
  "trap": {"name":"强化捕兽夹","desc":"每级 捕兽夹产量 +15%","base":{"metal":1},"need":"trap","max":15},
};

/**
 * 升到下一级（lv → lv+1）的总成本。基础成本按 (当前等级 + 1) 线性放大；
 * 升到 11 级起额外消耗符石与合金（实现为 `lv >= 10` 时把这次升级的额外材料算进成本）。
 * @param {string} key
 * @param {number} lv 当前等级
 * @returns {Record<string, number>}
 */
export function upgradeCost(key, lv) {
  const u = UPGRADES[key];
  if (!u) return {};
  /** @type {Record<string, number>} */
  const cost = {};
  for (const k in u.base) cost[k] = Math.round(u.base[k] * (lv + 1));
  if (lv >= 10) {
    cost.rune = lv - 9;
    cost.alloy = Math.round((lv - 9) * 1.5);
  }
  return cost;
}
