// CHANGELOG 解析 / 渲染的单测（纯函数，本地与 CI 都能跑）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChangelogMd, parseChangelogInline, renderChangelogJs } from '../../tools/lib/changelog.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const md = readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf8');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');

test('解析真实 CHANGELOG.md：75 个版本 / 216 条更新', () => {
  const v = parseChangelogMd(md);
  assert.equal(v.length, 75);
  assert.equal(v.reduce((a, x) => a + x.notes.length, 0), 216);
});

test('版本顺序是最新在前，且每条都有标题', () => {
  const v = parseChangelogMd(md);
  assert.equal(v[0].ver, '2.0.0');
  assert.equal(v[v.length - 1].ver, '1.0.0');
  for (const x of v) assert.ok(x.title.length > 0, `v${x.ver} 缺标题`);
});

test('渲染结果与 survival.html 里的内联数组逐字节一致（幂等基线）', () => {
  const s = html.indexOf('const CHANGELOG = [');
  const e = html.indexOf('\n];', s);
  const inline = html.slice(s, e + 3);
  assert.equal(renderChangelogJs(parseChangelogMd(md)), inline);
});

test('解析内联数组得到的结构与 md 一致', () => {
  assert.deepEqual(parseChangelogInline(html), parseChangelogMd(md));
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
