// 战斗：武器攻击力 / Boss 数值 / 遭遇选择（纯逻辑）
//
// 对应 survival.html 的 weaponAtk / bossStats / pharaohStats / startCombat 前半段。
// 战斗回合与奖励（fight）见 3.5 的第二批。

import { WEAPONS } from './data/weapons.mjs';
import { BEASTS, ROBOTS, REGION_BEASTS, MOON_BEASTS } from './data/monsters.mjs';

/**
 * 当前武器（取已制作的最强一把）+ 锋利附魔加成。
 * @param {any} state
 * @returns {{name: string, atk: number, baseAtk: number, mult: number, sharp: number}}
 */
export function weaponAtk(state) {
  const base = state.items.runeBlade ? WEAPONS.runeBlade
    : state.items.huntKing ? WEAPONS.huntKing
      : state.items.steel ? WEAPONS.steel
        : state.items.iron ? WEAPONS.iron
          : state.items.knife ? WEAPONS.knife
            : WEAPONS.none;
  const sharp = (state.enchant && state.enchant.weapon) || 0;
  return {
    name: base.name,
    atk: Math.round(base.atk * (1 + sharp * 0.10)),
    baseAtk: base.atk,
    mult: base.mult,
    sharp,
  };
}

/**
 * 废土兽王三阶段（按已击杀次数成长）。
 * @param {any} state
 * @returns {{name: string, hp: number, atk: number, food: number, leather: number, metal: number}}
 */
export function bossStats(state) {
  const k = state.stats.bossKills || 0;
  return {
    name: k === 0 ? '废土兽王' : k === 1 ? '废土兽王·狂暴' : '废土兽王·灭世',
    hp: 90 + k * 60,
    atk: 22 + k * 8,
    food: 30 + k * 12,
    leather: 12 + k * 5,
    metal: 8 + k * 4,
  };
}

/**
 * 法老三阶段。
 * @param {any} state
 * @returns {{name: string, hp: number, atk: number, food: number, leather: number, metal: number, alloy: number, rune: number, gold: number}}
 */
export function pharaohStats(state) {
  const k = state.stats.pharaohKills || 0;
  return {
    name: k === 0 ? '👑阿努比斯之仆' : k === 1 ? '💀死亡执政官' : '👁永恒法老',
    hp: 220 + k * 100,
    atk: 32 + k * 12,
    food: 40 + k * 15,
    leather: 8 + k * 3,
    metal: 15 + k * 5,
    alloy: 8 + k * 4,
    rune: 2 + k,
    gold: 120 + k * 80,
  };
}

/**
 * 是否满月（每 15 天）。
 * @param {number} day
 * @returns {boolean}
 */
export function isFullMoon(day) {
  return day % 15 === 0;
}

/**
 * 遭遇选择：先判区域特色怪（45%），再按 tierScale 决定强度档位；满月会让野狗/灰狼进化。
 *
 * 返回 `pool` 用于图鉴解锁：'beasts' | 'robots' | 'forest' | 'river' | 'hills' | 'pyramid'。
 *
 * @param {any} state
 * @param {{zone?: string, tierScale?: number, forceBeasts?: boolean, random?: () => number}} [opts]
 * @returns {{monster: any, pool: string, idx: number, moon: boolean}}
 */
export function pickMonster(state, opts = {}) {
  const random = opts.random ?? Math.random;
  const zone = opts.zone;
  const tierScale = opts.tierScale ?? 1;
  const forceBeasts = !!opts.forceBeasts;

  const zonePool = REGION_BEASTS[zone];
  const useZone = !forceBeasts && zonePool && random() < 0.45;
  const pool = useZone ? zonePool : BEASTS;

  let idx;
  if (tierScale === 1) idx = Math.min(pool.length - 1, random() < 0.5 ? 0 : 1);
  else if (tierScale === 0.5) idx = Math.min(pool.length - 1, random() < 0.6 ? 0 : 1);
  else idx = Math.min(pool.length - 1, Math.floor(random() * pool.length));

  let monster = pool[idx];
  const moon = isFullMoon(state.day);
  if (moon && monster.name === '野狗') monster = Object.assign({}, monster, MOON_BEASTS.dog);
  else if (moon && monster.name === '灰狼') monster = Object.assign({}, monster, MOON_BEASTS.wolf);

  let poolId;
  if (pool === BEASTS) poolId = 'beasts';
  else if (pool === ROBOTS) poolId = 'robots';
  else if (pool === REGION_BEASTS.forest) poolId = 'forest';
  else if (pool === REGION_BEASTS.river) poolId = 'river';
  else if (pool === REGION_BEASTS.hills) poolId = 'hills';
  else if (pool === REGION_BEASTS.pyramid) poolId = 'pyramid';
  else poolId = 'beasts';

  return { monster, pool: poolId, idx, moon };
}

