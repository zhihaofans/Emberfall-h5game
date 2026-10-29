#!/usr/bin/env node
// 可视化回归截图：用真浏览器打开 dist/，按「窄屏 390×844」与「桌面 1280×900」各截一张。
//
// 产物：screenshots/regression/{mobile-main,mobile-menu,desktop-main}.png（不入库，CI 作为 artifact 上传）
// 前置：npm run build；本地需要 Chromium（CHROMIUM_PATH 可覆盖）
//
// 为什么不做像素 diff：样式还在快速迭代，先有稳定的「当前截图」基线，
// 再考虑接 percy / pixelmatch 之类的差异比较。

import http from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'screenshots', 'regression');
const CHROMIUM = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('❌ 需要先 npm run build');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const PORT = 4800 + Math.floor(Math.random() * 200);
const srv = http.createServer((req, res) => {
  const url = decodeURIComponent(String(req.url).split('?')[0]);
  const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const file = join(DIST, rel);
  if (!file.startsWith(DIST)) { res.writeHead(403); res.end('forbidden'); return; }
  try {
    const buf = readFileSync(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404); res.end('404');
  }
});
await new Promise((r) => srv.listen(PORT, '127.0.0.1', r));
const base = `http://127.0.0.1:${PORT}/`;

const browser = await puppeteer.launch({
  executablePath: CHROMIUM,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--lang=zh-CN'],
});

/** @param {string} name @param {{width:number,height:number}} viewport @param {(page: any) => Promise<void>} [act] */
async function shot(name, viewport, act) {
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, deviceScaleFactor: 2 });
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#actions .actbtn');
  if (act) await act(page);
  await new Promise((r) => setTimeout(r, 400));
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  const kb = (readFileSync(file).length / 1024).toFixed(1);
  console.log(`📸 ${name}.png（${viewport.width}×${viewport.height}，${kb} KB）`);
  await page.close();
}

try {
  await shot('mobile-main', { width: 390, height: 844 });
  await shot('mobile-menu', { width: 390, height: 844 }, async (page) => {
    await page.click('#btnMenu');
    await page.waitForSelector('#modal.show #modalcard');
  });
  await shot('desktop-main', { width: 1280, height: 900 });
  console.log(`\n产物目录：${OUT}`);
} finally {
  await browser.close().catch(() => {});
  srv.close();
}
