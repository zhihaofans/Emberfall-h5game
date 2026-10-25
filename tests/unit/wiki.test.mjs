// 图鉴单测：markSeen 对拍 + id 清单完整性 + 与老档补解锁的交叉校验
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState, legacyBestiary } from '../../src/core/save.mjs';
import { BEASTS, ROBOTS, REGION_BEASTS, MOON_BEASTS } from '../../src/core/data/monsters.mjs';
import { BESTIARY_IDS, markSeen, isUnlocked, markEncounter, wikiProgress } from '../../src/core/wiki.mjs';
import { pickMonster } from '../../src/core/combat.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

function buildOld() {
  const env = { __logs: [] };
  vm.createContext(env);
  const a = html.indexOf('function wikiSeen(id){');
  const b = html.indexOf('/* 老存档迁移：按历史击杀/探索数粗略补解锁', a);
  vm.runInContext(`
    ${html.slice(a, b)}
    globalThis.__api = { wikiSeen, wikiUnlocked };
  `, env);
  return env;
}
const env = buildOld();

test('markSeen / isUnlocked 与旧实现一致（含累计次数）', () => {
  const sOld = createNewState(NOW);
  const sNew = createNewState(NOW);
  const ids = ['beast0', 'beast0', 'zone-forest', 'moon-dog'];
  for (const id of ids) {
    env.G = sOld;
    env.__api.wikiSeen(id);
    markSeen(sNew, id);
  }
  assert.deepEqual(sNew.bestiary, JSON.parse(JSON.stringify(sOld.bestiary)));
  assert.equal(sNew.bestiary.beast0, 2);
  assert.equal(isUnlocked(sNew, 'beast0'), true);
  assert.equal(isUnlocked(sNew, 'beast3'), false);
});

test('图鉴 id 清单：21 条且与数据表一致', () => {
  assert.equal(BESTIARY_IDS.length, 21);
  assert.equal(new Set(BESTIARY_IDS).size, 21);

  for (let i = 0; i < BEASTS.length; i++) assert.ok(BESTIARY_IDS.includes('beast' + i));
  for (let i = 0; i < ROBOTS.length; i++) assert.ok(BESTIARY_IDS.includes('rob' + i));
  for (const z of ['forest', 'river', 'hills']) assert.ok(BESTIARY_IDS.includes('zone-' + z));
  for (let i = 0; i < REGION_BEASTS.pyramid.length; i++) assert.ok(BESTIARY_IDS.includes('pyr' + i));
  for (const k of Object.keys(MOON_BEASTS)) assert.ok(BESTIARY_IDS.includes('moon-' + k));
  for (let i = 0; i < 3; i++) {
    assert.ok(BESTIARY_IDS.includes('boss' + i));
    assert.ok(BESTIARY_IDS.includes('pharaoh' + i));
  }
});

test('老档补解锁 legacyBestiary 产出的 id 全在图鉴清单里', () => {
  // 给一个"全成就"的统计，让 legacyBestiary 尽可能多产出 id
  const b = legacyBestiary({
    stats: {
      kills: 20, zoneCnt: { forest: 1, river: 1, hills: 1, ruins: 6, pyramid: 6 },
      bossKills: 3, pharaohKills: 3,
    },
  });
  const unknown = Object.keys(b).filter((id) => !BESTIARY_IDS.includes(id));
  assert.deepEqual(unknown, [], '补解锁产出了未知的图鉴 id');
  assert.ok(Object.keys(b).length >= 15);
});

test('遭遇解锁：markEncounter 与 combat 的图鉴映射一致', () => {
  const s = createNewState(NOW);
  const picked = pickMonster(s, { zone: 'ruins', tierScale: 2, random: () => 0.9 });
  const ids = markEncounter(s, picked);
  assert.ok(ids.length > 0);
  for (const id of ids) {
    assert.ok(BESTIARY_IDS.includes(id), `${id} 不在图鉴清单里`);
    assert.equal(isUnlocked(s, id), true);
  }
});

test('进度统计：0 → 21', () => {
  const s = createNewState(NOW);
  assert.deepEqual(wikiProgress(s), { unlocked: 0, total: 21 });
  for (const id of BESTIARY_IDS) markSeen(s, id);
  assert.deepEqual(wikiProgress(s), { unlocked: 21, total: 21 });
  // 重复遭遇不重复计数
  markSeen(s, 'beast0');
  assert.deepEqual(wikiProgress(s), { unlocked: 21, total: 21 });
});
