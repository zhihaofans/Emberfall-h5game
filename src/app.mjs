// 应用层：把 core 的逻辑接到 DOM 上（P2 第一步：最小可玩闭环）
//
// 分工：
//   core/**  纯逻辑，不碰 DOM
//   app.mjs  状态容器 + 渲染 + 事件（本文件）
//
// 已经接上的 core：存档、时间/生存、13 个行动（含自动循环）、资源显示。
// 还没接：制作面板、背包、事件弹窗、图鉴、PWA（后续按 P2 逐块补）。

import { createNewState, parseSavePayload, serialize } from './core/save.mjs';
import { ACTIONS } from './core/data/actions.mjs';
import { SEASONS, WEATHERS, seasonOf, rollWeather, dailyConsume, advanceHour, applyPassive } from './core/time.mjs';
import { resNames } from './core/data/resources.mjs';
import {
  checkAction, payActionCost, interruptsAuto,
  startAuto, stopAuto, nextAutoAction,
  doChop, doHunt, doFish, doSmelt, doMineOre, doSmeltOre,
  doFetch, doCook, doBoil, doEat, doDrink, doSleep, doHeal,
} from './core/actions.mjs';

// 版本号由构建注入（唯一源：仓库根 version.json）
const APP_VERSION = __APP_VERSION__;

const SAVE_KEY = 'ember_save_v1';
const NAMES = resNames();
const AUTO_MS = 1600;

/** @type {any} */
let G = null;
/** @type {{text: string, cls: string}[]} */
const logBuffer = [];
let autoTimer = null;

const el = (id) => document.getElementById(id);
const name = (k) => NAMES[k] || k;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

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

export function log(text, cls = 'sys') {
  logBuffer.push({ text, cls });
  if (logBuffer.length > 300) logBuffer.shift();
  renderLog();
}

function toast(msg) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 1600);
}

function renderLog() {
  const w = el('logwrap');
  if (!w) return;
  w.innerHTML = logBuffer.map((l) => `<div class="logline ${l.cls}">${l.text}</div>`).join('');
  w.scrollTop = w.scrollHeight;
}

/* ------------------------------ 渲染 ------------------------------ */

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
  renderActions();
  renderActive();
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

export function doAction(kind) {
  if (!G || G.dead) return;
  const a = ACTIONS[kind];
  if (!a) return;

  if (interruptsAuto(kind)) stopAuto(true);

  const chk = checkAction(G, kind);
  if (!chk.ok) {
    if (chk.reason) toast(chk.reason);
    if (chk.stopAuto) stopAuto();
    return;
  }

  payActionCost(G, kind, { adrenaline: (G.adrenalineLeft || 0) > 0 });

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

/* ------------------------------ 启动 ------------------------------ */

export function boot() {
  G = loadSave() || createNewState();

  logBuffer.length = 0;
  log(`末日余烬 v${APP_VERSION} · 文字生存冒险`, 'info');
  log('点击下方按钮开始行动；可以长按「自动」类行动进入放置模式。', 'sys');

  el('actions')?.addEventListener('click', (e) => {
    const btn = /** @type {HTMLElement} */ (e.target).closest('.actbtn');
    if (!btn) return;
    const kind = btn.dataset.kind;
    if (!kind) return;
    if (ACTIONS[kind] && ACTIONS[kind].auto) toggleAuto(kind);
    else doAction(kind);
  });

  el('activeStop')?.addEventListener('click', stopAutoLoop);
  el('btnMenu')?.addEventListener('click', () => {
    toast(G.dead ? '你已死亡，重新加载页面开始新的一世' : '菜单功能开发中');
  });

  renderAll();
  startAutoLoop();
  save();
}
