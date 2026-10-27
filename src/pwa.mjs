// PWA 能力层：Service Worker 注册、安装引导、更新提示、离线标识。
//
// 从 survival.html 末尾的 pwaBoot() 逐条搬来，行为保持一致：
//   · SW 只在 https / localhost 注册（file:// 打开不注册、不抛错，游戏照常）
//   · 更新提示三源：updatefound + controllerchange + 切前台比对 version.json
//   · 只提示不自动刷新（玩家可能正在战斗中）
//   · 首次安装接管不误报「已更新」（注册前先记 hadController）
//
// 这里只依赖传入的 `toast` 回调（不 import app.mjs），整段可以摘掉而不影响游戏。

const TIP_INSTALL = 'pwa_tip_install';
const TIP_IOS = 'pwa_tip_ios';
const BANNER_ID = 'pwaBanner';

/** @typedef {{deferredPrompt: any, swReg: any, standalone: boolean, versionAsked: string}} PwaState */

/** @type {PwaState} */
const PWA = { deferredPrompt: null, swReg: null, standalone: false, versionAsked: '' };

/** @param {string} k */
function lsGet(k) {
  try { return localStorage.getItem(k); } catch { return null; }
}

/** @param {string} k @param {string} v */
function lsSet(k, v) {
  try { localStorage.setItem(k, v); } catch { /* 隐私模式 / 配额满 */ }
}

/**
 * 是否以独立窗口运行（已安装到桌面 / 主屏）。
 * @param {any} [win]
 */
export function isStandalone(win = /** @type {any} */ (globalThis)) {
  const mq = win.matchMedia && win.matchMedia('(display-mode: standalone)');
  return !!mq?.matches || win.navigator?.standalone === true;
}

/**
 * 是否 iOS / iPadOS（iPadOS 13+ 的 UA 伪装成 Mac，靠触点数区分）。
 * @param {any} [nav]
 */
export function isIOS(nav = /** @type {any} */ (globalThis).navigator) {
  const ua = String(nav?.userAgent || '');
  return /iPad|iPhone|iPod/.test(ua)
    || (nav?.platform === 'MacIntel' && Number(nav?.maxTouchPoints) > 1);
}

/**
 * 是否该显示「安装到桌面」入口。
 * @param {{standalone: boolean, hasPrompt: boolean, ios: boolean}} env
 */
export function canInstall(env) {
  if (env.standalone) return false;
  return env.hasPrompt || env.ios;
}

/** 当前环境能否安装（菜单入口用） */
export function canInstallNow() {
  return canInstall({ standalone: isStandalone(), hasPrompt: !!PWA.deferredPrompt, ios: isIOS() });
}

/**
 * 底部提示条。`closable` 时右侧出现 ✕，点 ✕ 只关提示、不触发主回调。
 * @param {string} text
 * @param {(() => void) | null} [onClick]
 * @param {boolean} [closable]
 */
export function showBanner(text, onClick, closable) {
  let box = document.getElementById(BANNER_ID);
  if (!box) {
    box = document.createElement('div');
    box.id = BANNER_ID;
    document.body.appendChild(box);
  }
  box.innerHTML = text + (closable ? '<span class="pwa-x">✕</span>' : '');
  box.onclick = (e) => {
    if (/** @type {any} */ (e.target)?.className === 'pwa-x') { hideBanner(); return; }
    if (onClick) onClick();
  };
  box.style.display = 'block';
}

export function hideBanner() {
  const box = document.getElementById(BANNER_ID);
  if (box) box.style.display = 'none';
}

/**
 * 安装：Chromium 走 beforeinstallprompt 事件，iOS 给「分享 → 添加到主屏幕」文案。
 */
export function install() {
  if (PWA.deferredPrompt) {
    const ev = PWA.deferredPrompt;
    PWA.deferredPrompt = null;
    try { ev.prompt(); } catch { /* 已被消费或浏览器拒绝 */ }
    if (ev.userChoice) ev.userChoice.then(() => hideBanner()).catch(() => {});
    lsSet(TIP_INSTALL, '1');
    return;
  }
  if (isIOS()) {
    showBanner('📲 iOS 安装：点底部「分享」→「添加到主屏幕」，之后可全屏离线玩', () => hideBanner(), true);
  }
}

/**
 * 版本比对：SW 字节没变时，唯一能发现更新的路径。
 * @param {string} version 当前版本
 */
export async function checkVersion(version) {
  if (!/^https?:$/.test(location.protocol)) return;
  try {
    const r = await fetch('./version.json', { cache: 'no-store' });
    if (!r.ok) return;
    const meta = await r.json();
    if (meta && meta.ver && meta.ver !== version && PWA.versionAsked !== meta.ver) {
      PWA.versionAsked = meta.ver;
      showBanner('🔥 发现新版本 v' + meta.ver + '，点此刷新', () => location.reload());
    }
  } catch { /* 离线 / 解析失败：静默 */ }
}

/**
 * 启动 PWA 能力：离线提示、安装引导、SW 注册与更新提示。
 * @param {{version: string, toast?: (msg: string) => void}} opts
 */
export function bootPWA(opts) {
  const version = opts.version;
  const toast = opts.toast ?? (() => {});
  PWA.standalone = isStandalone();

  /* 离线 / 在线 */
  window.addEventListener('offline', () => {
    showBanner('🌐✕ 当前离线：已缓存的版本仍可正常游玩');
  });
  window.addEventListener('online', () => {
    hideBanner();
    toast('🌐 网络已恢复');
  });
  /* 冷启动就离线时 offline 事件不会触发，需主动检查 */
  if (!navigator.onLine) {
    setTimeout(() => showBanner('🌐✕ 当前离线：已缓存的版本仍可正常游玩'), 1200);
  }

  /* 安装引导：Chromium 系 */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    PWA.deferredPrompt = e;
    if (!lsGet(TIP_INSTALL)) showBanner('📲 可安装到桌面，点此一键安装', () => install());
  });
  window.addEventListener('appinstalled', () => {
    PWA.deferredPrompt = null;
    lsSet(TIP_INSTALL, '1');
    hideBanner();
    toast('✅ 已安装到桌面');
  });

  /* 安装引导：iOS 手动添加（只提示一次） */
  if (isIOS() && !PWA.standalone) {
    setTimeout(() => {
      if (lsGet(TIP_IOS)) return;
      showBanner('📲 点「分享」→「添加到主屏幕」，可全屏离线玩 <span style="opacity:.7">（点此关闭）</span>', () => {
        lsSet(TIP_IOS, '1');
        hideBanner();
      });
    }, 3500);
  }

  /* 存档安全：申请持久化存储（失败不影响游戏） */
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  } catch { /* 老浏览器没有 storage API */ }

  /* SW 只在 https / localhost 注册 */
  const canSW = 'serviceWorker' in navigator
    && (/^https:$/.test(location.protocol) || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname));
  if (!canSW) return;

  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
    .then((reg) => {
      PWA.swReg = reg;
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          // 已有 controller 说明这是「更新」而不是首次安装
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            showBanner('🔥 新版本已下载，点此刷新生效', () => location.reload());
          }
        });
      });
    })
    .catch(() => { /* 注册失败不打扰玩家 */ });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return; // 首次安装接管，不提示
    showBanner('🔥 已更新到新版本，点此刷新', () => location.reload());
  });

  /* 切回前台：两路兜底检查更新（SW update + version.json 比对） */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (PWA.swReg && PWA.swReg.update) PWA.swReg.update().catch(() => {});
    checkVersion(version);
  });
  setTimeout(() => checkVersion(version), 8000);
}
