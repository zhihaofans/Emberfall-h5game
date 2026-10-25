// 存档层（纯函数）：状态进、状态出，不碰 localStorage、不碰 DOM、不读全局。
//
// 对应 survival.html 里的：newGame() / normalizeState() / migrateFrom() /
// legacyBestiary() / serialize() / parseSavePayload()。
// 行为与原实现逐行对齐（数值、兜底顺序、一次性补偿都照搬），差异只有两处：
//   1. `Date.now()` 改为可注入的 `now` 参数（测试确定性）
//   2. 不写全局 `G`、不调 `log/renderAll`（这些属于表现层）

/** @typedef {import('./types.mjs').GameState} GameState */
/** @typedef {import('./types.mjs').ResMap} ResMap */

import { defaultRes } from './data/resources.mjs';

/** 存档标识（永不改） */
export const SAVE_TAG = 'EMBER';
/** 存档结构版本：只在存档字段变化时 +1，并在 migrateFrom 里补迁移 */
export const SAVE_FMT = 11;

/** @param {number} n @param {number} lo @param {number} hi */
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * 默认值表：normalizeState 的兜底来源。
 * 注意 `stats.days` 这里是 1，而 newGame() 是 0 —— 原实现如此，照搬。
 * @returns {any}
 */
function defaults() {
  return {
    v: SAVE_FMT, day: 1, hour: 8, season: 0, weather: 0,
    hp: 100, food: 100, water: 100, stam: 100,
    ill: false, lightWound: false, heavyWound: false,
    res: defaultRes(),
    items: {
      axe: false, knife: false, fire: false, puri: false, rod: false, trap: false,
      bed: false, kit: false, iron: false,
      ironAxe: false, steel: false, farm: false, tower: false, forge: false, huntKing: false,
      armorHead: 'none', armorBody: 'none', armorLegs: 'none', armorBoots: 'none',
      runeBlade: false, runeArmor: false, forgeMast: false, vault: false,
      autokitchen: false, solarBoiler: false, enchantTbl: false,
    },
    upgrades: { weapon: 0, axe: 0, rod: 0, trap: 0 },
    enchant: { tblLv: 0, weapon: 0, armor: 0, tool: 0 },
    stats: {
      explore: 0, hunt: 0, craft: 0, kills: 0, cook: 0, days: 1, events: 0,
      fish: 0, fishTreas: 0, fishBig: 0, bossKills: 0, bossFirstAt: 0,
      pharaohKills: 0, pharaohFirstAt: 0, totemSave: 0, ores: 0, ingots: 0,
      armorsWorn: [], zoneCnt: {}, ownedRes: {},
    },
    skills: {
      chop: { lvl: 1, xp: 0 }, mine: { lvl: 1, xp: 0 }, hunt: { lvl: 1, xp: 0 },
      fish: { lvl: 1, xp: 0 }, explore: { lvl: 1, xp: 0 }, cook: { lvl: 1, xp: 0 },
      combat: { lvl: 1, xp: 0 },
    },
    gold: 0, lastSeen: 0, autoAction: null, adrenalineLeft: 0,
    offToday: { fire: false, puri: false, trap: false },
    npcDora: { fav: 0 }, bestiary: {},
    milestones: {}, dead: false, deathReason: '',
  };
}

/**
 * 新游戏初始状态（对应原 newGame() 的对象部分；不含日志输出与全局赋值）。
 * @param {number} [now]
 * @returns {GameState}
 */
export function createNewState(now = Date.now()) {
  const d = defaults();
  // newGame() 与 normalizeState() 的两处历史差异：新档 stats.days=0，且带 v1.17.1 补偿标记
  d.stats.days = 0;
  d.lastSeen = now;
  d.__v1171_comp = 1;
  // 新档也必须带 v1.27.4 标记：否则第一次读档会被当成"未补偿过的老档"，
  // 白送 不死图腾×1 + 抽奖券×2（原 newGame() 漏了这个字段，属历史坑 #5）
  d.__v1274_comp = 1;
  return /** @type {GameState} */ (d);
}

/**
 * 老存档补图鉴：按历史战绩粗略推断"遭遇过"的怪物。
 * 与 survival.html 里的 legacyBestiary 完全一致。
 * @param {any} g
 * @returns {Record<string, number>}
 */
