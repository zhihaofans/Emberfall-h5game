// 应用入口：加载样式 → 启动应用层 → 挂上 PWA 能力（SW / 安装 / 更新提示）
//
// PWA 层在 boot() 之后启动：这样提示条回调里的 toast 已经可用；
// 想临时关掉 PWA 能力，删掉下面两行即可，游戏逻辑不受影响（同旧版 pwaBoot 的解耦约定）。
import './ui/style.css';
import { boot, toast } from './app.mjs';
import { bootPWA } from './pwa.mjs';

boot();
bootPWA({ version: __APP_VERSION__, toast });
