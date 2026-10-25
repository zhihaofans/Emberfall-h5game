// 效果执行器：把「效果」表达成**数据指令**，由这里统一执行。
//
// 为什么不用函数：原实现里 SHOP / LUCK_EVENTS / ENCHANTS 的表项直接写
// `g => { addRes('metal',30); log('…') }`，闭包里改全局 G、调 UI 的 log，
// 既不能单测、也无法在重构时安全搬运。这里改成声明式指令：
//
//   { op:'res',   res:'metal', n:30 }         加/扣资源（正向会记 ownedRes）
//   { op:'gold',  n:100 }                     加/扣金币
//   { op:'set',   field:'hp', value:100 }     字段直接赋值（hp / ill / day …）
//   { op:'delta', field:'hp', n:-20, min:1 }  数值增减并夹取
//   { op:'steal', n:[3,8] }                   特殊：随机偷一种资源
//   { op:'random', branches:[{w, effects}] }  按权重随机走一组效果
//   { op:'combat', night?, beasts? }          触发战斗（由上层发起）
//   { op:'achievement', id }                  触发成就
//   { op:'log',   text:'…', cls:'good' }      产出一条日志（支持 {res:key} 占位）
//
// 执行器只改传入的 state、返回待写入的日志，**不碰 DOM、不碰 localStorage**。
// 随机性通过 `ctx.random` / `ctx.rnd` 注入，测试可完全确定。

import { resNames } from './data/resources.mjs';
import { addRes } from './state.mjs';
import { RECIPES } from './data/recipes.mjs';

/**
 * @typedef {Object} Effect
 * @property {'res'|'gold'|'set'|'delta'|'steal'|'random'|'branch'|'combat'|'achievement'|'learnRecipe'|'log'} op
 * @property {string} [res]
 * @property {number} [n]
 * @property {number[]} [n2]
 * @property {string} [field]
 * @property {any} [value]
 * @property {number} [min]
 * @property {number} [max]
 * @property {any[]} [branches]
 * @property {boolean} [night]
 * @property {boolean} [beasts]
 * @property {string} [id]
 * @property {string} [text]
 * @property {string} [cls]
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} text
 * @property {string} cls
 */

/**
 * 执行一组效果指令。
 * @param {any} state 游戏状态（原地修改）
 * @param {Effect[]} effects
 * @param {{random?: () => number, rnd?: (a: number, b: number) => number}} [ctx]
 * @returns {LogEntry[]} 需要写进日志的条目
 */
export function applyEffects(state, effects, ctx = {}) {
  const random = ctx.random ?? Math.random;
  /** @type {any[]} */
  const combat = ctx.combat ?? [];
  /** @type {string[]} */
  const achievements = ctx.achievements ?? [];
  const rnd = ctx.rnd ?? ((a, b) => Math.floor(random() * (b - a + 1)) + a);
  /** @type {LogEntry[]} */
  const logs = [];
  /** @type {number|undefined} 当前指令的数值（供 {n} 占位） */
  let nval;

  const fill = (text, nval) =>
    String(text)
      .replace(/\{res:([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, k) => resNames()[k] ?? k)
      .replace(/\{n\}/g, String(nval ?? ''));

  /** 数量支持数字或 { rnd: [a,b] } */
  const amount = (v) =>
    v && typeof v === 'object' && Array.isArray(v.rnd) ? rnd(v.rnd[0], v.rnd[1]) : Number(v) || 0;

  for (const e of effects) {
    switch (e.op) {
      case 'res': {
        const k = String(e.res);
        nval = amount(e.n);
        addRes(state, k, nval);
        break;
      }
      case 'gold':
        nval = amount(e.n);
        state.gold = Math.max(0, (state.gold || 0) + nval);
        break;
      case 'learnRecipe': {
        const unowned = Object.keys(RECIPES).filter((k) => !state.items[k]);
        if (unowned.length) {
          const pick = unowned[Math.floor(random() * unowned.length)];
          state.items[pick] = true;
          // 文案可定制：{name} 会被替换成配方名
          const tpl = e.log || '你学会了 {name} 的制作方法！';
          logs.push({ text: String(tpl).replace('{name}', RECIPES[pick].name), cls: 'good' });
        } else {
          logs.push({ text: e.failText || '图纸已经看不清了。', cls: 'warn' });
        }
        break;
      }
      case 'set':
        state[String(e.field)] = e.value;
        break;
      case 'delta': {
        const f = String(e.field);
        const cur = Number(state[f]) || 0;
        let v = cur + (Number(e.n) || 0);
        if (e.min !== undefined) v = Math.max(e.min, v);
        if (e.max !== undefined) v = Math.min(e.max, v);
        state[f] = v;
        break;
      }
      case 'steal': {
        const [lo, hi] = e.n2 ?? [3, 8];
        const keys = Object.keys(state.res).filter((k) => state.res[k] > 0 && k !== 'luck');
        if (keys.length) {
          const k = keys[Math.floor(random() * keys.length)];
          const n = Math.min(state.res[k], rnd(lo, hi));
          state.res[k] -= n;
          logs.push({ text: `💥 你的 ${resNames()[k] ?? k} 丢了 ×${n}！`, cls: 'bad' });
        } else {
          logs.push({ text: '💥 好像什么都没发生……', cls: 'bad' });
        }
        break;
      }
      case 'random': {
        const branches = /** @type {any[]} */ (e.branches) || [];
        const pool = [];
        for (const b of branches) for (let i = 0; i < (b.w || 1); i++) pool.push(b);
        const pick = pool[Math.floor(random() * pool.length)];
        if (pick) logs.push(...applyEffects(state, pick.effects || [], ctx));
        break;
      }
      case 'branch': {
        // 条件分支：{ if: { field, gte/lte }, then:[…], else:[…] }
        const cond = e.if || {};
        const cur = Number(state[String(cond.field)]) || 0;
        let hit = true;
        if (cond.gte !== undefined) hit = hit && cur >= cond.gte;
        if (cond.lte !== undefined) hit = hit && cur <= cond.lte;
        logs.push(...applyEffects(state, (hit ? e.then : e.else) || [], ctx));
        break;
      }
      case 'combat':
        combat.push({ night: !!e.night, forceBeasts: !!e.beasts });
        break;
      case 'achievement':
        achievements.push(String(e.id));
        break;
      case 'log':
        logs.push({ text: fill(String(e.text)), cls: e.cls || 'sys' });
        break;
      default:
        throw new Error(`未知的效果指令: ${e.op}`);
    }
    // 指令自带的日志模板（支持 {n} / {res:key}）
    // learnRecipe 自己会写日志（还带 {name}），这里跳过避免重复
    if (e.log && e.op !== 'learnRecipe') logs.push({ text: fill(e.log, nval), cls: e.cls || 'sys' });
  }
  return logs;
}
