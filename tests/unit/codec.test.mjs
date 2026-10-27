// 存档编码：EMBER / EMBER1 / EMQR1 / 裸 JSON 的往返与兼容性
//
// 三种前缀都是旧版 survival.html 已有的格式，必须逐字节互认：
//   EMBER:  base64(UTF-8 JSON)
//   EMBER1: 同上，v1.0.0 旧标识
//   EMQR1:  LZ 压缩的 base64（二维码用）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNewState, serialize } from '../../src/core/save.mjs';
import {
  exportCode, exportQrCode, parseSaveCode, CODE_TAG, LEGACY_TAG, QR_TAG,
} from '../../src/core/codec.mjs';

const NOW = 1_700_000_000_000;
const VER = '2.0.0';

function sampleState() {
  const s = createNewState(NOW);
  s.gold = 777;
  s.day = 42;
  s.res.wood = 99;
  s.items.axe = true;
  return s;
}

/** 旧版 toB64 的写法（与 codec 内部实现无关，独立复现一遍用于兼容性断言） */
const oldB64 = (s) => btoa(unescape(encodeURIComponent(s)));

test('EMBER：标准码往返，金币/天数/资源都不丢', () => {
  const s = sampleState();
  const code = exportCode(s, VER);
  assert.ok(code.startsWith(CODE_TAG + ':'), '前缀必须是 EMBER:');

  const parsed = parseSaveCode(code);
  assert.ok(parsed);
  assert.equal(parsed.isOld, false);
  assert.equal(parsed.state.gold, 777);
  assert.equal(parsed.state.day, 42);
  assert.equal(parsed.state.res.wood, 99);
  assert.equal(parsed.state.items.axe, true);
});

test('EMBER：正文与旧版逐字节同格式（base64(UTF-8 JSON)）', () => {
  const s = sampleState();
  const code = exportCode(s, VER);
  const body = code.slice(CODE_TAG.length + 1);
  assert.equal(
    decodeURIComponent(escape(atob(body))),
    serialize(s, VER),
    '正文必须是旧版 toB64(serialize()) 的结果',
  );
});

test('EMQR1：压缩码往返，且明显短于标准码（能塞进二维码）', () => {
  const s = sampleState();
  const code = exportQrCode(s, VER);
  assert.ok(code.startsWith(QR_TAG + ':'));
  assert.ok(code.length < exportCode(s, VER).length, '压缩码应短于 base64 码');
  assert.ok(code.length < 1500, `二维码内容过长：${code.length}`);

  const parsed = parseSaveCode(code);
  assert.ok(parsed);
  assert.equal(parsed.state.gold, 777);
  assert.equal(parsed.state.res.wood, 99);
});

test('EMQR1：满状态（全图鉴/装备/资源）也压得进二维码', () => {
  const s = createNewState(NOW);
  for (const id of Object.keys(s.bestiary)) s.bestiary[id] = 3;
  for (const k of Object.keys(s.items)) s.items[k] = true;
  for (const k of Object.keys(s.res)) s.res[k] = 250;
  s.gold = 99999;
  s.day = 120;
  const code = exportQrCode(s, VER);
  assert.ok(code.length < 2900, `满状态二维码内容 ${code.length} 字符，可能超出 QR 容量`);
  const parsed = parseSaveCode(code);
  assert.equal(parsed.state.day, 120);
  assert.equal(parsed.state.gold, 99999);
});

test('EMBER1：旧版标识仍可导入，并标记为旧档', () => {
  const s = sampleState();
  const legacy = LEGACY_TAG + ':' + oldB64(JSON.stringify({ tag: 'EMBER1', fmt: 11, ver: '1.0.0', g: s }));
  const parsed = parseSaveCode(legacy);
  assert.ok(parsed);
  assert.equal(parsed.isOld, true);
  assert.equal(parsed.state.gold, 777);
});

test('裸 JSON：兼容早期新架构导出与前后夹带说明的文本', () => {
  const s = sampleState();
  const json = serialize(s, VER);
  const parsed = parseSaveCode(json);
  assert.ok(parsed);
  assert.equal(parsed.state.gold, 777);

  const wrapped = `这是我昨天的存档，复制进来就行：\n${json}\n——以上`;
  const parsed2 = parseSaveCode(wrapped);
  assert.ok(parsed2);
  assert.equal(parsed2.state.day, 42);
});

test('容错：BOM / 前缀前带说明 / base64 折行 / URL-safe 变体', () => {
  const s = sampleState();
  const code = exportCode(s, VER);

  // Windows 记事本另存的 UTF-8 BOM
  assert.equal(parseSaveCode('\uFEFF' + code).state.gold, 777);

  // 复制时带了说明文字
  assert.equal(parseSaveCode('我的存档，粘进来就行：' + code).state.gold, 777);

  // base64 每 76 列折行（邮件/编辑器常见）
  const body = code.slice(CODE_TAG.length + 1);
  assert.equal(parseSaveCode(CODE_TAG + ':' + body.replace(/(.{76})/g, '$1\n')).state.gold, 777);

  // URL-safe base64（- _ 代替 + /）
  const urlSafe = CODE_TAG + ':' + body.replace(/\+/g, '-').replace(/\//g, '_');
  assert.equal(parseSaveCode(urlSafe).state.gold, 777);
});

test('前缀大小写不敏感（输入法/聊天工具会把开头字母转小写）', () => {
  const code = exportCode(sampleState(), VER);
  for (const pre of ['ember:', 'Ember:', 'eMbEr:']) {
    const r = parseSaveCode(pre + code.slice(CODE_TAG.length + 1));
    assert.ok(r, `${pre} 应能识别`);
    assert.equal(r.state.gold, 777);
  }
});

test('坏数据一律返回 null，不抛错', () => {
  for (const bad of ['', '   ', 'hello', 'EMBER:', 'EMBER:!!!', 'EMQR1:!!!', '{"a":1}', '{}', null, undefined]) {
    assert.equal(parseSaveCode(bad), null, `应拒绝：${String(bad)}`);
  }
});
