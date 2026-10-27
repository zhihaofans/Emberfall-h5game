#!/usr/bin/env node
// 打包：把 dist/ 打成 末日余烬-<ver>.zip（只含运行时文件）。
//
// 前置：先 npm run build（dist/ 里必须是刚构建的产物）。
// 校验：dist/version.json ↔ dist/sw.js 的 BUILD ↔ 包内文件；包时间必须晚于所有产物。
//
// 为什么用系统 zip：Node 没有内置 zip 写入器；为一次打包引入 archiver/jszip 不划算。
// 系统没有 zip 时会明确报错（而不是静默产出空包）。

import { readFileSync, existsSync, statSync, rmSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!existsSync(join(DIST, 'index.html'))) fail('dist/ 不存在或没有 index.html：请先 npm run build');
if (!existsSync(join(DIST, 'version.json'))) fail('dist/version.json 缺失：请重新 npm run build');

const meta = JSON.parse(readFileSync(join(DIST, 'version.json'), 'utf8'));
const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
const swBuild = /const BUILD = '([^']*)'/.exec(sw);
if (!swBuild) fail('dist/sw.js 里找不到 BUILD（构建脚本没注入？）');
if (String(meta.build) !== swBuild[1]) fail(`版本不一致：dist/version.json build=${meta.build}，sw.js BUILD=${swBuild[1]}`);

const zipName = `末日余烬-${meta.ver}.zip`;
const zipPath = join(ROOT, zipName);
if (existsSync(zipPath)) rmSync(zipPath);

const zip = spawnSync('zip', ['-q', '-r', zipPath, '.'], { cwd: DIST });
if (zip.error || zip.status !== 0) {
  fail(`打包失败（需要系统 zip）：${zip.error ? zip.error.message : `exit ${zip.status}`}`);
}

// ---- 包内一致性 ----
const inZip = spawnSync('unzip', ['-p', zipPath, 'version.json'], { encoding: 'utf8' });
if (inZip.status !== 0) fail('读不到包内 version.json');
const zipMeta = JSON.parse(inZip.stdout);
const zipSw = spawnSync('unzip', ['-p', zipPath, 'sw.js'], { encoding: 'utf8' });
const zipBuild = /const BUILD = '([^']*)'/.exec(zipSw.stdout || '');
if (zipMeta.ver !== meta.ver || String(zipMeta.build) !== swBuild[1] || !zipBuild || zipBuild[1] !== swBuild[1]) {
  fail(`包内版本不一致：${JSON.stringify(zipMeta)} / BUILD=${zipBuild ? zipBuild[1] : '缺失'}（期望 v${meta.ver} build ${swBuild[1]}）`);
}

// ---- 新鲜度：包必须晚于所有产物文件 ----
const zipTime = statSync(zipPath).mtimeMs;
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  const st = statSync(p);
  return st.isDirectory() ? walk(p) : [{ path: p, mtime: st.mtimeMs }];
});
const newer = walk(DIST).filter((f) => f.mtime > zipTime + 1000);
if (newer.length) {
  console.warn(`⚠ 包后又有产物更新，可能已过期：\n  ${newer.slice(0, 5).map((f) => f.path).join('\n  ')}`);
}

const sizeKb = (statSync(zipPath).size / 1024).toFixed(1);
console.log(`✅ 已打包：${zipName}（${sizeKb} KB）`);
console.log(`   版本：v${meta.ver} · build ${meta.build} · git ${meta.sha || 'unknown'}`);
console.log('   下一步：git tag v' + meta.ver + '（commit/tag 由你执行）');
