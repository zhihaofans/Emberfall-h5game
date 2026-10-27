// 应用入口：启动守卫 → 应用层 → PWA 能力
//
// 守卫只做两件事：启动前写哨兵、启动成功后清哨兵。上次没清掉（启动到一半崩了）
// 就先显示降级页，让玩家自己选「重载 / 清缓存重载 / 仍然进入」，而不是对着白屏。
import './ui/style.css';
import { boot, toast } from './app.mjs';
import { bootPWA } from './pwa.mjs';
import {
  guardStart, guardMarkBooted, guardRecord, showRecovery, clearCachesAndReload,
} from './dev/guard.mjs';

const guard = guardStart();

function startApp() {
  try {
    boot();
    bootPWA({ version: __APP_VERSION__, toast });
    guardMarkBooted();
    document.getElementById('recovery')?.remove();
  } catch (err) {
    guardRecord(err);
    showRecovery({
      lastError: String((err as Error)?.message ?? err),
      onRetry: () => location.reload(),
      onClear: clearCachesAndReload,
      onContinue: null,
    });
    throw err;
  }
}

// 运行期错误也记一笔：下次启动如果哨兵还在，降级页能直接展示它
window.addEventListener('error', (e) => guardRecord(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => guardRecord(e.reason));

if (guard.recovered) {
  showRecovery({
    lastError: guard.lastError,
    onRetry: () => location.reload(),
    onClear: clearCachesAndReload,
    onContinue: startApp,
  });
} else {
  startApp();
}
