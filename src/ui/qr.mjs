// 二维码：生成（导出用）与摄像头扫描（导入用）。
//
// 生成用 qrcode-generator（与旧内联库同一个库，编码结果稳定）；扫描用 jsQR，
// 每 300ms 抽一帧解码，长边最多 1280px（半分辨率会把密集二维码压成 1px/模块，解不出）。
//
// 只碰 DOM 与 MediaStream，不读写存档；解码成功把文本交给调用方，由 codec 负责解析。

import qrcode from 'qrcode-generator';
import jsQR from 'jsqr';

const TIP_DEFAULT = '正在识别…<br><span style="font-size:11px;opacity:.7">把二维码放进取景框，靠近一点、调亮屏幕</span>';

/** @type {MediaStream | null} */
let stream = null;
/** @type {ReturnType<typeof setInterval> | null} */
let timer = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let tipTimer = null;

/**
 * 生成二维码 canvas（白底黑码，四周留 4 模块静默区）。
 * @param {string} text
 * @param {number} [size] 期望边长（实际会取整到模块整数倍）
 * @returns {HTMLCanvasElement}
 */
export function makeQrCanvas(text, size = 300) {
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();

  const n = qr.getModuleCount();
  // 关键：每模块至少 3 像素。存档较大时模块数可达 165+，按 260px 算只有 1px/模块，
  // 手机摄像头几乎不可能解出来（实测：1px/模块在理想图下能解，真实拍摄基本失败）。
  const cell = Math.max(3, Math.floor((size - 16) / n));
  const pad = 4 * cell;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = n * cell + pad * 2;

  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(c * cell + pad, r * cell + pad, cell, cell);
  }
  return canvas;
}

/** 停止扫码：清定时器、关摄像头、收起全屏层。重复调用安全。 */
export function stopScanner() {
  if (timer) { clearInterval(timer); timer = null; }
  if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }
  const tip = document.querySelector('#scanner .tip');
  if (tip) tip.innerHTML = TIP_DEFAULT;
  if (stream) {
    for (const t of stream.getTracks()) t.stop();
    stream = null;
  }
  const video = /** @type {HTMLVideoElement | null} */ (document.getElementById('scanVideo'));
  if (video) video.srcObject = null;
  const sc = document.getElementById('scanner');
  if (sc) sc.classList.remove('show');
}

/**
 * 打开扫码层并开始解码。第一次解出内容就自动停流并回调。
 * @param {{onText: (text: string) => void, onError: (msg: string) => void}} opts
 */
export async function startScanner(opts) {
  const { onText, onError } = opts;
  const sc = document.getElementById('scanner');
  const video = /** @type {HTMLVideoElement | null} */ (document.getElementById('scanVideo'));

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    onError('当前浏览器不支持摄像头扫码，请使用「粘贴存档代码」');
    return;
  }
  if (!sc || !video) {
    onError('扫码界面没有准备好，请刷新后重试');
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
  } catch {
    onError('无法访问摄像头，请授予相机权限或用粘贴导入');
    return;
  }

  video.srcObject = stream;
  video.play().catch(() => { /* 自动播放被拦时由用户点一下即可 */ });
  sc.classList.add('show');

  // 8 秒还没解出来就换提示：让玩家知道是「没扫到」，不是点了没反应
  const tip = sc.querySelector('.tip');
  if (tip) tip.innerHTML = TIP_DEFAULT;
  if (tipTimer) clearTimeout(tipTimer);
  tipTimer = setTimeout(() => {
    if (tip) tip.innerHTML = '还没识别到…<br><span style="font-size:11px;opacity:.7">靠近一点 / 调亮屏幕 / 换角度，或改用「粘贴导入」</span>';
  }, 8000);

  timer = setInterval(() => tick(video, onText), 300);
}

/**
 * 抽一帧解码。
 * @param {HTMLVideoElement} video
 * @param {(text: string) => void} onText
 */
function tick(video, onText) {
  if (!video || video.readyState < 2 || !video.videoWidth) return;

  // 全分辨率解码（长边最多 1280，兼顾性能）：半分辨率会把 2px/模块压成 1px，直接解不出
  const longest = Math.max(video.videoWidth, video.videoHeight);
  const scale = Math.min(1, 1280 / longest);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  /** @type {ImageData} */
  let img;
  try { img = ctx.getImageData(0, 0, canvas.width, canvas.height); } catch { return; }

  const res = jsQR(img.data, img.width, img.height);
  if (res && res.data) {
    stopScanner();
    onText(res.data);
  }
}
