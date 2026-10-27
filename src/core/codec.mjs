// 存档编码：把 state 变成可复制/可扫码的文本，以及反向解析。
//
// 三种格式（与旧版 survival.html 完全互认）：
//   EMBER:  + base64(UTF-8 JSON)     标准导出码（复制/粘贴用；长度约为 JSON 的 1.33 倍）
//   EMBER1: + base64(UTF-8 JSON)     v1.0.0 的旧标识，只读兼容
//   EMQR1:  + LZ 压缩的 base64       二维码专用（JSON 太大，不压塞不进 QR）
//
// 另外容忍「裸 JSON」（新版早起导出的文本、手工从别处粘来的），以及前后夹带说明文字的整段文本。
// 纯函数：不碰 DOM、不碰 localStorage；解析失败一律返回 null（不抛错）。

import LZString from 'lz-string';
import { SAVE_FMT, SAVE_TAG, parseSavePayload, serialize } from './save.mjs';

export const CODE_TAG = SAVE_TAG; // 'EMBER'
export const LEGACY_TAG = 'EMBER1';
export const QR_TAG = 'EMQR1';

/** @typedef {import('./save.mjs').GameState} GameState */

/**
 * UTF-8 安全的 base64（与旧版 toB64 的写法一致：先 escape(encodeURIComponent) 再 btoa）。
 * @param {string} s
 */
function toB64(s) {
  return btoa(unescape(encodeURIComponent(s)));
}

/**
 * @param {string} s
 */
function fromB64(s) {
  // 容错：去掉折行/空格；兼容 URL-safe 变体（- _）；补齐 base64 padding
  let b = String(s).replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  return decodeURIComponent(escape(atob(b)));
}

/**
 * 标准导出码：`EMBER:` + base64(JSON)。与旧版逐字节同格式，老存档/新存档互通。
 * @param {any} state
 * @param {string} ver
 * @returns {string}
 */
export function exportCode(state, ver) {
  return `${CODE_TAG}:${toB64(serialize(state, ver))}`;
}

/**
 * 二维码专用码：`EMQR1:` + LZ 压缩。二维码容量有限，必须压缩。
 * @param {any} state
 * @param {string} ver
 * @returns {string}
 */
export function exportQrCode(state, ver) {
  return `${QR_TAG}:${LZString.compressToBase64(serialize(state, ver))}`;
}

/**
 * 解析任意一种存档文本。
 * @param {string} text
 * @param {number} [now]
 * @returns {{state: GameState, isOld: boolean} | null}
 */
export function parseSaveCode(text, now = Date.now()) {
  // 容错：BOM（Windows 记事本另存会出现）、首尾空白
  const code = String(text ?? '').replace(/^\uFEFF/, '').trim();
  if (!code) return null;

  /** @param {any} data @param {boolean} legacy */
  const finish = (data, legacy) => {
    const state = parseSavePayload(data, now);
    if (!state) return null;
    const fmt = (data.fmt | 0) || 1;
    return { state, isOld: legacy || fmt < SAVE_FMT };
  };

  // 允许前缀前面带说明文字（「我的存档：EMBER:xxx」），取最先出现的已知前缀；
  // 前缀大小写不敏感（部分输入法/聊天工具会把开头字母转成小写）
  const tags = [
    { tag: QR_TAG, kind: 'qr' },
    { tag: LEGACY_TAG, kind: 'legacy' },
    { tag: CODE_TAG, kind: 'code' },
  ];
  const lower = code.toLowerCase();
  /** @type {{tag: string, kind: string, at: number}|null} */
  let hit = null;
  for (const t of tags) {
    const at = lower.indexOf(t.tag.toLowerCase() + ':');
    if (at >= 0 && (!hit || at < hit.at)) hit = { ...t, at };
  }

  if (hit) {
    try {
      const body = code.slice(hit.at + hit.tag.length + 1);
      if (hit.kind === 'qr') {
        const json = LZString.decompressFromBase64(body.replace(/\s+/g, ''));
        if (json) return finish(JSON.parse(json), false);
      } else {
        return finish(JSON.parse(fromB64(body)), hit.kind === 'legacy');
      }
    } catch {
      // 前缀在但内容解不开：继续尝试按裸 JSON 解析（可能是 PEM 式的混合文本）
    }
  }

  // 裸 JSON：容忍前后夹带的说明文字（取第一个 { 到最后一个 }）
  try {
    const start = code.indexOf('{');
    const end = code.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    return finish(JSON.parse(code.slice(start, end + 1)), false);
  } catch {
    return null;
  }
}
