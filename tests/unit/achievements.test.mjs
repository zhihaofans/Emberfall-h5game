// 成就系统对拍 + 一致性校验
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { MS, DAY_REWARDS, DAY_MILESTONES, WHITELIST } from '../../src/core/data/achievements.mjs';
import { ZONES } from '../../src/core/data/zones.mjs';
import { ARMOR_MATS, ARMOR_SLOTS } from '../../src/core/data/armor.mjs';
import { resNames } from '../../src/core/data/resources.mjs';
import { checkMilestone, checkZoneAchieve, checkStageAchieve, checkFishAchieve, checkArmorSet } from '../../src/core/achievements.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'legacy/survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

function sliceBetween(from, to) {
  const a = html.indexOf(from);
  const b = html.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`切片失败: ${from} → ${to}`);
  return html.slice(a, b);
}

function extractFn(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`找不到 ${name}`);
  const nextFn = html.indexOf('\nfunction ', start + 1);
  const nextComment = html.indexOf('\n/*', start + 1);
  const end = Math.min(...[nextFn, nextComment].filter((i) => i > 0));
  return html.slice(start, end);
}

function buildOld() {
  const env = {
    ZONES, ARMOR_MATS, ARMOR_SLOTS, RES_NAMES: resNames(),
    __logs: [],
  };
  vm.createContext(env);
  vm.runInContext(`
    function log(m,c){ __logs.push({text:m, cls:c||'sys'}) }
    function addRes(k,n){ if(!(k in G.res)) G.res[k]=0; G.res[k]+=n; if(n>0&&G.stats){ if(!G.stats.ownedRes) G.stats.ownedRes={}; G.stats.ownedRes[k]=1 } }
    function skillLvl(k){ return (G.skills[k] && G.skills[k].lvl) || 1 }
    function armorSlotMat(slot){ const k='armor'+slot[0].toUpperCase()+slot.slice(1); return G.items[k]||'none' }
    ${sliceBetween('const MS = {', 'function checkMilestone')}
    ${sliceBetween('function checkMilestone(key){', '/* ---------------- 死亡 ----------------')}
    ${extractFn('checkArmorSet')}
    globalThis.__api = { checkMilestone, checkZoneAchieve, checkStageAchieve, checkFishAchieve, checkArmorSet };
  `, env);
  return env;
}
const env = buildOld();

function oldRun(fn, state, ...args) {
  env.G = state;
  env.__logs.length = 0;
  env.__api[fn](...args);
  return { logs: JSON.parse(JSON.stringify(env.__logs)), state: JSON.parse(JSON.stringify(env.G)) };
}

test('数据：MS / 天数奖励 / 白名单与旧文件一致', () => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(
    sliceBetween('const MS = {', 'function checkMilestone').replace(/const (MS|DAY_MILESTONES|DAY_REWARDS)/g, 'globalThis.$1'),
    ctx,
  );
  assert.deepEqual(MS, JSON.parse(JSON.stringify(ctx.MS)));
  assert.deepEqual(DAY_REWARDS, JSON.parse(JSON.stringify(ctx.DAY_REWARDS)));
  assert.deepEqual(DAY_MILESTONES, JSON.parse(JSON.stringify(ctx.DAY_MILESTONES)));

  const cmBody = sliceBetween('function checkMilestone(key){', '/* 通用阶段成就检查');
  const list = [.../if\(\[([\s\S]*?)\]\.includes\(key\)\)/.exec(cmBody)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(WHITELIST, list);
});

test('一致性：MS 的字符串键与白名单双向一致（漏登记直接红）', () => {
  const msKeys = Object.keys(MS).filter((k) => !/^\d+$/.test(k)).sort();
  const wl = [...WHITELIST].sort();
  assert.deepEqual(wl, msKeys, '白名单与 MS 文案必须一一对应');
  assert.equal(new Set(WHITELIST).size, WHITELIST.length, '白名单不应有重复');
});

test('天数里程碑：3 / 7 / 15 / 30 只记日志，60 / 100 / 180 发奖励 —— 与旧实现一致', () => {
  for (const day of [1, 3, 7, 15, 30, 31, 60, 100, 180, 300]) {
    const base = createNewState(NOW);
    base.day = day;
    base.gold = 0;
    for (const k of Object.keys(base.res)) base.res[k] = 0;

    const fresh = JSON.parse(JSON.stringify(base));
    const old = oldRun('checkMilestone', base, day);
    const r = checkMilestone(fresh, day);

    assert.deepEqual(r.logs, old.logs, `day=${day}：日志不一致`);
    assert.deepEqual(fresh, old.state, `day=${day}：状态不一致`);
  }
});

