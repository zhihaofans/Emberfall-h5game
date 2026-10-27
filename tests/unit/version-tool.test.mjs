// 版本号运算（tools/lib/version.mjs）：stamp 的行为基准
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSemver, bumpSemver, normalizeBuild } from '../../tools/lib/version.mjs';

test('parseSemver：接受 X.Y.Z，拒绝其它写法', () => {
  assert.deepEqual(parseSemver('2.0.0'), { major: 2, minor: 0, patch: 0 });
  assert.deepEqual(parseSemver('10.30.2'), { major: 10, minor: 30, patch: 2 });
  for (const bad of ['3.0', 'v3.0.0', '3.0.0-beta', '', 'abc']) {
    assert.throws(() => parseSemver(bad), /版本号格式不合法/, `应拒绝 ${bad}`);
  }
});

test('bumpSemver：major / minor / patch 的进位规则', () => {
  assert.equal(bumpSemver('2.0.0', 'major'), '3.0.0');
  assert.equal(bumpSemver('2.1.3', 'minor'), '2.2.0');
  assert.equal(bumpSemver('2.1.3', 'patch'), '2.1.4');
  assert.equal(bumpSemver('1.30.2', 'patch'), '1.30.3');
  assert.equal(bumpSemver('1.30.2', 'minor'), '1.31.0');
  assert.equal(bumpSemver('0.9.9', 'minor'), '0.10.0');
});

test('bumpSemver：未知类型直接抛错（不要静默当成 patch）', () => {
  assert.throws(() => bumpSemver('1.0.0', 'build'), /未知的升级类型/);
});

test('normalizeBuild：只接受正整数', () => {
  assert.equal(normalizeBuild(103), 103);
  assert.equal(normalizeBuild('104'), 104);
  for (const bad of [0, -1, 1.5, 'abc', '', null]) {
    assert.throws(() => normalizeBuild(bad), /构建号必须是正整数/, `应拒绝 ${String(bad)}`);
  }
});
