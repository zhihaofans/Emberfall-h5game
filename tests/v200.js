/* v2.0.0 PWA 化专项测试
   覆盖：manifest 字段/相对路径 → 图标可达 → SW 注册与缓存 → 数据 reload 持久化
        → 离线可玩 → 旧缓存清理（升级路径）→ 子目录部署 0-404 → 窄屏溢出 → file:// 兜底 */
const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.css': 'text/css'
};
function makeServer(root) {
  return http.createServer((req, res) => {
    const u = decodeURIComponent(url.parse(req.url).pathname);
    let p = path.join(root, u);
    if (u.endsWith('/')) p = path.join(p, 'index.html');
    fs.readFile(p, (e, buf) => {
      if (e) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
      res.end(buf);
    });
  });
}

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('✅ ' + n); } else { fail++; console.log('❌ ' + n); } }

(async () => {
  const PORT = 8137;
  const srv = makeServer(require('./_env').ROOT);
  await new Promise(r => srv.listen(PORT, '127.0.0.1', r));
  const BASE = `http://127.0.0.1:${PORT}`;

  const browser = await puppeteer.launch({
    executablePath: require('./_env').CHROMIUM, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  console.log('== 1. 静态资源与 manifest ==');
  await page.goto(`${BASE}/survival.html`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  const mf = JSON.parse(fs.readFileSync(require('./_env').ROOT + '/manifest.json', 'utf8'));
  ok(mf.name && mf.short_name, 'manifest 有 name / short_name');
  // 2026-10-25：start_url 从 ./survival.html 改成 ./index.html —— 构建产物 dist/ 里没有 survival.html，
  // 而根目录的 index.html 会 redirect 到 survival.html，两种形态都能启动。
  ok(mf.start_url === './index.html', 'start_url 是相对路径：' + mf.start_url);
  ok(mf.scope === './', 'scope 是相对路径：' + mf.scope);
  ok(mf.display === 'standalone', 'display = standalone');
  ok(mf.theme_color && mf.background_color, 'theme_color / background_color 齐全');
  ok(mf.orientation === 'portrait', 'orientation = portrait');
  const has192 = (mf.icons || []).some(i => i.sizes === '192x192');
  const has512 = (mf.icons || []).some(i => i.sizes === '512x512' && (i.purpose || '').includes('any'));
  const hasMask = (mf.icons || []).some(i => (i.purpose || '').includes('maskable'));
  ok(has192 && has512 && hasMask, '图标含 192 / 512 any / 512 maskable');

  // 图标与关键文件全部 200
  const assets = ['/manifest.json', '/sw.js', '/version.json',
    '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png',
    '/icons/apple-touch-icon-180.png', '/icons/favicon-32.png',
    '/screenshots/shot-mobile.png', '/splash/splash-iphone13-1170x2532.png'];
  const codes = {};
  for (const a of assets) {
    const r = await page.goto(`${BASE}${a}`, { waitUntil: 'domcontentloaded' }).catch(() => null);
    codes[a] = r ? r.status() : 0;
  }
  const bad = Object.keys(codes).filter(k => codes[k] !== 200);
  ok(bad.length === 0, '全部 PWA 资源 200' + (bad.length ? '（异常：' + bad.map(k => k + '=' + codes[k]).join(',') + '）' : ''));

  console.log('== 2. HTML PWA meta ==');
  await page.goto(`${BASE}/survival.html`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const meta = await page.evaluate(() => {
    const g = (sel, att) => { const e = document.querySelector(sel); return e ? e.getAttribute(att) : null; };
    return {
      manifest: g('link[rel=manifest]', 'href'),
      appleCap: g('meta[name="apple-mobile-web-app-capable"]', 'content'),
      appleIcon: g('link[rel=apple-touch-icon]', 'href'),
      appleTitle: g('meta[name="apple-mobile-web-app-title"]', 'content'),
      startup: document.querySelectorAll('link[rel=apple-touch-startup-image]').length,
      noCacheMeta: document.querySelectorAll('meta[http-equiv="Cache-Control"]').length,
      viewport: g('meta[name=viewport]', 'content')
    };
  });
  ok(meta.manifest === './manifest.json', 'manifest 链接为相对路径');
  ok(meta.appleCap === 'yes', 'apple-mobile-web-app-capable');
  ok(!!meta.appleIcon, 'apple-touch-icon 存在');
  ok(meta.appleTitle === '末日余烬', 'apple 应用名');
  ok(meta.startup >= 5, 'iOS 启动图 media 数 = ' + meta.startup);
  ok(meta.noCacheMeta === 0, '已移除与 SW 冲突的 no-cache meta');
  ok((meta.viewport || '').includes('viewport-fit=cover'), 'viewport-fit=cover 保留');

  console.log('== 3. Service Worker 注册与缓存 ==');
  const sw = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { supported: false };
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    await new Promise(r => setTimeout(r, 1200));
    const keys = await caches.keys();
    const cur = keys.find(k => k.startsWith('emberfall-'));
    let entries = [];
    if (cur) { const c = await caches.open(cur); entries = (await c.keys()).map(r => new URL(r.url).pathname); }
    return { supported: true, scope: reg ? reg.scope : null, keys, cur, entries };
  });
  ok(sw.supported && sw.scope === `${BASE}/`, 'SW 已注册，scope = ' + sw.scope);
  ok(!!sw.cur, '缓存名为 emberfall-<build>：' + sw.cur);
  ok(sw.entries.some(p => p.endsWith('/survival.html')), '预缓存含 survival.html');
  ok(sw.entries.some(p => p.endsWith('/manifest.json')), '预缓存含 manifest.json');
  ok(sw.entries.some(p => p.includes('/icons/icon-192.png')), '预缓存含图标');

  console.log('== 4. 数据持久化（写入 → reload → 断言仍在）==');
  await page.evaluate(() => { G.day = 42; G.gold = 777; G.res.metal = 13; G.bestiary = { 'beast0': 3 }; save(); });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  const persisted = await page.evaluate(() => ({ day: G.day, gold: G.gold, metal: G.res.metal, best: (G.bestiary || {})['beast0'] }));
  ok(persisted.day === 42 && persisted.gold === 777 && persisted.metal === 13 && persisted.best === 3,
    'reload 后存档完整（day=' + persisted.day + ' gold=' + persisted.gold + ' metal=' + persisted.metal + ' bestiary=' + persisted.best + '）');

  console.log('== 5. 离线可玩 ==');
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));
  const offline = await page.evaluate(() => ({
    hasUI: !!document.getElementById('statusbar') && !!document.getElementById('actions'),
    day: (typeof G !== 'undefined' && G) ? G.day : null,
    logLen: (document.getElementById('logwrap') || {}).textContent ? document.getElementById('logwrap').textContent.length : 0,
    banner: (document.getElementById('pwaBanner') || {}).textContent || ''
  }));
  ok(offline.hasUI, '断网刷新后界面完整渲染');
  ok(offline.day === 42, '断网后存档仍可读（day=' + offline.day + '）');
  ok(offline.logLen > 50, '断网后日志正常（' + offline.logLen + ' 字符）');
  ok(offline.banner.includes('当前离线'), '断网提示条出现：' + offline.banner.slice(0, 20));
  await page.setOfflineMode(false);

  console.log('== 6. 升级路径：旧缓存被清理、数据不丢 ==');
  // 造一条"旧版本"缓存，并模拟服务端发布新版（改写 sw.js 构建号 → SW 字节变化 → 浏览器才会装新版）
  const swPath = require('./_env').ROOT + '/sw.js';
  const swOrig = fs.readFileSync(swPath, 'utf8');
  await page.evaluate(async () => {
    const old = await caches.open('emberfall-999');
    await old.put('/__old_marker', new Response('old'));
  });
  const beforeKeys = await page.evaluate(() => caches.keys());
  // ⚠ 这里会临时改写仓库里的 sw.js，必须保证无论成功、失败还是异常都还原，
  //   否则测试中断会把开发者的 sw.js 留在 BUILD=999001 的脏状态。
  let upgrade;
  try {
    fs.writeFileSync(swPath, swOrig.replace(/const BUILD = '[^']*';/, "const BUILD = '999001';"));
    upgrade = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg.update();
      await new Promise(r => setTimeout(r, 3500));
      return { after: await caches.keys(), day: G.day, gold: G.gold };
    });
  } finally {
    fs.writeFileSync(swPath, swOrig);   // 恢复原文件（异常路径同样执行）
  }
  ok(beforeKeys.includes('emberfall-999'), '升级前存在旧缓存 emberfall-999');
  ok(upgrade.after.includes('emberfall-999001'), '新版本 SW 已装并激活（emberfall-999001）');
  ok(!upgrade.after.includes('emberfall-999'), '旧缓存 emberfall-999 已被清理（现存：' + upgrade.after.join(',') + '）');
  ok(upgrade.day === 42 && upgrade.gold === 777, '升级过程用户数据一条不丢');

  console.log('== 7. 子目录部署（0 条 404 + scope 正确）==');
  const SUB = '/tmp/site/webapp/game';
  fs.rmSync('/tmp/site', { recursive: true, force: true });
  fs.mkdirSync(SUB, { recursive: true });
  for (const f of ['survival.html', 'index.html', 'manifest.json', 'sw.js', 'version.json']) {
    fs.copyFileSync(`${require('./_env').ROOT}/${f}`, `${SUB}/${f}`);
  }
  for (const d of ['icons', 'splash', 'screenshots']) {
    fs.mkdirSync(`${SUB}/${d}`, { recursive: true });
    for (const f of fs.readdirSync(`${require('./_env').ROOT}/${d}`)) fs.copyFileSync(`${require('./_env').ROOT}/${d}/${f}`, `${SUB}/${d}/${f}`);
  }
  const srv2 = makeServer('/tmp/site');
  const PORT2 = 8138;
  await new Promise(r => srv2.listen(PORT2, '127.0.0.1', r));
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 390, height: 844 });
  const bad404 = [];
  page2.on('response', res => { if (res.status() >= 400) bad404.push(res.url()); });
  await page2.goto(`http://127.0.0.1:${PORT2}/webapp/game/survival.html`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const subSw = await page2.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    await new Promise(r => setTimeout(r, 800));
    return { scope: reg ? reg.scope : null, live: !!document.getElementById('statusbar') };
  });
  ok(bad404.length === 0, '子目录部署 0 条 4xx/5xx' + (bad404.length ? '（' + bad404.slice(0, 3).join(',') + '）' : ''));
  ok(subSw.scope === `http://127.0.0.1:${PORT2}/webapp/game/`, '子目录下 SW scope 正确：' + subSw.scope);
  ok(subSw.live, '子目录下游戏正常运行');
  await page2.close();
  srv2.close();

  console.log('== 8. 窄屏溢出扫描（390 / 360）==');
  for (const w of [390, 360]) {
    await page.setViewport({ width: w, height: 844 });
    await page.goto(`${BASE}/survival.html`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    const of = await page.evaluate(() => {
      const W = document.documentElement.clientWidth;
      return [...document.querySelectorAll('*')]
        .filter(e => e.offsetParent)
        .map(e => ({ c: e.className || e.tagName, r: e.getBoundingClientRect() }))
        .filter(({ r }) => r.right > W + 1 || r.left < -1)
        .map(({ c, r }) => c + ' ' + Math.round(r.right) + '/' + W);
    });
    ok(of.length === 0, `${w}px 无横向溢出` + (of.length ? '（' + of.slice(0, 3).join(' | ') + '）' : ''));
  }

  console.log('== 9. file:// 兜底（不注册 SW 也能玩）==');
  const page3 = await browser.newPage();
  await page3.setViewport({ width: 390, height: 844 });
  const err3 = [];
  page3.on('pageerror', e => err3.push(e.message));
  await page3.goto(require('./_env').URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const fileMode = await page3.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
    return { canPlay: !!document.getElementById('statusbar'), swReg: !!reg };
  });
  ok(fileMode.canPlay, 'file:// 直接打开仍可游玩');
  ok(!fileMode.swReg, 'file:// 下不注册 SW（无报错）');
  ok(err3.length === 0, 'file:// 无 JS 报错' + (err3.length ? '：' + err3[0] : ''));
  await page3.close();

  ok(errors.length === 0, '主流程无 JS 报错' + (errors.length ? '：' + errors.slice(0, 2).join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n======== PWA 专项: ' + pass + ' 通过 / ' + fail + ' 失败 ========');
  process.exit(fail > 0 ? 1 : 0);
})();
