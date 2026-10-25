// 状态基础操作（供 actions / effects / 后续模块共用，避免各写一份）
//
// 语义与 survival.html 里的同名 helper 一致：
//   addRes  加资源；正向获取时记 stats.ownedRes（"曾经拥有过"，用于配方可见性）
//   spend   扣资源，不足则返回 false 且不改动
//   has     判断设施/装备是否已制作

/**
 * 加（或扣）资源。
 * @param {any} state
 * @param {string} k
 * @param {number} n
 */
export function addRes(state, k, n) {
  if (!(k in state.res)) state.res[k] = 0;
  state.res[k] += n;
  if (n > 0 && state.stats) {
    if (!state.stats.ownedRes) state.stats.ownedRes = {};
    state.stats.ownedRes[k] = 1;
  }
}

/**
 * 扣资源；数量不足时不做任何改动并返回 false。
 * @param {any} state
 * @param {string} k
 * @param {number} n
 * @returns {boolean}
 */
export function spend(state, k, n) {
  if ((state.res[k] || 0) >= n) {
    state.res[k] -= n;
    return true;
  }
  return false;
}

/**
 * 是否已制作某个设施/装备。
 * @param {any} state
 * @param {string} k
 * @returns {boolean}
 */
export function has(state, k) {
  return !!state.items[k];
}

/**
 * 技能等级。
 * @param {any} state
 * @param {string} skill
 * @returns {number}
 */
export function skillLvl(state, skill) {
  return (state.skills && state.skills[skill] && state.skills[skill].lvl) || 1;
}
