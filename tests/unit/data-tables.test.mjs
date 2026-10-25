// 数据表对拍：技能 / 区域 / 行动
//
// 与 resources.test.mjs 同样的思路 —— 新表必须与 survival.html 里的旧数据逐字段一致，
// 否则说明搬运时改坏了数值。另外补一组"交叉引用"校验（区域产出的资源、行动对应的技能）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { SKILLS, SKILL_NAMES, SKILL_DESC, xpNeed } from '../../src/core/data/skills.mjs';
import { ZONES } from '../../src/core/data/zones.mjs';
import { ACTIONS } from '../../src/core/data/actions.mjs';
import { RESOURCES } from '../../src/core/data/resources.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');

/** 把旧文件里一段纯字面量代码求值，拿到原始数据
 *  注意：vm 里创建的对象属于另一个 realm，原型不同 → deepStrictEqual 会报
 *  "same structure but not reference-equal"。这里做一次 JSON 往返，转回当前 realm。 */
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

test('零漂移：技能表三个常量与旧文件一致', () => {
  const old = evalOld('const SKILLS = ', 'function xpNeed');
  assert.deepEqual(SKILLS, old.SKILLS);
  assert.deepEqual(SKILL_NAMES, old.SKILL_NAMES);
  assert.deepEqual(SKILL_DESC, old.SKILL_DESC);
});

test('xpNeed 公式与旧实现逐级一致（1–60 级）', () => {
  const oldFn = (lvl) => Math.round(8 * lvl * lvl + 12 * lvl);
  for (let lvl = 1; lvl <= 60; lvl++) assert.equal(xpNeed(lvl), oldFn(lvl), `Lv.${lvl}`);
});

test('零漂移：区域表与旧文件一致', () => {
  const old = evalOld('const ZONES = {', 'const ACTIONS = {');
  assert.deepEqual(ZONES, old.ZONES);
});

test('零漂移：行动表与旧文件一致', () => {
  const old = evalOld('const ACTIONS = {', '/* 商店价格');
  assert.deepEqual(ACTIONS, old.ACTIONS);
});

test('交叉引用：区域产出的资源都在资源表里', () => {
  const ids = new Set(RESOURCES.map((r) => r.id));
  for (const [zone, def] of Object.entries(ZONES)) {
    for (const [resId] of def.res) {
      assert.ok(ids.has(resId), `区域 ${zone} 产出了未定义的资源 ${resId}`);
    }
  }
});

test('交叉引用：行动引用的技能都在技能表里', () => {
  const skills = new Set(SKILLS);
  for (const [actId, def] of Object.entries(ACTIONS)) {
    if (def.skill) assert.ok(skills.has(def.skill), `行动 ${actId} 引用了未定义的技能 ${def.skill}`);
  }
});

test('每个区域都有解锁天数与成就组', () => {
  for (const [zone, def] of Object.entries(ZONES)) {
    assert.ok(Number.isInteger(def.unlockDay), `区域 ${zone} 缺 unlockDay`);
    assert.equal(def.ach.length, 3, `区域 ${zone} 的成就组应为 3 档`);
  }
});

test('autoLv 只出现在可自动的行动上', () => {
  for (const [actId, def] of Object.entries(ACTIONS)) {
    if (def.autoLv !== undefined) assert.equal(def.auto, true, `行动 ${actId} 有 autoLv 但 auto=false`);
  }
});
