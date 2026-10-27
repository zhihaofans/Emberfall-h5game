// 应用层：把 core 的逻辑接到 DOM 上（P2 第一步：最小可玩闭环）
//
// 分工：
//   core/**  纯逻辑，不碰 DOM
//   app.mjs  状态容器 + 渲染 + 事件（本文件）
//
// 已经接上的 core：存档、时间/生存、13 个行动（含自动循环）、制作/装备/强化/附魔、
// 探索与事件、战斗、图鉴、黑市商店、导入导出。
// 还没接：技能一览、进度总览、更新日志、扫码导入导出、PWA（后续按 P2 逐块补）。

import { createNewState, parseSavePayload, serialize } from './core/save.mjs';
import { ACTIONS } from './core/data/actions.mjs';
import { SEASONS, WEATHERS, seasonOf, rollWeather, dailyConsume, advanceHour, applyPassive } from './core/time.mjs';
import { resNames, RESOURCES, resPrices } from './core/data/resources.mjs';
import { RECIPES } from './core/data/recipes.mjs';
import { SKILL_NAMES } from './core/data/skills.mjs';
import {
  doCraft, recipeVisible, hasRes, craftArmor, upgradeItem,
  armorSlotMat, armorDmgMult, nextArmorMat, armorMatVisible,
  enchantItem, upgradeEnchantTbl,
} from './core/craft.mjs';
import { UPGRADES, upgradeCost } from './core/data/upgrades.mjs';
import {
  ARMOR_MAT_INFO, ARMOR_SLOTS, ENCHANTS, ENCHANT_TBL_MAX, enchantCost, enchantTblCost,
} from './core/data/armor.mjs';
import {
  checkAction, payActionCost, interruptsAuto,
  startAuto, stopAuto, nextAutoAction,
  doChop, doHunt, doFish, doSmelt, doMineOre, doSmeltOre,
  doFetch, doCook, doBoil, doEat, doDrink, doSleep, doHeal,
} from './core/actions.mjs';
import { ZONES } from './core/data/zones.mjs';
import { exploreZone, rollExploreEvent } from './core/explore.mjs';
import { resolveOption, lostOpts } from './core/explore-events.mjs';
import { pickMonster, fightRound, fightBoss, flee, bossFlee, bait, bossStats, pharaohStats } from './core/combat.mjs';
import { checkMilestone, checkStageAchieve, checkArmorSet } from './core/achievements.mjs';
import { pickMerchantGoods, canTrade, buyMerchant, doraInfo, doraGoods, DORA_GIFTS, canGift, giftDora, canBuyDoraGood, buyDoraGood, addDoraFav } from './core/npc.mjs';
import { markEncounter, wikiProgress } from './core/wiki.mjs';
import { monsterEntries, materialEntries } from './core/bestiary.mjs';
import { SHOP, SHOP_GROUPS } from './core/data/shop.mjs';
import { shopItem, buyShopItem, canBuyShop, canBuyAnyShop } from './core/shop.mjs';

// 版本号由构建注入（唯一源：仓库根 version.json）
const APP_VERSION = __APP_VERSION__;

const SAVE_KEY = 'ember_save_v1';
const NAMES = resNames();
const AUTO_MS = 1600;

/** @type {any} */
let G = null;
/** @type {{text: string, cls: string}[]} */
const logBuffer = [];
/** @type {ReturnType<typeof setInterval> | null} */
let autoTimer = null;
let curZone = 'forest';
let curTab = 'act';
/** @type {any} */
let pendingEvent = null;
/** @type {any[]} */
let eventOpts = [];
/** @type {any} */
let pendingCombat = null;

/**
 * 按 id 取元素。页面骨架（index.html）固定，`el()` 的 id 由 tools/check-ssot.mjs 守着，
 * 取不到说明骨架被改坏 —— 直接抛错交给全局错误钩子，比静默 return 更容易发现。
 * @type {(id: string) => HTMLElement}
 */
const el = (id) => /** @type {any} */ (document.getElementById(id));
/** @type {(k: string) => string} */
const name = (k) => NAMES[k] || k;
/** @type {(v: number, lo: number, hi: number) => number} */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * 从事件目标向上找最近的匹配元素。
 * `closest()` 返回 `Element`，读 `dataset` / `disabled` 需要 `HTMLElement`。
 * @type {(t: EventTarget | null, sel: string) => HTMLElement | null}
 */
const closestEl = (t, sel) => {
  const node = /** @type {any} */ (t);
  return node && typeof node.closest === 'function' ? node.closest(sel) : null;
};

/* ------------------------------ 存档 ------------------------------ */

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return parseSavePayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

function save() {
  try {
    G.lastSeen = Date.now();
    localStorage.setItem(SAVE_KEY, serialize(G, APP_VERSION));
  } catch { /* 配额满等情况忽略 */ }
}

/* ------------------------------ 日志 / 提示 ------------------------------ */

/** @param {string} text @param {string} [cls] */
export function log(text, cls = 'sys') {
  logBuffer.push({ text, cls });
  if (logBuffer.length > 300) logBuffer.shift();
  renderLog();
}

/** @type {ReturnType<typeof setTimeout> | undefined} */
let toastTimer;

