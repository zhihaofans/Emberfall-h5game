#!/usr/bin/env node
// 生成器：把「源」写进「生成物」，让同一事实只需要改一处。
//
// 源 ：version.json → build
// 生成物：sw.js 的 BUILD（缓存名随它变化）
//
// M4（2026-10-27）之后不再生成 survival.html：
//   旧文件已冻结到 legacy/survival.html（2.0.0 原样，单测对拍基准，不随版本更新）；
//   新架构的版本号由构建期从 version.json 注入（vite define __APP_VERSION__），
//   更新日志运行时直读 CHANGELOG.md（Vite ?raw），都不需要内联生成。
//
// 用法：
//   node tools/sync-meta.mjs            写入（有改动才写，无改动是幂等的）
//   node tools/sync-meta.mjs --check    只检查，有差异则 exit 1（CI / 发布前用）
//   node tools/sync-meta.mjs --dry-run  只打印将要改什么，不写
//
// 规则见 AGENT.md §0.6。

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const DRY = args.includes('--dry-run');

const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const meta = JSON.parse(read('version.json'));
if (!meta.ver || meta.build === undefined) {
  console.error('❌ version.json 缺 ver 或 build');
  process.exit(1);
}

const sw = read('sw.js');
const swBuild = /const BUILD = '([^']*)';/.exec(sw);
if (!swBuild) {
  console.error('❌ 找不到 sw.js 的 BUILD 常量，无法同步');
  process.exit(1);
}

const nextSw = sw.replace(/const BUILD = '[^']*';/, `const BUILD = '${meta.build}';`);
const changed = nextSw !== sw;

console.log(`sync-meta${CHECK ? ' --check' : DRY ? ' --dry-run' : ''} · ${ROOT}`);
console.log(`源：version.json → v${meta.ver} / build ${meta.build}\n`);
console.log(`  ${changed ? '✎ 待更新' : '✓ 已一致'}  sw.js · BUILD（当前 '${swBuild[1]}'）`);

if (!changed) {
  console.log('\n结果：无需改动（生成物与源一致）');
  process.exit(0);
}

if (CHECK) {
  console.log('\n结果：1 处与源不一致（--check 不写入）');
  process.exit(1);
}

if (DRY) {
  console.log('\n结果：1 处待更新（--dry-run 未写入）');
  process.exit(0);
}

writeFileSync(join(ROOT, 'sw.js'), nextSw);
console.log('\n结果：已写入 1 处');
