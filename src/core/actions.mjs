// 行动的前置条件与基础消耗（纯逻辑）
//
// 对应 survival.html 的 doAction() 前半段：
//   - 前置检查（工具/设施/材料/精力/天色）
//   - 精力扣减（肾上腺素期间不扣）
//
// 各 case 的具体产出（砍柴产量、钓鱼三池、采矿概率…）属于 3.3 的下一批，暂不在此。
//
// 关键历史坑（AGENT.md §7 #4）：**材料不足时必须前置返回，不能先扣精力**。
// 原实现的修法是"在扣精力之前把材料检查全部做完"，这里用同样的顺序保证。

import { ACTIONS } from './data/actions.mjs';
import { addRes, spend, has, skillLvl } from './state.mjs';
import { resNames } from './data/resources.mjs';
import { TREASURES, JUNK } from './data/fishing.mjs';
import { applyEffects } from './effects.mjs';

/**
 * 前置检查结果。
 * @typedef {{ok: true} | {ok: false, reason: string, stopAuto: boolean}} CheckResult
 */

/**
 * 判断某个行动此刻能不能执行。
 * @param {any} state
 * @param {string} kind
 * @returns {CheckResult}
 */
export function checkAction(state, kind) {
  const a = ACTIONS[kind];
  if (!a) return { ok: false, reason: '', stopAuto: false };
  if (state.dead) return { ok: false, reason: '', stopAuto: false };

  const fail = (reason, stopAuto = true) => ({ ok: false, reason, stopAuto });

  // —— 工具 / 设施 ——
  if (kind === 'hunt' && !state.items.knife && !state.items.iron && !state.items.steel && !state.items.huntKing) {
    return fail('需要先制作石刀/铁刀/钢刀');
  }
  if (kind === 'fish' && !state.items.rod) return fail('需要先制作鱼竿');
  if (kind === 'smelt' && !state.items.forge) return fail('需要先制作铁匠炉');
  if (kind === 'smeltOre' && !state.items.forge) return fail('需要先制作铁匠炉');
  if ((kind === 'cook' || kind === 'boil') && (!state.items.fire || state.offToday.fire)) {
    return fail(state.offToday.fire ? '火堆今天停摆了，需要木材维护' : '需要先制作火堆');
  }

  // —— 材料（v1.29.4 起：材料不足直接返回，不扣精力、不推进时间）——
  if (kind === 'cook' && (state.res.food || 0) <= 0) return fail('没有生食可以烹饪');
  if (kind === 'boil' && (state.res.water || 0) <= 0) return fail('没有生水可以烧');
  if (kind === 'smelt' && (state.res.metal || 0) <= 0) return fail('没有金属可以熔炼');
  if (kind === 'smelt' && (state.res.stone || 0) < 2) return fail('石头不够熔炼（至少需要 2）');
  if (kind === 'smeltOre'
    && !(state.res.goldOre || 0) && !(state.res.silverOre || 0) && !(state.res.copperOre || 0)) {
    return fail('没有矿石可冶炼（采矿可得铜/银/金矿石）');
  }

  // —— 治疗（这两条原实现只提示、不额外 stopAuto）——
  if (kind === 'heal' && state.hp >= 100) return { ok: false, reason: '生命值已满，无需治疗', stopAuto: false };
  if (kind === 'heal' && (state.res.herb || 0) <= 0) return { ok: false, reason: '没有草药', stopAuto: false };

  // —— 精力 / 天色 ——
  if (a.stam > 0 && state.stam < a.stam) return fail('精力不足，先睡一觉吧');
  if (a.time > 0 && state.hour + a.time > 24 && (state.food < 12 || state.water < 15)) {
    return fail('天色已晚且你饥渴难耐，先吃饭喝水');
  }

  return { ok: true };
}

/**
 * 扣精力。肾上腺素生效期间不扣（与原实现一致）。
 * @param {any} state
 * @param {string} kind
 * @param {{adrenaline?: boolean}} [opts]
 */
