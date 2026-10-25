// 制作 / 强化 / 装备 / 附魔 对拍：新实现 vs survival.html 的旧函数
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { RECIPES } from '../../src/core/data/recipes.mjs';
import { UPGRADES } from '../../src/core/data/upgrades.mjs';
import { SKILL_NAMES } from '../../src/core/data/skills.mjs';
import { resNames } from '../../src/core/data/resources.mjs';
import {
  ARMOR_MATS, ARMOR_MAT_INFO, ARMOR_SLOTS, ENCHANT_TBL_MAX,
  ENCHANTS, enchantCost, enchantTblCost, armorSlotKey,
} from '../../src/core/data/armor.mjs';
import {
  doCraft, upgradeItem, craftArmor, armorDmgMult, recipeVisible,
  enchantItem, upgradeEnchantTbl, hasRes, nextArmorMat, armorMatVisible,
} from '../../src/core/craft.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

/** 从源码里截出某个函数（切到下一个 function 或注释块） */
function extractFn(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`找不到 ${name}`);
  const nextFn = html.indexOf('\nfunction ', start + 1);
  const nextComment = html.indexOf('\n/*', start + 1);
  const candidates = [nextFn, nextComment].filter((i) => i > 0);
  const end = Math.min(...candidates);
  return html.slice(start, end);
}

function buildOld() {
  const env = {
    RECIPES, UPGRADES, ARMOR_MATS, ARMOR_MAT_INFO, ARMOR_SLOTS,
    ENCHANT_TBL_MAX, ENCHANTS, RES_NAMES: resNames(), SKILL_NAMES,
    __logs: [], __toasts: [], __ach: [], __time: [],
  };
  vm.createContext(env);
  const code = [
    'function log(m,c){ __logs.push({text:m, cls:c||"sys"}) }',
    'function toast(m){ __toasts.push(m) }',
    'function checkMilestone(id){ __ach.push(id) }',
    'function checkStageAchieve(){ __ach.push("stage") }',
    'function checkArmorSet(){ __ach.push("armorSet") }',
    'function passTime(h){ __time.push(h) }',
    'function renderAll(){}',
    'function save(){}',
    'function skillLvl(s){ return (G.skills && G.skills[s] && G.skills[s].lvl) || 1 }',
    'function spend(k,n){ if((G.res[k]||0)>=n){ G.res[k]-=n; return true } return false }',
    'function hasRes(cost){ for(const k in cost){ if((G.res[k]||0)<cost[k]) return false } return true }',
    'function armorSlotKey(slot){ return "armor"+slot[0].toUpperCase()+slot.slice(1) }',
    'function armorSlotMat(slot){ const k=armorSlotKey(slot); return G.items[k]||"none" }',
    extractFn('upgradeItem'),
    extractFn('craftArmor'),
    extractFn('armorDmgMult'),
    extractFn('doCraft'),
    extractFn('enchantCost'),
    extractFn('enchantTblCost'),
    extractFn('enchantItem'),
    extractFn('upgradeEnchantTbl'),
    'globalThis.__api = { doCraft, upgradeItem, craftArmor, armorDmgMult, enchantItem, upgradeEnchantTbl }',
  ].join('\n');
  vm.runInContext(code, env);
  // 旧文件里的 enchantCost / upgradeCost 依赖这些全局，vm 内已定义
  vm.runInContext('function upgradeCost(key, lv){ const u=UPGRADES[key]; if(!u) return {}; const c={}; for(const k in u.base) c[k]=Math.round(u.base[k]*(lv+1)); if(lv>=10){ c.rune=lv-9; c.alloy=Math.round((lv-9)*1.5) } return c }', env);
  return env;
}
const env = buildOld();

function oldRun(fn, state, ...args) {
  env.G = state;
  env.__logs.length = 0;
  env.__toasts.length = 0;
  env.__ach.length = 0;
  env.__time.length = 0;
  env.__api[fn](...args);
  return {
    logs: JSON.parse(JSON.stringify(env.__logs)),
    toasts: JSON.parse(JSON.stringify(env.__toasts)),
    ach: [...env.__ach],
    time: [...env.__time],
    state: JSON.parse(JSON.stringify(env.G)),
  };
}

/** 富状态：能制作大部分东西 */
function richState() {
  const s = createNewState(NOW);
  for (const k of Object.keys(s.res)) s.res[k] = 999;
  for (const k of Object.keys(s.items)) if (typeof s.items[k] === 'boolean') s.items[k] = false;
  for (const k of Object.keys(RECIPES)) s.items[k] = false;
  return s;
}

