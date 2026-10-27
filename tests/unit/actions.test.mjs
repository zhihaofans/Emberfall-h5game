// 行动前置检查对拍：新 checkAction vs 旧 doAction 的前半段
//
// 历史坑 #4（AGENT.md §7）：材料不足时不能先扣精力/推进时间。
// 这里把旧 doAction 截到扣精力之前，在 vm 里真跑，与新实现逐 kind 对比：
// 「能不能做」与「失败原因文案」必须一致。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { ACTIONS } from '../../src/core/data/actions.mjs';
import { checkAction, payActionCost, interruptsAuto } from '../../src/core/actions.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'legacy/survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

/** 把旧 doAction 截到「扣精力之前」，补一个 PASSED 返回值 */
function buildOldCheck() {
  const start = html.indexOf('function doAction(kind){');
  const end = html.indexOf('  // 肾上腺素期间：精力不消耗', start);
  if (start < 0 || end < 0) throw new Error('切片失败');
  const body = html.slice(start, end) + '\n  return "PASSED";\n}\n';
  const env = { ACTIONS, __toasts: [], __stops: [] };
  vm.createContext(env);
  vm.runInContext(
    `function toast(m){ __toasts.push(m) }
     function stopAuto(silent){ __stops.push(silent === true ? 'true' : 'false') }
     ${body}
     globalThis.__doAction = doAction;`,
    env,
  );
  return env;
}
const env = buildOldCheck();

/** 用旧实现判断一次 */
function oldCheck(state, kind) {
  env.G = state;
  env.__toasts.length = 0;
  env.__stops.length = 0;
  const r = env.__doAction(kind);
  return { passed: r === 'PASSED', toast: env.__toasts[env.__toasts.length - 1] };
}

/** 造一组有代表性的状态 */
function states() {
  const base = () => createNewState(NOW);
  const out = [];

  out.push(['初始档（无工具）', base()]);

  const full = base();
  Object.assign(full.items, {
    knife: true, iron: true, steel: true, rod: true, forge: true, fire: true,
  });
  full.res.food = 20; full.res.water = 20; full.res.metal = 20; full.res.stone = 20;
  full.res.herb = 5; full.res.goldOre = 1;
  out.push(['全套工具 + 充足材料', full]);

  const noMat = base();
  Object.assign(noMat.items, { fire: true, forge: true, rod: true, knife: true });
  noMat.res.food = 0; noMat.res.water = 0; noMat.res.metal = 0; noMat.res.stone = 1;
  noMat.res.herb = 0; noMat.res.goldOre = 0; noMat.res.silverOre = 0; noMat.res.copperOre = 0;
  out.push(['有设施但没材料', noMat]);

  const noStam = base();
  Object.assign(noStam.items, { fire: true, forge: true, rod: true, knife: true });
  noStam.res.food = 20; noStam.res.water = 20;
  noStam.stam = 0;
  out.push(['精力见底', noStam]);

  const lateNight = base();
  Object.assign(lateNight.items, { fire: true, forge: true, rod: true, knife: true });
  lateNight.res.food = 20; lateNight.res.water = 20;
  lateNight.hour = 23; lateNight.food = 5; lateNight.water = 5;
  out.push(['深夜 + 饥渴', lateNight]);

  const fireOff = base();
  Object.assign(fireOff.items, { fire: true });
  fireOff.offToday.fire = true;
  fireOff.res.food = 10; fireOff.res.water = 10;
  out.push(['火堆今日停摆', fireOff]);

  const fullHp = base();
  fullHp.hp = 100; fullHp.res.herb = 3;
  out.push(['满血治疗', fullHp]);

  const dead = base();
  dead.dead = true;
  out.push(['角色已死亡', dead]);

  return out;
}

test('前置检查：27 种组合（9 状态 × 3 行动）与旧实现一致', () => {
  const kinds = ['cook', 'hunt', 'heal'];
  for (const [label, state] of states()) {
    for (const kind of kinds) {
      const old = oldCheck(state, kind);
      const now = checkAction(state, kind);

      assert.equal(now.ok, old.passed, `${label} / ${kind}：能否执行不一致`);

      if (!old.passed) {
        // 旧的失败文案来自最后一条 toast；角色死亡时旧实现静默返回（没有 toast）
        if (old.toast !== undefined) {
          assert.equal(now.reason, old.toast, `${label} / ${kind}：失败原因不一致`);
        }
      }
    }
  }
});

test('全部 14 个行动：通过与否与旧实现一致（同一状态）', () => {
  const s = createNewState(NOW);
  Object.assign(s.items, { knife: true, iron: true, steel: true, rod: true, forge: true, fire: true });
  s.res.food = 20; s.res.water = 20; s.res.metal = 20; s.res.stone = 20; s.res.herb = 5;
  for (const kind of Object.keys(ACTIONS)) {
    const old = oldCheck(s, kind);
    const now = checkAction(s, kind);
    assert.equal(now.ok, old.passed, `${kind}：能否执行不一致`);
  }
});

test('未知行动 / 死亡状态：一律不可执行', () => {
  const s = createNewState(NOW);
  assert.equal(checkAction(s, 'nope').ok, false);
  s.dead = true;
  assert.equal(checkAction(s, 'chop').ok, false);
});

test('材料不足时精力不会被扣（历史坑 #4）', () => {
  const s = createNewState(NOW);
  s.items.fire = true;
  s.res.food = 0;
  const before = s.stam;
  const r = checkAction(s, 'cook');
  assert.equal(r.ok, false);
  if (r.ok === false) assert.match(r.reason, /没有生食/);
  assert.equal(s.stam, before);   // 检查失败时调用方不应再扣精力
});

test('payActionCost：正常扣、肾上腺素不扣、下限 0', () => {
  const s = createNewState(NOW);
  s.stam = 50;
  payActionCost(s, 'chop');            // chop 扣 8
  assert.equal(s.stam, 42);

  payActionCost(s, 'chop', { adrenaline: true });
  assert.equal(s.stam, 42);

  s.stam = 3;
  payActionCost(s, 'explore');         // 扣 18，夹到 0
  assert.equal(s.stam, 0);
});

test('interruptsAuto：只有手动决策类行动会打断自动', () => {
  assert.equal(interruptsAuto('explore'), true);
  assert.equal(interruptsAuto('sleep'), true);
  assert.equal(interruptsAuto('heal'), true);
  assert.equal(interruptsAuto('chop'), false);
  assert.equal(interruptsAuto('eat'), false);
  assert.equal(interruptsAuto('drink'), false);
});
