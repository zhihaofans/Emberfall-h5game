// CHANGELOG 解析 / 渲染的单测（纯函数，本地与 CI 都能跑）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChangelogMd, parseChangelogInline, renderChangelogJs } from '../../tools/lib/changelog.mjs';
import {
  parseChangelogMd as parseFromSrc, changelogStats, VERSION_RULES,
} from '../../src/core/changelog.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const md = readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf8');
const html = readFileSync(resolve(ROOT, 'legacy/survival.html'), 'utf8');

test('解析真实 CHANGELOG.md：条目数覆盖 3.0.0 之前的历史（>= 75 版）', () => {
  const v = parseChangelogMd(md);
  assert.ok(v.length >= 75, `版本数异常：${v.length}`);
  assert.ok(v.reduce((a, x) => a + x.notes.length, 0) >= 216, '条目数异常');
});

test('版本顺序是最新在前，且每条都有标题', () => {
  const v = parseChangelogMd(md);
  const first = /^## v([0-9.]+) · /m.exec(md)[1];
  assert.equal(v[0].ver, first, '第一条必须与 md 的首个版本标题一致');
  assert.equal(v[v.length - 1].ver, '1.0.0');
  for (const x of v) assert.ok(x.title.length > 0, `v${x.ver} 缺标题`);
});

test('单引号与反斜杠能原样往返（不会写坏源码）', () => {
  const tricky = [{ ver: '9.9.9', date: '2026-01-01', title: "it's a \\ test", notes: ["can't stop", 'back\\slash'] }];
  const js = renderChangelogJs(tricky);
  const src = `let x = 1;\n${js}\nconst TAIL = 1;\n`;
  // 用真正的解析器验证生成的代码没有语法错误
  assert.doesNotThrow(() => new Function(src));
  const parsed = parseChangelogInline(src);
  assert.deepEqual(parsed, tricky);
});

test('空输入返回空数组，不抛错', () => {
  assert.deepEqual(parseChangelogMd(''), []);
  assert.deepEqual(parseChangelogInline('const A = 1;'), []);
});

test('解析器只有一份实现：tools 侧 re-export 的就是 src 里那个函数', () => {
  assert.equal(parseChangelogMd, parseFromSrc);
});

test('概览数字：与解析结果一致', () => {
  const entries = parseFromSrc(md);
  const st = changelogStats(entries);
  assert.equal(st.versions, entries.length);
  assert.equal(st.notes, entries.reduce((a, e) => a + e.notes.length, 0));
  assert.equal(st.latest.ver, entries[0].ver);
  assert.deepEqual(changelogStats([]), { versions: 0, notes: 0, latest: null });
});

test('版本号唯一且严格降序（新版本在前）', () => {
  const vers = parseFromSrc(md).map((e) => e.ver);
  assert.equal(new Set(vers).size, vers.length, '有重复版本号');
  const num = (v) => v.split('.').map(Number);
  for (let i = 1; i < vers.length; i++) {
    const [a1, a2, a3] = num(vers[i - 1]);
    const [b1, b2, b3] = num(vers[i]);
    const desc = a1 !== b1 ? a1 > b1 : a2 !== b2 ? a2 > b2 : a3 > b3;
    assert.ok(desc, `${vers[i - 1]} 应排在 ${vers[i]} 之前`);
  }
});

test('版本规则：三条，MAJOR 的定义与重构口径一致', () => {
  assert.equal(VERSION_RULES.length, 3);
  assert.deepEqual(VERSION_RULES.map((r) => r[0].split(' · ')[0]), ['MAJOR', 'MINOR', 'PATCH']);
  const major = VERSION_RULES[0][1];
  assert.match(major, /运行形态/);
  assert.match(major, /工程结构/);
  assert.match(major, /存档不兼容/);
});

