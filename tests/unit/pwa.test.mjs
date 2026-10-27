// PWA 能力层的纯判断（不碰 DOM / SW，浏览器专属的部分交 CI 与手测）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isStandalone, isIOS, canInstall } from '../../src/pwa.mjs';

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';

test('isStandalone：display-mode 或 navigator.standalone 任一成立', () => {
  const mqTrue = { matchMedia: () => ({ matches: true }), navigator: {} };
  const mqFalse = { matchMedia: () => ({ matches: false }), navigator: {} };
  assert.equal(isStandalone(mqTrue), true);
  assert.equal(isStandalone({ matchMedia: () => ({ matches: false }), navigator: { standalone: true } }), true);
  assert.equal(isStandalone(mqFalse), false);
  assert.equal(isStandalone({}), false, '没有 matchMedia 的环境不应抛错');
});

test('isIOS：iPhone / iPad / iPadOS 伪装 Mac 都能认出来', () => {
  assert.equal(isIOS({ userAgent: IPHONE_UA }), true);
  assert.equal(isIOS({ userAgent: IPAD_UA }), true);
  assert.equal(isIOS({ userAgent: IPHONE_UA, platform: 'MacIntel', maxTouchPoints: 5 }), true);
  assert.equal(isIOS({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', platform: 'MacIntel', maxTouchPoints: 0 }), false);
});

test('isIOS：安卓与空 UA 不误判', () => {
  assert.equal(isIOS({ userAgent: ANDROID_UA }), false);
  assert.equal(isIOS({}), false);
});

test('canInstall：已安装不再提示；桌面端只认 beforeinstallprompt；iOS 可手动添加', () => {
  assert.equal(canInstall({ standalone: true, hasPrompt: true, ios: true }), false);
  assert.equal(canInstall({ standalone: false, hasPrompt: true, ios: false }), true);
  assert.equal(canInstall({ standalone: false, hasPrompt: false, ios: true }), true);
  assert.equal(canInstall({ standalone: false, hasPrompt: false, ios: false }), false);
});