export function payActionCost(state, kind, opts = {}) {
  const a = ACTIONS[kind];
  if (!a || a.stam <= 0) return;
  if (opts.adrenaline) return;
  state.stam = Math.max(0, Math.min(100, state.stam - a.stam));
}

/**
 * 一个行动是否应该打断"自动放置"（手动决策类行动会）。
 * @param {string} kind
 * @returns {boolean}
 */
export function interruptsAuto(kind) {
  const a = ACTIONS[kind];
  if (!a) return false;
  return !a.auto && kind !== 'eat' && kind !== 'drink';
}

/* ============================ 各行动的具体产出 ============================ */
// 约定：函数接收 state 与 ctx（随机源），原地改 state，返回日志数组。
// 原实现里 case 内部用 `toast(...); return;` 提前结束的，这里用 `refused` 字段表达，
// 由调用方决定是弹 toast 还是写日志。

/** @typedef {{text: string, cls: string}} LogEntry */
/** @typedef {{random?: () => number, rnd?: (a: number, b: number) => number}} Ctx */

/**
 * @param {Ctx} [ctx]
 * @returns {{random: () => number, rnd: (a: number, b: number) => number}}
 */
function randomOf(ctx = {}) {
  const random = ctx.random ?? Math.random;
  const rnd = ctx.rnd ?? ((a, b) => Math.floor(random() * (b - a + 1)) + a);
  return { random, rnd };
}

/**
 * 进食：优先熟食（饱食 +16/个），否则生食（+9/个，15% 概率生病）。
 * @param {any} state
 * @param {Ctx} [ctx]
 * @returns {{logs: LogEntry[], refused?: string}}
 */
export function doEat(state, ctx) {
  const { random, rnd } = randomOf(ctx);
  const logs = [];
  if (state.food >= 100) return { logs, refused: '你已经吃饱了' };

  let n = 0;
  let src = '';
  let risk = 0;
  if (state.res.cooked > 0) { n = Math.min(state.res.cooked, rnd(1, 2)); state.res.cooked -= n; src = '熟食'; }
  else if (state.res.food > 0) { n = Math.min(state.res.food, rnd(1, 2)); state.res.food -= n; src = '生食'; risk = 0.15; }
  if (n <= 0) return { logs, refused: '没有食物可吃' };

  const gain = src === '熟食' ? 16 * n : 9 * n;
  state.food = Math.max(0, Math.min(100, state.food + gain));
  logs.push({ text: `你吃下 ${src} ×${n}，饱食 +${gain}。`, cls: 'good' });
  if (risk && random() < risk) {
    state.ill = true;
    logs.push({ text: '生食让你闹肚子……感染了疾病！', cls: 'bad' });
  }
  return { logs };
}

/**
 * 饮水：优先净水（水分 +14/个），否则生水（+8/个，18% 概率生病）。
 * @param {any} state
 * @param {Ctx} [ctx]
 * @returns {{logs: LogEntry[], refused?: string}}
 */
export function doDrink(state, ctx) {
  const { random, rnd } = randomOf(ctx);
  const logs = [];
  if (state.water >= 100) return { logs, refused: '你已经喝足了' };

  let n = 0;
  let src = '';
  let risk = 0;
  if (state.res.clean > 0) { n = Math.min(state.res.clean, rnd(1, 2)); state.res.clean -= n; src = '净水'; }
  else if (state.res.water > 0) { n = Math.min(state.res.water, rnd(1, 2)); state.res.water -= n; src = '生水'; risk = 0.18; }
  if (n <= 0) return { logs, refused: '没有水可喝' };

  const gain = src === '净水' ? 14 * n : 8 * n;
  state.water = Math.max(0, Math.min(100, state.water + gain));
  logs.push({ text: `你喝下 ${src} ×${n}，水分 +${gain}。`, cls: 'good' });
  if (risk && random() < risk) {
    state.ill = true;
    logs.push({ text: '生水让你腹痛如绞……感染了疾病！', cls: 'bad' });
  }
  return { logs };
}

