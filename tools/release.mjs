#!/usr/bin/env node
// 发布流水线（替代旧的 release.sh 主体）：
//   SSOT 校验 → 类型检查 → 单元测试 →（可选 e2e）→ 构建 → 打包
//
// 不碰 git：commit / tag / push 由人确认后执行（TODO 5.4）。
// 用法：
//   node tools/release.mjs            # 本地全流程（无浏览器）
//   node tools/release.mjs --e2e      # 额外跑真浏览器 e2e（需要 Chromium）
//   node tools/release.mjs --no-package
//
// 版本号请先用 `node tools/stamp.mjs --bump patch --note "..."` 改好。

import { readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const withE2e = args.includes('--e2e');
const withPackage = !args.includes('--no-package');

/**
 * @param {string} label
 * @param {string} cmd
 * @param {string[]} cmdArgs
 */
function run(label, cmd, cmdArgs) {
  console.log(`\n=== ${label} ===`);
  const r = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit' });
  if (r.error) {
    console.error(`❌ ${label} 无法执行：${r.error.message}`);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(`❌ ${label} 失败（exit ${r.status}）`);
    process.exit(r.status ?? 1);
  }
}

const unitFiles = readdirSync(join(ROOT, 'tests', 'unit'))
  .filter((f) => f.endsWith('.test.mjs'))
  .sort()
  .map((f) => join('tests', 'unit', f));

run('SSOT 校验', process.execPath, ['tools/check-ssot.mjs']);
run('类型检查', 'npm', ['run', '--silent', 'typecheck']);
run('单元测试', process.execPath, ['--test', '--test-concurrency=1', ...unitFiles]);
if (withE2e) run('e2e（真浏览器）', process.execPath, ['tests/run-e2e.mjs']);
else console.log('\n（跳过 e2e：本地没浏览器时以 CI 为准；需要时加 --e2e）');

run('构建 dist/', process.execPath, ['tools/build.mjs']);
if (withPackage) run('打包', process.execPath, ['tools/package.mjs']);

console.log('\n✅ 流水线完成。接下来由你确认并执行：');
console.log('   git add -A && git commit -m "v<ver> · <说明>"');
console.log('   git tag -a v<ver> -m "v<ver> · <说明>"');
console.log('   git push origin master --tags   （CI 全绿后 Deploy workflow 会自动发 Pages）');
