#!/usr/bin/env node
// e2e 统一入口：串行跑 puppeteer 用例并汇总。
//
// 为什么需要它：原来的用例散在 tests/ 下、由 release.sh 里的 bash 循环调用，
// 本地与 CI 各写一套容易漂移。这里只留一个入口。
//
// 用法（M4 之后默认跑新架构）：
//   node tests/run-e2e.mjs            跑新架构冒烟（tests/app.js，需先 npm run build）
//   node tests/run-e2e.mjs --legacy   跑旧 survival.html 的 15 个历史用例（冻结基准）
//   node tests/run-e2e.mjs --all      跑 tests/ 下全部用例
//   node tests/run-e2e.mjs app.js     只跑指定文件
//
// 环境：CHROMIUM_PATH 可指定浏览器（默认 /usr/bin/chromium）。
// 退出码：0 = 全绿；1 = 有用例失败或无断言。

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TESTS = dirname(fileURLToPath(import.meta.url));
const TIMEOUT_MS = 180_000;

// 新架构的默认用例（对 dist/ 做真浏览器冒烟）
const NEW_SUITE = ['app.js', 'install.js'];

// 旧单文件版本的历史用例（对 legacy/survival.html；仅 --legacy 时跑）
const LEGACY_WHITELIST = [
  'test.js', 'version.js', 'melvor.js', 'regress.js', 'layout.js',
  'v1100.js', 'v1110.js', 'v1111.js', 'v1120.js', 'v1220.js', 'v1230.js',
  'v1298.js', 'v1299.js', 'v1300.js', 'v200.js',
];

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const given = args.filter((a) => !a.startsWith('--'));

let files;
if (given.length) {
  files = given;
} else if (flags.includes('--all')) {
  files = readdirSync(TESTS)
    .filter((f) => f.endsWith('.js') && !['run-e2e.mjs', '_env.js'].includes(f))
    .sort();
} else if (flags.includes('--legacy')) {
  files = LEGACY_WHITELIST;
} else {
  files = NEW_SUITE;
}

const results = [];
let totalPass = 0;
let totalFail = 0;

console.log(`e2e · ${files.length} 个用例文件 · CHROMIUM_PATH=${process.env.CHROMIUM_PATH || '(默认 /usr/bin/chromium)'}\n`);

for (const f of files) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [f], {
    cwd: TESTS,
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    env: process.env,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const pass = (out.match(/✅/g) || []).length;
  const fail = (out.match(/❌/g) || []).length;
  const ms = Date.now() - t0;

  // 进程没跑起来（缺依赖 / 浏览器崩）也要算失败，不能只看 ✅/❌ 计数
  const crashed = r.error || r.signal || (r.status !== 0 && fail === 0);
  totalPass += pass;
  totalFail += fail;

  const status = crashed && fail === 0 ? '💥' : fail ? '❌' : '✅';
  console.log(`${status} ${f.padEnd(14)} ${String(pass).padStart(3)} 通过 / ${String(fail).padStart(2)} 失败  ${ms}ms`);

  if (crashed && fail === 0) {
    const tail = out.trim().split('\n').slice(-3).join(' | ');
    const why = `${r.error ? r.error.message : r.signal || 'exit ' + r.status}${tail ? ' · ' + tail : ''}`;
    console.log(`     运行异常：${why}`);
    // GitHub Actions 会把这行变成 annotation，便于匿名 API 读出失败原因
    console.log(`::error file=tests/${f}::运行异常（0 断言）：${why.slice(0, 200)}`);
    results.push({ f, crashed: true });
  } else if (fail) {
    const detail = out.split('\n').filter((l) => l.includes('❌')).slice(0, 5);
    for (const line of detail) console.log('     ' + line.trim());
    console.log(`::error file=tests/${f}::${fail} 项断言失败：${detail[0] ? detail[0].trim().slice(0, 180) : ''}`);
    results.push({ f, crashed: false });
  }
}

const bad = results.length;
console.log('');
if (!totalPass && !totalFail) {
  console.log('结果：0 项断言被执行（用例没有真正运行，多半是浏览器不可用）');
  process.exit(1);
}
if (bad) {
  console.log(`结果：${bad}/${files.length} 个文件有问题 · 共 ${totalPass} 通过 / ${totalFail} 失败`);
  console.log(`::error::e2e 失败：${bad}/${files.length} 个文件（明细见上面的 annotation）`);
  process.exit(1);
}
console.log(`结果：全部通过 · ${files.length} 个文件 / ${totalPass} 项断言`);
process.exit(0);