test('制作：22 个配方逐一对拍（可制作 / 已制作 / 材料不足）', () => {
  for (const id of Object.keys(RECIPES)) {
    const old = oldRun('doCraft', richState(), id);
    const fresh = richState();
    const r = doCraft(fresh, id);

    assert.deepEqual(r.logs, old.logs, `${id}：日志不一致`);
    assert.deepEqual(r.achievements ?? [], old.ach, `${id}：成就标记不一致`);
    assert.equal(r.time, old.time[0], `${id}：推进时间不一致`);
    assert.deepEqual(fresh, old.state, `${id}：状态不一致`);

    // 已制作
    const old2 = oldRun('doCraft', old.state, id);
    const r2 = doCraft(fresh, id);
    assert.equal(r2.refused, old2.toasts[0], `${id}：重复制作的提示不一致`);

    // 材料不足
    const poor = richState();
    for (const k of Object.keys(poor.res)) poor.res[k] = 0;
    const old3 = oldRun('doCraft', poor, id);
    const r3 = doCraft(JSON.parse(JSON.stringify(poor)), id);
    if (old3.toasts.length) assert.equal(r3.refused, old3.toasts[0], `${id}：材料不足提示不一致`);
  }
});

test('制作：前置与等级门槛的提示一致', () => {
  const s = richState();
  s.skills.chop.lvl = 1;
  const old = oldRun('doCraft', s, 'axe');           // 需要砍伐 Lv.3
  const r = doCraft(JSON.parse(JSON.stringify(s)), 'axe');
  assert.equal(r.refused, old.toasts[0]);

  const s2 = richState();
  s2.items.steel = false;
  const old2 = oldRun('doCraft', s2, 'huntKing');    // 需要先有钢刀
  const r2 = doCraft(JSON.parse(JSON.stringify(s2)), 'huntKing');
  assert.equal(r2.refused, old2.toasts[0]);
});

test('强化：4 类 × 多等级逐一对拍', () => {
  for (const key of Object.keys(UPGRADES)) {
    for (const lv of [0, 1, 9, 10, 14, 15]) {
      const base = richState();
      Object.assign(base.items, { steel: true, ironAxe: true, rod: true, trap: true });
      base.upgrades[key] = lv;

      const fresh = JSON.parse(JSON.stringify(base));
      const old = oldRun('upgradeItem', base, key);
      const r = upgradeItem(fresh, key);

      assert.deepEqual(r.logs, old.logs, `${key} Lv.${lv}：日志不一致`);
      assert.equal(r.refused, old.toasts[0], `${key} Lv.${lv}：提示不一致`);
      assert.deepEqual(fresh, old.state, `${key} Lv.${lv}：状态不一致`);
    }
  }
});

test('装备：材质链 / 重复 / 材料不足 逐一对拍', () => {
  for (const slot of Object.keys(ARMOR_SLOTS)) {
    for (const mat of ARMOR_MATS) {
      const base = richState();
      // 先把上一级材质穿上，才能测本级
      const idx = ARMOR_MATS.indexOf(mat);
      if (idx > 0) base.items[armorSlotKey(slot)] = ARMOR_MATS[idx - 1];

      const fresh = JSON.parse(JSON.stringify(base));
      const old = oldRun('craftArmor', base, slot, mat);
      const r = craftArmor(fresh, slot, mat);

      assert.deepEqual(r.logs, old.logs, `${slot}/${mat}：日志不一致`);
      assert.equal(r.refused, old.toasts[0], `${slot}/${mat}：提示不一致`);
      assert.deepEqual(fresh, old.state, `${slot}/${mat}：状态不一致`);
    }
  }
});

test('装备：跳级会被拒绝（提示一致）', () => {
  const s = richState();
  s.items.armorHead = 'none';
  const old = oldRun('craftArmor', s, 'head', 'steel');
  const r = craftArmor(JSON.parse(JSON.stringify(s)), 'head', 'steel');
  assert.equal(r.refused, old.toasts[0]);
});

test('减伤：多组装备组合与旧实现一致', () => {
  const combos = [
    {},
    { head: 'leather', body: 'leather', legs: 'leather', boots: 'leather' },
    { head: 'steel', body: 'steel', legs: 'steel', boots: 'steel' },
    { head: 'gold', body: 'silver', legs: 'iron', boots: 'leather' },
  ];
  for (const combo of combos) {
    for (const runeArmor of [false, true]) {
      for (const armorEnch of [0, 3, 5]) {
        const s = createNewState(NOW);
        for (const [slot, mat] of Object.entries(combo)) s.items[armorSlotKey(slot)] = mat;
        s.items.runeArmor = runeArmor;
        s.enchant.armor = armorEnch;

        env.G = s;
        const oldVal = env.__api.armorDmgMult();
        const newVal = armorDmgMult(s);
        assert.equal(newVal, oldVal, `组合 ${JSON.stringify(combo)} / 符甲=${runeArmor} / 保护=${armorEnch}`);
      }
    }
  }
});

