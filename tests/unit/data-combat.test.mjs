// 数据表对拍：配方 / 强化 / 武器 / 怪物
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { RECIPES } from '../../src/core/data/recipes.mjs';
import { UPGRADES, upgradeCost } from '../../src/core/data/upgrades.mjs';
import { WEAPONS } from '../../src/core/data/weapons.mjs';
import { BEASTS, ROBOTS, REGION_BEASTS, MOON_BEASTS } from '../../src/core/data/monsters.mjs';
import { RESOURCES } from '../../src/core/data/resources.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');
const RES_IDS = new Set(RESOURCES.map((r) => r.id));

function evalOld(from, to) {
  const a = html.indexOf(from);
  const b = html.indexOf(to, a);
  const code = html.slice(a, b).replace(/const ([A-Za-z_]\w*) =/g, 'globalThis.$1 =');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const out = {};
  for (const k of Object.keys(ctx)) out[k] = JSON.parse(JSON.stringify(ctx[k]));
  return out;
}

test('零漂移：配方表与旧文件一致（22 条）', () => {
  const old = evalOld('const RECIPES = {', '/* 强化系统');
  assert.equal(Object.keys(RECIPES).length, 22);
  assert.deepEqual(RECIPES, old.RECIPES);
});

test('零漂移：强化表与旧文件一致', () => {
  const old = evalOld('const UPGRADES = {', '/* 计算升级到 lv+1');
  assert.deepEqual(UPGRADES, old.UPGRADES);
});

test('upgradeCost 与旧实现逐级一致（4 类 × 0–14 级）', () => {
  const ref = (key, lv) => {
    const u = UPGRADES[key];
    const cost = {};
    for (const k in u.base) cost[k] = Math.round(u.base[k] * (lv + 1));
    if (lv >= 10) { cost.rune = lv - 9; cost.alloy = Math.round((lv - 9) * 1.5); }
    return cost;
  };
  for (const key of Object.keys(UPGRADES)) {
    for (let lv = 0; lv <= 14; lv++) {
      assert.deepEqual(upgradeCost(key, lv), ref(key, lv), `${key} Lv.${lv}`);
    }
  }
  assert.deepEqual(upgradeCost('nope', 3), {});
});

test('零漂移：武器链与旧文件一致', () => {
  const old = evalOld('const WEAPONS = {', '/* 配方可见性');
  assert.deepEqual(WEAPONS, old.WEAPONS);
});

test('零漂移：怪物四张表与旧文件一致', () => {
  const old = evalOld('const BEASTS = [', '/* ---------------- 怪物图鉴解锁');
  assert.deepEqual(BEASTS, old.BEASTS);
  assert.deepEqual(ROBOTS, old.ROBOTS);
  assert.deepEqual(REGION_BEASTS, old.REGION_BEASTS);
  assert.deepEqual(MOON_BEASTS, old.MOON_BEASTS);
});

test('REGION_BEASTS.ruins 就是 ROBOTS 本身（同一引用，不是复制）', () => {
  assert.equal(REGION_BEASTS.ruins, ROBOTS);
});

test('交叉引用：配方材料都是已定义的资源', () => {
  for (const [id, r] of Object.entries(RECIPES)) {
    for (const resId of Object.keys(r.cost)) {
      assert.ok(RES_IDS.has(resId), `配方 ${id} 用了未定义的资源 ${resId}`);
    }
  }
});

test('交叉引用：配方前置指向存在的配方，且不指向自己', () => {
  for (const [id, r] of Object.entries(RECIPES)) {
    if (r.need === null) continue;
    assert.ok(RECIPES[r.need], `配方 ${id} 的前置 ${r.need} 不存在`);
    assert.notEqual(r.need, id, `配方 ${id} 前置指向自己`);
  }
});

test('交叉引用：怪物掉落字段都是已定义的资源', () => {
  const all = [...BEASTS, ...ROBOTS, ...Object.values(REGION_BEASTS).flat(), ...Object.values(MOON_BEASTS)];
  for (const m of all) {
    for (const key of Object.keys(m)) {
      if (['name', 'hp', 'atk'].includes(key)) continue;
      assert.ok(RES_IDS.has(key), `怪物 ${m.name} 的掉落字段 ${key} 不是资源`);
    }
  }
});

test('配方阶数与等级门槛的约定：needLv 只出现在 1 阶', () => {
  for (const [id, r] of Object.entries(RECIPES)) {
    if (r.needLv !== undefined) assert.equal(r.tier, 1, `配方 ${id} 是 ${r.tier} 阶却有 needLv`);
  }
});