/** @param {string} msg */
function toast(msg) {
  const t = el('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}

function renderLog() {
  const w = el('logwrap');
  if (!w) return;
  w.innerHTML = logBuffer.map((l) => `<div class="logline ${l.cls}">${l.text}</div>`).join('');
  w.scrollTop = w.scrollHeight;
}

/* ------------------------------ 渲染 ------------------------------ */

/** @param {string} key @param {number} value */
function setBar(key, value) {
  const f = el('f-' + key);
  const v = el('v-' + key);
  if (f) f.style.width = clamp(value, 0, 100) + '%';
  if (v) v.textContent = String(value);
}

function renderStatus() {
  el('v-day').textContent = String(G.day);
  el('v-phase').textContent = G.hour >= 6 && G.hour < 18 ? '白天' : '夜晚';
  el('v-season').textContent = SEASONS[G.season] + '季';
  el('v-weather').textContent = WEATHERS[G.weather];
  el('goldinfo').textContent = '💰' + G.gold;
  setBar('hp', G.hp);
  setBar('food', G.food);
  setBar('water', G.water);
  setBar('stam', G.stam);
}

function renderActions() {
  const box = el('actions');
  if (!box) return;
  box.classList.remove('bag-mode');
  const parts = [];
  for (const k in ACTIONS) {
    if (k === 'eat' || k === 'drink') continue;
    const a = ACTIONS[k];
    const running = G.autoAction === k;
    parts.push(
      `<button class="actbtn${running ? ' on' : ''}" data-kind="${k}">`
      + `<span class="n">${a.name}${running ? ' ·进行中' : ''}</span>`
      + `<span class="sub">${a.sub || ''}</span>`
      + `</button>`,
    );
  }
  box.innerHTML = parts.join('');
}

function renderActive() {
  const bar = el('activebar');
  if (!bar) return;
  if (G.autoAction && ACTIONS[G.autoAction]) {
    bar.classList.add('show');
    el('activeName').textContent = ACTIONS[G.autoAction].name;
  } else {
    bar.classList.remove('show');
  }
}

export function renderAll() {
  renderStatus();
  renderZone();
  renderMain();
  renderActive();
}

/** 按当前页签渲染主区域 */
function renderMain() {
  const box = el('actions');
  if (!box) return;
  box.classList.remove('bag-mode', 'craft-mode');
  if (curTab === 'bag') renderBag();
  else if (curTab === 'craft') renderCraft();
  else renderActions();
}

/** 成就 id → 日志（'stage' 是"阶段成就检查"的标记，不是成就 id）
 * @param {string[]} [list] */
function applyAchievements(list) {
  for (const a of list || []) {
    if (a === 'stage') {
      for (const l of checkStageAchieve(G).logs) log(l.text, l.cls);
    } else if (a === 'armorSet') {
      for (const l of checkArmorSet(G).logs) log(l.text, l.cls);
    } else {
      for (const l of checkMilestone(G, a).logs) log(l.text, l.cls);
    }
  }
}

/** 材料成本行：缺的标红（制作 / 装备 / 强化共用）
 * @param {Record<string, number>} cost */
function costLine(cost) {
  return Object.keys(cost).map((k) => {
    const have = G.res[k] || 0;
    const need = cost[k];
    return `<span style="color:${have >= need ? 'var(--txt-dim)' : 'var(--bad)'}">${name(k)} ${have}/${need}</span>`;
  }).join(' · ');
}

/** 制作类操作的统一收尾：refused → toast；否则日志 → 成就 → 耗时 → 重渲染 → 存档
 * @param {{logs?: {text: string, cls: string}[], achievements?: string[], refused?: string, time?: number}} r */
function finishCraftOp(r) {
  if (r.refused) return toast(r.refused);
  for (const l of r.logs || []) log(l.text, l.cls);
  applyAchievements(r.achievements);
  if (r.time) passTime(r.time);
  renderAll();
  save();
}

/** 制作页顶部区块导航：滚到对应区块
 * @param {string} id */
function scrollCraftTo(id) {
  const box = el('actions');
  const target = el(id);
  if (!box || !target) return;
  box.scrollTo({ top: Math.max(0, target.offsetTop - box.offsetTop - 4), behavior: 'smooth' });
}

/** 装备区：总减伤 + 4 部位材质链
 * @param {string[]} parts */
function renderArmor(parts) {
  const mult = armorDmgMult(G);
  const pct = Math.round((1 - mult) * 100);
  parts.push(`<div class="armor-sum"><span>🛡 当前总减伤 <b>${pct}%</b></span>`
    + `<span class="mult">受伤倍率 ${mult.toFixed(2)}</span></div>`);
  parts.push('<div class="craft-sep" id="craftArmor">🛡 装备（材质链：皮→铜→铁→银→金→钢，需先装备低级）</div>');

  for (const slot in ARMOR_SLOTS) {
    const sname = ARMOR_SLOTS[slot].name;
    const cur = armorSlotMat(G, slot);
    const curInfo = ARMOR_MAT_INFO[cur] || null;
    const next = nextArmorMat(G, slot);

    let body;
    let btn = '';
    if (!next) {
      body = `<div class="mat" style="color:var(--ok)">已是最强（${curInfo.name}）</div>`;
    } else if (!armorMatVisible(G, next)) {
      body = '<div class="mat" style="color:var(--txt-faint)">收集材料后可制作</div>';
    } else {
      const nInfo = ARMOR_MAT_INFO[next];
      body = '<div class="mat">' + costLine(nInfo.cost) + '</div>';
      if (hasRes(G, nInfo.cost)) {
        btn = `<button class="make" data-armor="${slot}:${next}">`
          + `${cur === 'none' ? '制作并穿上' : '升级到'}${nInfo.name}${sname}（减伤 ${Math.round((1 - nInfo.dmg) * 100)}%）</button>`;
      }
    }

    const curTxt = curInfo ? `${curInfo.name}${sname}（减伤 ${Math.round((1 - curInfo.dmg) * 100)}%）` : '空';
    parts.push(`<div class="craft-item">
      <div class="name">${sname}<span class="desc">当前：${curTxt}</span></div>
      ${body}${btn}
    </div>`);
  }
}

/** 强化区：4 类装备，材料随等级递增
 * @param {string[]} parts */
function renderUpgrade(parts) {
  parts.push('<div class="craft-sep" id="craftUp">⬆ 强化（材料随等级递增 · Lv.11 起需符石+合金）</div>');

  for (const key in UPGRADES) {
    const u = UPGRADES[key];
    const lv = G.upgrades[key] || 0;
    const max = u.max || 10;
    const hot = lv >= 10 ? '<span class="tag">⭐ 高级</span>' : '';

    let body;
    let btn = '';
    if (u.need && !G.items[u.need]) {
      body = `<div class="mat" style="color:var(--warn)">需要先制作 ${/** @type {Record<string, {name: string}>} */ (RECIPES)[u.need].name}</div>`;
    } else if (lv >= max) {
      body = '<div class="mat" style="color:var(--ok)">已满级</div>';
    } else {
      const cost = upgradeCost(key, lv);
      body = `<div class="mat">Lv.${lv}/${max} · ${costLine(cost)}</div>`;
      if (hasRes(G, cost)) btn = `<button class="make" data-upgrade="${key}">强化到 Lv.${lv + 1}</button>`;
    }

    parts.push(`<div class="craft-item">
      <div class="name">${u.name}${hot}<span class="desc">${u.desc}</span></div>
      ${body}${btn}
    </div>`);
  }
}

/** 附魔区：附魔台（等级 = 附魔上限）+ 3 种附魔
 * @param {string[]} parts */
function renderEnchant(parts) {
  parts.push('<div class="craft-sep" id="craftEn">🔮 附魔（需附魔台 · 附魔台等级 = 附魔上限）</div>');

  // 还没做附魔台：只提示怎么解锁，不给按钮（避免点了没反应的入口）
  if (!G.items.enchantTbl) {
    const r = RECIPES.enchantTbl;
    parts.push(`<div class="craft-item">
      <div class="name">🔮附魔台<span class="desc">${r.desc}</span></div>
      <div class="mat" style="color:var(--warn)">需要先制作 🔮附魔台 · ${costLine(r.cost)}</div>
    </div>`);
    return;
  }

  // —— 附魔台本身 ——
  const tblLv = G.enchant.tblLv || 0;
  let tblBody;
  let tblBtn = '';
  if (tblLv >= ENCHANT_TBL_MAX) {
    tblBody = `<div class="mat" style="color:var(--ok)">已满级 · 可附魔至 ${ENCHANT_TBL_MAX} 级</div>`;
  } else {
    const cost = enchantTblCost(tblLv);
    tblBody = `<div class="mat">Lv.${tblLv}/${ENCHANT_TBL_MAX} · ${costLine(cost)}</div>`;
    if (hasRes(G, cost)) tblBtn = `<button class="make" data-enchtbl="1">升级附魔台到 Lv.${tblLv + 1}</button>`;
  }
  parts.push(`<div class="craft-item">
    <div class="name">🔮附魔台<span class="desc">升级解锁更高级附魔</span></div>
    ${tblBody}${tblBtn}
  </div>`);

  // —— 3 种附魔（上限 = 附魔台等级）——
  for (const kind in ENCHANTS) {
    const e = ENCHANTS[kind];
    const lv = G.enchant[kind] || 0;

    let body;
    let btn = '';
    if (lv >= ENCHANT_TBL_MAX) {
      body = `<div class="mat" style="color:var(--ok)">Lv.${lv} 已满级</div>`;
    } else if (lv >= tblLv) {
      body = `<div class="mat" style="color:var(--warn)">Lv.${lv}/${tblLv} · 需先把附魔台升到 Lv.${lv + 1}</div>`;
    } else {
      const cost = enchantCost(kind, lv);
      body = `<div class="mat">Lv.${lv}/${tblLv} · ${costLine(cost)}</div>`;
      if (hasRes(G, cost)) btn = `<button class="make" data-enchant="${kind}">附魔到 Lv.${lv + 1}</button>`;
    }

    parts.push(`<div class="craft-item">
      <div class="name">${e.name}<span class="desc">${e.desc}</span></div>
      ${body}${btn}
    </div>`);
  }
}

/** 制作面板：22 配方按阶分组 + 装备 / 强化 / 附魔（TODO §4.1.1–4.1.2） */
function renderCraft() {
  const box = el('actions');
  if (!box) return;
  box.classList.add('craft-mode');

  const parts = [
    '<div class="craftnav">'
    + '<button class="cnav" data-cnav="craft0">⚒ 制作</button>'
    + '<button class="cnav" data-cnav="craftArmor">🛡 装备</button>'
    + '<button class="cnav" data-cnav="craftUp">⬆ 强化</button>'
    + '<button class="cnav" data-cnav="craftEn">🔮 附魔</button>'
    + '</div>',
  ];

  /** @type {Record<string, [string, any][]>} */
  const tiers = {};
  for (const id in RECIPES) {
    const r = RECIPES[id];
    if (!recipeVisible(G, id)) continue;
    (tiers[r.tier] = tiers[r.tier] || []).push([id, r]);
  }

  const cards = [];
  for (const t of Object.keys(tiers).sort()) {
    cards.push(`<div class="craft-tier">第 ${t} 阶</div>`);
    for (const [id, r] of tiers[t]) {
      const owned = !!G.items[id];
      const lvOk = !r.needLv || (r.skill && (G.skills[r.skill]?.lvl || 1) >= r.needLv);
      const needOk = !r.need || !!G.items[r.need];
      const matOk = hasRes(G, r.cost);
      const can = !owned && lvOk && needOk && matOk;

      let body = '';
      if (owned) {
        body = '<div class="mat" style="color:var(--ok)">✅ 已制作</div>';
      } else if (!needOk) {
        body = `<div class="mat" style="color:var(--warn)">需要先制作 ${RECIPES[r.need].name}</div>`;
      } else if (!lvOk) {
        const cur = G.skills[r.skill]?.lvl || 1;
        body = `<div class="mat" style="color:var(--warn)">需要 ${SKILL_NAMES[r.skill] || r.skill} Lv.${r.needLv}（当前 Lv.${cur}）</div>`;
      } else {
        body = '<div class="mat">' + costLine(r.cost) + '</div>';
      }

      cards.push(`<div class="craft-item">
        <div class="name">${r.name}<span class="desc">${r.desc}</span></div>
        ${body}
        ${can ? `<button class="make" data-craft="${id}">制作（${r.time} 小时）</button>` : ''}
      </div>`);
    }
  }
  parts.push(`<div id="craft0">${cards.join('')}</div>`);

  renderArmor(parts);
  renderUpgrade(parts);
  renderEnchant(parts);
  box.innerHTML = parts.join('');
}

/** 制作一件
 * @param {string} id */
function craftItem(id) {
  finishCraftOp(doCraft(G, id));
}

/** 背包：进食/饮水 + 资源列表 + 出售 */
function renderBag() {
  const box = el('actions');
  if (!box) return;
  box.classList.add('bag-mode');
  const price = resPrices();
  const parts = [];

  parts.push('<button class="actbtn" data-bag-act="eat"><span>🍽 进食</span><span class="sub">饱食 ' + G.food + '/100</span></button>');
  parts.push('<button class="actbtn" data-bag-act="drink"><span>💧 饮水</span><span class="sub">水分 ' + G.water + '/100</span></button>');

  for (const r of RESOURCES) {
    const n = G.res[r.id] || 0;
    const p = price[r.id];
    const sellable = !!p && n > 0;
    parts.push(
      `<div class="bagrow"><span>${r.name} <span class="cnt">×${n}</span></span>`
      + '<span style="display:flex;align-items:center;gap:6px">'
      + `<span style="font-size:11px;color:var(--txt-faint)">${p ? p + '💰/个' : '不可出售'}</span>`
      + `<button class="sell" data-sell="${r.id}" ${sellable ? '' : 'disabled style="opacity:.35"'}>出售</button>`
      + '</span></div>',
    );
  }
  box.innerHTML = parts.join('');
}

/** 卖 1 个资源
 * @param {string} id */
function sellRes(id) {
  const p = resPrices()[id];
  if (!p) return toast('这个不能卖');
  if ((G.res[id] || 0) <= 0) return toast('没有可卖的');
  G.res[id]--;
  G.gold += p;
  log(`💰 卖出${name(id)} ×1，获得 ${p} 金币。`, 'good');
  renderAll();
  save();
}

function renderZone() {
  const box = el('zonebar');
  if (!box) return;
  const parts = [];
  for (const k in ZONES) {
    const z = ZONES[k];
    const unlockDay = z.unlockDay || 1;
    if (G.day < unlockDay) {
      parts.push(`<button class="zonebtn" style="opacity:.4" data-locked="${z.name} 需存活至第 ${unlockDay} 天解锁">🔒${z.name}</button>`);
      continue;
    }
    const on = curZone === k ? ' on' : '';
    parts.push(`<button class="zonebtn zone-${k}${on}" data-zone="${k}">${z.name}</button>`);
  }
  box.innerHTML = parts.join('');
}

/* ------------------------------ 时间与死亡 ------------------------------ */

function nextDay() {
  G.day++;
  G.stats.days = G.day;
  G.season = seasonOf(G.day);
  G.weather = rollWeather(G.season, Math.random);

  const c = dailyConsume({
    weather: G.weather,
    day: G.day,
    hasVault: !!G.items.vault,
    adrenaline: (G.adrenalineLeft || 0) > 0,
  });
  G.food = clamp(G.food - c.food, 0, 100);
  G.water = clamp(G.water - c.water, 0, 100);

  log(`—— 第 ${G.day} 天 · ${SEASONS[G.season]}季 · ${WEATHERS[G.weather]} ——`, 'tit');
}

/** @param {number} h 推进的小时数 */
function passTime(h) {
  const days = advanceHour(G, h);
  for (let i = 0; i < days; i++) nextDay();
  for (const l of applyPassive(G)) log(l.text, l.cls);
  checkDeath();
}

function checkDeath() {
  if (G.dead) return;
  let reason = null;
  if (G.hp <= 0) reason = '你倒在了荒芜的大地上，再也没有起来。';
  else if (G.food <= 0 && G.hp < 30) reason = '饥饿夺走了你最后的力气。';
  if (!reason) return;

  if ((G.res.totem || 0) > 0) {
    G.res.totem--;
    G.hp = 100;
    G.food = Math.max(G.food, 60);
    G.water = Math.max(G.water, 60);
    G.ill = false;
    G.lightWound = false;
    G.heavyWound = false;
    G.stam = Math.max(G.stam, 60);
    G.stats.totemSave = (G.stats.totemSave || 0) + 1;
    log('🪬 不死图腾在你手中碎裂！金光笼罩全身——你从死亡边缘被拉了回来！', 'good');
    renderAll();
    save();
    return;
  }
  G.dead = true;
  G.deathReason = reason;
  G.stats.days = G.day;
  log(`💀 ${reason}`, 'bad');
  log('点击「菜单 → 重开」开始新的一世。', 'sys');
  renderAll();
  save();
}

/* ------------------------------ 行动 ------------------------------ */

/** 各行动对应的 core 函数 */
/** @type {Record<string, (g: any) => any>} */
const RUNNERS = {
  chop: (g) => doChop(g, {}, name),
  hunt: (g) => doHunt(g, {}, name),
  fish: (g) => doFish(g, {}),
  smelt: (g) => doSmelt(g, {}, name),
  mineOre: (g) => doMineOre(g, {}, name),
  smeltOre: (g) => doSmeltOre(g, name),
  fetch: (g) => doFetch(g, {}, name),
  cook: (g) => doCook(g, {}, name),
  boil: (g) => doBoil(g, {}, name),
  eat: (g) => doEat(g, {}),
  drink: (g) => doDrink(g, {}),
  sleep: (g) => doSleep(g),
  heal: (g) => doHeal(g, {}, name),
};

/** @param {string} kind */
export function doAction(kind) {
  if (!G || G.dead) return;
  const a = ACTIONS[kind];
  if (!a) return;

  if (interruptsAuto(kind)) stopAuto(G, true);

  const chk = checkAction(G, kind);
  if (!chk.ok) {
    if (chk.reason) toast(chk.reason);
    if (chk.stopAuto) stopAuto(G);
    return;
  }

  payActionCost(G, kind, { adrenaline: (G.adrenalineLeft || 0) > 0 });

  if (kind === 'explore') {
    doExplore();
    if (a.time > 0) passTime(a.time);
    renderAll();
    save();
    return;
  }

  const run = RUNNERS[kind];
  const r = run ? run(G) : null;
  if (r && r.refused) {
    toast(r.refused);
    return;
  }
  if (r && r.logs) for (const l of r.logs) log(l.text, l.cls);

  if (a.time > 0) passTime(a.time);
  renderAll();
  save();
}

/* ------------------------------ 自动循环 ------------------------------ */

function startAutoLoop() {
  if (autoTimer) return;
  autoTimer = setInterval(() => {
    if (!G || G.dead) return;
    const r = nextAutoAction(G, { blocked: false });
    if (r.action) doAction(r.action);
    renderActive();
  }, AUTO_MS);
}

/** @param {string} kind */
export function toggleAuto(kind) {
  const running = G.autoAction === kind;
  if (running) {
    stopAuto(G);
    log('⏹ 停止自动行动。', 'sys');
  } else {
    const r = startAuto(G, kind);
    if (!r.ok) { toast('这个行动不能自动进行'); return; }
    for (const l of r.logs) log(l.text, l.cls);
    doAction(kind);
  }
  renderAll();
  save();
}

export function stopAutoLoop() {
  stopAuto(G, true);
  renderAll();
  save();
}


/* ------------------------------ 探索与事件 ------------------------------ */

function doExplore() {
  const r = exploreZone(G, {
    zone: curZone,
    onEvent: () => {
      const roll = rollExploreEvent(G, curZone);
      if (roll.kind === 'combat') {
        const picked = pickMonster(G, { zone: curZone, tierScale: 1 });
        markEncounter(G, picked);
        showCombat(picked.monster);
      } else if (roll.kind === 'boss') {
        showBoss(false);
      } else if (roll.kind === 'pharaoh') {
        showBoss(true);
      } else if (roll.kind === 'event' && roll.event) {
        showEvent(roll.event);
      }
    },
  });
  for (const l of r.logs) log(l.text, l.cls);
}

function hideEvent() {
  const mask = el('evmask');
  mask.classList.remove('show');
  el('evwrap').innerHTML = '';
  pendingEvent = null;
  pendingCombat = null;
  eventOpts = [];
}

/** @param {string} title @param {string} text @param {any[]} opts */
function renderEvent(title, text, opts) {
  eventOpts = opts;
  const items = opts.map((o, i) => {
    const dis = o.disabled ? 'disabled style="opacity:.45;cursor:not-allowed"' : '';
    return `<button class="evbtn" data-idx="${i}" ${dis}>${o.label}<span class="d">${o.d || ''}</span></button>`;
  }).join('');
  el('evwrap').innerHTML = `<h4>⚡ ${title}</h4><div class="evbox"><div class="evt">${text}</div>${items}</div>`;
  el('evmask').classList.add('show');
}

/** @param {any} ev */
function showEvent(ev) {
  pendingEvent = { ...ev };
  G.stats.events++;
  if (ev.id === 'lost') { renderEvent(ev.title, ev.text, lostOpts(G)); save(); return; }
  if (ev.kind === 'merchant') { showMerchant(); save(); return; }
  if (ev.kind === 'dora') { showDoraMenu(); return; }
  renderEvent(ev.title, ev.text, ev.opts);
  save();
}

function showMerchant() {
  const goods = pickMerchantGoods(G, 4);
  /** @type {any[]} */
  const opts = goods.map((g) => ({
    label: g.label,
    d: `${g.blurb}（${canTrade(G, g) ? '可交易' : '材料/金币不足'}）`,
    disabled: !canTrade(G, g),
    _good: g,
  }));
  opts.push({ label: '不换了', d: '挥手告别', effects: [] });
  renderEvent('流浪商人', '一个兜帽人推着破车出现：「换点物资吗？我这有 4 样货，包你满意。」', opts);
}

function showDoraMenu() {
  const d = doraInfo(G);
  el('evwrap').innerHTML = `
    <h4>🤖 猫耳机器人</h4>
    <div class="evbox">
      <div class="evt">好感度：${d.name}（${d.fav}${d.nextNeed > 0 ? ` / 下一级还需 ${d.nextNeed}` : ' / 已满级'}）</div>
      <button class="evbtn" data-dora="gift">🤝 送礼<span class="d">选个礼物提升好感度</span></button>
      <button class="evbtn" data-dora="pocket">🎒 万能口袋<span class="d">按好感度解锁</span></button>
      <button class="evbtn" data-dora="chat">💬 闲聊<span class="d">听它讲蓝胖子前辈的故事（好感 +1）</span></button>
      <button class="evbtn" data-dora="leave">👋 离开<span class="d">下次再来找它</span></button>
    </div>`;
  el('evmask').classList.add('show');
  save();
}

function showDoraGifts() {
  /** @type {any[]} */
  const opts = DORA_GIFTS.map((g, i) => ({
    label: g.label,
    d: `${g.blurb} · 好感 +${g.fav}`,
    disabled: !canGift(G, i),
    _gift: i,
  }));
  opts.push({ label: '⬆ 返回', d: '回到主菜单', _back: true });
  renderEvent('送礼', '选个礼物送给猫耳机器人：', opts);
}

function showDoraPocket() {
  const goods = doraGoods(G);
  /** @type {any[]} */
  const opts = goods.map((g) => {
    const costTxt = [
      g.cost > 0 ? `💰${g.cost}` : '',
      ...Object.keys(g.give || {}).map((k) => `${name(k)}×${g.give[k]}`),
    ].filter(Boolean).join(' + ');
    const getTxt = Object.keys(g.get || {}).map((k) => `${name(k)}×${g.get[k]}`).join('+');
    return {
      label: g.name,
      d: `${g.blurb}${costTxt ? `（${costTxt}${getTxt ? ' → ' + getTxt : ''}）` : ''}`,
      disabled: !canBuyDoraGood(G, g),
      _doraGood: g,
    };
  });
  if (!opts.length) opts.push({ label: '（暂无商品）', d: '好感度不足', disabled: true });
  opts.push({ label: '⬆ 返回', d: '回到主菜单', _back: true });
  renderEvent('万能口袋', doraInfo(G).max ? '它把整个口袋翻给你看！' : '当前好感度可购买的物品：', opts);
}

/** 结算一个事件选项
 * @param {number} i */
function resolveEventIdx(i) {
  const opt = eventOpts[i];
  if (!opt) return;

  // NPC 相关
  if (opt._back) { hideEvent(); showDoraMenu(); return; }
  if (opt._gift !== undefined) {
    hideEvent();
    const r = giftDora(G, opt._gift);
    for (const l of r.logs) log(l.text, l.cls);
    applyAchievements(r.achievements);
    renderAll(); save(); checkDeath();
    return;
  }
  if (opt._doraGood) {
    hideEvent();
    const r = buyDoraGood(G, opt._doraGood);
    if (r.refused) log(r.refused, 'warn');
    for (const l of r.logs) log(l.text, l.cls);
    applyAchievements(r.achievements);
    renderAll(); save(); checkDeath();
    return;
  }
  if (opt._good) {
    hideEvent();
    const r = buyMerchant(G, opt._good);
    if (r.refused) log(r.refused, 'warn');
    for (const l of r.logs) log(l.text, l.cls);
    renderAll(); save(); checkDeath();
    return;
  }

  // 普通事件选项
  const ev = pendingEvent;
  const opts = eventOpts;
  hideEvent();
  const r = resolveOption(G, { ...(ev || {}), opts }, i);
  if (r.refused) log(r.refused, 'warn');
  for (const l of r.logs) log(l.text, l.cls);
  applyAchievements(r.achievements);

  if (r.combat && r.combat.length) {
    const c = r.combat[0] || {};
    const picked = pickMonster(G, { zone: curZone, tierScale: 1, forceBeasts: !!c.forceBeasts });
    markEncounter(G, picked);
    showCombat(picked.monster);
  }
  renderAll(); save(); checkDeath();
}

/* ------------------------------ 战斗弹窗 ------------------------------ */

/** @param {any} monster */
function showCombat(monster) {
  pendingCombat = { monster, boss: false, isPharaoh: false };
  el('evwrap').innerHTML = `
    <h4>⚔️ 遭遇 ${monster.name}！</h4>
    <div class="evbox">
      <div class="evt">${monster.name}盯上了你。（❤️${monster.hp} ⚔️${monster.atk}）</div>
      <button class="evbtn" data-combat="fight">迎战<span class="d">拼一把</span></button>
      <button class="evbtn" data-combat="flee">逃跑<span class="d">消耗精力 · 有风险</span></button>
      ${G.res.food > 0 ? '<button class="evbtn" data-combat="bait">扔食物引开<span class="d">生食 -2</span></button>' : ''}
    </div>`;
  el('evmask').classList.add('show');
}

/** @param {boolean} isPharaoh */
function showBoss(isPharaoh) {
  const st = isPharaoh ? pharaohStats(G) : bossStats(G);
  pendingCombat = { monster: { ...st }, boss: true, isPharaoh };
  el('evwrap').innerHTML = `
    <h4>🐲 ${st.name}</h4>
    <div class="evbox">
      <div class="evt">空气凝滞了——${st.name}挡在面前！（❤️${st.hp} ⚔️${st.atk}）</div>
      <button class="evbtn" data-combat="fight">迎战<span class="d">多回合对拼，直到一方倒下</span></button>
      <button class="evbtn" data-combat="flee">悄悄退走<span class="d">精力 -15 · 80% 脱身</span></button>
    </div>`;
  el('evmask').classList.add('show');
}

/** @param {string} act */
function doCombatAction(act) {
  const c = pendingCombat;
  hideEvent();
  if (!c) return;

  let r = null;
  if (c.boss) {
    if (act === 'fight') r = fightBoss(G, { monster: c.monster, isPharaoh: c.isPharaoh });
    else if (act === 'flee') r = bossFlee(G);
  } else {
    if (act === 'fight') r = fightRound(G, c.monster);
    else if (act === 'flee') r = flee(G, c.monster);
    else if (act === 'bait') r = bait(G, c.monster);
  }
  if (!r) return;
  for (const l of r.logs) log(l.text, l.cls);
  applyAchievements(r.achievements);
  renderAll();
  save();
  checkDeath();
}

/* ------------------------------ 菜单与弹窗 ------------------------------ */

/** 二次确认的回调（自绘确认框，不用 window.confirm：桩环境与 e2e 都能断言） */
/** @type {(() => void) | null} */
let pendingConfirm = null;
/** 图鉴当前分页：'monster' | 'mats' */
let curWikiTab = 'monster';

/** 打开通用弹窗：锁背景滚动，防移动端页面被顶起 */
function openModal() {
  el('modal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

/** 关闭弹窗：顺手收起移动端键盘，避免残留焦点 */
function closeModal() {
  el('modal').classList.remove('show');
  el('evmask').classList.remove('show');
  document.body.style.overflow = '';
  const a = document.activeElement;
  if (a && typeof /** @type {any} */ (a).blur === 'function') /** @type {any} */ (a).blur();
}

/** @param {string} html */
function setModal(html) {
  el('modalcard').innerHTML = html;
  openModal();
}

/**
 * 二次确认框。
 * @param {string} title
 * @param {string} text
 * @param {string} okLabel
 * @param {() => void} onOk
 */
function confirmModal(title, text, okLabel, onOk) {
  pendingConfirm = onOk;
  setModal(`
    <h3>${title}</h3>
    <div class="msub">${text}</div>
    <button class="mbtn danger" data-confirm-ok="1">${okLabel}</button>
    <button class="mbtn" data-close="1">取消</button>`);
}

/** 主菜单 */
function openMenu() {
  const state = G.dead ? '已死亡' : '生存中';
  setModal(`
    <h3>☰ 菜单</h3>
    <div class="msub">末日余烬 v${APP_VERSION} · 第 ${G.day} 天 · ${state}</div>
    <button class="mbtn" data-menu="shop">🏪 黑市商店（💰${G.gold}）</button>
    <button class="mbtn" data-menu="wiki">📖 百科图鉴</button>
    <button class="mbtn" data-menu="export">📤 导出存档</button>
    <button class="mbtn" data-menu="import">📥 导入存档</button>
    <button class="mbtn" data-menu="save">💾 手动保存</button>
    <button class="mbtn" data-menu="newgame">🔄 新游戏</button>
    <button class="mbtn danger" data-menu="clear">🗑 清除本地存档</button>
    <button class="mbtn" data-close="1">关闭</button>`);
}

/** @param {string} act */
function handleMenu(act) {
  if (act === 'shop') return renderShop();
  if (act === 'wiki') return openWiki();
  if (act === 'export') return openExport();
  if (act === 'import') return openImport();
  if (act === 'save') { save(); closeModal(); toast('已保存'); return; }
  if (act === 'newgame') {
    return confirmModal('🔄 新游戏', '当前进度会被覆盖，且不可恢复。', '确定开始新游戏', startNewGame);
  }
  if (act === 'clear') {
    return confirmModal('🗑 清除本地存档', '本地存档会被删除，游戏回到第 1 天。', '确定清除', clearSaveAndRestart);
  }
}

/* ---------------- 黑市商店 ---------------- */

/** 黑市商店：两组商品 + 当前金币。买不起的置灰（与旧版一致，不隐藏） */
function renderShop() {
  const groups = SHOP_GROUPS.map((g) => {
    const rows = g.ids.map(shopRowHtml).join('');
    return `<div class="craft-sep">${g.title}</div>${rows}`;
  }).join('');

  setModal(`
    <h3>🏪 黑市商店</h3>
    <div class="msub">当前金币：<b id="shopGold" style="color:var(--yellow)">💰${G.gold}</b> · 金币购物随时可用</div>
    ${groups}
    <button class="mbtn" data-close="1">关闭</button>`);
}

/** 单件商品按钮：名字 + 价格（买得起黄色，买不起灰色且 disabled）
 * @param {string} id */
function shopRowHtml(id) {
  const it = shopItem(id);
  if (!it) return '';
  const ok = canBuyShop(G, id).ok;
  const dis = ok ? '' : ' disabled style="opacity:.45"';
  return `<button class="mbtn" id="shopBtn_${id}" data-shop="${id}"${dis}>`
    + '<span style="display:flex;justify-content:space-between;align-items:center">'
    + `<span>${it.name}</span>`
    + `<span class="shop-price" style="color:${ok ? 'var(--yellow)' : 'var(--txt-faint)'}">${it.cost} 💰</span>`
    + '</span></button>';
}

/** 买完后原地刷新金币与全部按钮态：不重建弹窗，保住滚动位置（旧版行为） */
function refreshShop() {
  const gold = el('shopGold');
  if (gold) gold.textContent = '💰' + G.gold;
  for (const id of Object.keys(SHOP)) {
    const b = /** @type {HTMLButtonElement|null} */ (document.getElementById('shopBtn_' + id));
    if (!b) continue;
    const ok = canBuyShop(G, id).ok;
    b.disabled = !ok;
    b.style.opacity = ok ? '' : '.45';
    const price = /** @type {HTMLElement|null} */ (b.querySelector('.shop-price'));
    if (price) price.style.color = ok ? 'var(--yellow)' : 'var(--txt-faint)';
  }
}

/** 买一件
 * @param {string} id */
function buyShop(id) {
  const r = buyShopItem(G, id);
  if (r.refused) { toast(r.refused); return; }

  for (const l of r.logs) log(l.text, l.cls);
  renderAll();
  save();
  refreshShop();
  if (!canBuyAnyShop(G)) toast('金币已不足以再购买');
}

/* ---------------- 百科图鉴 ---------------- */

function openWiki() {
  renderWiki();
}

function renderWiki() {
  const isMonster = curWikiTab === 'monster';
  const entries = isMonster ? monsterEntries(G) : materialEntries();
  const prog = wikiProgress(G);
  const sub = isMonster
    ? `已解锁 ${prog.unlocked}/${prog.total} · 遭遇过才会显示数值`
    : `${entries.length - 1} 种资源 + 附魔系统 · 全部可见`;

  const on = 'flex:1;background:rgba(255,200,80,.18);border-color:var(--accent);color:var(--yellow)';
  const off = 'flex:1';
  const rows = entries.map((e) => wikiRowHtml(e, !isMonster)).join('');

  setModal(`
    <h3>📖 百科图鉴</h3>
    <div class="msub">${sub}</div>
    <div style="display:flex;gap:6px;margin:10px 0">
      <button class="mbtn" style="${isMonster ? on : off}" data-wiki-tab="monster">👹 怪物图鉴</button>
      <button class="mbtn" style="${isMonster ? off : on}" data-wiki-tab="mats">📦 材料百科</button>
    </div>
    <div style="max-height:46vh;overflow-y:auto">${rows}</div>
    <button class="mbtn" data-close="1">关闭</button>`);
}

/**
 * 图鉴单行。未解锁时只露名字，数值全部打码。
 * @param {{id: string, head: string, tag?: string, lines: string[], seen?: boolean}} e
 * @param {boolean} forceOpen 材料百科不参与解锁，直接展示
 */
function wikiRowHtml(e, forceOpen) {
  const seen = forceOpen || !!e.seen;
  const body = seen
    ? e.lines.map((l) => `<div class="wiki-line">${l}</div>`).join('')
    : '<div class="wiki-line">❤️ ？？？ · ⚔️ ？？？</div>'
      + '<div class="wiki-line">🎁 ？？？</div>'
      + '<div class="wiki-line faint">🤫 属性未知 · 遭遇后解锁</div>';
  const tag = e.tag ? ` <span class="wiki-tag">${e.tag}</span>` : '';
  const lock = seen ? '' : ' <span class="wiki-tag">🔒 未遭遇</span>';
  return `<div class="wiki-row${seen ? ' done' : ''}">
    <div class="wiki-head">${e.head}${tag}${lock}</div>
    ${body}
  </div>`;
}

/* ---------------- 导出 / 导入 ---------------- */

/** @param {any} s */
function escapeHtml(s) {
  /** @type {Record<string, string>} */
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(s).replace(/[&<>"']/g, (c) => map[c] || c);
}

function openExport() {
  const code = serialize(G, APP_VERSION);
  setModal(`
    <h3>📤 导出存档</h3>
    <div class="msub">下面整段文本就是存档：复制保存，换设备时粘进「导入存档」即可</div>
    <textarea id="exportArea" readonly>${escapeHtml(code)}</textarea>
    <button class="mbtn primary" data-export-copy="1">📋 复制到剪贴板</button>
    <button class="mbtn" data-export-download="1">⬇️ 下载为 .txt 文件</button>
    <button class="mbtn" data-close="1">关闭</button>`);
}

function copyExport() {
  const ta = /** @type {HTMLTextAreaElement|null} */ (el('exportArea'));
  if (!ta) return;
  ta.select();
  const done = () => toast('已复制，请妥善保存');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ta.value).then(done, () => fallbackCopy(done));
  } else fallbackCopy(done);
}

/** @param {() => void} done */
function fallbackCopy(done) {
  try { document.execCommand('copy'); done(); } catch { toast('复制失败，请手动长按复制'); }
}

function downloadExport() {
  const code = serialize(G, APP_VERSION);
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ember_save_${G.day}d.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast('已下载存档文件');
}

function openImport() {
  setModal(`
    <h3>📥 导入存档</h3>
    <div class="msub">粘贴存档文本（兼容 EMBER / EMBER1 标识）· 会覆盖当前进度</div>
    <textarea id="importArea" placeholder="粘贴存档代码…"></textarea>
    <button class="mbtn primary" data-import-do="1">导入并覆盖当前进度</button>
    <button class="mbtn" data-close="1">取消</button>`);
}

/**
 * 从任意文本里抠出存档 JSON（容忍前后夹带说明文字）。
 * @param {string} text
 * @returns {any|null} 规范化后的状态，失败返回 null
 */
function parseImportText(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return parseSavePayload(JSON.parse(t.slice(start, end + 1)));
  } catch {
    return null;
  }
}

function doImport() {
  const ta = /** @type {HTMLTextAreaElement|null} */ (el('importArea'));
  const parsed = parseImportText(ta ? ta.value : '');
  if (!parsed) { toast('导入失败：存档代码无效'); return; }

  G = parsed;
  logBuffer.length = 0;
  try { localStorage.setItem(SAVE_KEY, serialize(G, APP_VERSION)); } catch { /* 配额满则忽略 */ }
  closeModal();
  log('📥 存档导入成功！', 'good');
  renderAll();
  save();
  toast('导入成功');
}

/* ---------------- 存档操作 ---------------- */

function startNewGame() {
  G = createNewState();
  logBuffer.length = 0;
  log(`末日余烬 v${APP_VERSION} · 新的一世`, 'info');
  log('点击下方按钮开始行动；可以长按「自动」类行动进入放置模式。', 'sys');
  closeModal();
  renderAll();
  save();
  toast('新游戏开始');
}

function clearSaveAndRestart() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* 忽略 */ }
  startNewGame();
  log('🗑 本地存档已清除。', 'sys');
}

/* ------------------------------ 启动 ------------------------------ */

/**
 * 把运行时错误显示到日志区：迁移期没有调试台时，截图就能定位问题。
 * 只做展示，不吞异常（仍然抛回控制台）。
 */
function installErrorHooks() {
  window.addEventListener('error', (e) => {
    log(`💥 脚本错误：${e.message}（${e.filename || '?'}:${e.lineno || 0}）`, 'bad');
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    log(`💥 未处理的异常：${(r && r.message) || r}`, 'bad');
  });
}

export function boot() {
  installErrorHooks();
  G = loadSave() || createNewState();

  logBuffer.length = 0;
  log(`末日余烬 v${APP_VERSION} · 文字生存冒险`, 'info');
  log('点击下方按钮开始行动；可以长按「自动」类行动进入放置模式。', 'sys');

  el('actions')?.addEventListener('click', (e) => {
    const sellBtn = /** @type {HTMLButtonElement|null} */ (closestEl(e.target, '[data-sell]'));
    if (sellBtn && !sellBtn.disabled) { sellRes(String(sellBtn.dataset.sell)); return; }

    const craftBtn = closestEl(e.target, '[data-craft]');
    if (craftBtn) { craftItem(String(craftBtn.dataset.craft)); return; }

    const cnavBtn = closestEl(e.target, '[data-cnav]');
    if (cnavBtn) { scrollCraftTo(String(cnavBtn.dataset.cnav)); return; }

    const armorBtn = closestEl(e.target, '[data-armor]');
    if (armorBtn) {
      const [slot, mat] = String(armorBtn.dataset.armor).split(':');
      finishCraftOp(craftArmor(G, slot, mat));
      return;
    }

    const upBtn = closestEl(e.target, '[data-upgrade]');
    if (upBtn) { finishCraftOp(upgradeItem(G, String(upBtn.dataset.upgrade))); return; }

    const enchBtn = closestEl(e.target, '[data-enchant]');
    if (enchBtn) { finishCraftOp(enchantItem(G, String(enchBtn.dataset.enchant))); return; }

    const enchTblBtn = closestEl(e.target, '[data-enchtbl]');
    if (enchTblBtn) { finishCraftOp(upgradeEnchantTbl(G)); return; }

    const bagBtn = closestEl(e.target, '[data-bag-act]');
    if (bagBtn) {
      if (bagBtn.dataset.bagAct === 'eat') doAction('eat');
      else if (bagBtn.dataset.bagAct === 'drink') doAction('drink');
      return;
    }

    const btn = closestEl(e.target, '.actbtn');
    if (!btn) return;
    const kind = btn.dataset.kind;
    if (!kind) return;
    if (ACTIONS[kind] && ACTIONS[kind].auto) toggleAuto(kind);
    else doAction(kind);
  });

  el('tabs')?.addEventListener('click', (e) => {
    const tab = closestEl(e.target, '.tab');
    if (!tab || !tab.dataset.tab) return;
    curTab = tab.dataset.tab;
    for (const b of document.querySelectorAll('#tabs .tab')) b.classList.toggle('on', b === tab);
    renderAll();
  });

  el('zonebar')?.addEventListener('click', (e) => {
    const btn = closestEl(e.target, '.zonebtn');
    if (!btn) return;
    if (btn.dataset.locked) { toast('🔒 ' + btn.dataset.locked); return; }
    if (btn.dataset.zone) {
      curZone = btn.dataset.zone;
      log(`📍 前往${ZONES[curZone].name}。`, 'sys');
      renderAll();
    }
  });

  el('evwrap')?.addEventListener('click', (e) => {
    const combatBtn = closestEl(e.target, '[data-combat]');
    if (combatBtn) { doCombatAction(String(combatBtn.dataset.combat)); return; }

    const doraBtn = closestEl(e.target, '[data-dora]');
    if (doraBtn) {
      const act = doraBtn.dataset.dora;
      if (act === 'gift') showDoraGifts();
      else if (act === 'pocket') showDoraPocket();
      else if (act === 'chat') {
        hideEvent();
        const r = addDoraFav(G, 1);
        for (const l of r.logs) log(l.text, l.cls);
        log('🤖 「前辈的百宝袋……我可差远了。」', 'info');
        applyAchievements(r.achievements);
        renderAll(); save();
      } else hideEvent();
      return;
    }

    const optBtn = closestEl(e.target, '[data-idx]');
    if (optBtn) resolveEventIdx(Number(optBtn.dataset.idx));
  });

  el('activeStop')?.addEventListener('click', stopAutoLoop);
  el('btnMenu')?.addEventListener('click', openMenu);

  el('modal')?.addEventListener('click', (e) => {
    const closeBtn = closestEl(e.target, '[data-close]');
    if (closeBtn) { closeModal(); return; }

    const okBtn = closestEl(e.target, '[data-confirm-ok]');
    if (okBtn) {
      const fn = pendingConfirm;
      pendingConfirm = null;
      closeModal();
      if (fn) fn();
      return;
    }

    const menuBtn = closestEl(e.target, '[data-menu]');
    if (menuBtn) { handleMenu(String(menuBtn.dataset.menu)); return; }

    const shopBtn = closestEl(e.target, '[data-shop]');
    if (shopBtn) {
      if (!/** @type {HTMLButtonElement} */ (shopBtn).disabled) buyShop(String(shopBtn.dataset.shop));
      return;
    }

    const wtab = closestEl(e.target, '[data-wiki-tab]');
    if (wtab) { curWikiTab = String(wtab.dataset.wikiTab); renderWiki(); return; }

    if (closestEl(e.target, '[data-export-copy]')) { copyExport(); return; }
    if (closestEl(e.target, '[data-export-download]')) { downloadExport(); return; }
    if (closestEl(e.target, '[data-import-do]')) { doImport(); return; }
  });

  renderAll();
  startAutoLoop();
  save();
}
