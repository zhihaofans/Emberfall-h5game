// 成就系统（纯逻辑）
//
// 对应 survival.html 的 checkMilestone / checkZoneAchieve / checkStageAchieve /
// checkFishAchieve / checkArmorSet。
//
// 规则：只认 `data/achievements.mjs` 里 WHITELIST 登记的 key —— 漏登记就等于该成就永远不触发，
// 所以单测会校验「MS 的字符串键」与「WHITELIST」双向一致。

import { MS, DAY_REWARDS, WHITELIST } from './data/achievements.mjs';
import { ZONES } from './data/zones.mjs';
import { ARMOR_MATS, ARMOR_SLOTS } from './data/armor.mjs';
import { addRes, skillLvl } from './state.mjs';
import { resNames } from './data/resources.mjs';

/** @typedef {{text: string, cls: string}} LogEntry */

/**
 * 触发一个成就 / 天数里程碑。
 *
 * - 传数字：天数里程碑（3/7/15/30 只记日志；60/100/180 额外发奖励）
 * - 传字符串：必须在 WHITELIST 里才会触发
 *
 * @param {any} state
 * @param {string|number} key
 * @returns {{logs: LogEntry[]}}
 */
export function checkMilestone(state, key) {
  const logs = [];
  if (!state.milestones) state.milestones = {};

  if (typeof key === 'number') {
    // 60/100/180：带奖励
    [60, 100, 180].forEach((d) => {
      if (state.day >= d && !state.milestones['d' + d]) {
        state.milestones['d' + d] = 1;
        logs.push({ text: `🏆 里程碑：${MS[d]}！`, cls: 'good' });
        const r = DAY_REWARDS[d];
        if (r) {
          const names = resNames();
          const parts = [];
          for (const k in r) {
            if (k === 'gold') {
              state.gold += r[k];
              if (r[k]) parts.push(`💰${r[k]}`);
            } else {
              addRes(state, k, r[k]);
              parts.push(`${names[k] || k} ×${r[k]}`);
            }
          }
          logs.push({ text: `🎁 大事件奖励：${parts.join('、')}`, cls: 'info' });
        }
      }
    });
    // 3/7/15/30：只记日志
    [3, 7, 15, 30].forEach((d) => {
      if (state.day >= d && !state.milestones['d' + d]) {
        state.milestones['d' + d] = 1;
        logs.push({ text: `🏆 里程碑：${MS[d]}！`, cls: 'good' });
      }
    });
    return { logs };
  }

  if (WHITELIST.includes(key)) {
    if (!state.milestones[key]) {
      state.milestones[key] = 1;
      logs.push({ text: `🏆 里程碑：${MS[key]}！`, cls: 'good' });
    }
  }
  return { logs };
}

/**
 * 区域探索成就：每个区域 1 / 10 / 50 次三档。
 * @param {any} state
 * @returns {{logs: LogEntry[]}}
 */
export function checkZoneAchieve(state) {
  const logs = [];
  const zc = state.stats.zoneCnt || {};
  for (const z in ZONES) {
    const p = ZONES[z].ach;
    if (!p) continue;
    const n = zc[z] || 0;
    if (n >= 1) logs.push(...checkMilestone(state, p[0]).logs);
    if (n >= 10) logs.push(...checkMilestone(state, p[1]).logs);
    if (n >= 50) logs.push(...checkMilestone(state, p[2]).logs);
  }
  return { logs };
}

/**
 * 通用阶段成就：击杀 / 制作 / 探索 / 烹饪 / 强化次数。
 * @param {any} state
 * @returns {{logs: LogEntry[]}}
 */
export function checkStageAchieve(state) {
  const logs = [];
  const st = state.stats;
  if (st.kills >= 10) logs.push(...checkMilestone(state, 'kill10').logs);
  if (st.kills >= 50) logs.push(...checkMilestone(state, 'kill50').logs);
  if (st.craft >= 10) logs.push(...checkMilestone(state, 'craft10').logs);
  if (st.explore >= 10) logs.push(...checkMilestone(state, 'explore10').logs);
  if (st.explore >= 50) logs.push(...checkMilestone(state, 'explore50').logs);
  if (st.cook >= 10) logs.push(...checkMilestone(state, 'cook10').logs);

  const upTotal = Object.values(state.upgrades).reduce((a, v) => a + v, 0);
  if (upTotal >= 5) logs.push(...checkMilestone(state, 'up5').logs);
  if (upTotal >= 10) logs.push(...checkMilestone(state, 'up10').logs);
  return { logs };
}

/**
 * 钓鱼成就：特殊事件 + 累计次数 + 渔猎等级。
 * @param {any} state
 * @param {string} [kind] 'treasure' | 'rune' | 'blueprint' | 'big'
 * @returns {{logs: LogEntry[]}}
 */
export function checkFishAchieve(state, kind) {
  const logs = [];
  if (kind === 'treasure') {
    logs.push(...checkMilestone(state, 'fishTreas').logs);
    return { logs };
  }
  if (kind === 'rune') {
    logs.push(...checkMilestone(state, 'fishRune').logs);
    logs.push(...checkMilestone(state, 'fishTreas').logs);
    return { logs };
  }
  if (kind === 'blueprint') {
    logs.push(...checkMilestone(state, 'fishBlueprint').logs);
    logs.push(...checkMilestone(state, 'fishTreas').logs);
    return { logs };
  }
  if (kind === 'big') logs.push(...checkMilestone(state, 'fishBig').logs);

  const n = state.stats.fish || 0;
  if (n >= 1) logs.push(...checkMilestone(state, 'fish1').logs);
  if (n >= 10) logs.push(...checkMilestone(state, 'fish10').logs);
  if (n >= 50) logs.push(...checkMilestone(state, 'fish50').logs);
  if (n >= 100) logs.push(...checkMilestone(state, 'fish100').logs);

  const lv = skillLvl(state, 'fish');
  if (lv >= 10) logs.push(...checkMilestone(state, 'fishLv10').logs);
  if (lv >= 25) logs.push(...checkMilestone(state, 'fishLv25').logs);
  if (lv >= 50) logs.push(...checkMilestone(state, 'fishLv50').logs);
  return { logs };
}

/**
 * 套装成就：某材质 4 部位齐 → 触发对应套装成就；6 套集齐 → 收藏家。
 * @param {any} state
 * @returns {{logs: LogEntry[]}}
 */
export function checkArmorSet(state) {
  const logs = [];
  if (!state.stats.setsWorn) state.stats.setsWorn = [];
  const matOf = (slot) => state.items['armor' + slot[0].toUpperCase() + slot.slice(1)] || 'none';

  for (const m of ARMOR_MATS) {
    if (Object.keys(ARMOR_SLOTS).every((s) => matOf(s) === m)) {
      logs.push(...checkMilestone(state, 'set' + m[0].toUpperCase() + m.slice(1)).logs);
      if (m === 'iron') logs.push(...checkMilestone(state, 'armorIron').logs);
      if (m === 'steel') logs.push(...checkMilestone(state, 'armorSteel').logs);
      if (!state.stats.setsWorn.includes(m)) state.stats.setsWorn.push(m);
    }
  }
  if (state.stats.setsWorn.length >= 6) {
    logs.push(...checkMilestone(state, 'setsAll').logs);
    logs.push(...checkMilestone(state, 'armorAll').logs);
  }
  return { logs };
}