test('天数里程碑：一天只结算一次（重复调用无输出）', () => {
  const s = createNewState(NOW);
  s.day = 100;
  s.gold = 0;
  const first = checkMilestone(s, 100);
  assert.ok(first.logs.length > 0);
  const goldAfter = s.gold;

  const second = checkMilestone(s, 100);
  assert.deepEqual(second.logs, []);
  assert.equal(s.gold, goldAfter);
});

test('白名单成就：触发一次后不再重复；未登记的 key 不触发', () => {
  const s = createNewState(NOW);
  const first = checkMilestone(s, 'craft1');
  assert.equal(first.logs.length, 1);
  assert.equal(s.milestones.craft1, 1);

  const again = checkMilestone(s, 'craft1');
  assert.deepEqual(again.logs, []);

  const unknown = checkMilestone(s, 'notInWhitelist');
  assert.deepEqual(unknown.logs, []);
  assert.equal(s.milestones.notInWhitelist, undefined);
});

test('白名单成就：逐个与旧实现一致', () => {
  for (const key of WHITELIST) {
    const base = createNewState(NOW);
    const fresh = JSON.parse(JSON.stringify(base));
    const old = oldRun('checkMilestone', base, key);
    const r = checkMilestone(fresh, key);
    assert.deepEqual(r.logs, old.logs, `${key}：日志不一致`);
    assert.deepEqual(fresh.milestones, old.state.milestones, `${key}：标记不一致`);
  }
});

test('区域探索成就：1/10/50 三档，与旧实现一致', () => {
  for (const cnt of [0, 1, 9, 10, 49, 50]) {
    const base = createNewState(NOW);
    base.stats.zoneCnt = { forest: cnt, pyramid: cnt };
    const fresh = JSON.parse(JSON.stringify(base));

    const old = oldRun('checkZoneAchieve', base);
    const r = checkZoneAchieve(fresh);

    assert.deepEqual(r.logs, old.logs, `cnt=${cnt}：日志不一致`);
    assert.deepEqual(fresh.milestones, old.state.milestones, `cnt=${cnt}：标记不一致`);
  }
});

test('阶段成就：击杀/制作/探索/烹饪/强化次数与旧实现一致', () => {
  const cases = [
    { kills: 10 }, { kills: 50 }, { craft: 10 }, { explore: 10 }, { explore: 50 },
    { cook: 10 }, { upgrades: { weapon: 3, axe: 2 } }, { upgrades: { weapon: 5, axe: 5 } },
  ];
  for (const c of cases) {
    const base = createNewState(NOW);
    Object.assign(base.stats, { kills: c.kills ?? 0, craft: c.craft ?? 0, explore: c.explore ?? 0, cook: c.cook ?? 0 });
    if (c.upgrades) Object.assign(base.upgrades, c.upgrades);
    const fresh = JSON.parse(JSON.stringify(base));

    const old = oldRun('checkStageAchieve', base);
    const r = checkStageAchieve(fresh);

    assert.deepEqual(r.logs, old.logs, `${JSON.stringify(c)}：日志不一致`);
    assert.deepEqual(fresh.milestones, old.state.milestones, `${JSON.stringify(c)}：标记不一致`);
  }
});

test('钓鱼成就：事件型与累计型都与旧实现一致', () => {
  for (const kind of [undefined, 'treasure', 'rune', 'blueprint', 'big']) {
    for (const fish of [0, 1, 10, 50, 100]) {
      const base = createNewState(NOW);
      base.stats.fish = fish;
      base.skills.fish.lvl = 25;
      const fresh = JSON.parse(JSON.stringify(base));

      const old = oldRun('checkFishAchieve', base, kind);
      const r = checkFishAchieve(fresh, kind);

      assert.deepEqual(r.logs, old.logs, `${kind}/fish=${fish}：日志不一致`);
      assert.deepEqual(fresh.milestones, old.state.milestones, `${kind}/fish=${fish}：标记不一致`);
    }
  }
});

test('套装成就：全身同材质触发，集齐 6 套触发收藏家', () => {
  for (const mat of ARMOR_MATS) {
    const base = createNewState(NOW);
    for (const slot of Object.keys(ARMOR_SLOTS)) {
      base.items['armor' + slot[0].toUpperCase() + slot.slice(1)] = mat;
    }
    const fresh = JSON.parse(JSON.stringify(base));

    const old = oldRun('checkArmorSet', base);
    const r = checkArmorSet(fresh);

    assert.deepEqual(r.logs, old.logs, `${mat}：日志不一致`);
    assert.deepEqual(fresh.milestones, old.state.milestones, `${mat}：标记不一致`);
    assert.deepEqual(fresh.stats.setsWorn, old.state.stats.setsWorn, `${mat}：套装记录不一致`);
  }
});
