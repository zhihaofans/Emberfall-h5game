// 技能一览的数据派生：顺序、名称、经验曲线、进度百分比
//
// 旧 openSkills() 直接读全局 G 并把 `xpNeed` / 百分比公式写在模板里；
// 新实现把派生收进 core/skills.mjs，UI 只画。这里锁住派生结果与旧公式一致。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNewState } from '../../src/core/save.mjs';
import { skillRows } from '../../src/core/skills.mjs';
import { SKILLS, SKILL_NAMES, SKILL_DESC, xpNeed } from '../../src/core/data/skills.mjs';

const NOW = 1_700_000_000_000;

test('7 行，顺序与 SKILLS 一致，名称/说明取自同一数据源', () => {
  const rows = skillRows(createNewState(NOW));
  assert.equal(rows.length, 7);
  assert.deepEqual(rows.map((r) => r.key), SKILLS);
  for (const r of rows) {
    assert.equal(r.name, SKILL_NAMES[r.key]);
    assert.equal(r.desc, SKILL_DESC[r.key]);
  }
});

test('经验曲线：1–60 级每级 need 都等于 xpNeed(lvl)', () => {
  for (let lvl = 1; lvl <= 60; lvl++) {
    const state = createNewState(NOW);
    state.skills.chop = { lvl, xp: 0 };
    const row = skillRows(state).find((r) => r.key === 'chop');
    assert.equal(row.lvl, lvl);
    assert.equal(row.need, xpNeed(lvl), `Lv.${lvl}`);
  }
});

test('进度百分比：0 / 一半 / 满经验 / 超额都按旧公式夹在 0–100', () => {
  const cases = [
    { xp: 0, pct: 0 },
    { xp: xpNeed(3) / 2, pct: 50 },
    { xp: xpNeed(3), pct: 100 },
    { xp: xpNeed(3) * 3, pct: 100 }, // 异常大值也不溢出
  ];
  for (const c of cases) {
    const state = createNewState(NOW);
    state.skills.mine = { lvl: 3, xp: c.xp };
    const row = skillRows(state).find((r) => r.key === 'mine');
    assert.equal(row.pct, c.pct, `xp=${c.xp}`);
    assert.equal(row.pct, Math.min(100, Math.round((c.xp / xpNeed(3)) * 100)), '与旧公式不一致');
  }
});

test('缺字段兜底：skills 为空 / 某项缺失都按 Lv.1·0 经验渲染，不抛错', () => {
  const empty = createNewState(NOW);
  empty.skills = {};
  const rows = skillRows(empty);
  assert.equal(rows.length, 7);
  for (const r of rows) {
    assert.equal(r.lvl, 1);
    assert.equal(r.xp, 0);
    assert.equal(r.need, xpNeed(1));
    assert.equal(r.pct, 0);
  }

  const partial = createNewState(NOW);
  delete partial.skills.cook;
  const cook = skillRows(partial).find((r) => r.key === 'cook');
  assert.equal(cook.lvl, 1);
  assert.equal(cook.xp, 0);
});
