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
