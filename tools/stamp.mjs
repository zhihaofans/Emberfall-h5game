#!/usr/bin/env node
// 版本号唯一源的操作入口：只改 version.json，然后让生成器把变化写到所有生成物。
//
// 用法：
//   node tools/stamp.mjs --bump patch --note "修了 xx"      # 版本 +1 且 build +1
//   node tools/stamp.mjs --set 3.0.0 --build 103            # 显式指定
//   node tools/stamp.mjs --build 103                        # 只动构建号
//   node tools/stamp.mjs --check                            # 只校验三处一致，不写
//
// 规则（AGENT.md §0.3）：改代码不动版本号；测试全绿后一次性 bump；BUILD 单调 +1。
// 写完会调用 tools/sync-meta.mjs（把 build 写进 sw.js），随后回读校验 —— 不一致直接 exit 1。
// M4 之后只有两处：version.json（源）与 sw.js 的 BUILD（生成物）。

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { bumpSemver, parseSemver, normalizeBuild } from './lib/version.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VERSION_PATH = join(ROOT, 'version.json');

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  if (i < 0) return undefined;
  const v = args[i + 1];
  if (!v || v.startsWith('--')) throw new Error(`${f} 需要参数`);
  return v;
};

const CHECK = has('--check');
const NO_SYNC = has('--no-sync');

/**
 * 一致性校验：version.json 的 build 必须等于 sw.js 的 BUILD。
 * （M4 之后不再有 survival.html 的 GAME_VERSION，版本号由构建期从 version.json 注入。）
 * @param {string} ver
 * @param {number} build
 */
function verify(ver, build) {
  const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  const mSw = /const BUILD = '([^']*)'/.exec(sw);
  const problems = [];
  if (!mSw || mSw[1] !== String(build)) problems.push(`sw.js BUILD=${mSw ? mSw[1] : '缺失'}（期望 ${build}）`);
  if (ver !== JSON.parse(readFileSync(VERSION_PATH, 'utf8')).ver) problems.push(`version.json ver 读取不一致（期望 ${ver}）`);
  return problems;
}

try {
  const meta = JSON.parse(readFileSync(VERSION_PATH, 'utf8'));

  if (CHECK) {
    const problems = verify(meta.ver, meta.build);
    if (problems.length) {
      console.error(`❌ 版本不一致：\n  ${problems.join('\n  ')}`);
      process.exit(1);
    }
    console.log(`✅ 一致：v${meta.ver} · build ${meta.build} · sw.js BUILD`);
    process.exit(0);
  }

  // ---- 计算新值 ----
  const setVer = val('--set');
  const bump = val('--bump');
  const setBuild = val('--build');
  const note = val('--note');

  if (!setVer && !bump && !setBuild && note === undefined) {
    console.error('用法：node tools/stamp.mjs --bump patch|minor|major [--build N] [--note 说明]');
    console.error('      node tools/stamp.mjs --set 3.0.0 [--build N]');
    console.error('      node tools/stamp.mjs --check');
    process.exit(2);
  }

  let ver = meta.ver;
  if (setVer) {
    parseSemver(setVer); // 格式不对直接抛
    ver = setVer.trim();
  } else if (bump) {
    ver = bumpSemver(meta.ver, bump);
  }

  // 版本变了但没给 --build：构建号照规则 +1；只动 build 时按给定值
  const build = setBuild !== undefined
    ? normalizeBuild(setBuild)
    : ver !== meta.ver
      ? normalizeBuild(Number(meta.build) + 1)
      : Number(meta.build);

  if (ver === meta.ver && build === Number(meta.build) && note === undefined) {
    console.log(`版本没变（v${ver} · build ${build}），未写入`);
    process.exit(0);
  }

  // ---- 写入唯一源 ----
  const next = {
    ver,
    build,
    name: meta.name,
    en: meta.en,
    note: note !== undefined ? note : meta.note,
  };
  writeFileSync(VERSION_PATH, JSON.stringify(next, null, 2) + '\n');
  console.log(`已更新 version.json：v${meta.ver} build ${meta.build} → v${ver} build ${build}`);

  // ---- 生成物 ----
  if (!NO_SYNC) {
    const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'sync-meta.mjs')], { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) {
      console.error('❌ sync-meta 失败，生成物可能没跟上');
      process.exit(r.status ?? 1);
    }
  }

  const problems = verify(ver, build);
  if (problems.length) {
    console.error(`❌ 写入后仍不一致：\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`✅ v${ver} · build ${build} → version.json 与 sw.js BUILD 已同步`);
  console.log('下一步：补 CHANGELOG.md 条目（若--note 未覆盖）→ npm run build → tools/package.mjs');
} catch (err) {
  console.error(`❌ ${/** @type {Error} */ (err).message}`);
  process.exit(1);
}
