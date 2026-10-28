// 错误过滤：跨域脱敏错误与良性告警不应写进游戏日志
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isIgnorableScriptError } from '../../src/core/errors.mjs';

test('跨域脱敏错误（切全屏时常见）应被忽略', () => {
  assert.equal(isIgnorableScriptError({ message: 'Script error.', filename: '', lineno: 0, error: null }), true);
  assert.equal(isIgnorableScriptError({ message: 'Script error', filename: '', error: undefined }), true);
  assert.equal(isIgnorableScriptError({ message: 'SCRIPT ERROR.' }), true);
});

test('我们自己的异常带文件名/行号，必须照常记录', () => {
  assert.equal(isIgnorableScriptError({
    message: "Cannot read properties of undefined (reading 'x')",
    filename: 'https://example.com/assets/index-abc.js',
    lineno: 120,
    error: new Error('boom'),
  }), false);
  assert.equal(isIgnorableScriptError({ message: 'Script error.', filename: '/assets/index.js', lineno: 1 }), false);
});

test('ResizeObserver 循环告警是良性噪音，忽略', () => {
  assert.equal(isIgnorableScriptError({ message: 'ResizeObserver loop completed with undelivered notifications.' }), true);
  assert.equal(isIgnorableScriptError({ message: 'ResizeObserver loop limit exceeded' }), true);
});

test('普通业务错误不被误吞', () => {
  assert.equal(isIgnorableScriptError({ message: '存档解析失败', filename: 'app.js', lineno: 3, error: new Error('x') }), false);
  assert.equal(isIgnorableScriptError({}), false);
});
