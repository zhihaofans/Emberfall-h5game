// 技能表：7 种技能的唯一数据源（名称 / 描述 / 升级曲线）
//
// 与 survival.html 的 SKILLS / SKILL_NAMES / SKILL_DESC / xpNeed 逐一对应。

export const SKILLS = ["chop", "mine", "hunt", "fish", "explore", "cook", "combat"];

/** @type {Record<string, string>} */
export const SKILL_NAMES = {
  "chop": "砍伐",
  "mine": "采掘",
  "hunt": "狩猎",
  "fish": "渔猎",
  "explore": "探索",
  "cook": "烹饪",
  "combat": "战斗",
};

/** @type {Record<string, string>} */
export const SKILL_DESC = {
  "chop": "每级 砍柴产量 +8%",
  "mine": "每级 采石产量 +5%",
  "hunt": "每级 狩猎成功率 +4%",
  "fish": "每级 捕鱼成功率 +1.2%",
  "explore": "每级 探索收获 +8%",
  "cook": "每级 烹饪产出 +10%",
  "combat": "每级 武器伤害 +5%",
};

/**
 * 升到下一级所需经验。
 * @param {number} lvl 当前等级
 * @returns {number}
 */
export function xpNeed(lvl) {
  return Math.round(8 * lvl * lvl + 12 * lvl);
}
