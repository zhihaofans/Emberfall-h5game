// 探索与夜晚事件（纯逻辑）
//
// 对应 survival.html 的 doExplore 前半段（区域产出 / 天气惩罚 / 掉落判定）与 rollNightEvent。
// 事件弹窗的渲染、选择与结算在后续（EXPLORE_EVENTS 数据化）一起完成。

import { ZONES } from './data/zones.mjs';
import { NIGHT_EVENTS } from './data/events-night.mjs';
import { addRes, has, skillLvl } from './state.mjs';
import { resNames } from './data/resources.mjs';

/** @typedef {import('./types.mjs').LogEntry} LogEntry */

function rngOf(ctx = {}) {
  const random = ctx.random ?? Math.random;
  const rnd = ctx.rnd ?? ((a, b) => Math.floor(random() * (b - a + 1)) + a);
  return { random, rnd };
}

/**
 * 探索一个区域：采集产出 + 天气惩罚 + 幸运方块/符石小概率掉落。
 *
 * `onEvent` 会在原实现调用 `rollExploreEvent` 的位置被调用（保证随机数消耗顺序一致）；
 * 是否真正进入事件由调用方决定。
 *
 * @param {any} state
 * @param {{zone: string, ctx?: any, onEvent?: () => void}} opts
 * @returns {{logs: LogEntry[]}}
 */
export function exploreZone(state, opts) {
  const { zone } = opts;
  const { random, rnd } = rngOf(opts.ctx);
  const z = ZONES[zone];
  const names = resNames();
  /** @type {LogEntry[]} */
  const logs = [];
  if (!z) return { logs };

  const lv = skillLvl(state, 'explore');
  const got = [];
  const rolls = state.items.axe ? 3 : 2;
  for (let i = 0; i < rolls; i++) {
    if (random() < 0.75) {
      const pick = z.res[Math.floor(random() * z.res.length)];
      let n = Math.round(rnd(pick[1], pick[2]) * (1 + lv * 0.08));
      if (has(state, 'tower')) n = Math.round(n * 1.5);            // 瞭望塔：探索收获 +50%
      if (has(state, 'forge') && pick[0] === 'metal') n = Math.round(n * 1.5);
      if (has(state, 'forgeMast') && pick[0] === 'metal') n = Math.round(n * 1.5);
      if (n > 0) {
        addRes(state, pick[0], n);
        got.push(`${names[pick[0]] || pick[0]} ×${n}`);
      }
    }
  }
  if (got.length) logs.push({ text: `在${z.name}搜刮到：${got.join('、')}。`, cls: 'good' });
  else logs.push({ text: `在${z.name}转了一圈，一无所获。`, cls: 'warn' });

  // 天气惩罚
  if (state.weather === 4) {
    logs.push({ text: '暴风雪让探索异常艰难，精力额外消耗。', cls: 'bad' });
    state.stam = Math.max(0, Math.min(100, state.stam - 10));
  } else if (state.weather === 3 && state.hour < 18) {
    logs.push({ text: '暴雨中你浑身湿透，行动迟缓。', cls: 'warn' });
    state.stam = Math.max(0, Math.min(100, state.stam - 6));
  }

  // 随机事件（位置与旧实现一致）
  if (random() < 0.55) opts.onEvent?.();

  // 幸运方块 3%
  if (random() < 0.03) {
    addRes(state, 'luck', 1);
    logs.push({ text: '🎁 探索中发现了一个幸运方块！', cls: 'good' });
  }
  // 符石 5%（仅废墟/山丘）
  if ((zone === 'ruins' || zone === 'hills') && random() < 0.05) {
    addRes(state, 'rune', 1);
    logs.push({ text: '🔮 你发现了一颗稀有的符石！', cls: 'good' });
  }
  return { logs };
}

/**
 * 夜晚事件：金币小偷 / 满月 / 兽王 / 四种夜间事件。
 *
 * @param {any} state
 * @param {{ctx?: any}} [opts]
 * @returns {{logs: LogEntry[], achievements: string[], combat?: 'normal'|'boss', moonEvent?: boolean}}
 */
