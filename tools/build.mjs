#!/usr/bin/env node
// 构建：清产物 → vite build → 打印产物清单。
//
// 目录约定（迁移期）：
//   src/     TypeScript 源码，Vite 的 root 与入口（src/index.html）
//   dist/    纯构建产物，**不入库**；本地 preview / e2e / 部署都用它
//   根目录   旧的 survival.html / index.html 保持不动，随时可回退
//
// 下一步（TODO 2.1 之后）：把 game 逻辑从 survival.html 按 core/ 与 ui/ 两层搬进 src/。

import { rmSync, existsSync, readdirSync, statSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { gitShortSha } from './lib/git.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist');

// ---- 1. 清空产物目录（dist/ 里只有产物，没有手写文件，可以整目录删）----
if (existsSync(OUT)) {
  rmSync(OUT, { recursive: true, force: true });
  console.log('已清空 dist/');
}

// ---- 2. vite build ----
const viteBin = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
if (!existsSync(viteBin)) {
  console.error('❌ 找不到 vite：请先在仓库根执行 npm ci');
  process.exit(1);
}
const r = spawnSync(process.execPath, [viteBin, 'build'], { cwd: ROOT, stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);

// ---- 3. 复制运行时静态资源（PWA 清单 / 图标 / 启动图 / 版本 / SW）----
const COPY = ['icons', 'splash', 'screenshots', 'manifest.json', 'version.json'];
for (const item of COPY) {
  const from = join(ROOT, item);
  if (!existsSync(from)) { console.warn(`⚠ 缺少 ${item}，已跳过`); continue; }
  cpSync(from, join(OUT, item), { recursive: true });
}
console.log(`已复制静态资源：${COPY.join(' / ')}`);

// ---- 4. 生成 dist/sw.js：BUILD 取 version.json，ASSETS 按真实产物生成 ----
// 手写 ASSETS 在多文件产物下必然漏项，这里由构建生成（SSOT：产物目录是唯一源）。
const meta = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf8'));
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push({ path: p.slice(OUT.length + 1), size: st.size });
  }
  return out;
}
const walkPaths = (dir) => walk(dir).map((f) => './' + f.path.split(sep).join('/'));
const all = walkPaths(OUT);
const SKIP = new Set(['./sw.js', './version.json']); // sw 自身不入缓存；version.json 走网络优先
const assets = ['./', './index.html', ...all.filter((p) => !SKIP.has(p) && p !== './index.html').sort()];

let sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
sw = sw.replace(/const BUILD = '[^']*';/, `const BUILD = '${meta.build}';`);
sw = sw.replace(/const ASSETS = \[[\s\S]*?\];/, `const ASSETS = [\n${assets.map((a) => `  '${a}'`).join(',\n')}\n];`);
writeFileSync(join(OUT, 'sw.js'), sw);
console.log(`已生成 dist/sw.js：BUILD=${meta.build} · 预缓存 ${assets.length} 项`);

// ---- 4.5 dist/version.json 补 git hash（排查线上到底跑的是哪个提交）----
// 仓库根的 version.json 仍是唯一源（只放 ver/build），sha 是构建期派生，不写回源文件。
const commit = gitShortSha(ROOT);
const distMetaPath = join(OUT, 'version.json');
const distMeta = JSON.parse(readFileSync(distMetaPath, 'utf8'));
distMeta.sha = commit;
writeFileSync(distMetaPath, JSON.stringify(distMeta, null, 2) + '\n');

// 回读校验：dist 里的 ver/build/sha 必须与「version.json + 当前 HEAD」一致
const check = JSON.parse(readFileSync(distMetaPath, 'utf8'));
const headSha = gitShortSha(ROOT, { dirty: false });
if (check.ver !== meta.ver || String(check.build) !== String(meta.build) || check.sha !== commit) {
  console.error(`❌ dist/version.json 与源不一致：${JSON.stringify(check)}`);
  process.exit(1);
}
if (commit !== 'unknown' && !commit.startsWith(headSha)) {
  console.error(`❌ git hash 不一致：产物 ${commit} / HEAD ${headSha}`);
  process.exit(1);
}
console.log(`已写入 dist/version.json：v${meta.ver} · build ${meta.build} · git ${commit}`);

// ---- 5. 产物清单（体积异常时一眼能看出来）----
const files = walk(OUT).sort((a, b) => b.size - a.size);
const total = files.reduce((a, f) => a + f.size, 0);
console.log(`\n产物：${files.length} 个文件 / ${(total / 1024).toFixed(1)} KB`);
for (const f of files.slice(0, 8)) console.log(`  ${(f.size / 1024).toFixed(1).padStart(7)} KB  ${f.path}`);
if (files.length > 8) console.log(`  …… 其余 ${files.length - 8} 个文件略`);
