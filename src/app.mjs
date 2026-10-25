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
import { resNames, RESOURCES, resPrices } from './core/data/resources.mjs';
import { RECIPES } from './core/data/recipes.mjs';
import { SKILL_NAMES } from './core/data/skills.mjs';
import { doCraft, recipeVisible, hasRes } from './core/craft.mjs';
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
import { checkMilestone, checkStageAchieve } from './core/achievements.mjs';
import { pickMerchantGoods, canTrade, buyMerchant, doraInfo, doraGoods, DORA_GIFTS, canGift, giftDora, canBuyDoraGood, buyDoraGood, addDoraFav } from './core/npc.mjs';
import { markEncounter, wikiProgress } from './core/wiki.mjs';

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
let curZone = 'forest';
let curTab = 'act';
/** @type {any} */
let pendingEvent = null;
/** @type {any[]} */
let eventOpts = [];
/** @type {any} */
let pendingCombat = null;

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

/** 成就 id → 日志（'stage' 是"阶段成就检查"的标记，不是成就 id） */
function applyAchievements(list) {
  for (const a of list || []) {
    if (a === 'stage') {
      for (const l of checkStageAchieve(G).logs) log(l.text, l.cls);
    } else if (a === 'armorSet') {
      // 套装检查在 core/craft 里由 UI 触发
      continue;
    } else {
      for (const l of checkMilestone(G, a).logs) log(l.text, l.cls);
    }
  }
}

/** 制作面板：22 配方按阶分组 */
function renderCraft() {
  const box = el('actions');
  if (!box) return;
  box.classList.add('craft-mode');

  const tiers = {};
  for (const id in RECIPES) {
    const r = RECIPES[id];
    if (!recipeVisible(G, id)) continue;
    (tiers[r.tier] = tiers[r.tier] || []).push([id, r]);
  }

  const parts = [];
  for (const t of Object.keys(tiers).sort()) {
    parts.push(`<div class="craft-tier">第 ${t} 阶</div>`);
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
        body = '<div class="mat">' + Object.keys(r.cost).map((k) => {
          const have = G.res[k] || 0;
          const need = r.cost[k];
          return `<span style="color:${have >= need ? 'var(--txt-dim)' : 'var(--bad)'}">${name(k)} ${have}/${need}</span>`;
        }).join(' · ') + '</div>';
      }

      parts.push(`<div class="craft-item">
        <div class="name">${r.name}<span class="desc">${r.desc}</span></div>
        ${body}
        ${can ? `<button class="make" data-craft="${id}">制作（${r.time} 小时）</button>` : ''}
      </div>`);
    }
  }
  box.innerHTML = parts.join('');
}

/** 制作一件 */
function craftItem(id) {
  const r = doCraft(G, id);
  if (r.refused) return toast(r.refused);
  for (const l of r.logs) log(l.text, l.cls);
  applyAchievements(r.achievements);
  if (r.time) passTime(r.time);
  renderAll();
  save();
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

/** 卖 1 个资源 */
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

function renderEvent(title, text, opts) {
  eventOpts = opts;
  const items = opts.map((o, i) => {
    const dis = o.disabled ? 'disabled style="opacity:.45;cursor:not-allowed"' : '';
    return `<button class="evbtn" data-idx="${i}" ${dis}>${o.label}<span class="d">${o.d || ''}</span></button>`;
  }).join('');
  el('evwrap').innerHTML = `<h4>⚡ ${title}</h4><div class="evbox"><div class="evt">${text}</div>${items}</div>`;
  el('evmask').classList.add('show');
}

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

/** 结算一个事件选项 */
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
    const target = /** @type {HTMLElement} */ (e.target);

    const sellBtn = target.closest('[data-sell]');
    if (sellBtn && !sellBtn.disabled) { sellRes(sellBtn.dataset.sell); return; }

    const craftBtn = target.closest('[data-craft]');
    if (craftBtn) { craftItem(craftBtn.dataset.craft); return; }

    const bagBtn = target.closest('[data-bag-act]');
    if (bagBtn) {
      if (bagBtn.dataset.bagAct === 'eat') doAction('eat');
      else if (bagBtn.dataset.bagAct === 'drink') doAction('drink');
      return;
    }

    const btn = target.closest('.actbtn');
    if (!btn) return;
    const kind = btn.dataset.kind;
    if (!kind) return;
    if (ACTIONS[kind] && ACTIONS[kind].auto) toggleAuto(kind);
    else doAction(kind);
  });

  el('tabs')?.addEventListener('click', (e) => {
    const tab = /** @type {HTMLElement} */ (e.target).closest('.tab');
    if (!tab || !tab.dataset.tab) return;
    curTab = tab.dataset.tab;
    for (const b of document.querySelectorAll('#tabs .tab')) b.classList.toggle('on', b === tab);
    renderAll();
  });

  el('zonebar')?.addEventListener('click', (e) => {
    const btn = /** @type {HTMLElement} */ (e.target).closest('.zonebtn');
    if (!btn) return;
    if (btn.dataset.locked) { toast('🔒 ' + btn.dataset.locked); return; }
    if (btn.dataset.zone) {
      curZone = btn.dataset.zone;
      log(`📍 前往${ZONES[curZone].name}。`, 'sys');
      renderAll();
    }
  });

  el('evwrap')?.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    const combatBtn = target.closest('[data-combat]');
    if (combatBtn) { doCombatAction(combatBtn.dataset.combat); return; }

    const doraBtn = target.closest('[data-dora]');
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

    const optBtn = target.closest('[data-idx]');
    if (optBtn) resolveEventIdx(Number(optBtn.dataset.idx));
  });

  el('activeStop')?.addEventListener('click', stopAutoLoop);
  el('btnMenu')?.addEventListener('click', () => {
    toast(G.dead ? '你已死亡，重新加载页面开始新的一世' : '菜单功能开发中');
  });

  renderAll();
  startAutoLoop();
  save();
}