/**
 * 睡觉：消耗食物与水，恢复精力（缺粮水只回 60%），回血 5（有床 10）。
 * @param {any} state
 * @returns {{logs: LogEntry[]}}
 */
export function doSleep(state) {
  const logs = [];
  let foodOk = true;
  let waterOk = true;

  if (state.res.cooked > 0) { state.res.cooked -= 1; logs.push({ text: '你吃了点熟食垫肚子。', cls: 'good' }); }
  else if (state.res.food > 0) { state.res.food -= 2; logs.push({ text: '你啃了点生食。', cls: 'warn' }); }
  else foodOk = false;

  if (state.res.clean > 0) { state.res.clean -= 1; logs.push({ text: '你喝了口水。', cls: 'good' }); }
  else if (state.res.water > 0) { state.res.water -= 2; logs.push({ text: '你灌了点生水。', cls: 'warn' }); }
  else waterOk = false;

  if (!foodOk || !waterOk) {
    logs.push({ text: '你饿着肚子/口干舌燥，睡不安稳……', cls: 'warn' });
    state.stam = Math.max(0, Math.min(100, state.stam + 60));
  } else {
    state.stam = 100;
  }

  const bedBonus = state.items.bed ? 10 : 5;
  state.hp = Math.max(0, Math.min(100, state.hp + bedBonus));
  logs.push({ text: `你睡了 8 小时，精力恢复，生命 +${bedBonus}。`, cls: 'good' });
  if (state.items.bed) logs.push({ text: '床铺让你睡得更安稳。', cls: 'good' });
  return { logs };
}

/**
 * 治疗：消耗草药（2–4），回血 8/株（有药箱翻倍），并治病/降伤。
 * @param {any} state
 * @param {Ctx} [ctx]
 * @param {(id: string) => string} [resName]
 * @returns {{logs: LogEntry[], refused?: string}}
 */
export function doHeal(state, ctx, resName = (k) => k) {
  const { rnd } = randomOf(ctx);
  const logs = [];
  if (state.hp >= 100) return { logs, refused: '生命值已满，无需治疗' };
  const n = Math.min(state.res.herb || 0, rnd(2, 4));
  if (n <= 0) return { logs, refused: '没有草药' };

  state.res.herb -= n;
  const mult = state.items.kit ? 2 : 1;
  const hp = 8 * n * mult;
  state.hp = Math.max(0, Math.min(100, state.hp + hp));

  if (state.ill) { state.ill = false; logs.push({ text: '你服下草药，病痛渐渐消退。', cls: 'good' }); }
  if (state.heavyWound) {
    state.heavyWound = false; state.lightWound = true;
    logs.push({ text: '重伤转为轻伤。', cls: 'good' });
  } else if (state.lightWound) {
    state.lightWound = false;
    logs.push({ text: '伤口愈合了。', cls: 'good' });
  }
  logs.push({ text: `用${resName('herb')} ×${n} 治疗，生命 +${hp}。`, cls: 'good' });
  return { logs };
}

/**
 * 取水：固定获得生水，有净水器时不会因生水生病（注意：原实现只写日志，并没有真的产出净水）。
 * @param {any} state
 * @param {Ctx} [ctx]
 * @param {(k: string) => string} [resName]
 * @returns {{logs: LogEntry[]}}
 */
export function doFetch(state, ctx, resName = (k) => k) {
  const { random, rnd } = randomOf(ctx);
  const logs = [];
  const n = rnd(5, 8);
  addRes(state, 'water', n);
  logs.push({ text: `获得${resName('water')} ×${n}（生水可能让你生病，建议烧开）。`, cls: 'good' });
  if (has(state, 'puri')) {
    logs.push({ text: '净水器自动净化了生水。', cls: 'good' });
  } else if (random() < 0.22) {
    state.ill = true;
    logs.push({ text: '你喝了生水，腹痛如绞……感染了疾病！', cls: 'bad' });
  }
  return { logs };
}

