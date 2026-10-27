#!/usr/bin/env node
// 单一数据源（SSOT）校验：只读，不改任何文件。
//
// 目的：把"同一事实存在于多处"的地方钉住。任何一处漂移就 exit 1，发布前必须绿。
// 规则见 AGENT.md §0.5；计划见 dev-docs/TODO.md P0-2.4。
//
// 用法：node tools/check-ssot.mjs
// 退出码：0 = 全部一致；1 = 有失败项（会打印具体差异）

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChangelogMd } from './lib/changelog.mjs';
import { objectBody, topLevelKeys, flatKeys } from './lib/source.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));
const exists = (p) => existsSync(join(ROOT, p));

let pass = 0;
const fails = [];
/** checkLockfile 里用来避免与记录器 bad() 同名 */
let bad_ = () => {};
const warns = [];

function ok(name, detail) {
  pass++;
  console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`);
}
function bad(name, detail) {
  fails.push({ name, detail });
  console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
}
bad_ = bad;
function warn(name, detail) {
  warns.push({ name, detail });
  console.log(`  ⚠️  ${name}${detail ? ' — ' + detail : ''}`);
}

/* ---------- 通用解析工具：见 tools/lib/source.mjs（与单测共用） ---------- */

// 把 md 里的 CHANGELOG 解成 [{ver,date,title,notes[]}] —— 实现在 tools/lib/changelog.mjs（与 sync-meta 共用）

/* ---------- 1. 版本号 / 构建号 ---------- */
// M4 之后唯一源是 version.json；survival.html 已冻结到 legacy/，不再参与版本同步。
function checkVersion() {
  console.log('[1/7] 版本与构建号');
  const sw = read('sw.js');
  const meta = readJson('version.json');

  const sb = /const BUILD = '([^']*)'/.exec(sw)?.[1];
  if (!sb) return bad('sw.js 里找不到 BUILD');
  if (String(meta.build) !== sb) bad('version.json.build ≠ sw.js BUILD', `${meta.build} vs ${sb}`);
  else ok('build 一致', `build ${sb}`);
  ok('ver 来自唯一源', `v${meta.ver}`);
  const cacheOk = /const CACHE = 'emberfall-' \+ BUILD;/.test(sw);
  if (!cacheOk) bad('sw.js 的 CACHE 不是「前缀 + BUILD」拼接式');
  else ok('缓存名随 BUILD 变化');
}

/* ---------- 2. CHANGELOG ---------- */
// M4 之后不再有内联数组：CHANGELOG.md 是唯一源，这里只校验「文件头统计 ↔ 实际条目」。
function checkChangelog() {
  console.log('[2/7] CHANGELOG.md');
  if (!exists('CHANGELOG.md')) return bad('缺少 CHANGELOG.md');
  const raw = read('CHANGELOG.md');
  const md = parseChangelogMd(raw);
  if (!md.length) return bad('CHANGELOG.md 解析出 0 个版本');

  const notes = md.reduce((a, v) => a + v.notes.length, 0);
  const head = /共 \*\*(\d+) 个版本 \/ (\d+) 条更新\*\*/.exec(raw);
  if (!head) {
    warn('文件头没有统计行', '期望：共 **N 个版本 / M 条更新**');
  } else if (Number(head[1]) !== md.length || Number(head[2]) !== notes) {
    bad('文件头统计与内容不一致', `头 ${head[1]}/${head[2]}，实际 ${md.length}/${notes}`);
  } else {
    ok('文件头统计一致', `${md.length} 版 / ${notes} 条`);
  }

  const missingTitle = md.filter((v) => !String(v.title || '').trim()).map((v) => v.ver);
  if (missingTitle.length) bad('有版本缺标题', missingTitle.join(', '));
  else ok('每条都有标题');

  const vers = md.map((v) => v.ver);
  if (new Set(vers).size !== vers.length) bad('版本号有重复');
  else ok('版本号唯一', `${vers.length} 个`);
}

/* ---------- 3. 图标 ---------- */
function checkIcons() {
  console.log('[3/7] 图标清单');
  const manifest = readJson('manifest.json');
  const html = read('src/index.html');
  const listed = (manifest.icons || []).map((i) => String(i.src).replace(/^\.\//, ''));

  for (const p of listed) {
    if (!exists(p)) bad('manifest 引用的图标不存在', p);
  }
  if (listed.length && listed.every((p) => exists(p))) ok('manifest 图标文件都存在', `${listed.length} 个`);

  const htmlIcons = [...html.matchAll(/<link rel="(?:icon|apple-touch-icon)"[^>]*href="\.\/([^"]+)"/g)].map((m) => m[1]);
  for (const p of htmlIcons) {
    if (!exists(p)) bad('html 引用的图标不存在', p);
  }
  ok('html 图标引用可解析', `${htmlIcons.length} 个`);

  // 目录里的孤儿文件：只提示，不算失败（icon-1024 是母版，本就不入 manifest）
  const all = readdirSync(join(ROOT, 'icons')).filter((f) => /\.(png|svg|ico)$/i.test(f)).map((f) => 'icons/' + f);
  const referenced = new Set([...listed, ...htmlIcons]);
  const orphans = all.filter((p) => !referenced.has(p));
  if (orphans.length) warn('icons/ 里有未被引用的文件', orphans.join(', '));
}

/* ---------- 4. 启动图 ---------- */
function checkSplash() {
  console.log('[4/7] iOS 启动图');
  const html = read('src/index.html');
  const refs = [...html.matchAll(/<link rel="apple-touch-startup-image"[^>]*href="\.\/([^"]+)"/g)].map((m) => m[1]);
  for (const p of refs) {
    if (!exists(p)) bad('html 引用的启动图不存在', p);
  }
  if (refs.length && refs.every((p) => exists(p))) ok('启动图引用可解析', `${refs.length} 张`);

  const files = exists('splash') ? readdirSync(join(ROOT, 'splash')).filter((f) => /\.png$/i.test(f)).map((f) => 'splash/' + f) : [];
  const orphans = files.filter((p) => !refs.includes(p));
  if (orphans.length) warn('splash/ 里有未被引用的文件', orphans.join(', '));
  if (!refs.length) warn('没有找到任何 apple-touch-startup-image 引用');
}

/* ---------- 5. SW 预缓存清单 ---------- */
// 源 sw.js 只是模板：ASSETS 由 tools/build.mjs 按 dist/ 真实产物生成。
// 所以这里校验的是 dist/sw.js（构建过才有意义），而不是根目录那份。
function checkSwAssets() {
  console.log('[5/7] Service Worker 预缓存清单');
  if (!exists('dist/sw.js')) {
    warn('dist/ 还没构建', '先 npm run build 再校验预缓存清单');
    return;
  }
  const sw = read('dist/sw.js');
  const block = /const ASSETS = \[([\s\S]*?)\];/.exec(sw)?.[1];
  if (!block) return bad('dist/sw.js 里找不到 ASSETS 数组');
  const assets = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((p) => p !== './');
  const missing = assets.filter((p) => !exists('dist/' + p.replace(/^\.\//, '')));
  if (missing.length) bad('ASSETS 里有不存在的产物', missing.join(', '));
  else ok('ASSETS 全部可解析', `${assets.length} 项（dist/）`);

  const required = ['index.html', 'manifest.json'];
  const notCached = required.filter((f) => !assets.includes('./' + f));
  const hasJs = assets.some((p) => /^\.\/assets\/index-[^/]+\.js$/.test(p));
  if (notCached.length) bad('运行时文件没进预缓存', notCached.join(', '));
  else if (!hasJs) bad('主 JS 没进预缓存');
  else ok('运行时必备文件都在预缓存里', `${required.length} 个 + 主 JS`);
}

/* ---------- 6. 资源定义 ---------- */
function checkResources() {
  console.log('[6/7] 资源定义（对拍 legacy/survival.html）');
  const html = read('legacy/survival.html');

  const names = objectBody(html, 'RES_NAMES');
  const prices = objectBody(html, 'RES_PRICE');
  const where = objectBody(html, 'GET_WHERE');
  if (!names || !prices || !where) return bad('找不到 RES_NAMES / RES_PRICE / GET_WHERE');

  const kNames = new Set(topLevelKeys(names));
  const kPrices = new Set(topLevelKeys(prices));
  const kWhere = new Set(topLevelKeys(where));

  // newGame() 里的 res:{...}
  const ngStart = html.indexOf('function newGame');
  const ngRes = ngStart < 0 ? null : /res:\{([^}]*)\}/.exec(html.slice(ngStart));
  // normalizeState 里的 def.res:{...}
  const nsStart = html.indexOf('function normalizeState');
  const nsRes = nsStart < 0 ? null : /res:\{([^}]*)\}/.exec(html.slice(nsStart));
  if (!ngRes || !nsRes) return bad('找不到 newGame()/normalizeState() 的 res 默认值');

  const kNg = flatKeys(ngRes[1]);
  const kNs = flatKeys(nsRes[1]);

  const sets = [
    ['RES_PRICE', kPrices],
    ['GET_WHERE', kWhere],
    ['newGame().res', kNg],
    ['normalizeState().res', kNs],
  ];
  // RES_NAMES 是资源全集，其余 4 处按它对齐
  let okAll = true;
  for (const [label, s] of sets) {
    const missing = [...kNames].filter((k) => !s.has(k));
    const extra = [...s].filter((k) => !kNames.has(k));
    // RES_PRICE 缺项 = 该资源不可出售（渲染层 `if(!RES_PRICE[k]) return;`），设计上允许
    if (missing.length && label === 'RES_PRICE') {
      warn('RES_PRICE 缺项（=不可出售）', missing.join(', '));
    } else if (missing.length) {
      okAll = false;
      bad(`${label} 缺少资源键`, missing.join(', '));
    }
    if (extra.length) {
      okAll = false;
      bad(`${label} 有 RES_NAMES 里不存在的键`, extra.join(', '));
    }
  }
  if (okAll) ok('资源键集合一致', `${kNames.size} 种资源`);
}

/* ---------- 7. 依赖源地址 ---------- */
// 为什么查这个：如果 package-lock.json 里的 tarball 指向国内镜像（如某云），
// 本地装得快，但 GitHub Actions（境外 Runner）会变慢甚至失败。
function checkLockfile() {
  console.log('[7/7] package-lock.json 源地址');
  if (!exists('package-lock.json')) {
    warn('没有 package-lock.json（CI 的 npm ci 需要它）');
    return;
  }
  const raw = read('package-lock.json');
  const urls = [...raw.matchAll(/"resolved":\s*"([^"]+)"/g)].map((m) => m[1]);
  const bad = urls.filter((u) => !u.startsWith('https://registry.npmjs.org/'));
  if (bad.length) {
    const hosts = [...new Set(bad.map((u) => { try { return new URL(u).host; } catch { return u; } }))];
    bad_(`lock 里有 ${bad.length} 个非官方源地址`, hosts.join(', '));
  } else {
    ok('全部指向官方 registry', `${urls.length} 个 tarball`);
  }
}

/* ---------- 主流程 ---------- */
console.log(`SSOT 校验（只读） · ${ROOT}\n`);
try {
  checkVersion();
  checkChangelog();
  checkIcons();
  checkSplash();
  checkSwAssets();
  checkResources();
  checkLockfile();
} catch (err) {
  bad('脚本异常', err && err.message ? err.message : String(err));
}

console.log('');
if (warns.length) console.log(`提示：${warns.length} 项（不影响退出码）`);
if (fails.length) {
  console.log(`结果：${pass} 项通过 / ${fails.length} 项失败`);
  for (const f of fails) console.log(`  - ${f.name}${f.detail ? '：' + f.detail : ''}`);
  process.exit(1);
}
console.log(`结果：全部一致（${pass} 项通过${warns.length ? `，${warns.length} 项提示` : ''}）`);
process.exit(0);