/**
 * 图鉴 id（遭遇即解锁）：与旧 startCombat 里的 wikiSeen 调用一一对应。
 * @param {{pool: string, idx: number, monster: any}} picked
 * @returns {string[]}
 */
export function bestiaryIds(picked) {
  const ids = [];
  if (picked.pool === 'beasts') ids.push('beast' + picked.idx);
  else if (picked.pool === 'robots') ids.push('rob' + picked.idx);
  else if (picked.pool === 'forest') ids.push('zone-forest');
  else if (picked.pool === 'river') ids.push('zone-river');
  else if (picked.pool === 'hills') ids.push('zone-hills');
  else if (picked.pool === 'pyramid') ids.push('pyr' + picked.idx);

  const name = picked.monster.name || '';
  if (name.includes('凶犬')) ids.push('moon-dog');
  else if (name.includes('月狼')) ids.push('moon-wolf');
  return ids;
}

/* ------------------------------ 战斗回合 ------------------------------ */
// 对应 survival.html 的 fight(act)。UI（弹窗关掉、renderAll/save/checkDeath）留在表现层。
//
// 约定返回：
//   logs         日志
//   xp           技能经验增量
//   achievements 要触发的成就（'kill1' / 'stage' / 'mummy1' / 'boss' …）
//   combat       Boss 战是否已分出胜负（true 表示流程结束）

import { addRes, spend, skillLvl } from './state.mjs';
import { armorDmgMult } from './craft.mjs';
import { resNames } from './data/resources.mjs';

/** @typedef {{text: string, cls: string}} LogEntry */

/**
 * 普通怪单回合对拼。
 * @param {any} state
 * @param {any} monster
 * @param {{random?: () => number, rnd?: (a: number, b: number) => number}} [ctx]
 * @returns {{logs: LogEntry[], xp: {skill: string, n: number}[], achievements: string[], killed: boolean}}
 */
export function fightRound(state, monster, ctx = {}) {
  const random = ctx.random ?? Math.random;
  const rnd = ctx.rnd ?? ((a, b) => Math.floor(random() * (b - a + 1)) + a);
  const logs = [];
  const achievements = [];
  const names = resNames();

  const wpn = weaponAtk(state);
  const lv = skillLvl(state, 'combat');
  const b = Object.assign({}, monster);

  const dmg = Math.round(wpn.atk * (1 + (state.upgrades.weapon || 0) * 0.1) * (1 + lv * 0.05) * (0.8 + random() * 0.4));
  const takenRaw = Math.round(b.atk * (0.6 + random() * 0.6));
  const taken = Math.max(1, Math.round(takenRaw * armorDmgMult(state)));
  b.hp -= dmg;
  state.hp = Math.max(0, Math.min(100, state.hp - taken));
  const xp = [{ skill: 'combat', n: rnd(10, 16) }];
  logs.push({ text: `⚔️ 你挥出${wpn.name}造成 ${dmg} 点伤害，被反击 ${taken} 点。`, cls: 'ev' });

  let killed = false;
  if (b.hp <= 0) {
    killed = true;
    state.stats.kills++;
    const loot = [];
    const fields = ['food', 'leather', 'metal', 'alloy', 'rune'];
    for (const k of fields) {
      const v = b[k];
      if (v > 0) {
        addRes(state, k, v);
        loot.push(`${names[k]} ×${v}`);
      }
    }
    logs.push({ text: `🏆 你击败了${b.name}！获得 ${loot.join('、')}`, cls: 'good' });
    achievements.push('kill1', 'stage');
    if (b.name && b.name.includes('木乃伊')) achievements.push('mummy1');
  } else {
    logs.push({ text: `${b.name}还在挣扎，你趁机撤退了。`, cls: 'warn' });
    state.hp = Math.max(0, Math.min(100, state.hp - 6));
    if (state.hp < 40 && !state.heavyWound) {
      state.heavyWound = true;
      logs.push({ text: '你受了重伤，行动力大减。', cls: 'bad' });
    }
  }
  return { logs, xp, achievements, killed };
}