export function rollNightEvent(state, opts = {}) {
  const { random, rnd } = rngOf(opts.ctx);
  const names = resNames();
  /** @type {LogEntry[]} */
  const logs = [];
  /** @type {string[]} */
  const achievements = [];

  // 金币小偷：余额 > 1 万时 10% 被偷光（只留 1）
  if ((state.gold || 0) > 10000 && random() < 0.10) {
    const lost = (state.gold || 0) - 1;
    state.gold = 1;
    logs.push({
      text: `🌙 你惊醒过来——钱袋空空如也！只留下 1 枚金币和一张字条：「看你可怜，给你留 1 元。」（💰被偷走 ${lost}）`,
      cls: 'bad',
    });
    achievements.push('robbed1');
    return { logs, achievements };
  }

  // 满月：70% 触发专属事件
  if (state.day % 15 === 0) {
    if (random() < 0.7) return { logs, achievements, moonEvent: true };
    logs.push({ text: '🌕 满月当空，远处狼嚎此起彼伏，但今晚它们没敢靠近营地。', cls: 'info' });
  }

  if (random() < 0.35) return { logs, achievements };

  // 兽王夜间遭遇
  const bk = state.stats.bossKills || 0;
  if (state.day >= 30 && random() < (bk > 0 ? 0.03 : 0.05) && (bk === 0 || state.day >= 45 + state.stats.bossFirstAt)) {
    return { logs, achievements, combat: 'boss' };
  }

  /** @type {any[]} */
  const pool = [];
  NIGHT_EVENTS.forEach((e) => { for (let i = 0; i < e.w; i++) pool.push(e); });
  const ev = pool[Math.floor(random() * pool.length)];
  if (!ev) return { logs, achievements };

  if (ev.fight) return { logs, achievements, combat: 'normal' };

  if (ev.cold) {
    if (state.season === 3 && !has(state, 'fire')) {
      state.hp = Math.max(0, Math.min(100, state.hp - 8));
      logs.push({ text: '寒夜无火，你冻得几乎失去知觉……', cls: 'bad' });
    } else if (state.season === 3) {
      logs.push({ text: '火堆噼啪作响，驱散了夜的寒意。', cls: 'good' });
    } else {
      logs.push({ text: '夜里起了凉风，好在你裹紧了外套。', cls: 'sys' });
    }
    return { logs, achievements };
  }

  if (ev.steal) {
    const keys = Object.keys(state.res).filter((k) => state.res[k] > 0);
    if (keys.length) {
      const k = keys[Math.floor(random() * keys.length)];
      const n = Math.min(state.res[k], rnd(1, 3));
      state.res[k] -= n;
      logs.push({ text: `夜色中你丢了 ${names[k] || k} ×${n}……`, cls: 'bad' });
    }
    return { logs, achievements };
  }

  if (ev.heal) {
    state.hp = Math.max(0, Math.min(100, state.hp + ev.heal));
    logs.push({ text: '一夜好眠，生命 +' + ev.heal + '。', cls: 'good' });
  }
  return { logs, achievements };
}

/**
 * 探索时的"接着发生什么"：先判 Boss，再判遇怪，最后抽事件。
 * 对应 survival.html 的 rollExploreEvent 前半段（UI 与弹窗在表现层）。
 *
 * @param {any} state
 * @param {string} zoneKey
 * @param {{ctx?: any}} [opts]
 * @returns {{kind: 'boss'|'pharaoh'|'combat'|'event'|'none', event?: any}}
 */
export function rollExploreEvent(state, zoneKey, opts = {}) {
  const { random } = rngOf(opts.ctx);
  const z = ZONES[zoneKey];
  if (!z) return { kind: 'none' };

  // 废土兽王：30 天后首次 6%，击杀过之后 4%，45 天 CD
  const bk = state.stats.bossKills || 0;
  if (state.day >= 30 && random() < (bk > 0 ? 0.04 : 0.06)
    && (bk === 0 || state.day >= 45 + state.stats.bossFirstAt)) {
    return { kind: 'boss' };
  }

  // 法老：25 天后在金字塔 5%，最多 3 次，击败后 30 天 CD
  if (zoneKey === 'pyramid' && state.day >= 25) {
    const pk = state.stats.pharaohKills || 0;
    const cd = pk > 0 && state.stats.pharaohFirstAt ? state.stats.pharaohFirstAt + 30 : 0;
    if (pk < 3 && random() < 0.05 && (pk === 0 || state.day >= cd)) return { kind: 'pharaoh' };
  }

  // 遇怪
  if (random() < z.danger) return { kind: 'combat' };

  // 事件（按权重、限本区域）
  const ev = pickExploreEvent(zoneKey, random);
  return ev ? { kind: 'event', event: ev } : { kind: 'none' };
}
