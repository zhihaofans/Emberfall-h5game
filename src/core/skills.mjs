// 技能一览的数据派生（纯函数）：面板只负责画，不再自己算经验与百分比。
//
// 旧 openSkills() 把 `xpNeed` 与百分比公式写在渲染里，改一处就得改两处；
// 这里统一走 data/skills.mjs（唯一数据源），UI 只取 rows。

import { SKILLS, SKILL_NAMES, SKILL_DESC, xpNeed } from './data/skills.mjs';

/**
 * @typedef {Object} SkillRow
 * @property {string} key 技能键（chop / mine / …）
 * @property {string} name 中文名
 * @property {string} desc 等级加成说明
 * @property {number} lvl 当前等级
 * @property {number} xp 当前经验
 * @property {number} need 升到下一级所需经验
 * @property {number} pct 进度百分比（0–100，已夹取）
 */

/**
 * 7 行技能进度，顺序与 SKILLS 一致。
 * 缺字段按「Lv.1 / 0 经验」兜底（老档或中途加入的技能键不会把面板画崩）。
 * @param {any} state
 * @returns {SkillRow[]}
 */
export function skillRows(state) {
  return SKILLS.map((k) => {
    const s = (state.skills && state.skills[k]) || { lvl: 1, xp: 0 };
    const lvl = Number(s.lvl) || 1;
    const xp = Number(s.xp) || 0;
    const need = xpNeed(lvl);
    return {
      key: k,
      name: SKILL_NAMES[k] || k,
      desc: SKILL_DESC[k] || '',
      lvl,
      xp,
      need,
      pct: Math.min(100, Math.round((xp / need) * 100)),
    };
  });
}
