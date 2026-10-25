#!/usr/bin/env node
// 单一数据源（SSOT）校验：只读，不改任何文件。
//
// 目的：把"同一事实存在于多处"的地方钉住。任何一处漂移就 exit 1，发布前必须绿。
// 规则见 AGENT.md §0.5；计划见 TODO.md P0-2.4。
//
// 用法：node tools/check-ssot.mjs
// 退出码：0 = 全部一致；1 = 有失败项（会打印具体差异）

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChangelogMd, parseChangelogInline } from './lib/changelog.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));
const exists = (p) => existsSync(join(ROOT, p));

let pass = 0;
const fails = [];
const warns = [];

function ok(name, detail) {
  pass++;
  console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`);
}
function bad(name, detail) {
  fails.push({ name, detail });
  console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
}
function warn(name, detail) {
  warns.push({ name, detail });
  console.log(`  ⚠️  ${name}${detail ? ' — ' + detail : ''}`);
}

/* ---------- 通用解析工具 ---------- */

// 从源码里取出 `const NAME = {` 到配对 `}` 之间的对象体（不解析嵌套内容，只做括号配对）
function objectBody(src, name) {
  const start = src.indexOf(`const ${name} = {`);
  if (start < 0) return null;
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return null;
}

// 取对象体的顶层键名（用于资源表这类"键为资源 id"的扁平表）
function topLevelKeys(body) {
  const keys = [];
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') depth--;
    else if (depth === 0) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*:/.exec(body.slice(i));
      if (m && (i === 0 || /[\s,{]/.test(body[i - 1]))) {
        keys.push(m[1]);
        i += m[0].length - 1;
      }
    }
  }
  return keys;
}

// 把 md 里的 CHANGELOG 解成 [{ver,date,title,notes[]}] —— 实现在 tools/lib/changelog.mjs（与 sync-meta 共用）

/* ---------- 1. 版本号 / 构建号 ---------- */
function checkVersion() {
  console.log('[1/6] 版本与构建号');
  const html = read('survival.html');
  const sw = read('sw.js');
  const meta = readJson('version.json');

  const hv = /const GAME_VERSION = '([^']+)'/.exec(html)?.[1];
  const hb = /const BUILD_CODE = (\d+)/.exec(html)?.[1];
  const sb = /const BUILD = '([^']*)'/.exec(sw)?.[1];

  if (!hv || !hb) return bad('html 里找不到 GAME_VERSION / BUILD_CODE');
  if (hv !== meta.ver) bad('version.json.ver ≠ GAME_VERSION', `${meta.ver} vs ${hv}`);
  else ok('ver 一致', `v${hv}`);
  if (String(meta.build) !== hb) bad('version.json.build ≠ BUILD_CODE', `${meta.build} vs ${hb}`);
  else ok('build 一致', `build ${hb}`);
  if (sb !== hb) bad('sw.js BUILD ≠ BUILD_CODE', `${sb} vs ${hb}`);
  else ok('sw.js BUILD 一致', `BUILD ${sb}`);
  const cacheOk = /const CACHE = 'emberfall-' \+ BUILD;/.test(sw);
  if (!cacheOk) bad('sw.js 的 CACHE 不是「前缀 + BUILD」拼接式');
  else ok('缓存名随 BUILD 变化');
}

/* ---------- 2. CHANGELOG ---------- */
function checkChangelog() {
  console.log('[2/6] CHANGELOG.md ↔ 内联数组');
  if (!exists('CHANGELOG.md')) return bad('缺少 CHANGELOG.md');
  const md = parseChangelogMd(read('CHANGELOG.md'));
  const inline = parseChangelogInline(read('survival.html'));

  const mdN = md.reduce((a, v) => a + v.notes.length, 0);
  const inN = inline.reduce((a, v) => a + v.notes.length, 0);
  if (md.length !== inline.length) bad('版本数不一致', `md ${md.length} / 内联 ${inline.length}`);
  if (mdN !== inN) bad('条目数不一致', `md ${mdN} / 内联 ${inN}`);

  const mdMap = new Map(md.map((v) => [v.ver, v]));
  const inMap = new Map(inline.map((v) => [v.ver, v]));
  const onlyMd = [...mdMap.keys()].filter((k) => !inMap.has(k));
  const onlyIn = [...inMap.keys()].filter((k) => !mdMap.has(k));
  if (onlyMd.length) bad('只在 md 里的版本', onlyMd.join(', '));
  if (onlyIn.length) bad('只在 html 里的版本', onlyIn.join(', '));

  let diff = 0;
  for (const [ver, a] of mdMap) {
    const b = inMap.get(ver);
    if (!b) continue;
    if (a.date !== b.date || a.title !== b.title || JSON.stringify(a.notes) !== JSON.stringify(b.notes)) {
      diff++;
      if (diff <= 3) bad(`版本 v${ver} 内容不同`, `title/notes 有差异（${a.notes.length} vs ${b.notes.length} 条）`);
    }
  }
  if (!fails.length && diff === 0 && md.length === inline.length && mdN === inN) {
    ok('逐条一致', `${md.length} 版 / ${mdN} 条`);
  }
}

/* ---------- 3. 图标 ---------- */
function checkIcons() {
  console.log('[3/6] 图标清单');
  const manifest = readJson('manifest.json');
  const html = read('survival.html');
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
  console.log('[4/6] iOS 启动图');
  const html = read('survival.html');
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
function checkSwAssets() {
  console.log('[5/6] Service Worker 预缓存清单');
  const sw = read('sw.js');
  const block = /const ASSETS = \[([\s\S]*?)\];/.exec(sw)?.[1];
  if (!block) return bad('sw.js 里找不到 ASSETS 数组');
  const assets = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((p) => p !== './');
  const missing = assets.filter((p) => !exists(p.replace(/^\.\//, '')));
  if (missing.length) bad('ASSETS 里有不存在的文件', missing.join(', '));
  else ok('ASSETS 全部可解析', `${assets.length} 项`);

  // 运行时必备文件必须在预缓存里，否则离线会缺
  // 注意：sw.js 自身不需要预缓存；version.json 故意走网络优先（用于发现新版本），也不入缓存
  const required = ['survival.html', 'index.html', 'manifest.json'];
  const notCached = required.filter((f) => !assets.includes('./' + f));
  if (notCached.length) bad('运行时文件没进预缓存', notCached.join(', '));
  else ok('运行时必备文件都在预缓存里', `${required.length} 个`);
}

/* ---------- 6. 资源定义 ---------- */
function checkResources() {
  console.log('[6/6] 资源定义（5 处派生）');
  const html = read('survival.html');

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

  const keysOfFlat = (body) => new Set([...body.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map((m) => m[1]));
  const kNg = keysOfFlat(ngRes[1]);
  const kNs = keysOfFlat(nsRes[1]);

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

/* ---------- 主流程 ---------- */
console.log(`SSOT 校验（只读） · ${ROOT}\n`);
try {
  checkVersion();
  checkChangelog();
  checkIcons();
  checkSplash();
  checkSwAssets();
  checkResources();
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
