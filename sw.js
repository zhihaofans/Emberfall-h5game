/* ============================================================
   末日余烬 · Emberfall —— Service Worker
   ------------------------------------------------------------
   策略要点（来自《纯前端HTML应用开发经验》第七节）：
   1. 缓存名带构建号：每次发版 CACHE 变化 → 新 SW 装、旧缓存清。
   2. 导航与静态资源统一 cacheFirst + 后台静默更新：
      networkFirst 会让 iOS 冷启动白屏 1~2s（缓存明明有却先等网络）。
   3. 全部使用相对路径，支持子目录部署（如 /webapp/game/）。
   4. 只接管同源 GET；version.json 永远优先网络（用于页面比对版本）。
   5. 预缓存逐个 add，单个失败不影响整体安装。
   ============================================================ */

const BUILD = '113';                 // 发布脚本注入构建号（BUILD_CODE）
const CACHE = 'emberfall-' + BUILD;
const CACHE_PREFIX = 'emberfall-';

// 占位清单：tools/build.mjs 会按 dist/ 真实产物整段重写（这里只用于源码可读性）。
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

/* 安装：预缓存 app shell */
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map(async (url) => {
      try { await cache.add(new Request(url, { cache: 'reload' })); }
      catch (err) { /* 单个资源失败不阻塞安装 */ }
    }));
    await self.skipWaiting();
  })());
});

/* 激活：清理旧的 emberfall-* 缓存 + 立即接管 */
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* cacheFirst：有缓存立刻返回，同时后台拉新写回缓存 */
function cacheFirst(req) {
  return caches.match(req).then((hit) => {
    const net = fetch(req).then((resp) => {
      if (resp && resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => hit);
    return hit || net;
  });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // 同源才算

  // 版本文件：始终先走网络（拿最新），断网回落缓存
  if (url.pathname.endsWith('/version.json')) {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => caches.match(req))
    );
    return;
  }
  e.respondWith(cacheFirst(req));
});

/* 页面可主动要求新 SW 立即接管 */
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