/**
 * 烹饪：生食 → 熟食（产出 = n × 1.5 × (1 + 烹饪等级 × 0.1)）。
 * @param {any} state
 * @param {Ctx} [ctx]
 * @param {(k: string) => string} [resName]
 * @returns {{logs: LogEntry[]}}
 */
export function doCook(state, ctx, resName = (k) => k) {
  const { rnd } = randomOf(ctx);
  const logs = [];
  const lv = skillLvl(state, 'cook');
  const n = Math.min(state.res.food || 0, rnd(2, 5));
  if (n <= 0) {
    logs.push({ text: '没有生食可以烹饪。', cls: 'warn' });
    return { logs };
  }
  spend(state, 'food', n);
  const out = Math.round(n * 1.5 * (1 + lv * 0.1));
  addRes(state, 'cooked', out);
  logs.push({ text: `烹饪完成：${resName('food')} ×${n} → ${resName('cooked')} ×${out}（更顶饱）。`, cls: 'good' });
  state.stats.cook++;
  return { logs };
}

/**
 * 烧水：生水 → 净水（1:1）。
 * @param {any} state
 * @param {Ctx} [ctx]
 * @param {(k: string) => string} [resName]
 * @returns {{logs: LogEntry[]}}
 */
export function doBoil(state, ctx, resName = (k) => k) {
  const { rnd } = randomOf(ctx);
  const logs = [];
  const n = Math.min(state.res.water || 0, rnd(3, 6));
  if (n <= 0) {
    logs.push({ text: '没有生水可以烧。', cls: 'warn' });
    return { logs };
  }
  spend(state, 'water', n);
  addRes(state, 'clean', n);
  logs.push({ text: `烧开${resName('water')} ×${n}，得到${resName('clean')} ×${n}。`, cls: 'good' });
  return { logs };
}

/**
 * 砍柴：产量随斧头品质、砍伐等级、强化与"效率"附魔提升。
 * @param {any} state
 * @param {Ctx} [ctx]
 * @param {(k: string) => string} [resName]
 * @returns {{logs: LogEntry[]}}
 */
export function doChop(state, ctx, resName = (k) => k) {
  const { rnd } = randomOf(ctx);
  const logs = [];
  const lv = skillLvl(state, 'chop');
  const up = 1 + (state.upgrades.axe || 0) * 0.1;
  const eff = 1 + ((state.enchant && state.enchant.tool) || 0) * 0.08;
  const base = state.items.ironAxe ? 8 : state.items.axe ? 5 : 3;
  const spread = state.items.ironAxe ? 6 : state.items.axe ? 4 : 2;
  const n = Math.round(rnd(base, base + spread) * (1 + lv * 0.08) * up * eff);
  addRes(state, 'wood', n);
  logs.push({ text: `获得${resName('wood')} ×${n}。`, cls: 'good' });
  return { logs };
}

/**
 * 狩猎：成功率随武器与狩猎等级提升；失败可能扭伤。
 * @param {any} state
 * @param {Ctx} [ctx]
 * @param {(k: string) => string} [resName]
 * @returns {{logs: LogEntry[]}}
 */
export function doHunt(state, ctx, resName = (k) => k) {
  const { random, rnd } = randomOf(ctx);
  const logs = [];
  const lv = skillLvl(state, 'hunt');
  const mult = state.items.iron ? 1.8 : state.items.knife ? 1.3 : 0.8;
  if (random() < 0.55 * mult * (1 + lv * 0.04)) {
    const n = rnd(6, 12);
    addRes(state, 'food', n);
    logs.push({ text: `狩猎成功！获得${resName('food')} ×${n}。`, cls: 'good' });
    state.stats.hunt++;
  } else {
    logs.push({ text: '猎物跑掉了，白忙一场。', cls: 'warn' });
    if (random() < 0.3) {
      state.hp = Math.max(0, Math.min(100, state.hp - 8));
      logs.push({ text: '追赶时扭伤了脚踝。', cls: 'bad' });
    }
  }
  return { logs };
}

