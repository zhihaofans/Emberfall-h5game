// 启动守卫（EBH 的简化版）：防「启动到一半崩掉 → 下次打开白屏」。
//
// 旧版是单文件，崩溃时还能把整份 HTML 备份进 localStorage 再回滚；
// 新架构是多文件产物，回滚整页没有意义，改为：
//   1. 启动前写哨兵（时间戳）
//   2. 启动成功后清哨兵（只有走完 boot() + PWA 才清）
//   3. 下次启动若哨兵还在（且 1 小时内）→ 说明上次没启动完，显示降级页：
//      · 重新加载
//      · 清掉 Service Worker 缓存后重载（最常见的原因是更新到一半的旧缓存）
//      · 仍然进入（存档不动；哨兵在下次成功启动后清掉）
// 同时把最后一次脚本错误记下来，降级页直接展示，免去让用户开控制台。

const SENTINEL = 'ember_boot_sentinel';
const LAST_ERROR = 'ember_last_error';
const FRESH_MS = 60 * 60 * 1000;

/**
 * @typedef {Object} GuardState
 * @property {boolean} recovered 上次启动是否没走完
 * @property {string|null} lastError 上次记录的错误
 */

/**
 * 读取守卫状态。
 * @param {Storage} [storage]
 * @param {number} [now]
 * @returns {GuardState}
 */
export function readGuard(storage = localStorage, now = Date.now()) {
  let sentinel = null;
  let lastError = null;
  try { sentinel = JSON.parse(storage.getItem(SENTINEL) || 'null'); } catch { /* 坏数据当作没有 */ }
  try { lastError = storage.getItem(LAST_ERROR); } catch { /* 隐私模式 */ }

  const ts = Number(sentinel && sentinel.ts);
  const fresh = Number.isFinite(ts) && ts > 0 && now >= ts && now - ts < FRESH_MS;
  return { recovered: !!fresh, lastError: lastError || null };
}

/**
 * 启动前：写哨兵（覆盖上一次已过期的记录）。
 * @param {Storage} [storage]
 * @param {number} [now]
 * @returns {GuardState} 本次启动前读到的状态（决定要不要先出降级页）
 */
export function guardStart(storage = localStorage, now = Date.now()) {
  const before = readGuard(storage, now);
  try { storage.setItem(SENTINEL, JSON.stringify({ ts: now })); } catch { /* 配额满也不影响游戏 */ }
  return before;
}

/**
 * 启动成功：清哨兵与错误记录。
 * @param {Storage} [storage]
 */
export function guardMarkBooted(storage = localStorage) {
  try { storage.removeItem(SENTINEL); storage.removeItem(LAST_ERROR); } catch { /* 忽略 */ }
}

/**
 * 记录一次脚本错误（降级页会展示它）。
 * @param {any} err
 * @param {Storage} [storage]
 */
export function guardRecord(err, storage = localStorage) {
  const msg = err && err.message ? err.message : String(err);
  try { storage.setItem(LAST_ERROR, msg.slice(0, 300)); } catch { /* 忽略 */ }
}

/**
 * 清掉 SW 缓存并重载。**不动存档**（localStorage 里的 ember_save_v1 保留）。
 */
export async function clearCachesAndReload() {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch { /* 无缓存 API */ }
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
  } catch { /* 无 SW */ }
  location.reload();
}

/**
 * 降级页：不依赖游戏逻辑，纯 DOM。
 * @param {{lastError?: string|null, onRetry: () => void, onClear: () => void, onContinue?: (() => void) | null}} opts
 */
export function showRecovery(opts) {
  const old = document.getElementById('recovery');
  if (old) old.remove();

  const box = document.createElement('div');
  box.id = 'recovery';
  box.innerHTML = `
    <div class="rc-card">
      <h3>⚠️ 上次启动没有走完</h3>
      <p>可能是更新到一半、缓存损坏，或脚本出错。存档还在本地，没有丢。</p>
      ${opts.lastError ? `<pre class="rc-err">${escapeHtml(opts.lastError)}</pre>` : ''}
      <button class="mbtn primary" data-rc="retry">重新加载</button>
      <button class="mbtn" data-rc="clear">清缓存并重新加载</button>
      ${opts.onContinue ? '<button class="mbtn" data-rc="continue">仍然进入（存档不动）</button>' : ''}
    </div>`;
  document.body.appendChild(box);

  box.addEventListener('click', (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const btn = t.closest('[data-rc]');
    if (!btn) return;
    const act = /** @type {HTMLElement} */ (btn).dataset.rc;
    if (act === 'retry') opts.onRetry();
    else if (act === 'clear') opts.onClear();
    else if (act === 'continue' && opts.onContinue) opts.onContinue();
  });
}

/** @param {string} s */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}
