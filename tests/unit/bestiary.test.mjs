// 百科图鉴条目：结构、解锁联动、数值来源（不许在图鉴里另写一份）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNewState } from '../../src/core/save.mjs';
import { BESTIARY_IDS } from '../../src/core/wiki.mjs';
import { markSeen } from '../../src/core/wiki.mjs';
import { monsterEntries, materialEntries } from '../../src/core/bestiary.mjs';
import { bossStats, pharaohStats, BOSS_EXTRA_DROPS } from '../../src/core/combat.mjs';
import { BEASTS } from '../../src/core/data/monsters.mjs';
import { RESOURCES } from '../../src/core/data/resources.mjs';

const NOW = 1_700_000_000_000;

test('怪物图鉴：条目 id 与 BESTIARY_IDS 一一对应且同序', () => {
  const entries = monsterEntries(createNewState(NOW));
  assert.equal(entries.length, 21);
  assert.deepEqual(entries.map((e) => e.id), BESTIARY_IDS);
});

test('怪物图鉴：seen 跟着存档解锁状态走', () => {
  const s = createNewState(NOW);
  const before = monsterEntries(s);
  assert.ok(before.every((e) => e.seen === false), '新档应当全是未遭遇');

  markSeen(s, 'beast0');
  markSeen(s, 'boss2');
  const after = monsterEntries(s);
  const byId = Object.fromEntries(after.map((e) => [e.id, e]));
  assert.equal(byId.beast0.seen, true);
  assert.equal(byId.boss2.seen, true);
  assert.equal(byId.beast1.seen, false);
});

test('怪物图鉴：数值取自战斗数据，不是另写一份', () => {
  const s = createNewState(NOW);
  const byId = Object.fromEntries(monsterEntries(s).map((e) => [e.id, e]));

  // 常见野兽直接对 data 表
  assert.equal(byId.beast0.head.includes(BEASTS[0].name), true);
  assert.ok(byId.beast0.lines.join('').includes(String(BEASTS[0].hp)));
  assert.ok(byId.beast0.lines.join('').includes(String(BEASTS[0].atk)));

  // 兽王三阶段对 bossStats
  for (let k = 0; k < 3; k++) {
    const bs = bossStats({ stats: { bossKills: k } });
    const text = byId['boss' + k].lines.join('');
    assert.ok(byId['boss' + k].head.includes(bs.name), `boss${k} 名字不一致`);
    assert.ok(text.includes(String(bs.hp)), `boss${k} 生命不一致`);
    assert.ok(text.includes(String(bs.atk)), `boss${k} 攻击不一致`);
  }
  // 固定掉落项也来自 BOSS_EXTRA_DROPS
  const bossTxt = byId.boss0.lines.join('');
  for (const k of Object.keys(BOSS_EXTRA_DROPS)) {
    assert.ok(bossTxt.includes(`×${BOSS_EXTRA_DROPS[k]}`), `boss 固定掉落缺 ${k}`);
  }

  // 法老三阶段对 pharaohStats
  for (let k = 0; k < 3; k++) {
    const ps = pharaohStats({ stats: { pharaohKills: k } });
    const text = byId['pharaoh' + k].lines.join('');
    assert.ok(byId['pharaoh' + k].head.includes(ps.name), `pharaoh${k} 名字不一致`);
    assert.ok(text.includes(String(ps.hp)), `pharaoh${k} 生命不一致`);
    assert.ok(text.includes(String(ps.atk)), `pharaoh${k} 攻击不一致`);
    assert.ok(text.includes(String(ps.gold)), `pharaoh${k} 金币不一致`);
  }
});

test('材料百科：23 种资源 + 1 条附魔说明，且都有来源文案', () => {
  const entries = materialEntries();
  assert.equal(entries.length, RESOURCES.length + 1);

  const ids = entries.map((e) => e.id);
  for (const r of RESOURCES) assert.ok(ids.includes(r.id), `缺资源 ${r.id}`);

  const ench = entries.find((e) => e.id === 'enchant');
  assert.ok(ench, '缺附魔说明条目');
  assert.equal(ench.lines.length, 3, '三种附魔各一行');

  // 除附魔说明外，每条都要有非空的获取方式
  for (const e of entries) {
    if (e.id === 'enchant') continue;
    assert.equal(e.lines.length, 1);
    assert.ok(e.lines[0] && e.lines[0].length > 0, `${e.id} 缺少来源文案`);
  }
});
