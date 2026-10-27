// 离线结算：关掉游戏再回来时，按 lastSeen 补发自动设施产出。
//
// 逐行对照 legacy/survival.html 的 settleOffline() 搬过来，行为保持一致：
//   · 上限 8 小时，少于 9 分钟（0.15h）不结算，半小时粒度向下取整
//   · 捕兽夹 1.2/时、温室 0.5/时、净水器 0.6/时、斧类 1.5/时
//   · 冬季没火堆会掉血（封顶扣到 20，不致死）
//   · 期间消耗食物 2/时、水分 2.5/时，精力 +15/时
//   · 只有真正睡过去/离开才会结算；导入存档时把 lastSeen 置为当下即可跳过

import { addRes, has } from './state.mjs';
import { resNames } from './data/resources.mjs';

/** @typedef {import('./types.mjs').LogEntry} LogEntry */

export const OFFLINE_MAX_HOURS = 8;
export const OFFLINE_MIN_HOURS = 0.15;

/** @param {number} v @param {number} lo @param {number} hi */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * 结算一段离线时间（原地修改 state，返回要写的日志与产出摘要）。
 * @param {any} state
 * @param {number} elapsedMs 距离 lastSeen 的毫秒数
 * @returns {{hours: number, gains: string[], logs: LogEntry[], settled: boolean}}
 */
export function settleOffline(state, elapsedMs) {
  /** @type {LogEntry[]} */
  const logs = [];
  /** @type {string[]} */
  const gains = [];

  const hours = Math.min((Number(elapsedMs) || 0) / 3600000, OFFLINE_MAX_HOURS);
  if (!(hours >= OFFLINE_MIN_HOURS)) return { hours: 0, gains, logs, settled: false };

  const h = Math.floor(hours * 2) / 2; // 半小时粒度
  const names = resNames();

  const foodN = Math.floor(
    h * 1.2 * (has(state, 'trap') ? 1 : 0) + h * 0.5 * (has(state, 'farm') ? 1 : 0),
  );
  const cleanN = has(state, 'puri') ? Math.floor(h * 0.6) : 0;
  const woodN = state.items.axe || state.items.ironAxe ? Math.floor(h * 1.5) : 0;

  if (foodN > 0) { addRes(state, 'food', foodN); gains.push(`${names.food} ×${foodN}`); }
  if (cleanN > 0) { addRes(state, 'clean', cleanN); gains.push(`${names.clean} ×${cleanN}`); }
  if (woodN > 0) { addRes(state, 'wood', woodN); gains.push(`${names.wood} ×${woodN}`); }

  // 冬季无火堆离线会受冻（封顶扣到 20，不致死）
  if (state.season === 3 && !has(state, 'fire') && !state.dead) {
    state.hp = Math.max(20, state.hp - Math.floor(h * 0.6));
    logs.push({ text: `⛄ 你离线时正值寒冬且没有火堆，生命降至 ${state.hp}。`, cls: 'bad' });
  }

  // 离线期间也消耗少量生存物资
  state.food = clamp(state.food - Math.floor(h * 2), 0, 100);
  state.water = clamp(state.water - Math.floor(h * 2.5), 0, 100);
  state.stam = clamp(state.stam + Math.floor(h * 15), 0, 100);
  state.day += Math.floor(h / 24);

  logs.push({
    text: `⏳ 你离开了 ${Math.round(h * 10) / 10} 小时，期间${gains.length ? '获得了：' + gains.join('、') : '平安无事'}。`,
    cls: 'info',
  });

  return { hours: h, gains, logs, settled: true };
}
