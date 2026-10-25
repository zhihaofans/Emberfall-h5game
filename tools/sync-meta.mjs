#!/usr/bin/env node
// 生成器：把「源」写进所有「生成物」，让同一事实只需要改一处。
//
// 源 ：
//   version.json   → ver / build
//   CHANGELOG.md   → 游戏内更新日志
// 生成物：
//   survival.html  const GAME_VERSION / const BUILD_CODE / const CHANGELOG
//   sw.js          const BUILD（缓存名随它变化）
//
// 用法：
//   node tools/sync-meta.mjs            写入（有改动才写，无改动是幂等的）
//   node tools/sync-meta.mjs --check    只检查，有差异则 exit 1（CI / 发布前用）
//   node tools/sync-meta.mjs --dry-run  只打印将要改什么，不写
//
// 规则见 AGENT.md §0.5。

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChangelogMd, renderChangelogJs } from './lib/changelog.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const DRY = args.includes('--dry-run');

const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const changes = [];
const same = [];

function plan(label, file, before, after) {
  if (before === after) { same.push(label); return; }
  changes.push({ label, file, before, after });
}

/* ---------- 1. 版本 / 构建号 → survival.html + sw.js ---------- */
const meta = JSON.parse(read('version.json'));
const html = read('survival.html');
const sw = read('sw.js');

if (!meta.ver || meta.build === undefined) {
  console.error('❌ version.json 缺 ver 或 build');
  process.exit(1);
}

const htmlVer = /const GAME_VERSION = '([^']+)';/.exec(html);
const htmlBuild = /const BUILD_CODE = (\d+);/.exec(html);
const swBuild = /const BUILD = '([^']*)';/.exec(sw);
if (!htmlVer || !htmlBuild || !swBuild) {
  console.error('❌ 找不到 GAME_VERSION / BUILD_CODE / sw.js BUILD，无法同步');
  process.exit(1);
}

let nextHtml = html;
nextHtml = nextHtml.replace(/const GAME_VERSION = '[^']+';/, `const GAME_VERSION = '${meta.ver}';`);
nextHtml = nextHtml.replace(/const BUILD_CODE = \d+;/, `const BUILD_CODE = ${meta.build};`);
plan('survival.html · GAME_VERSION', 'survival.html', html, nextHtml);

let nextSw = sw.replace(/const BUILD = '[^']*';/, `const BUILD = '${meta.build}';`);
plan('sw.js · BUILD', 'sw.js', sw, nextSw);

/* ---------- 2. CHANGELOG.md → survival.html 内联数组 ---------- */
const versions = parseChangelogMd(read('CHANGELOG.md'));
if (!versions.length) {
  console.error('❌ CHANGELOG.md 解析出 0 个版本，拒绝写入（多半是格式变了）');
  process.exit(1);
}
const start = nextHtml.indexOf('const CHANGELOG = [');
const end = nextHtml.indexOf('\n];', start);
if (start < 0 || end < 0) {
  console.error('❌ survival.html 里找不到内联 CHANGELOG 数组，无法同步');
  process.exit(1);
}
const rendered = renderChangelogJs(versions);
const beforeChangelog = nextHtml.slice(start, end + 3);
const afterChangelog = rendered;
if (beforeChangelog !== afterChangelog) {
  nextHtml = nextHtml.slice(0, start) + rendered + nextHtml.slice(end + 3);
  changes.push({
    label: `survival.html · CHANGELOG（${versions.length} 版 / ${versions.reduce((a, v) => a + v.notes.length, 0)} 条）`,
    file: 'survival.html',
    before: beforeChangelog,
    after: afterChangelog,
  });
} else {
  same.push(`survival.html · CHANGELOG（${versions.length} 版）`);
}

/* ---------- 3. 落盘 ---------- */
console.log(`sync-meta${CHECK ? ' --check' : DRY ? ' --dry-run' : ''} · ${ROOT}`);
console.log(`源：version.json → v${meta.ver} / build ${meta.build} · CHANGELOG.md → ${versions.length} 版\n`);

for (const s of same) console.log(`  ✓ 已一致  ${s}`);
for (const c of changes) console.log(`  ✎ 待更新  ${c.label}`);

if (!changes.length) {
  console.log('\n结果：无需改动（生成物与源一致）');
  process.exit(0);
}

if (CHECK) {
  console.log(`\n结果：${changes.length} 处与源不一致（--check 不写入）`);
  process.exit(1);
}

if (DRY) {
  console.log(`\n结果：${changes.length} 处待更新（--dry-run 未写入）`);
  process.exit(0);
}

// html 只写一次（两处改动合并）
if (changes.some((c) => c.file === 'survival.html')) writeFileSync(join(ROOT, 'survival.html'), nextHtml);
if (changes.some((c) => c.file === 'sw.js')) writeFileSync(join(ROOT, 'sw.js'), nextSw);

console.log(`\n结果：已写入 ${changes.length} 处`);
