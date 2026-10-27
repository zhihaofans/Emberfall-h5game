/* 测试公共环境：统一解析项目根、游戏入口与浏览器路径
   —— 用例不再硬编码绝对路径，仓库换位置/换机器后仍可跑。
   环境变量 CHROMIUM_PATH 可覆盖浏览器路径（默认系统 chromium）。 */
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');      // 仓库根目录（tests/ 的上一级）
const GAME = path.join(ROOT, 'legacy', 'survival.html');   // 游戏入口
const URL = pathToFileURL(GAME).href;            // file:// 形式，可直接喂给 page.goto
const CHROMIUM = process.env.CHROMIUM_PATH || '/usr/bin/chromium';

module.exports = { ROOT, GAME, URL, CHROMIUM };
