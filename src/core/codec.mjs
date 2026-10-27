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
  return decodeURIComponent(escape(atob(s)));
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
  const code = String(text ?? '').trim();
  if (!code) return null;

  /** @param {any} data @param {boolean} legacy */
  const finish = (data, legacy) => {
    const state = parseSavePayload(data, now);
    if (!state) return null;
    const fmt = (data.fmt | 0) || 1;
    return { state, isOld: legacy || fmt < SAVE_FMT };
  };

  try {
    if (code.startsWith(QR_TAG + ':')) {
      const json = LZString.decompressFromBase64(code.slice(QR_TAG.length + 1));
      if (!json) return null;
      return finish(JSON.parse(json), false);
    }

    let body = null;
    let legacy = false;
    if (code.startsWith(CODE_TAG + ':')) {
      body = code.slice(CODE_TAG.length + 1);
    } else if (code.startsWith(LEGACY_TAG + ':')) {
      body = code.slice(LEGACY_TAG.length + 1);
      legacy = true;
    }
    if (body !== null) return finish(JSON.parse(fromB64(body.trim())), legacy);

    // 裸 JSON：容忍前后夹带的说明文字（取第一个 { 到最后一个 }）
    const start = code.indexOf('{');
    const end = code.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    return finish(JSON.parse(code.slice(start, end + 1)), false);
  } catch {
    return null;
  }
}
