// 多帧二维码：拆分 / 解析 / 收集 / 单帧可解码
import { test } from 'node:test';
import assert from 'node:assert/strict';
import qrcode from 'qrcode-generator';
import jsQR from 'jsqr';
import { createNewState } from '../../src/core/save.mjs';
import { exportQrCode } from '../../src/core/codec.mjs';
import {
  chunkText, parseFrame, FrameCollector, FRAME_PREFIX, DEFAULT_CHUNK,
} from '../../src/core/qr-frames.mjs';

const NOW = 1_700_000_000_000;

test('短内容不拆分，保持单帧（与旧的单张二维码兼容）', () => {
  const short = 'EMQR1:abc';
  const r = chunkText(short);
  assert.equal(r.total, 1);
  assert.deepEqual(r.frames, [short]);
  assert.equal(parseFrame(short), null);
});

test('长内容按块拆分，每帧都能解析且序号连续', () => {
  const full = 'EMQR1:' + 'x'.repeat(1926);
  const { id, total, frames } = chunkText(full);
  assert.ok(total >= 4, `应至少 4 张，实际 ${total}`);
  assert.match(id, /^[a-z0-9]{6}$/);

  frames.forEach((f, i) => {
    const p = parseFrame(f);
    assert.ok(p, `第 ${i + 1} 帧应能解析`);
    assert.equal(p.id, id);
    assert.equal(p.seq, i + 1);
    assert.equal(p.total, total);
    assert.ok(p.part.length <= DEFAULT_CHUNK);
  });

  const joined = frames.map((f) => parseFrame(f).part).join('');
  assert.equal(joined, full);
});

test('收集器：乱序也能拼回；重复帧不重复计入提示', () => {
  const full = 'EMQR1:' + 'y'.repeat(1600);
  const { frames } = chunkText(full);
  const c = new FrameCollector();
  const parsed = frames.map(parseFrame);

  const first = parsed[0];
  assert.equal(c.has(first), false);
  c.add(first);
  assert.equal(c.has(first), true, '重复扫同一张应被识别出来');

  for (const f of [...parsed].reverse()) c.add(f);
  // 上面已经加过 first，再全部加一遍（重复）后应集齐
  const r = new FrameCollector();
  for (const f of [...parsed].reverse()) {
    const out = r.add(f);
    if (out.text) assert.equal(out.text, full);
  }
  assert.equal(r.cur, null, '集齐后收集器应清空');
});

test('不同 id 的碎片不会混到一起', () => {
  const a = chunkText('EMQR1:' + 'a'.repeat(1200));
  const b = chunkText('EMQR1:' + 'b'.repeat(1200));
  const c = new FrameCollector();
  c.add(parseFrame(a.frames[0]));
  const r = c.add(parseFrame(b.frames[0]));
  assert.equal(r.text, null);
});

test('单帧二维码 ≤ 100 模块，jsQR 能解出（手机可扫的密度）', () => {
  const s = createNewState(NOW);
  for (const k of Object.keys(s.items)) s.items[k] = true;
  for (const k of Object.keys(s.res)) s.res[k] = 99999;
  const full = exportQrCode(s, '3.0.0');
  const { frames } = chunkText(full);

  for (const text of frames.slice(0, 2)) {
    const qr = qrcode(0, 'M');
    qr.addData(text, 'Byte');
    qr.make();
    const n = qr.getModuleCount();
    assert.ok(n <= 100, `单帧 ${n} 模块，仍然过密`);

    // 栅格化后交给 jsQR 解码
    const px = 4;
    const pad = 4 * px;
    const size = n * px + pad * 2;
    const data = new Uint8ClampedArray(size * size * 4).fill(255);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!qr.isDark(r, c)) continue;
        for (let y = 0; y < px; y++) {
          for (let x = 0; x < px; x++) {
            const i = ((r * px + pad + y) * size + (c * px + pad + x)) * 4;
            data[i] = data[i + 1] = data[i + 2] = 0;
          }
        }
      }
    }
    const res = jsQR(data, size, size);
    assert.ok(res, '单帧应可解码');
    assert.equal(res.data, text);
  }
});

test('坏帧：缺段 / 序号越界 / 前缀相似都不被误认', () => {
  assert.equal(parseFrame(`${FRAME_PREFIX}|abc123|1/4`), null);
  assert.equal(parseFrame(`${FRAME_PREFIX}|abc123|0/4|x`), null);
  assert.equal(parseFrame(`${FRAME_PREFIX}|abc123|5/4|x`), null);
  assert.equal(parseFrame('EMQ1|abc123|1/4|x'), null);
  assert.equal(parseFrame('hello'), null);
});
