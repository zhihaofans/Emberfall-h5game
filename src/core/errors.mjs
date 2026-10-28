// 错误过滤：哪些 window.onerror 不该写进游戏日志。
//
// 背景：在手机内置浏览器/WebView 里切换全屏时，会冒出 `Script error.（?:0）`。
// 这是浏览器对**跨域脚本**（扩展注入、WebView 自身页面）的脱敏报错：
// 没有文件名、没有行号、没有 Error 对象，跟游戏代码无关，但会吓到玩家。
//
// 规则：只忽略「完全没有定位信息」的错误与 ResizeObserver 的良性告警；
// 我们自己的 assets/*.js 是同源的，真出错一定带 filename/lineno，不会被误吞。

/** @typedef {{message?: string, filename?: string, lineno?: number, error?: any}} ErrorLike */

/**
 * 是否应当忽略（不进游戏日志）。
 * @param {ErrorLike} e
 * @returns {boolean}
 */
export function isIgnorableScriptError(e) {
  const msg = String(e?.message ?? '');
  const file = String(e?.filename ?? '');
  const hasError = !!e?.error;

  // 跨域脱敏错误：浏览器只给一句 "Script error."，没有文件/行号/异常对象
  if (/^script error\.?$/i.test(msg.trim()) && !file && !hasError) return true;

  // ResizeObserver 循环告警：移动端 WebView 常见，属于良性噪音
  if (/ResizeObserver loop/i.test(msg)) return true;

  return false;
}
