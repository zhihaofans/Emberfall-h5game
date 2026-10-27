// 新架构 e2e（真浏览器）：对 dist/ 做冒烟
//
// 覆盖：启动 → 12 个行动 → 菜单 11 项 → 进度总览（含已知修正）→ 导出二维码 → 砍柴 → 刷新后存档还在 → 0 pageerror
//
// 前置：npm run build（CI 的 e2e job 里已加这一步）
// 运行：node tests/run-e2e.mjs            # 默认跑本文件
//       node tests/run-e2e.mjs --legacy   # 跑旧 survival.html 的 15 个历史用例
const puppeteer = require('puppeteer-core');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { ROOT, CHROMIUM } = require('./_env');

const DIST = path.join(ROOT, 'dist');
const PORT = 4300 + Math.floor(Math.random() * 300);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const url = decodeURIComponent(String(req.url).split('?')[0]);
      const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
      const file = path.join(DIST, rel);
      if (!file.startsWith(DIST)) { res.writeHead(403); res.end('forbidden'); return; }
      fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(buf);
      });
    });
    srv.listen(PORT, '127.0.0.1', () => resolve(srv));
  });
}

async function readWood(page) {
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll('#tabs .tab')].find((t) => t.textContent.includes('背包'));
    if (tab) tab.click();
  });
  await page.waitForFunction(() => [...document.querySelectorAll('#actions .bagrow')].some((r) => r.textContent.includes('木材')));
  return page.evaluate(() => {
    const row = [...document.querySelectorAll('#actions .bagrow')].find((r) => r.textContent.includes('木材'));
    const m = /×(\d+)/.exec(row ? row.textContent : '');
    return m ? Number(m[1]) : 0;
  });
}

async function openMenu(page) {
  const shown = await page.evaluate(() => document.getElementById('modal').classList.contains('show'));
  if (!shown) await page.click('#btnMenu');
  await page.waitForSelector('#modal.show #modalcard');
}

async function clickMenu(page, label) {
  await openMenu(page);
  await page.evaluate((text) => {
    const btn = [...document.querySelectorAll('#modalcard .mbtn')].find((b) => b.textContent.includes(text));
    if (!btn) throw new Error('菜单项不存在: ' + text);
    btn.click();
  }, label);
}