/**
 * Boss 战：多回合自动对拼，直到一方倒下。
 *
 * ⚠ 原实现的回合日志固定写「兽王反击」，即使打的是法老 —— 照搬（见 SUSPECTED.md）。
 *
 * @param {any} state
 * @param {{monster: any, isPharaoh: boolean}} opts
 * @param {{random?: () => number, rnd?: (a: number, b: number) => number}} [ctx]
 * @returns {{logs: LogEntry[], xp: {skill: string, n: number}[], achievements: string[], victory: boolean}}
 */
export function fightBoss(state, opts, ctx = {}) {
  const random = ctx.random ?? Math.random;
  const rnd = ctx.rnd ?? ((a, b) => Math.floor(random() * (b - a + 1)) + a);
  const logs = [];
  const achievements = [];
  const names = resNames();
  const isPharaoh = !!opts.isPharaoh;
  const b = Object.assign({}, opts.monster);

  const wpn = weaponAtk(state);
  const lv = skillLvl(state, 'combat');
  let rounds = 0;
  while (b.hp > 0 && state.hp > 0) {
    rounds++;
    const dmg = Math.round(wpn.atk * (1 + (state.upgrades.weapon || 0) * 0.1) * (1 + lv * 0.05) * (0.8 + random() * 0.4));
    const takenRaw = Math.round(b.atk * (0.6 + random() * 0.6));
    const taken = Math.max(1, Math.round(takenRaw * armorDmgMult(state)));
    b.hp -= dmg;
    state.hp = Math.max(0, Math.min(100, state.hp - taken));
    logs.push({ text: `⚔️ 第${rounds}回合：你造成 ${dmg} 点伤害，兽王反击 ${taken} 点。`, cls: 'ev' });
  }

  const xp = [{ skill: 'combat', n: rnd(30, 45) }];
  const victory = b.hp <= 0;

  if (victory) {
    state.stats.kills++;
    if (isPharaoh) {
      const ps = pharaohStats(state);
      state.gold += ps.gold;
      addRes(state, 'food', ps.food);
      addRes(state, 'leather', ps.leather);
      addRes(state, 'metal', ps.metal);
      addRes(state, 'alloy', ps.alloy);
      addRes(state, 'rune', ps.rune);
      addRes(state, 'luck', 1);
      addRes(state, 'goldOre', rnd(2, 4));
      let extra = '';
      if (random() < 0.5) { addRes(state, 'totem', 1); extra += '、🪬不死图腾 ×1'; }
      if (random() < 0.5) { addRes(state, 'adrenaline', 1); extra += '、💉肾上腺素 ×1'; }
      logs.push({
        text: `🏆 ${ps.name}轰然倒地！沙金碎了一地！你获得了${names.food} ×${ps.food}、${names.leather} ×${ps.leather}、${names.metal} ×${ps.metal}、${names.alloy} ×${ps.alloy}、${names.rune} ×${ps.rune}、${names.goldOre} ×2~4、💰${ps.gold}${extra}！`,
        cls: 'good',
      });
      state.stats.pharaohKills = (state.stats.pharaohKills || 0) + 1;
      if (!state.stats.pharaohFirstAt) state.stats.pharaohFirstAt = state.day;
      achievements.push('pharaoh1');
      if (state.stats.pharaohKills >= 2) achievements.push('pharaoh2');
      if (state.stats.pharaohKills >= 3) achievements.push('pharaoh3');
    } else {
      const bs = bossStats(state);
      addRes(state, 'food', bs.food);
      addRes(state, 'leather', bs.leather);
      addRes(state, 'metal', bs.metal);
      addRes(state, 'luck', 1);
      addRes(state, 'rune', 1);
      let totemTxt = '';
      if (random() < 0.4) { addRes(state, 'totem', 1); totemTxt = '、🪬不死图腾 ×1'; }
      if (random() < 0.3) { addRes(state, 'adrenaline', 1); totemTxt += '、💉肾上腺素 ×1'; }
      logs.push({
        text: `🏆 ${bs.name}轰然倒地！你获得了${names.food} ×${bs.food}、${names.leather} ×${bs.leather}、${names.metal} ×${bs.metal}、${names.luck} ×1、${names.rune} ×1${totemTxt}！`,
        cls: 'good',
      });
      state.stats.bossKills = (state.stats.bossKills || 0) + 1;
      if (!state.stats.bossFirstAt) state.stats.bossFirstAt = state.day;
      achievements.push('boss');
      if (state.stats.bossKills >= 2) achievements.push('boss2');
      if (state.stats.bossKills >= 3) achievements.push('boss3');
    }
    // 原实现在法老胜利后也打这句「击败兽王 N 次」，照搬
    logs.push({ text: `🩸 你已击败兽王 ${state.stats.bossKills} 次，它的躯体会再次凝聚……`, cls: 'info' });
  } else {
    logs.push({ text: '你倒在了兽王的利爪下……', cls: 'bad' });
  }
  return { logs, xp, achievements, victory };
}

