// 存档层单测（纯函数，不需要浏览器）
//
// 覆盖：默认值补齐 / 幂等 / 一次性补偿 / 迁移链 / 序列化往返 / 非法输入
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SAVE_FMT, SAVE_TAG, createNewState, normalizeState, migrateFrom,
  serialize, parseSavePayload, legacyBestiary,
} from '../../src/core/save.mjs';

const NOW = 1_700_000_000_000; // 固定时间戳，保证断言确定性

test('新档：关键默认值与源实现一致', () => {
  const s = createNewState(NOW);
  assert.equal(s.v, SAVE_FMT);
  assert.equal(s.day, 1);
  assert.equal(s.hour, 8);
  assert.equal(s.hp, 100);
  assert.equal(s.gold, 0);
  assert.equal(s.res.wood, 4);
  assert.equal(s.res.lifePotion, 0);
  assert.equal(s.stats.days, 0);        // newGame() 的历史值是 0（normalize 的默认值是 1）
  assert.equal(s.skills.combat.lvl, 1);
  assert.equal(s.__v1171_comp, 1);      // 新档自带补偿标记，避免再补一次
  assert.equal(s.lastSeen, NOW);
});

test('normalizeState({}) 补齐所有字段，且 stats.days 默认 1', () => {
  const s = normalizeState({}, NOW);
  assert.equal(s.day, 1);
  assert.equal(s.stats.days, 1);
  assert.equal(Object.keys(s.res).length, 23);
  assert.equal(s.items.armorHead, 'none');
  assert.equal(s.enchant.tblLv, 0);
  assert.equal(s.lastSeen, NOW);
});

test('幂等：规范化两次结果完全相同', () => {
  const once = normalizeState({ day: 42, res: { wood: 7 } }, NOW);
  const twice = normalizeState(JSON.parse(JSON.stringify(once)), NOW);
  assert.deepEqual(twice, once);
});

test('数值修正：越界与非法值被 clamp / 归零', () => {
  const s = normalizeState({ hp: 200, food: -5, water: 'x', stam: NaN, hour: -1, day: 0, gold: NaN }, NOW);
  assert.equal(s.hp, 100);
  assert.equal(s.food, 0);
  assert.equal(s.water, 0);      // 'x' |0 → 0
  assert.equal(s.stam, 0);       // NaN |0 → 0
  assert.equal(s.hour, 23);      // -1 归一化到 23
  assert.equal(s.day, 1);
  assert.equal(s.gold, 0);       // NaN 硬保护
});

test('一次性补偿只触发一次', () => {
  const first = normalizeState({}, NOW);
  assert.equal(first.res.luck, 100);       // v1.17.1 补偿 +100
  assert.equal(first.res.totem, 1);        // v1.27.4 补偿
  assert.equal(first.res.luckyDraw, 2);

  const second = normalizeState(JSON.parse(JSON.stringify(first)), NOW);
  assert.equal(second.res.luck, 100);      // 不再累加
  assert.equal(second.res.totem, 1);
});

test('迁移链：fmt=1 的最小旧档能升到当前格式且字段齐全', () => {
  const old = { day: 5, hour: 12 };
  const migrated = migrateFrom(old, 1, NOW);
  assert.equal(migrated.v, SAVE_FMT);
  assert.ok(migrated.skills && migrated.skills.chop);
  assert.equal(migrated.items.steel, false);
  assert.equal(migrated.items.armorBody, 'none');
  assert.ok('armor' in migrated.items === false); // 旧的单一 armor 字段已删除
  assert.ok(migrated.enchant);
  assert.equal(migrated.adrenalineLeft, 0);
  assert.ok(migrated.bestiary);                   // fmt<11 会被补图鉴

  const normalized = normalizeState(migrated, NOW);
  assert.equal(normalized.day, 5);
  assert.equal(normalized.hour, 12);
});

test('迁移链幂等：已是最新格式再迁移不会改坏数据', () => {
  const s = createNewState(NOW);
  const again = migrateFrom(JSON.parse(JSON.stringify(s)), SAVE_FMT, NOW);
  assert.deepEqual(again, s);
});

test('序列化 → 解析 往返后逐字段一致', () => {
  const s = createNewState(NOW);
  s.day = 33;
  s.res.rune = 9;
  s.stats.zoneCnt = { forest: 4, pyramid: 1 };
  s.bestiary = { beast0: 3, 'zone-forest': 1 };
  s.milestones = { d7: 1 };

  const text = serialize(s, '9.9.9');
  const back = parseSavePayload(JSON.parse(text), NOW);
  assert.ok(back);
  assert.deepEqual(back, s);
});

test('兼容旧标识 EMBER1 与只有 v 没有 fmt 的存档', () => {
  const payload = { tag: 'EMBER1', v: 3, g: { day: 2 } };
  const s = parseSavePayload(payload, NOW);
  assert.ok(s);
  assert.equal(s.day, 2);
  assert.ok(s.skills);
});

test('非法载荷返回 null（不抛错）', () => {
  assert.equal(parseSavePayload(null, NOW), null);
  assert.equal(parseSavePayload({}, NOW), null);
  assert.equal(parseSavePayload({ tag: 'WRONG', g: {} }, NOW), null);
  assert.equal(parseSavePayload({ tag: SAVE_TAG }, NOW), null);
});

test('未来字段不会被规范化吞掉（前向兼容）', () => {
  const s = normalizeState({ day: 3, __future_x: 42, res: { wood: 1, newRes: 5 } }, NOW);
  assert.equal(s.__future_x, 42);   // 未知顶层字段保留
  assert.equal(s.res.newRes, 5);    // 未知资源键保留（不认识的键不该被删）
  assert.equal(s.res.wood, 1);
});

test('老档补图鉴：按历史战绩推断', () => {
  const b = legacyBestiary({ stats: { kills: 7, zoneCnt: { forest: 1, ruins: 4 }, bossKills: 1 } });
  assert.equal(b['beast0'], 1);
  assert.equal(b['beast3'], 1);     // kills=7 ≥ 4
  assert.equal(b['zone-forest'], 1);
  assert.equal(b['rob1'], 1);       // ruins=4 ≥ 3
  assert.equal(b['rob2'], undefined);
  assert.equal(b['boss0'], 1);      // bossKills=1 → boss0（原实现是 0 起编号）
  assert.equal(b['moon-dog'], 1);   // kills=7 ≥ 6
  assert.equal(b['moon-wolf'], undefined);
});

test('lastSeen 不会被 32 位截断（原实现的 |0 会导致离线结算虚高）', () => {
  const big = 1_700_000_000_000;
  const s = normalizeState({ lastSeen: big }, NOW);
  assert.equal(s.lastSeen, big);
  assert.ok(s.lastSeen > 0);
});
