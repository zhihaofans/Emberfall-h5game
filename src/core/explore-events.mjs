// 探索事件的抽取与选项结算
//
// 对应 survival.html 的 rollExploreEvent（事件池抽取部分）与 resolveEvent（选项执行）。
// 数据在 data/explore-events.mjs；这里只管「抽哪个」「选了之后发生什么」。

import { EXPLORE_EVENTS } from './data/explore-events.mjs';
import { applyEffects } from './effects.mjs';
import { addRes, has, spend, skillLvl } from './state.mjs';
import { weaponAtk } from './combat.mjs';
import { resNames } from './data/resources.mjs';

/** @typedef {import('./types.mjs').LogEntry} LogEntry */

/**
 * 按权重抽一个探索事件（只抽本区域可用的）。
 * @param {string} zone
 * @param {() => number} [random]
 * @returns {any|null}
 */
export function pickExploreEvent(zone, random = Math.random) {
  /** @type {any[]} */
  const pool = [];
  for (const e of EXPLORE_EVENTS) {
    if (e.zone && e.zone !== zone) continue;
    for (let i = 0; i < (e.w || 1); i++) pool.push(e);
  }
  return pool.length ? pool[Math.floor(random() * pool.length)] : null;
}

/**
 * 选项条件是否满足（材料 / 物品 / 金币）。
 * @param {any} state
 * @param {any} opt
 * @returns {boolean}
 */
export function canPickOption(state, opt) {
  if (!opt) return false;
  if (opt.disabled) return false;
  const req = opt.require;
  if (!req) return true;
  for (const k in req) {
    if (k === 'gold') {
      if ((state.gold || 0) < req.gold) return false;
    } else if (k === 'item') {
      if (!has(state, req.item)) return false;
    } else if ((state.res[k] || 0) < req[k]) return false;
  }
  return true;
}

/* ------------------------------ 具名 handler ------------------------------ */

/**
 * 鹿群伏击：有武器且命中概率才成功（依赖武器与狩猎等级，无法用纯指令表达）。
 * @param {any} state
 * @param {{random: () => number, rnd: (a: number, b: number) => number}} ctx
 */
function deerHunt(state, ctx) {
  const wpn = weaponAtk(state);
  const lv = skillLvl(state, 'hunt');
  if (wpn.name !== '徒手' && ctx.random() < 0.55 + lv * 0.02) {
    const n = ctx.rnd(10, 16);
    addRes(state, 'food', n);
    state.stats.kills++;
    return { logs: [{ text: `你猎到一头鹿！${resNames().food} ×${n}`, cls: 'good' }] };
  }
  return { logs: [{ text: '鹿群惊散了，一无所获。', cls: 'warn' }] };
}

/**
 * 丢硬币选路：正面随机小发现，反面精力 -10。
 * @param {any} state
 * @param {{random: () => number, rnd: (a: number, b: number) => number}} ctx
 */
function lostCoin(state, ctx) {
  if ((state.gold || 0) < 100) {
    return { logs: [{ text: '💰 你掏了掏口袋，凑不出 100 金币。', cls: 'warn' }] };
  }
  state.gold -= 100;
  if (ctx.random() < 0.5) {
    const finds = [['food', ctx.rnd(3, 6)], ['clean', ctx.rnd(2, 4)], ['leather', ctx.rnd(1, 2)], ['metal', ctx.rnd(1, 3)]];
    const f = finds[Math.floor(ctx.random() * finds.length)];
    addRes(state, f[0], f[1]);
    return { logs: [{ text: `🪙 硬币正面！你抄了条隐蔽捷径，还在路边发现 ${resNames()[f[0]]} ×${f[1]}。`, cls: 'good' }] };
  }
  state.stam = Math.max(0, state.stam - 10);
  return { logs: [{ text: '🪙 硬币反面……你自信地走岔了路，绕了个大圈。', cls: 'bad' }] };
}

/**
 * 法老墓室开棺：一次随机决定宝藏/木乃伊/诅咒/空，日志里有两个随机数（金币与符石）。
 * @param {any} state
 * @param {{random: () => number, rnd: (a: number, b: number) => number}} ctx
 */
function tombOpen(state, ctx) {
  const logs = [{ text: '', cls: 'good' }];
  logs.length = 0;
  const achievements = ['tomb1'];
  const r = ctx.random();
  if (r < 0.35) {
    const g2 = ctx.rnd(25, 60);
    const rn = ctx.rnd(1, 2);
    state.gold += g2;
    addRes(state, 'rune', rn);
    logs.push({ text: `💎 石棺里堆满陪葬财宝！💰金币 +${g2}、${resNames().rune} ×${rn}！`, cls: 'good' });
    return { logs, achievements, combat: [] };
  }
  if (r < 0.65) {
    logs.push({ text: '🧟 石棺中的木乃伊突然睁开了眼——它活了！', cls: 'bad' });
    return { logs, achievements, combat: [{ night: false, forceBeasts: false }] };
  }
  if (r < 0.85) {
    state.ill = true;
    state.hp = Math.max(0, Math.min(100, state.hp - 15));
    logs.push({ text: '☠️ 你触发了法老的诅咒，染上重病！', cls: 'bad' });
    return { logs, achievements, combat: [] };
  }
  logs.push({ text: '石棺空空如也，只有千年积灰。', cls: 'warn' });
  return { logs, achievements, combat: [] };
}

