// 进度总览：数据派生 + 与旧 openProgress() 的展示清单对拍
//
// 旧 openProgress() 把目标线、成就清单、百分比、分母全写在渲染里，其中三处与数据表不符
// （强化分母写死 10、武器路线漏符刃、材料缺口印的是需求总量）。这一版把派生收进
// core/progress.mjs，并修正那三处；这里逐项锁住。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNewState } from '../../src/core/save.mjs';
import {
  pct, dayProgress, craftProgress, missingCostText, upgradeProgress, skillProgress,
  weaponProgress, bossProgress, pharaohProgress, doraProgress, achievementProgress,
  isAchievementId,
} from '../../src/core/progress.mjs';
import { DAY_TARGETS, SKILL_MAX_LV, ACHIEVEMENT_SHOWCASE } from '../../src/core/data/progress.mjs';
import { RECIPES } from '../../src/core/data/recipes.mjs';
import { UPGRADES } from '../../src/core/data/upgrades.mjs';
import { WEAPONS } from '../../src/core/data/weapons.mjs';
import { WHITELIST, DAY_MILESTONES } from '../../src/core/data/achievements.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

test('目标线与成就清单：与旧 openProgress 逐项一致', () => {
  const oldTargets = /const dayTargets=\[([^\]]+)\]/.exec(html)[1].split(',').map(Number);
  assert.deepEqual(DAY_TARGETS, oldTargets);

  const a = html.indexOf('const ach=[');
  const b = html.indexOf('const doneAch=', a);
  assert.ok(a > 0 && b > a, '切片失败: 旧成就清单');
  const pairs = [...html.slice(a, b).matchAll(/\['([A-Za-z0-9_]+)','([^']*)'\]/g)]
    .map((m) => ({ id: m[1], label: m[2] }));

  assert.equal(pairs.length, 54, '旧清单条目数变了，核对是否漏搬');
  assert.deepEqual(ACHIEVEMENT_SHOWCASE, pairs);
});

test('成就 id 全部合法：天数里程碑或白名单成员', () => {
  for (const { id } of ACHIEVEMENT_SHOWCASE) {
    assert.equal(isAchievementId(id), true, `${id} 不在天数里程碑 / WHITELIST 里`);
  }
  const dayIds = ACHIEVEMENT_SHOWCASE.filter((a) => /^d\d+$/.test(a.id)).map((a) => Number(a.id.slice(1)));
  assert.deepEqual(dayIds, [3, 7, 15, 30]);
  assert.ok(dayIds.every((d) => DAY_MILESTONES.includes(d)));
  const others = ACHIEVEMENT_SHOWCASE.filter((a) => !/^d\d+$/.test(a.id));
  assert.ok(others.every((a) => WHITELIST.includes(a.id)));
  assert.equal(isAchievementId('不是成就'), false);
});

test('pct：四舍五入并夹在 0–100，分母为 0 时返回 0', () => {
  assert.equal(pct(0, 100), 0);
  assert.equal(pct(50, 100), 50);
  assert.equal(pct(1, 3), 33);
  assert.equal(pct(2, 3), 67);
  assert.equal(pct(200, 100), 100);
  assert.equal(pct(-5, 100), 0);
  assert.equal(pct(1, 0), 0);
});

test('生存天数：下一个目标 / 还差几天 / 里程碑达成后跳过', () => {
  const s = createNewState(NOW);
  s.day = 1;
  let d = dayProgress(s);
  assert.deepEqual([d.next, d.left, d.done, d.max], [7, 6, false, 100]);

  s.day = 20;
  d = dayProgress(s);
  assert.deepEqual([d.next, d.left], [30, 10]);

  s.milestones.d7 = 1;
  s.milestones.d15 = 1;
  d = dayProgress(s);
  assert.deepEqual([d.next, d.left], [30, 10], '已达成的不应再算作下一个目标');

  s.day = 120;
  d = dayProgress(s);
  assert.deepEqual([d.next, d.done], [null, true], '超过 100 天后全部达成');
});

test('制作进度：0/22 → 下一个配方与真实缺口文案', () => {
  const s = createNewState(NOW);
  const first = Object.keys(RECIPES)[0];
  let c = craftProgress(s);
  assert.equal(c.total, 22);
  assert.equal(c.made, 0);
  assert.equal(c.pct, 0);
  assert.equal(c.next, first);
  assert.match(c.missing, /（缺 \d+）/);

  s.items[first] = true;
  c = craftProgress(s);
  assert.equal(c.made, 1);

  for (const k of Object.keys(RECIPES)) s.items[k] = true;
  c = craftProgress(s);
  assert.deepEqual([c.made, c.total, c.next, c.missing, c.pct], [22, 22, null, '', 100]);
});

