// 时间 / 生存结算（纯逻辑，不碰 DOM 与全局状态）
//
// 对应 survival.html 的：
//   passTime()       → advanceHour()
//   nextDay() 里的季节/天气/每日消耗 → seasonOf() / rollWeather() / dailyConsume()
//   applyPassive()   → applyPassive()
//
// nextDay 里"设施产出 / 夜间事件 / 成就 / 渲染"等部分要在后续模块搬，这里只做纯计算。

/** @typedef {import('./types.mjs').LogEntry} LogEntry */

export const SEASONS = ['春', '夏', '秋', '冬'];
export const WEATHERS = ['晴', '阴', '小雨', '暴雨', '暴风雪'];

/** 每季多少天（10 天 × 4 季 = 40 天一年） */
export const DAYS_PER_SEASON = 10;

/**
 * 第 N 天属于哪个季节（0–3）。
 * @param {number} day
 * @returns {number}
 */
export function seasonOf(day) {
  return Math.floor((day - 1) / DAYS_PER_SEASON) % 4;
}

/**
 * 掷当日天气。
 * ⚠ 原实现：非冬季的分布是 `0/1/2/4`，**跳过了 3（暴雨）**，所以夏天也会出现 4（暴风雪）。
 * 这里按原样保留（行为等价优先），是否修正见 TODO「疑似离谱设定」。
 * @param {number} season
 * @param {() => number} random
 * @returns {number} WEATHERS 的索引
 */
export function rollWeather(season, random = Math.random) {
  const r = random();
  if (season === 3) return r < 0.45 ? 0 : r < 0.7 ? 1 : r < 0.85 ? 2 : r < 0.95 ? 3 : 4;
  return r < 0.5 ? 0 : r < 0.75 ? 1 : r < 0.9 ? 2 : 4;
}

/**
 * 每日食物 / 水分消耗量。
 * @param {{weather: number, day: number, hasVault: boolean, adrenaline: boolean}} opts
 * @returns {{food: number, water: number}}
 */
export function dailyConsume({ weather, day, hasVault, adrenaline }) {
  if (adrenaline) return { food: 0, water: 0 };   // 肾上腺素期间不下降
  const late = day > 30 ? 1.15 : 1;               // 第 30 天起生存压力 +15%
  const mult = hasVault ? 0.5 : 1;                // 永恒仓库：消耗减半
  return {
    food: Math.round((weather >= 3 ? 18 : 15) * late * mult),
    water: Math.round((weather === 4 ? 28 : 20) * late * mult),
  };
}

/**
 * 推进小时数，返回跨过的天数（由上层决定是否调用"日结算"）。
 * 肾上腺素计时同步递减。
 * @param {any} state
 * @param {number} h
 * @returns {number} 跨过的天数
 */
export function advanceHour(state, h) {
  if (state.adrenalineLeft > 0) state.adrenalineLeft = Math.max(0, state.adrenalineLeft - h);
  state.hour += h;
  let days = 0;
  while (state.hour >= 24) {
    state.hour -= 24;
    days++;
  }
  return days;
}

/**
 * 被动生存结算：饥饿/口渴/伤病持续掉血 + 低值警告。
 * 对应原 applyPassive()，但只返回日志、不直接写 UI。
 * @param {any} state
 * @returns {{text: string, cls: string}[]}
 */
export function applyPassive(state) {
  /** @type {{text: string, cls: string}[]} */
  /** @type {LogEntry[]} */
  const logs = [];
  /** @param {number} v */
  const clamp = (v) => Math.max(0, Math.min(100, v));
  const adrenalined = (state.adrenalineLeft || 0) > 0;

  if (!adrenalined) {
    if (state.food <= 0) {
      state.hp = clamp(state.hp - 6);
      logs.push({ text: '你饿得头晕眼花……', cls: 'bad' });
    }
    if (state.water <= 0) {
      state.hp = clamp(state.hp - 8);
      logs.push({ text: '你渴得嘴唇干裂……', cls: 'bad' });
    }
    if (state.ill) state.hp = clamp(state.hp - 5);
    if (state.heavyWound) state.hp = clamp(state.hp - 4);
    else if (state.lightWound) state.hp = clamp(state.hp - 2);
  }
  if (state.food < 25) logs.push({ text: '⚠ 饱食见底，快找吃的！', cls: 'warn' });
  if (state.water < 25) logs.push({ text: '⚠ 水分见底，快去找水！', cls: 'warn' });
  return logs;
}