/**
 * 黄金密室搜刮：金矿石与金币两个随机数，日志里都要显示。
 * @param {any} state
 * @param {{random: () => number, rnd: (a: number, b: number) => number}} ctx
 */
function goldroomLoot(state, ctx) {
  const n = ctx.rnd(2, 4);
  const g2 = ctx.rnd(20, 40);
  addRes(state, 'goldOre', n);
  state.gold += g2;
  return {
    logs: [{ text: `你搜刮到${resNames().goldOre} ×${n}、💰金币 +${g2}！`, cls: 'good' }],
    achievements: ['goldroom1'],
    combat: [],
  };
}

const HANDLERS = { deerHunt, lostCoin, tombOpen, goldroomLoot };

/**
 * 迷路事件的动态选项（金币不足时禁用丢硬币）。
 * @param {any} state
 * @returns {any[]}
 */
export function lostOpts(state) {
  const names = resNames();
  return [
    {
      label: '继续前进', d: '精力 -10，一无所获',
      effects: [{ op: 'delta', field: 'stam', n: -10, min: 0, max: 100 }],
    },
    {
      label: '🪙 丢硬币选路',
      d: (state.gold || 0) >= 100
        ? '花费 💰100 · 正面：走对路精力不扣+小发现 / 反面：精力-10'
        : `❌ 金币不够（${state.gold || 0}/100）`,
      disabled: (state.gold || 0) < 100,
      run: 'lostCoin',
      effects: [],
    },
    {
      label: '🧭 闭眼转圈', d: '转 3 圈停下指向路口：东(好)/南(顺)/西(荆棘)/北(迷路)',
      effects: [{
        op: 'random',
        branches: [
          {
            w: 1,
            effects: [
              { op: 'delta', field: 'stam', n: -5, min: 0, max: 100 },
              { op: 'res', res: 'food', n: { rnd: [2, 4] } },
              { op: 'log', text: '🧭 你指向东——竟是一条正确小路！还捡到几份吃的。', cls: 'good' },
            ],
          },
          {
            w: 1,
            effects: [
              { op: 'delta', field: 'stam', n: -5, min: 0, max: 100 },
              { op: 'log', text: '🧭 南边意外顺畅，你很快找回了方向。', cls: 'info' },
            ],
          },
          {
            w: 1,
            effects: [
              { op: 'delta', field: 'stam', n: -10, min: 0, max: 100 },
              { op: 'delta', field: 'hp', n: -5, min: 1, max: 100 },
              { op: 'log', text: '🧭 西边是荆棘丛！你被刮得满身是伤。', cls: 'bad' },
            ],
          },
          {
            w: 1,
            effects: [
              { op: 'delta', field: 'stam', n: -15, min: 0, max: 100 },
              { op: 'log', text: '🧭 北边越走越深，你彻底绕晕了。', cls: 'bad' },
            ],
          },
        ],
      }],
    },
  ];
}

/**
 * 执行一个事件选项。
 *
 * 返回：
 *   logs         日志
 *   achievements 成就 id
 *   combat       由 ctx.combat 收集（非空表示要进入战斗）
 *   refused      disabled / 条件不满足时的提示
 *
 * @param {any} state
 * @param {any} event
 * @param {number} idx
 * @param {{random?: () => number, rnd?: (a: number, b: number) => number}} [ctx]
 * @returns {{logs: LogEntry[], achievements: string[], combat: any[], refused?: string}}
 */
export function resolveOption(state, event, idx, ctx = {}) {
  const random = ctx.random ?? Math.random;
  const rnd = ctx.rnd ?? ((a, b) => Math.floor(random() * (b - a + 1)) + a);
  /** @type {LogEntry[]} */
  const logs = [];
  /** @type {string[]} */
  const achievements = [];
  /** @type {any[]} */
  const combat = [];
  const opt = event && event.opts ? event.opts[idx] : null;
  if (!opt) return { logs, achievements, combat };

  if (opt.disabled) {
    return { logs, achievements, combat, refused: '❌ 库存不足，无法交易（不消耗机会）。' };
  }
  if (!canPickOption(state, opt)) {
    return {
      logs: [{ text: opt.requireFail || '条件不足。', cls: 'warn' }],
      achievements,
      combat,
    };
  }

  if (opt.run) {
    const handler = HANDLERS[opt.run];
    if (!handler) throw new Error(`未知的事件选项 handler: ${opt.run}`);
    const r = handler(state, { random, rnd });
    logs.push(...(r.logs || []));
    if (r.achievements) achievements.push(...r.achievements);
    if (r.combat) combat.push(...r.combat);
    return { logs, achievements, combat };
  }

  logs.push(...applyEffects(state, opt.effects || [], { random, rnd, combat, achievements }));
  return { logs, achievements, combat };
}