export function legacyBestiary(g) {
  const b = {};
  const k = (g.stats && g.stats.kills) || 0;
  [1, 2, 3, 4].forEach((n, i) => { if (k >= n) b['beast' + i] = 1; });
  const zc = (g.stats && g.stats.zoneCnt) || {};
  if ((zc.forest || 0) >= 1) b['zone-forest'] = 1;
  if ((zc.river || 0) >= 1) b['zone-river'] = 1;
  if ((zc.hills || 0) >= 1) b['zone-hills'] = 1;
  if ((zc.ruins || 0) >= 1) {
    b['rob0'] = 1;
    if ((zc.ruins || 0) >= 3) b['rob1'] = 1;
    if ((zc.ruins || 0) >= 6) b['rob2'] = 1;
  }
  if ((zc.pyramid || 0) >= 1) {
    b['pyr0'] = 1;
    if ((zc.pyramid || 0) >= 3) b['pyr1'] = 1;
    if ((zc.pyramid || 0) >= 6) b['pyr2'] = 1;
  }
  const bk = (g.stats && g.stats.bossKills) || 0;
  [1, 2, 3].forEach((n, i) => { if (bk >= n) b['boss' + i] = 1; });
  const pk = (g.stats && g.stats.pharaohKills) || 0;
  [1, 2, 3].forEach((n, i) => { if (pk >= n) b['pharaoh' + i] = 1; });
  if (k >= 6) b['moon-dog'] = 1;
  if (k >= 10) b['moon-wolf'] = 1;
  return b;
}

/**
 * 读档兜底：逐字段重建 + clamp + 一次性补偿。
 * @param {any} input
 * @param {number} [now]
 * @returns {GameState}
 */
export function normalizeState(input, now = Date.now()) {
  const def = defaults();
  const defSkills = def.skills;
  let g = input;
  if (!g || typeof g !== 'object') g = {};
  for (const k in def) {
    if (!(k in g)) g[k] = def[k];
    else if (k === 'res' || k === 'items' || k === 'stats' || k === 'milestones' || k === 'skills') {
      if (typeof g[k] !== 'object' || !g[k]) g[k] = def[k];
      else for (const kk in def[k]) { if (!(kk in g[k])) g[k][kk] = def[k][kk]; }
    }
  }
  // skills 内部补齐 lvl/xp
  if (g.skills) {
    for (const s in defSkills) {
      if (!g.skills[s]) g.skills[s] = { lvl: 1, xp: 0 };
      else {
        g.skills[s].lvl = Math.max(1, g.skills[s].lvl | 0 || 1);
        g.skills[s].xp = Math.max(0, g.skills[s].xp | 0 || 0);
      }
    }
  }
  // 区域探索计数兜底（新区域成就用）
  if (!g.stats || typeof g.stats !== 'object') g.stats = {};
  if (!g.stats.zoneCnt || typeof g.stats.zoneCnt !== 'object') g.stats.zoneCnt = {};
  if (!g.stats.ownedRes || typeof g.stats.ownedRes !== 'object') g.stats.ownedRes = {};
  if (!g.npcDora || typeof g.npcDora !== 'object') g.npcDora = { fav: 0 };
  if (!g.bestiary || typeof g.bestiary !== 'object') g.bestiary = {};
  // 数值修正
  g.day = Math.max(1, g.day | 0 || 1);
  g.hour = ((g.hour | 0) % 24 + 24) % 24;
  g.season = Math.max(0, (g.season | 0 || 0));
  g.weather = Math.max(0, (g.weather | 0 || 0));
  ['hp', 'food', 'water', 'stam'].forEach((k) => { g[k] = clamp(g[k] | 0 || 0, 0, 100); });
  // 金币 NaN 硬保护（修复 v1.16.x "购买符石后金币变 NaN"）
  if (typeof g.gold !== 'number' || !isFinite(g.gold)) g.gold = 0;
  g.gold = Math.max(0, g.gold | 0 || 0);
  // 一次性补偿：v1.17.1 金币 NaN → 100 幸运方块
  if (!g.__v1171_comp) {
    g.__v1171_comp = 1;
    if (!g.res) g.res = {};
    g.res.luck = (g.res.luck || 0) + 100;
  }
  // 一次性补偿：v1.27.4 金币 NaN → 不死图腾 ×1 + 抽奖券 ×2
  if (!g.__v1274_comp) {
    g.__v1274_comp = 1;
    if (!g.res) g.res = {};
    g.res.totem = (g.res.totem || 0) + 1;
    g.res.luckyDraw = (g.res.luckyDraw || 0) + 2;
  }
  // ⚠ 原实现是 `g.lastSeen|0 || now`，`|0` 会把 13 位时间戳截成 32 位有符号整数（溢出成负数），
  //   导致每次载入 lastSeen 都变成负数 → 离线结算算出天文数字 → 被封顶成 8 小时白拿产出。
  //   这里改为按数值判断，不再做 32 位截断。
  const ts = Number(g.lastSeen);
  g.lastSeen = Number.isFinite(ts) && ts > 0 ? ts : now;
  g.autoAction = null; // 载入后不恢复自动放置
  g.dead = !!g.dead;
  return g;
}

/**
 * 存档格式迁移链：旧格式 → 最新格式。
 * 规则：每次改存档结构，把 SAVE_FMT +1，并在此追加一段 `if (fmt < N) { ... }`。
 * @param {any} g
 * @param {number} fmt
 * @param {number} [now]
 * @returns {GameState}
 */
