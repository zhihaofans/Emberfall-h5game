// 版本展示（TODO §5.8）：游戏内所有版本号文案必须从这里拼
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { versionLabel } from '../../src/core/version.mjs';
import { gitShortSha } from '../../tools/lib/git.mjs';

test('三件套齐全：ver · build · sha', () => {
  assert.equal(versionLabel('2.0.0', 102, 'd87fc72'), 'v2.0.0 · build 102 · d87fc72');
  assert.equal(versionLabel('3.0.0', '103', 'abc1234-dirty'), 'v3.0.0 · build 103 · abc1234-dirty');
});

test('缺 sha 时只显示版本与构建号（无 git 环境的 zip / 解压包）', () => {
  assert.equal(versionLabel('2.0.0', 102), 'v2.0.0 · build 102');
  assert.equal(versionLabel('2.0.0', 102, ''), 'v2.0.0 · build 102');
  assert.equal(versionLabel('2.0.0', 102, null), 'v2.0.0 · build 102');
});

test('build 为 0 / 空串时不显示 build 段（build 0 是合法值）', () => {
  assert.equal(versionLabel('1.0.0', 0, 'abc1234'), 'v1.0.0 · build 0 · abc1234');
  assert.equal(versionLabel('1.0.0', '', 'abc1234'), 'v1.0.0 · abc1234');
});

test('gitShortSha：仓库内返回 7 位短 hash（脏工作区可带 -dirty）', () => {
  const sha = gitShortSha(process.cwd());
  assert.ok(sha === 'unknown' || /^[0-9a-f]{7}(-dirty)?$/.test(sha), `意外格式: ${sha}`);
});

test('gitShortSha：非 git 目录返回 unknown，不抛错', () => {
  assert.equal(gitShortSha('/tmp'), 'unknown');
});
