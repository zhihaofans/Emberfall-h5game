// 多帧二维码：把超长的存档码拆成几张「小二维码」，扫码端逐张收集后拼回。
//
// 为什么需要：2.0 存档编码后约 1900 字符 → 165×165 模块，手机镜头要么装不下、
// 要么对不上焦。拆成 4 张、每张约 480 字符（≈85–90 模块）后，单张屏幕显示即可扫。
//
// 帧格式（纯文本，便于扫码器直接读）：
//   EMQ2|<id>|<seq>/<total>|<part>
//   · id    : 整段内容的短哈希，防止扫到别的存档的碎片混进来
//   · seq   : 从 1 开始
//   · part  : 原文本的切片（base64 里没有 `|`，安全）
//
// 单帧存档（内容很短）不拆，直接把原文本交给扫码端。

export const FRAME_PREFIX = 'EMQ2';

/** 每帧字符数：520 → 约 89 模块（实测），比单张 165 模块好扫得多 */
export const DEFAULT_CHUNK = 520;

/**
 * @typedef {{id: string, total: number, frames: string[]}} ChunkedFrames
 * @typedef {{id: string, seq: number, total: number, part: string}} QrFrame
 */

/**
 * 6 位 base36 哈希（djb2）。
 * @param {string} text
 */
function hash36(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36).padStart(6, '0').slice(-6);
}

/**
 * 把完整文本拆成二维码帧。内容短于一帧时返回单帧（不加头，保持与旧 QR 兼容）。
 * @param {string} text
 * @param {number} [chunkSize]
 * @returns {ChunkedFrames}
 */
export function chunkText(text, chunkSize = DEFAULT_CHUNK) {
  const full = String(text);
  const size = Math.max(120, Math.floor(chunkSize));
  if (full.length <= size) return { id: '', total: 1, frames: [full] };

  const id = hash36(full);
  /** @type {string[]} */
  const parts = [];
  for (let i = 0; i < full.length; i += size) parts.push(full.slice(i, i + size));
  const total = parts.length;
  return {
    id,
    total,
    frames: parts.map((part, i) => `${FRAME_PREFIX}|${id}|${i + 1}/${total}|${part}`),
  };
}

/**
 * 解析一帧；不是多帧格式时返回 null（交给普通存档码处理）。
 * @param {string} text
 * @returns {QrFrame|null}
 */
export function parseFrame(text) {
  const s = String(text ?? '').trim();
  if (!s.startsWith(FRAME_PREFIX + '|')) return null;
  const m = /^EMQ2\|([a-z0-9]+)\|(\d+)\/(\d+)\|([\s\S]+)$/.exec(s);
  if (!m) return null;
  const seq = Number(m[2]);
  const total = Number(m[3]);
  if (!seq || !total || seq > total || total > 99) return null;
  return { id: m[1], seq, total, part: m[4] };
}

/**
 * 收集器：逐帧喂入，集齐后返回拼好的完整文本；未集齐返回 null。
 */
export class FrameCollector {
  constructor() {
    /** @type {{id: string, total: number, parts: Map<number, string>} | null} */
    this.cur = null;
  }

  /**
   * @param {QrFrame} frame
   * @returns {{text: string|null, got: number, total: number}}
   */
  add(frame) {
    if (!this.cur || this.cur.id !== frame.id || this.cur.total !== frame.total) {
      this.cur = { id: frame.id, total: frame.total, parts: new Map() };
    }
    this.cur.parts.set(frame.seq, frame.part);
    const got = this.cur.parts.size;

    if (got < this.cur.total) return { text: null, got, total: this.cur.total };

    let out = '';
    for (let i = 1; i <= this.cur.total; i++) {
      const part = this.cur.parts.get(i);
      if (part === undefined) return { text: null, got, total: this.cur.total };
      out += part;
    }
    this.cur = null;
    return { text: out, got, total: 0 };
  }

  /**
   * 这一帧是否已经收过（扫码器每 300ms 会重复读同一张，避免刷屏提示）。
   * @param {QrFrame} frame
   */
  has(frame) {
    return !!this.cur && this.cur.id === frame.id && this.cur.parts.has(frame.seq);
  }

  reset() {
    this.cur = null;
  }
}
