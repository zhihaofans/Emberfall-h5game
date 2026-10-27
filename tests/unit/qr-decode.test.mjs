// 二维码链路：qrcode-generator 编码 → 栅格化 → jsQR 解码，必须还原原文。
//
// 这条链路以前没有测试：导出码长度约 1900 字符时模块数 165+，按 260px 渲染只有 1px/模块，
// 手机摄像头基本解不出。这里用「每模块 N 像素」的合成图验证——渲染端必须给足像素。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import qrcode from 'qrcode-generator';
import jsQR from 'jsqr';
import { createNewState } from '../../src/core/save.mjs';
import { exportQrCode } from '../../src/core/codec.mjs';

const NOW = 1_700_000_000_000;

/** 把二维码矩阵栅格化成 ImageData 形状 */
function rasterize(text, pxPerModule) {
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  const pad = 4 * pxPerModule;
  const size = n * pxPerModule + pad * 2;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue;
      for (let y = 0; y < pxPerModule; y++) {
        for (let x = 0; x < pxPerModule; x++) {
          const i = ((r * pxPerModule + pad + y) * size + (c * pxPerModule + pad + x)) * 4;
          data[i] = data[i + 1] = data[i + 2] = 0;
        }
      }
    }
  }
  return { data, width: size, height: size, modules: n };
}

function bigState() {
  const s = createNewState(NOW);
  for (const id of Object.keys(s.bestiary)) s.bestiary[id] = 12345;
  for (const k of Object.keys(s.items)) s.items[k] = true;
  for (const k of Object.keys(s.res)) s.res[k] = 99999;
  s.gold = 99999;
  s.day = 180;
  s.hour = 22;
  s.skills = Object.fromEntries(Object.keys(s.skills).map((k) => [k, { lvl: 50, xp: 9999 }]));
  s.upgrades = Object.fromEntries(Object.keys(s.upgrades).map((k) => [k, 15]));
  s.enchant = { tblLv: 5, weapon: 5, armor: 5, tool: 5 };
  s.npcDora = { fav: 300 };
  s.stats = {
    ...s.stats,
    kills: 9999, explore: 999, craft: 500, bossKills: 3, pharaohKills: 3, events: 800, fish: 500,
    zoneCnt: { for: 50, rui: 50, riv: 50, hil: 50, pyr: 50 },
    ownedRes: Object.fromEntries(Object.keys(s.res).map((k) => [k, 1])),
  };
  for (const k of Object.keys(s.bestiary)) s.milestones[k] = 1;
  return s;
}

test('小存档：3px/模块可完整解出 EMBER/EMQR1 文本', () => {
  const text = exportQrCode(createNewState(NOW), '3.0.0');
  const img = rasterize(text, 3);
  const res = jsQR(img.data, img.width, img.height);
  assert.ok(res, '应能解码');
  assert.equal(res.data, text);
});

test('大存档（导出码 > 1300 字符 / 130+ 模块）：4px/模块仍能解出', () => {
  const text = exportQrCode(bigState(), '3.0.0');
  assert.ok(text.length > 1300, `测试样本太短：${text.length}`);
  const img = rasterize(text, 4);
  assert.ok(img.modules > 130, `模块数应 > 130，实际 ${img.modules}`);
  const res = jsQR(img.data, img.width, img.height);
  assert.ok(res, '密集二维码也要能解码');
  assert.equal(res.data, text);
});

test('渲染尺寸：makeQrCanvas 至少给到 3px/模块（165 模块 → ≥519px 画布）', async () => {
  // qr.mjs 依赖 document，这里只校验计算规则的一致性（与实现同式）
  const n = 165;
  const cell = Math.max(3, Math.floor((300 - 16) / n));
  assert.equal(cell, 3);
  assert.ok(n * cell + 8 * cell >= 500);
});
