#!/usr/bin/env node
// 构建：清产物 → vite build → 打印产物清单。
//
// 目录约定（迁移期）：
//   src/     TypeScript 源码，Vite 的 root 与入口（src/index.html）
//   dist/    纯构建产物，**不入库**；本地 preview / e2e / 部署都用它
//   根目录   旧的 survival.html / index.html 保持不动，随时可回退
//
// 下一步（TODO 2.1 的剩余部分）：把 icons/ splash/ screenshots/ manifest.json
// sw.js version.json 复制进 dist/，并注入 SW 预缓存清单。

import { rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

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

// ---- 3. 产物清单（体积异常时一眼能看出来）----
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
const files = walk(OUT).sort((a, b) => b.size - a.size);
const total = files.reduce((a, f) => a + f.size, 0);
console.log(`\n产物：${files.length} 个文件 / ${(total / 1024).toFixed(1)} KB`);
for (const f of files.slice(0, 8)) console.log(`  ${(f.size / 1024).toFixed(1).padStart(7)} KB  ${f.path}`);
if (files.length > 8) console.log(`  …… 其余 ${files.length - 8} 个文件略`);