(async () => {
  let pass = 0;
  let fail = 0;
  const ok = (c, n) => { c ? (pass++, console.log('✅ ' + n)) : (fail++, console.log('❌ ' + n)); };

  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('❌ 需要先 npm run build（dist/index.html 不存在）');
    process.exit(1);
  }

  const srv = await serve();
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  /** @type {string[]} */
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  try {
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0' });

    ok((await page.title()).includes('末日余烬'), '页面标题是末日余烬');
    await page.waitForSelector('#actions .actbtn');
    const acts = await page.$$eval('#actions .actbtn', (els) => els.length);
    ok(acts === 12, `行动面板 12 个按钮（实际 ${acts}）`);

    // 区域栏只在「行动」页；背包页进食/饮水合并成一行
    await page.evaluate(() => [...document.querySelectorAll('#tabs .tab')].find((t) => t.textContent.includes('背包')).click());
    await page.waitForSelector('.bag-eatdrink');
    const zoneHidden = await page.evaluate(() => getComputedStyle(document.getElementById('zonebar')).display === 'none');
    ok(zoneHidden, '背包页隐藏区域栏');
    const eatButtons = await page.$$eval('.bag-eatdrink .actbtn', (els) => els.length);
    ok(eatButtons === 2, `进食/饮水合并成一行（${eatButtons} 个按钮）`);

    // 收起 / 展开操作区
    await page.evaluate(() => document.getElementById('btnFold').click());
    const foldedHidden = await page.evaluate(() => getComputedStyle(document.getElementById('actions')).display === 'none');
    ok(foldedHidden, '点收起后隐藏操作区');
    await page.evaluate(() => document.getElementById('btnFold').click());
    const unfoldedShown = await page.evaluate(() => getComputedStyle(document.getElementById('actions')).display !== 'none');
    ok(unfoldedShown, '再点一次恢复操作区');

    // 回到「行动」页
    await page.evaluate(() => [...document.querySelectorAll('#tabs .tab')].find((t) => t.textContent.includes('行动')).click());
    await page.waitForFunction(() => getComputedStyle(document.getElementById('zonebar')).display !== 'none');

    // 菜单 11 项
    await openMenu(page);
    const menu = await page.$$eval('#modalcard .mbtn', (els) => els.map((e) => e.textContent.trim()));
    for (const label of ['黑市商店', '技能一览', '进度总览', '百科图鉴', '更新日志', '导出存档', '导入存档', '手动保存', '新游戏', '清除本地存档']) {
      ok(menu.some((t) => t.includes(label)), `菜单含「${label}」`);
    }

    // 进度总览：三处已知修正
    await clickMenu(page, '进度总览');
    await page.waitForFunction(() => document.getElementById('modalcard').textContent.includes('强化进度'));
    const prog = await page.$eval('#modalcard', (e) => e.textContent);
    ok(prog.includes('0/60'), '强化进度分母是 60');
    ok(prog.includes('符刃'), '武器路线含 🔮符刃');
    ok(prog.includes('查看剩余'), '成就可展开未解锁列表');

    // 导出：二维码 canvas 真的要出来
    await page.evaluate(() => document.querySelector('#modalcard [data-close]').click());
    await clickMenu(page, '导出存档');
    await page.waitForSelector('#qrCanvasBox canvas', { timeout: 15000 });
    const qr = await page.$eval('#qrCanvasBox canvas', (c) => ({ w: c.width, h: c.height }));
    ok(qr.w > 100 && qr.h > 100, `二维码已渲染 ${qr.w}×${qr.h}`);
    const code = await page.$eval('#exportArea', (ta) => ta.value.slice(0, 6));
    ok(code === 'EMBER:', `导出文本前缀是 EMBER:（实际 ${code}）`);

    // 存档往返：砍柴 → 刷新 → 木材还在
    await page.evaluate(() => document.querySelector('#modalcard [data-close]').click());
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('#actions .actbtn')].find((b) => b.textContent.includes('砍柴'));
      if (!btn) throw new Error('找不到砍柴按钮');
      btn.click();
    });
    await page.waitForFunction(() => {
      const row = [...document.querySelectorAll('#actions .bagrow')].find((r) => r.textContent.includes('木材'));
      return !!row;
    }, { timeout: 8000 }).catch(() => {});
    const woodBefore = await readWood(page);
    ok(woodBefore > 0, `砍柴后背包有木材 ×${woodBefore}`);

    await page.reload({ waitUntil: 'networkidle0' });
    const woodAfter = await readWood(page);
    ok(woodAfter === woodBefore, `刷新后木材不变（${woodAfter}）`);

    // 离线结算：把 lastSeen 往回拨 3 小时，刷新后日志里应有「你离开了 3 小时」
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('ember_save_v1'));
      raw.g.lastSeen = Date.now() - 3 * 3600 * 1000;
      localStorage.setItem('ember_save_v1', JSON.stringify(raw));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('#logwrap');
    const logs = await page.$eval('#logwrap', (e) => e.textContent);
    ok(/你离开了 3 小时/.test(logs), '离线结算日志出现');

    ok(errors.length === 0, `0 条 pageerror${errors.length ? '：' + errors[0] : ''}`);
  } catch (err) {
    fail++;
    console.log('❌ 用例异常：' + (err && err.message ? err.message : String(err)));
  } finally {
    await browser.close().catch(() => {});
    srv.close();
  }

  console.log(`\n新架构 e2e: ${pass} 通过 / ${fail} 失败`);
  process.exit(fail ? 1 : 0);
})();
