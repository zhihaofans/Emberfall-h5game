// 启动守卫的纯逻辑（不碰 DOM / SW）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  readGuard, guardStart, guardMarkBooted, guardRecord,
} from '../../src/dev/guard.mjs';

/** 内存版 Storage */
function memStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    _m: m,
  };
}

const T0 = 1_700_000_000_000;

test('正常启动：先写哨兵，成功后清掉，下一次不会误报', () => {
  const st = memStorage();
  assert.deepEqual(guardStart(st, T0), { recovered: false, lastError: null });
  assert.ok(st.getItem('ember_boot_sentinel'), '启动前应写哨兵');
  guardMarkBooted(st);
  assert.equal(st.getItem('ember_boot_sentinel'), null);
  assert.deepEqual(guardStart(st, T0 + 60_000), { recovered: false, lastError: null });
});

test('启动到一半崩了：哨兵残留 → 下次 recovered=true', () => {
  const st = memStorage();
  guardStart(st, T0);
  // 没有 guardMarkBooted（模拟崩溃）
  const g = guardStart(st, T0 + 5 * 60_000);
  assert.equal(g.recovered, true);
});

test('超过 1 小时的哨兵视为过期，不打扰玩家', () => {
  const st = memStorage();
  guardStart(st, T0);
  assert.equal(readGuard(st, T0 + 2 * 3600_000).recovered, false);
});

test('时钟回拨（now < 哨兵时间）不误判', () => {
  const st = memStorage();
  guardStart(st, T0);
  assert.equal(readGuard(st, T0 - 60_000).recovered, false);
});

test('错误记录会带到下一次启动的降级页', () => {
  const st = memStorage();
  guardRecord(new Error('Cannot read properties of undefined'), st);
  const g = guardStart(st, T0);
  assert.equal(g.lastError, 'Cannot read properties of undefined');
});

test('坏掉的哨兵 JSON 不抛错，按「没有记录」处理', () => {
  const st = memStorage({ ember_boot_sentinel: '{oops' });
  assert.deepEqual(readGuard(st, T0), { recovered: false, lastError: null });
});

test('guardMarkBooted 同时清掉错误记录', () => {
  const st = memStorage();
  guardRecord('boom', st);
  guardStart(st, T0);
  guardMarkBooted(st);
  assert.equal(st.getItem('ember_last_error'), null);
});