export function migrateFrom(g, fmt, now = Date.now()) {
  fmt = fmt | 0 || 1;
  if (fmt < 2) {
    // v1.x → v2：技能系统 / 金币 / 离线时间戳
    g.skills = {
      chop: { lvl: 1, xp: 0 }, mine: { lvl: 1, xp: 0 }, hunt: { lvl: 1, xp: 0 },
      fish: { lvl: 1, xp: 0 }, explore: { lvl: 1, xp: 0 }, cook: { lvl: 1, xp: 0 },
      combat: { lvl: 1, xp: 0 },
    };
    g.gold = 0;
    g.lastSeen = now;
    g.autoAction = null;
  }
  if (fmt < 3) {
    if (!g.items) g.items = {};
    ['ironAxe', 'steel', 'farm', 'tower', 'forge'].forEach((k) => { if (!(k in g.items)) g.items[k] = false; });
    g.offToday = { fire: false, puri: false, trap: false };
  }
  if (fmt < 4) {
    if (!g.items) g.items = {};
    if (!('huntKing' in g.items)) g.items.huntKing = false;
    if (!g.res) g.res = {};
    if (!('alloy' in g.res)) g.res.alloy = 0;
    g.upgrades = { weapon: 0, axe: 0, rod: 0, trap: 0 };
  }
  if (fmt < 5) {
    if (!g.items) g.items = {};
    if (!g.res) g.res = {};
    if (!('rune' in g.res)) g.res.rune = 0;
    ['runeBlade', 'runeArmor', 'forgeMast', 'vault'].forEach((k) => { if (!(k in g.items)) g.items[k] = false; });
  }
  if (fmt < 6) {
    if (!g.items) g.items = {};
    ['autokitchen', 'solarBoiler'].forEach((k) => { if (!(k in g.items)) g.items[k] = false; });
  }
  if (fmt < 7) {
    if (!g.items) g.items = {};
    if (!('enchantTbl' in g.items)) g.items.enchantTbl = false;
    if (!g.enchant) g.enchant = { tblLv: 0, weapon: 0, armor: 0, tool: 0 };
    else {
      if (!('tblLv' in g.enchant)) g.enchant.tblLv = 0;
      ['weapon', 'armor', 'tool'].forEach((k) => { if (!(k in g.enchant)) g.enchant[k] = 0; });
    }
  }
  if (fmt < 8) {
    if (!g.items) g.items = {};
    if (!('armor' in g.items)) g.items.armor = 'none';
    if (!g.res) g.res = {};
    ['copperOre', 'silverOre', 'goldOre', 'copper', 'silver', 'gold'].forEach((k) => { if (!(k in g.res)) g.res[k] = 0; });
  }
  if (fmt < 9) {
    // v8 → v9：4 部位装备（旧 armor → armorBody）
    if (!g.items) g.items = {};
    const oldArmor = g.items.armor || 'none';
    ['head', 'body', 'legs', 'boots'].forEach((s) => {
      const k = 'armor' + s[0].toUpperCase() + s.slice(1);
      if (!(k in g.items)) g.items[k] = 'none';
    });
    if (oldArmor !== 'none' && g.items.armorBody === 'none') g.items.armorBody = oldArmor;
    delete g.items.armor;
  }
  if (fmt < 10) {
    if (!g.res) g.res = {};
    if (!('adrenaline' in g.res)) g.res.adrenaline = 0;
    if (!('adrenalineLeft' in g)) g.adrenalineLeft = 0;
  }
  if (fmt < 11) {
    // v10 → v11：怪物图鉴解锁记录（老档按历史战绩粗略补）
    g.bestiary = legacyBestiary(g);
  }
  g.v = SAVE_FMT;
  return g;
}

/**
 * 序列化为存档字符串（与源文件同样的字段顺序：tag / fmt / ver / g）。
 * @param {GameState} state
 * @param {string} ver
 * @returns {string}
 */
export function serialize(state, ver) {
  return JSON.stringify({ tag: SAVE_TAG, fmt: SAVE_FMT, ver, g: state });
}

/**
 * 解析存档载荷 → 迁移 → 规范化。非法输入返回 null（不抛错）。
 * 兼容旧标识 `EMBER1`（v1.0.0 导出）。
 * @param {any} data
 * @param {number} [now]
 * @returns {GameState|null}
 */
export function parseSavePayload(data, now = Date.now()) {
  const okTag = data && (data.tag === SAVE_TAG || data.tag === 'EMBER1');
  if (!okTag || !data.g) return null;
  const fmt = data.fmt | 0 || (data.v | 0 || 1);
  return normalizeState(migrateFrom(data.g, fmt, now), now);
}
