// 进度总览的数据派生（纯函数）：每个区块返回结构化数据，UI 只拼文案。
//
// 旧 openProgress() 在渲染函数里直接算「已做几个配方 / 强化总和 / 成就列表」，
// 分母还有写死的 10（实际上限 15）与漏项（武器路线没有符刃）。这里统一：
//   - 分位数一律从数据表求和（upgrades.max / weapons 键序 / recipes 键集）
//   - 百分比统一走 pct()，UI 不再各写一遍 Math.min(100, …)
//
// 纯展示，不写 state、不碰 DOM。

import { RECIPES } from './data/recipes.mjs';
import { UPGRADES } from './data/upgrades.mjs';
import { WEAPONS } from './data/weapons.mjs';
import { DORA_LEVELS } from './data/npc.mjs';
import { resNames } from './data/resources.mjs';
import { DAY_MILESTONES, WHITELIST } from './data/achievements.mjs';
import { DAY_TARGETS, SKILL_MAX_LV, ACHIEVEMENT_SHOWCASE } from './data/progress.mjs';
import { skillRows } from './skills.mjs';
import { doraInfo } from './npc.mjs';
import { weaponAtk } from './combat.mjs';

/**
 * 百分比（0–100 的整数），与旧 `pbar()` 的算法一致。
 * @param {number} cur
 * @param {number} max
 * @returns {number}
 */
