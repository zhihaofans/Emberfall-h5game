// 安装引导 e2e：用 iPhone UA 模拟 iOS（走「添加到主屏幕」分支，不依赖真实安装弹窗）
const puppeteer = require('puppeteer-core');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { ROOT, CHROMIUM } = require('./_env');

const DIST = path.join(ROOT, 'dist');
const PORT = 4600 + Math.floor(Math.random() * 200);
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png' };

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

(async () => {
  let pass = 0;
  let fail = 0;
  const ok = (c, n) => { c ? (pass++, console.log('✅ ' + n)) : (fail++, console.log('❌ ' + n)); };

  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('❌ 需要先 npm run build');
    process.exit(1);
  }

  const srv = await serve();
  const browser = await puppeteer.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setUserAgent(IPHONE_UA);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  try {
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#actions .actbtn');
    await page.click('#btnMenu');
    await page.waitForSelector('#modal.show #modalcard');

    const menu = await page.$eval('#modalcard', (e) => e.textContent);
    ok(/安装到桌面/.test(menu), 'iOS 下菜单出现「安装到桌面」');

    await page.evaluate(() => [...document.querySelectorAll('#modalcard .mbtn')].find((b) => b.textContent.includes('安装到桌面')).click());
    await page.waitForFunction(() => {
      const b = document.getElementById('pwaBanner');
      return !!b && b.style.display !== 'none' && /分享|添加到主屏幕/.test(b.textContent);
    }, { timeout: 5000 });
    const banner = await page.$eval('#pwaBanner', (e) => e.textContent);
    ok(/分享/.test(banner) && /添加到主屏幕/.test(banner), 'iOS 安装提示文案正确');
    ok(errors.length === 0, `0 条 pageerror${errors.length ? '：' + errors[0] : ''}`);
  } catch (err) {
    fail++;
    console.log('❌ 用例异常：' + (err && err.message ? err.message : String(err)));
  } finally {
    await browser.close().catch(() => {});
    srv.close();
  }

  console.log(`安装引导 e2e: ${pass} 通过 / ${fail} 失败`);
  process.exit(fail ? 1 : 0);
})();