/**
 * 熔炼：金属 + 石头 → 合金（2 石 + 1 金属 → 1 合金）。
 * @param {any} state
 * @param {Ctx} [ctx]
 * @param {(k: string) => string} [resName]
 * @returns {{logs: LogEntry[]}}
 */
export function doSmelt(state, ctx, resName = (k) => k) {
  const { rnd } = randomOf(ctx);
  const logs = [];
  const n = Math.min(state.res.metal || 0, rnd(1, 2));
  if (n <= 0) {
    logs.push({ text: '没有金属可以熔炼。', cls: 'warn' });
    return { logs };
  }
  const needStone = n * 2;
  if ((state.res.stone || 0) < needStone) {
    logs.push({ text: `石头不够熔炼（需要 ${needStone}）。`, cls: 'warn' });
    return { logs };
  }
  spend(state, 'metal', n);
  spend(state, 'stone', needStone);
  addRes(state, 'alloy', n);
  logs.push({ text: `铁匠炉熔炼出${resName('alloy')} ×${n}（${resName('metal')} ${n} + ${resName('stone')} ${needStone}）。`, cls: 'good' });
  return { logs };
}

/**
 * 采矿：石头保底 + 概率出矿石（铜 45% / 银 12% / 金 3%）。
 * 命中的矿石成就会作为 `achievements` 返回，由上层调用 checkMilestone。
 * @param {any} state
 * @param {Ctx} [ctx]
 * @param {(k: string) => string} [resName]
 * @returns {{logs: LogEntry[], achievements: string[]}}
 */
export function doMineOre(state, ctx, resName = (k) => k) {
  const { random, rnd } = randomOf(ctx);
  const logs = [];
  const achievements = [];
  const lv = skillLvl(state, 'mine');
  const eff = 1 + ((state.enchant && state.enchant.tool) || 0) * 0.08;
  const st = Math.round(rnd(1, 2) * (1 + lv * 0.05) * eff);
  addRes(state, 'stone', st);
  const got = [`${resName('stone')} ×${st}`];

  const r = random();
  if (r < 0.03) {
    addRes(state, 'goldOre', 1);
    got.push(`${resName('goldOre')} ×1`);
    achievements.push('oreGold');
  } else if (r < 0.15) {
    addRes(state, 'silverOre', 1);
    got.push(`${resName('silverOre')} ×1`);
    achievements.push('oreSilver');
  } else if (r < 0.45) {
    addRes(state, 'copperOre', 1);
    got.push(`${resName('copperOre')} ×1`);
    achievements.push('oreCopper');
  }
  state.stats.ores = (state.stats.ores || 0) + 1;
  logs.push({ text: `⛏ 挖到 ${got.join('、')}。`, cls: 'good' });
  return { logs, achievements };
}

/**
 * 炼锭：矿石 → 锭，优先金 → 银 → 铜。
 * @param {any} state
 * @param {(k: string) => string} [resName]
 * @returns {{logs: LogEntry[], achievements: string[]}}
 */
export function doSmeltOre(state, resName = (k) => k) {
  const logs = [];
  const achievements = [];
  if (!state.items.forge) {
    logs.push({ text: '需要先制作铁匠炉。', cls: 'warn' });
    return { logs, achievements };
  }
  const ores = [['goldOre', 'gold'], ['silverOre', 'silver'], ['copperOre', 'copper']];
  for (const [ore, ingot] of ores) {
    if ((state.res[ore] || 0) > 0) {
      spend(state, ore, 1);
      addRes(state, ingot, 1);
      state.stats.ingots = (state.stats.ingots || 0) + 1;
      achievements.push('smelt1');
      if ((state.res.gold || 0) >= 1 && (state.res.silver || 0) >= 1 && (state.res.copper || 0) >= 1) {
        achievements.push('ingotAll');
      }
      logs.push({ text: `🔥 ${resName(ore)} ×1 炼成了 ${resName(ingot)} ×1。`, cls: 'good' });
      return { logs, achievements };
    }
  }
  logs.push({ text: '没有可冶炼的矿石（采矿可得铜/银/金矿石）。', cls: 'warn' });
  return { logs, achievements };
}