test('附魔：等级上限 / 材料 / 提升 逐一对拍', () => {
  for (const kind of Object.keys(ENCHANTS)) {
    for (const tblLv of [0, 1, 3, 5]) {
      for (const cur of [0, 2, 5]) {
        const base = richState();
        base.items.enchantTbl = true;
        base.enchant.tblLv = tblLv;
        base.enchant[kind] = cur;

        const fresh = JSON.parse(JSON.stringify(base));
        const old = oldRun('enchantItem', base, kind);
        const r = enchantItem(fresh, kind);

        assert.deepEqual(r.logs, old.logs, `${kind} tbl=${tblLv} cur=${cur}：日志不一致`);
        assert.equal(r.refused, old.toasts[0], `${kind} tbl=${tblLv} cur=${cur}：提示不一致`);
        assert.deepEqual(fresh, old.state, `${kind} tbl=${tblLv} cur=${cur}：状态不一致`);
      }
    }
  }
});

test('附魔台升级：0→5 与满级提示对拍', () => {
  for (const tblLv of [0, 1, 4, 5]) {
    const base = richState();
    base.items.enchantTbl = true;
    base.enchant.tblLv = tblLv;

    const fresh = JSON.parse(JSON.stringify(base));
    const old = oldRun('upgradeEnchantTbl', base);
    const r = upgradeEnchantTbl(fresh);

    assert.deepEqual(r.logs, old.logs, `tblLv=${tblLv}：日志不一致`);
    assert.equal(r.refused, old.toasts[0], `tblLv=${tblLv}：提示不一致`);
    assert.deepEqual(fresh, old.state, `tblLv=${tblLv}：状态不一致`);
  }
});

test('配方可见性：按"拥有/获取过材料"判断', () => {
  const s = createNewState(NOW);
  // 新档：木/石/食物/净水/草药有初始量
  assert.equal(recipeVisible(s, 'axe'), true);   // 需要石 + 木
  assert.equal(recipeVisible(s, 'steel'), false); // 需要金属 + 皮革（都没有）

  s.res.metal = 1;
  assert.equal(recipeVisible(s, 'steel'), true);

  const s2 = createNewState(NOW);
  s2.res.metal = 0;
  s2.stats.ownedRes.metal = 1;   // 曾经拥有过
  assert.equal(recipeVisible(s2, 'steel'), true);
});

test('hasRes：与旧实现语义一致', () => {
  const s = createNewState(NOW);
  s.res.wood = 10;
  assert.equal(hasRes(s, { wood: 10 }), true);
  assert.equal(hasRes(s, { wood: 11 }), false);
  assert.equal(hasRes(s, { wood: 5, stone: 999 }), false);
});

test('nextArmorMat：空装备从第一档起，逐档推进，到顶返回 null', () => {
  const s = createNewState(NOW);
  for (const slot of Object.keys(ARMOR_SLOTS)) s.items[armorSlotKey(slot)] = 'none';

  // 空装备 → 第一档（皮甲），不是「空」
  assert.equal(nextArmorMat(s, 'head'), 'leather');

  // 逐档走完：每次「制作并穿上」后下一档正确
  for (let i = 0; i < ARMOR_MATS.length; i++) {
    s.items.armorHead = ARMOR_MATS[i];
    const next = nextArmorMat(s, 'head');
    assert.equal(next, i < ARMOR_MATS.length - 1 ? ARMOR_MATS[i + 1] : null, `第 ${i} 档的下一档不对`);
  }

  // 未知材质（脏存档）按"空"处理
  s.items.armorHead = 'mithril';
  assert.equal(nextArmorMat(s, 'head'), 'leather');

  // 非法部位
  assert.equal(nextArmorMat(s, 'tail'), null);
});

test('nextArmorMat：部位之间互不影响（升级链按部位独立）', () => {
  const s = createNewState(NOW);
  s.items.armorHead = 'copper';
  s.items.armorBody = 'none';
  assert.equal(nextArmorMat(s, 'head'), 'iron');
  assert.equal(nextArmorMat(s, 'body'), 'leather');
});

test('armorMatVisible：没见过材料就不出制作入口', () => {
  const s = createNewState(NOW);
  for (const k of Object.keys(s.res)) s.res[k] = 0;
  s.stats.ownedRes = {};

  assert.equal(armorMatVisible(s, 'leather'), false);  // 需要皮革
  s.res.leather = 1;
  assert.equal(armorMatVisible(s, 'leather'), true);

  // 历史获取过（花光了也算见过）
  const s2 = createNewState(NOW);
  for (const k of Object.keys(s2.res)) s2.res[k] = 0;
  s2.stats.ownedRes = { metal: 1 };
  assert.equal(armorMatVisible(s2, 'iron'), true);

  assert.equal(armorMatVisible(s2, 'none'), false);
});
