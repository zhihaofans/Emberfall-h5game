// 二维码：生成（导出用）与摄像头扫描（导入用）。
//
// 生成用 qrcode-generator（与旧内联库同一个库，编码结果稳定）；扫描用 jsQR，
// 每 400ms 从摄像头画面抽 1/2 分辨率的一帧解码 —— 与旧版 pwaBoot 之后的扫码实现一致。
//
// 只碰 DOM 与 MediaStream，不读写存档；解码成功把文本交给调用方，由 codec 负责解析。

import qrcode from 'qrcode-generator';
import jsQR from 'jsqr';

/** @type {MediaStream | null} */
let stream = null;
/** @type {ReturnType<typeof setInterval> | null} */
let timer = null;

/**
 * 生成二维码 canvas（白底黑码，四周留 4 模块静默区）。
 * @param {string} text
 * @param {number} [size] 期望边长（实际会取整到模块整数倍）
 * @returns {HTMLCanvasElement}
 */
export function makeQrCanvas(text, size = 260) {
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();

  const n = qr.getModuleCount();
  const pad = 4;
  const cell = Math.max(1, Math.floor((size - pad * 2) / n));
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
  timer = setInterval(() => tick(video, onText), 400);
}

/**
 * 抽一帧解码。
 * @param {HTMLVideoElement} video
 * @param {(text: string) => void} onText
 */
function tick(video, onText) {
  if (!video || video.readyState < 2 || !video.videoWidth) return;

  const scale = 0.5;
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