test('材料缺口：印真实缺口而不是需求总量（旧版显示「缺 10」）', () => {
  const s = createNewState(NOW);
  s.res.stone = 0;
  s.res.wood = 3;
  const text = missingCostText(s, 'fire'); // 石 6 + 木 10
  assert.match(text, /🪨石头 6（缺 6）/);
  assert.match(text, /🪵木材 10（缺 7）/);

  s.res.wood = 10;
  assert.doesNotMatch(missingCostText(s, 'fire'), /木材 10（/);
  assert.equal(missingCostText(s, '不存在'), '');
});

test('强化进度：分母按 max 求和（4×15=60，旧版写死 40）', () => {
  const s = createNewState(NOW);
  let u = upgradeProgress(s);
  assert.equal(u.max, 60);
  assert.equal(u.total, 0);
  assert.equal(Object.values(UPGRADES).every((x) => x.max === 15), true);

  s.upgrades.weapon = 3;
  s.upgrades.axe = 15;
  u = upgradeProgress(s);
  assert.equal(u.total, 18);
  assert.equal(u.pct, 30);
  assert.equal(u.perKey.find((k) => k.key === 'axe').max, 15);
});

test('技能等级：7 项之和 / 7×50', () => {
  const s = createNewState(NOW);
  let sk = skillProgress(s);
  assert.deepEqual([sk.total, sk.max, sk.maxLv, sk.pct], [7, 350, SKILL_MAX_LV, 2]);

  s.skills.chop.lvl = 50;
  sk = skillProgress(s);
  assert.equal(sk.total, 56);
});

test('武器路线：按 WEAPONS 顺序派生，含 🔮符刃（旧版漏了）', () => {
  const s = createNewState(NOW);
  const w = weaponProgress(s);
  assert.deepEqual(w.route.map((r) => r.key), Object.keys(WEAPONS));
  assert.equal(w.route[w.route.length - 1].name, '🔮符刃');
  assert.deepEqual(w.route.filter((r) => r.owned).map((r) => r.key), ['none']);
  assert.equal(w.current.name, '✊徒手');

  s.items.knife = true;
  s.items.runeBlade = true;
  const w2 = weaponProgress(s);
  assert.deepEqual(w2.route.filter((r) => r.owned).map((r) => r.key), ['none', 'knife', 'runeBlade']);
  assert.equal(w2.current.name, '🔮符刃');
});

test('Boss 阶段：0/1/2/3，超过 3 次仍停在终结阶段', () => {
  const s = createNewState(NOW);
  assert.deepEqual(bossProgress(s), { kills: 0, stage: 0 });
  s.stats.bossKills = 2;
  assert.deepEqual(bossProgress(s), { kills: 2, stage: 2 });
  s.stats.bossKills = 7;
  assert.deepEqual(bossProgress(s), { kills: 7, stage: 3 });

  assert.deepEqual(pharaohProgress(s), { kills: 0, stage: 0 });
  s.stats.pharaohKills = 1;
  assert.deepEqual(pharaohProgress(s), { kills: 1, stage: 1 });
});

test('猫耳机器人：下一档名称与所需好感（6 档）', () => {
  const s = createNewState(NOW);
  let d = doraProgress(s);
  assert.deepEqual([d.name, d.nextName, d.nextNeed, d.max], ['陌生', '眼熟', 20, false]);

  s.npcDora.fav = 25;
  d = doraProgress(s);
  assert.deepEqual([d.lvl, d.name, d.nextName, d.nextNeed], [2, '眼熟', '信赖', 25]);

  s.npcDora.fav = 300;
  d = doraProgress(s);
  assert.deepEqual([d.name, d.max, d.nextName, d.nextNeed], ['家人', true, null, 0]);
});

test('成就进度：已达成/未达成拆分保持清单顺序', () => {
  const s = createNewState(NOW);
  let ac = achievementProgress(s);
  assert.equal(ac.total, ACHIEVEMENT_SHOWCASE.length);
  assert.equal(ac.doneCount, 0);
  assert.equal(ac.left.length, ac.total);

  s.milestones.d3 = 1;
  s.milestones.craft1 = 1;
  s.milestones.boss = 1;
  ac = achievementProgress(s);
  assert.deepEqual(ac.done.map((a) => a.id), ['d3', 'craft1', 'boss']);
  assert.equal(ac.left.length, ac.total - 3);

  for (const a of ACHIEVEMENT_SHOWCASE) s.milestones[a.id] = 1;
  ac = achievementProgress(s);
  assert.equal(ac.doneCount, ac.total);
  assert.equal(ac.pct, 100);
  assert.deepEqual(ac.left, []);
});