export function pct(cur, max) {
  if (!max || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
}

/**
 * 生存天数：下一个未达成的天数目标。
 * @param {any} state
 * @returns {{cur: number, max: number, pct: number, next: number|null, left: number, done: boolean}}
 */
export function dayProgress(state) {
  const cur = Number(state.day) || 1;
  const max = DAY_TARGETS[DAY_TARGETS.length - 1];
  const ms = state.milestones || {};
  const next = DAY_TARGETS.find((d) => d > cur && !ms['d' + d]) ?? null;
  return { cur, max, pct: pct(cur, max), next, left: next ? next - cur : 0, done: !next };
}

/**
 * 某个配方还缺哪些材料（「木材 10（缺 7）」）。
 * 旧实现印的是需求总量（「缺 10」），这里改成真实缺口。
 * @param {any} state
 * @param {string} id
 * @returns {string}
 */
export function missingCostText(state, id) {
  const r = /** @type {any} */ (RECIPES)[id];
  if (!r) return '';
  const names = resNames();
  return Object.keys(r.cost)
    .map((k) => {
      const need = r.cost[k];
      const have = (state.res && state.res[k]) || 0;
      return `${names[k] || k} ${need}${have < need ? `（缺 ${need - have}）` : ''}`;
    })
    .join(' ');
}

/**
 * 制作进度：已做 / 总数 / 下一个未做的配方与缺料。
 * @param {any} state
 * @returns {{made: number, total: number, pct: number, next: string|null, nextName: string|null, missing: string}}
 */
export function craftProgress(state) {
  const ids = Object.keys(RECIPES);
  const made = ids.filter((id) => state.items && state.items[id]).length;
  const next = ids.find((id) => !(state.items && state.items[id])) ?? null;
  return {
    made,
    total: ids.length,
    pct: pct(made, ids.length),
    next,
    nextName: next ? /** @type {any} */ (RECIPES)[next].name : null,
    missing: next ? missingCostText(state, next) : '',
  };
}

/**
 * 强化进度：分母按每项 `max` 求和（旧版写死 ×10，实际是 ×15）。
 * @param {any} state
 * @returns {{perKey: {key: string, name: string, lvl: number, max: number}[], total: number, max: number, pct: number}}
 */
export function upgradeProgress(state) {
  const perKey = Object.keys(UPGRADES).map((key) => {
    const u = /** @type {any} */ (UPGRADES)[key];
    return {
      key,
      name: u.name,
      lvl: (state.upgrades && state.upgrades[key]) || 0,
      max: u.max || 15,
    };
  });
  const total = perKey.reduce((s, k) => s + k.lvl, 0);
  const max = perKey.reduce((s, k) => s + k.max, 0);
  return { perKey, total, max, pct: pct(total, max) };
}

/**
 * 技能等级：7 项等级之和 / 7 × 上限。
 * @param {any} state
 * @returns {{rows: {key: string, name: string, desc: string, lvl: number, xp: number, need: number, pct: number}[], total: number, max: number, maxLv: number, pct: number}}
 */
export function skillProgress(state) {
  const rows = skillRows(state);
  const total = rows.reduce((s, r) => s + r.lvl, 0);
  const max = rows.length * SKILL_MAX_LV;
  return { rows, total, max, maxLv: SKILL_MAX_LV, pct: pct(total, max) };
}

/**
 * 武器路线：按 `WEAPONS` 的键序派生（旧版手写数组漏了 🔮符刃）。
 * @param {any} state
 * @returns {{route: {key: string, name: string, owned: boolean}[], current: ReturnType<typeof weaponAtk>}}
 */
export function weaponProgress(state) {
  const route = Object.keys(WEAPONS).map((key) => ({
    key,
    name: /** @type {any} */ (WEAPONS)[key].name,
    owned: key === 'none' ? true : !!(state.items && state.items[key]),
  }));
  return { route, current: weaponAtk(state) };
}

/**
 * 兽王进度：击杀次数与阶段（0 = 未击败，>=3 = 三形态全清）。
 * @param {any} state
 * @returns {{kills: number, stage: number}}
 */
export function bossProgress(state) {
  const kills = (state.stats && state.stats.bossKills) || 0;
  return { kills, stage: Math.min(kills, 3) };
}

/**
 * 法老进度：同上。
 * @param {any} state
 * @returns {{kills: number, stage: number}}
 */
export function pharaohProgress(state) {
  const kills = (state.stats && state.stats.pharaohKills) || 0;
  return { kills, stage: Math.min(kills, 3) };
}

/**
 * 猫耳机器人好感：当前档位 + 下一档名称/所需好感。
 * @param {any} state
 * @returns {{fav: number, lvl: number, name: string, nextNeed: number, max: boolean, nextName: string|null}}
 */
export function doraProgress(state) {
  const info = doraInfo(state);
  // DORA_LEVELS 是 0 基数组、lvl 从 1 起，所以下标 lvl 正好是下一档
  const nextLevel = DORA_LEVELS[info.lvl] || null;
  return { ...info, nextName: nextLevel ? nextLevel.name : null };
}

/**
 * 成就：展示清单里已达成 / 未达成的拆分（保持清单原顺序）。
 * @param {any} state
 * @returns {{done: {id: string, label: string}[], left: {id: string, label: string}[], doneCount: number, total: number, pct: number}}
 */
export function achievementProgress(state) {
  const ms = state.milestones || {};
  /** @type {{id: string, label: string}[]} */
  const done = [];
  /** @type {{id: string, label: string}[]} */
  const left = [];
  for (const a of ACHIEVEMENT_SHOWCASE) (ms[a.id] ? done : left).push(a);
  return {
    done,
    left,
    doneCount: done.length,
    total: ACHIEVEMENT_SHOWCASE.length,
    pct: pct(done.length, ACHIEVEMENT_SHOWCASE.length),
  };
}

/**
 * 成就 id 是否合法：天数里程碑（d3 / d7 …）或 WHITELIST 成员。
 * 只给测试与后续维护用（放到这里而不是 data 里，是为了避免 data 反向依赖模块校验）。
 * @param {string} id
 * @returns {boolean}
 */
export function isAchievementId(id) {
  const day = /^d(\d+)$/.exec(id);
  if (day) return DAY_MILESTONES.includes(Number(day[1]));
  return WHITELIST.includes(id);
}