/**
 * 逃跑（普通怪）：55% 成功，固定消耗 12 精力。
 * @param {any} state
 * @param {any} monster
 * @param {{random?: () => number}} [ctx]
 * @returns {{logs: LogEntry[]}}
 */
export function flee(state, monster, ctx = {}) {
  const random = ctx.random ?? Math.random;
  const logs = [];
  const ok = random() < 0.55;
  state.stam = Math.max(0, Math.min(100, state.stam - 12));
  if (ok) {
    logs.push({ text: '你连滚带爬逃出了追击。', cls: 'sys' });
  } else {
    state.hp = Math.max(0, Math.min(100, state.hp - monster.atk));
    logs.push({ text: `你没能甩掉${monster.name}，被抓伤！`, cls: 'bad' });
  }
  return { logs };
}

/**
 * 从 Boss 战撤离：消耗 15 精力，80% 成功；失败重伤。
 * @param {any} state
 * @param {{random?: () => number}} [ctx]
 * @returns {{logs: LogEntry[]}}
 */
export function bossFlee(state, ctx = {}) {
  const random = ctx.random ?? Math.random;
  const logs = [];
  state.stam = Math.max(0, Math.min(100, state.stam - 15));
  if (random() < 0.8) {
    logs.push({ text: '你屏息凝神，趁兽王转身时悄悄退走了。', cls: 'sys' });
  } else {
    state.hp = Math.max(0, Math.min(100, state.hp - 22));
    logs.push({ text: '兽王发现了你，一爪拍来！你重伤倒地，侥幸逃脱。', cls: 'bad' });
    state.heavyWound = true;
  }
  return { logs };
}

/**
 * 扔食物引开（消耗 2 生食）：70% 成功；失败被咬。
 * @param {any} state
 * @param {any} monster
 * @param {{random?: () => number}} [ctx]
 * @returns {{logs: LogEntry[], ok: boolean}}
 */
export function bait(state, monster, ctx = {}) {
  const random = ctx.random ?? Math.random;
  const logs = [];
  if (!spend(state, 'food', 2)) return { logs, ok: false };

  if (random() < 0.7) {
    logs.push({ text: '你把食物丢出去，趁它进食时溜走了。', cls: 'good' });
    return { logs, ok: true };
  }
  state.hp = Math.max(0, Math.min(100, state.hp - monster.atk));
  logs.push({ text: `${monster.name}吃完了食物却还是追上来咬了你！`, cls: 'bad' });
  return { logs, ok: false };
}
