// 自动放置循环单测：startAuto / stopAuto / nextAutoAction
//
// 对拍对象是 survival.html 的同名函数（渲染与 setInterval 已桩掉）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { ACTIONS } from '../../src/core/data/actions.mjs';
import { startAuto, stopAuto, nextAutoAction } from '../../src/core/actions.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'legacy/survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

/** 在 vm 里重建旧实现（渲染/计时器/行动执行全部桩掉） */
function buildOld() {
  const a = html.indexOf('function startAuto(kind){');
  const b = html.indexOf('setInterval(gameTick, 1600);', a);
  if (a < 0 || b < 0) throw new Error('切片失败');
  const env = { ACTIONS, __logs: [], __renders: 0, __actions: [], pendingEvent: null, combat: null };
  vm.createContext(env);
  vm.runInContext(`
    function log(m,c){ __logs.push({text:m, cls:c||'sys'}) }
    function renderActive(){ __renders++ }
    function renderActions(){ __renders++ }
    function save(){}
    function doAction(k){ __actions.push(k) }
    ${html.slice(a, b)}
    globalThis.__startAuto = startAuto;
    globalThis.__stopAuto = stopAuto;
    globalThis.__gameTick = gameTick;
  `, env);
  return env;
}
const env = buildOld();

function oldStart(state, kind) {
  env.G = state;
  env.__logs.length = 0;
  env.__actions.length = 0;
  env.__startAuto(kind);
  return { logs: JSON.parse(JSON.stringify(env.__logs)), actions: [...env.__actions] };
}
function oldStop(state, silent) {
  env.G = state;
  env.__logs.length = 0;
  env.__stopAuto(silent);
  return { logs: JSON.parse(JSON.stringify(env.__logs)) };
}
function oldTick(state, blocked) {
  env.G = state;
  env.__actions.length = 0;
  env.__logs.length = 0;
  // pendingEvent / combat 是旧实现的全局，这里用临时全局模拟
  if (blocked !== undefined) {
    if (blocked === 'event') env.pendingEvent = {};
    if (blocked === 'combat') env.combat = {};
  }
  env.__gameTick();
  env.pendingEvent = null;
  env.combat = null;
  return { actions: [...env.__actions] };
}

test('startAuto：只有 auto 行动能开启，日志与旧实现一致', () => {
  for (const kind of Object.keys(ACTIONS)) {
    const s1 = createNewState(NOW);
    const old = oldStart(s1, kind);

    const s2 = createNewState(NOW);
    const now = startAuto(s2, kind);

    assert.equal(s2.autoAction, s1.autoAction, `${kind}：autoAction 不一致`);
    assert.equal(now.ok, !!ACTIONS[kind].auto, `${kind}：可否自动不一致`);
    assert.deepEqual(now.logs, old.logs, `${kind}：日志不一致`);
  }
});

test('startAuto：非法行动不会改变状态', () => {
  const s = createNewState(NOW);
  s.autoAction = 'chop';
  const r = startAuto(s, 'nope');
  assert.equal(r.ok, false);
  assert.equal(s.autoAction, 'chop');   // 原实现直接 return，不清空
});

test('stopAuto：静默与非静默的日志差异', () => {
  const s1 = createNewState(NOW);
  s1.autoAction = 'chop';
  const loud = stopAuto(s1, false);
  assert.equal(s1.autoAction, null);
  assert.deepEqual(loud.logs, [{ text: '⏹ 停止自动行动。', cls: 'sys' }]);

  const s2 = createNewState(NOW);
  s2.autoAction = 'chop';
  const silent = stopAuto(s2, true);
  assert.equal(s2.autoAction, null);
  assert.deepEqual(silent.logs, []);

  // 本来就没在自动：什么都不发生，也不写日志
  const s3 = createNewState(NOW);
  const none = stopAuto(s3, false);
  assert.deepEqual(none.logs, []);
});

test('nextAutoAction：正常执行 / 死亡停止 / 弹窗暂停 / 失效清除', () => {
  // 正常
  const s = createNewState(NOW);
  s.autoAction = 'chop';
  assert.deepEqual(nextAutoAction(s), { action: 'chop' });

  // 死亡 → 静默停止
  const dead = createNewState(NOW);
  dead.autoAction = 'chop';
  dead.dead = true;
  const r1 = nextAutoAction(dead);
  assert.equal(r1.action, null);
  assert.equal(r1.stopped, true);
  assert.equal(dead.autoAction, null);

  // 有弹窗/战斗 → 跳过但不停止
  const busy = createNewState(NOW);
  busy.autoAction = 'chop';
  const r2 = nextAutoAction(busy, { blocked: true });
  assert.equal(r2.action, null);
  assert.equal(busy.autoAction, 'chop');

  // 没有自动行动
  const idle = createNewState(NOW);
  assert.deepEqual(nextAutoAction(idle), { action: null });

  // 记录里是个非法行动 → 清空
  const bad = createNewState(NOW);
  bad.autoAction = 'nope';
  const r3 = nextAutoAction(bad);
  assert.equal(r3.action, null);
  assert.equal(r3.cleared, true);
  assert.equal(bad.autoAction, null);
});

test('对拍：gameTick 在四种状态下的行为与旧实现一致', () => {
  const cases = [
    ['正常自动', (s) => { s.autoAction = 'chop'; }],
    ['死亡', (s) => { s.autoAction = 'chop'; s.dead = true; }],
    ['已停止', (s) => { s.autoAction = null; }],
    ['非法记录', (s) => { s.autoAction = 'nope'; }],
  ];
  for (const [label, setup] of cases) {
    const s1 = createNewState(NOW);
    setup(s1);
    const old = oldTick(s1);

    const s2 = createNewState(NOW);
    setup(s2);
    const r = nextAutoAction(s2);

    const oldActions = old.actions;
    const newActions = r.action ? [r.action] : [];
    assert.deepEqual(newActions, oldActions, `${label}：执行的行动不一致`);
    assert.equal(s2.autoAction, s1.autoAction, `${label}：autoAction 不一致`);
  }
});

test('对拍：有事件弹窗时 gameTick 不执行行动', () => {
  const s1 = createNewState(NOW);
  s1.autoAction = 'chop';
  const old = oldTick(s1, 'event');
  assert.deepEqual(old.actions, []);

  const s2 = createNewState(NOW);
  s2.autoAction = 'chop';
  const r = nextAutoAction(s2, { blocked: true });
  assert.equal(r.action, null);
});