/**
 * 钓鱼：不咬钩 / 怪物 / 宝藏 / 垃圾 / 鱼 五条分支。
 *
 * 掉落表见 `data/fishing.mjs`（宝藏 6 条 / 垃圾 7 条，均带权重）。
 * 返回里的 `achievements` 用 `fish:<kind>` 形式表达要触发的钓鱼成就，
 * `xp` 表达技能经验增量（技能系统尚未搬，交由上层结算）。
 *
 * @param {any} state
 * @param {Ctx} [ctx]
 * @returns {{logs: LogEntry[], achievements: string[], xp: {skill: string, n: number}[], combat?: boolean}}
 */
export function doFish(state, ctx = {}) {
  const { random, rnd } = randomOf(ctx);
  const logs = [];
  const achievements = [];
  const xp = [];
  const lv = skillLvl(state, 'fish');
  const up = state.upgrades.rod || 0;

  if (random() >= 0.7 + lv * 0.012 + up * 0.06) {
    logs.push({ text: '水面平静，鱼不咬钩。', cls: 'warn' });
    return { logs, achievements, xp };
  }

  const pick = (table) => {
    const pool = [];
    table.forEach((t) => { for (let i = 0; i < t.w; i++) pool.push(t); });
    return pool[Math.floor(random() * pool.length)];
  };

  // —— 低概率钓到怪物 ——
  if (random() < 0.035) {
    state.stats.fish = (state.stats.fish || 0) + 1;
    xp.push({ skill: 'fish', n: rnd(8, 15) });
    logs.push({ text: '🎣 鱼线猛地绷紧——你钓上来一只张牙舞爪的怪物！', cls: 'bad' });
    return { logs, achievements, xp, combat: true };
  }

  const junkChance = Math.max(0.10, 0.42 - lv * 0.003 - up * 0.010);
  const treasChance = Math.min(0.32, 0.13 + lv * 0.002 + up * 0.012);
  const roll = random();

  if (roll < treasChance) {
    // —— 宝藏 ——
    state.stats.fishTreas = (state.stats.fishTreas || 0) + 1;
    xp.push({ skill: 'fish', n: rnd(10, 18) });
    const t = pick(TREASURES);
    logs.push({ text: t.txt, cls: 'good' });
    logs.push(...applyEffects(state, t.effects, { random, rnd }));
    if (t.ach) achievements.push(`fish:${t.ach}`);
    achievements.push('fish:treasure');
  } else if (roll < junkChance + treasChance) {
    // —— 垃圾（10% 概率翻出零钱）——
    const j = pick(JUNK);
    logs.push({ text: j.txt, cls: 'info' });
    logs.push(...applyEffects(state, j.effects, { random, rnd }));
    if (random() < 0.10) {
      const c = rnd(1, 5);
      state.gold += c;
      logs.push({ text: `💰 垃圾里翻出 ${c} 枚硬币。`, cls: 'good' });
    }
  } else {
    // —— 鱼 ——
    state.stats.fish = (state.stats.fish || 0) + 1;
    xp.push({ skill: 'fish', n: rnd(6, 12) });
    if (random() < 0.12) {
      state.stats.fishBig = (state.stats.fishBig || 0) + 1;
      xp.push({ skill: 'fish', n: rnd(15, 25) });
      const n = rnd(12, 18);
      addRes(state, 'food', n);
      logs.push({ text: `🐟 上钩一条罕见的大鱼！${resNames().food} ×${n}。`, cls: 'good' });
      achievements.push('fish:big');
    } else {
      const n = rnd(5, 11);
      addRes(state, 'food', n);
      logs.push({ text: `🐟 钓上一条鱼！${resNames().food} ×${n}。`, cls: 'good' });
    }
    if (random() < 0.15) {
      const c = rnd(1, 8);
      state.gold += c;
      logs.push({ text: `💰 鱼嘴里叼着一枚硬币！金币 +${c}。`, cls: 'good' });
    }
    achievements.push('fish:');
  }
  return { logs, achievements, xp };
}
