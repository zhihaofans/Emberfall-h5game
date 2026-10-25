import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// 版本号唯一源是仓库根的 version.json；构建时注入成常量，页面里直接读 __APP_VERSION__。
// 不把 version.json 放进 src/，避免出现第二份版本事实。
const meta = JSON.parse(readFileSync(new URL('./version.json', import.meta.url), 'utf8')) as {
  ver: string;
  build: string | number;
};

// 迁移期约定：Vite 以 src/ 为根，入口是 src/index.html。
// 仓库根现有的 index.html / survival.html **保持不动** —— 新代码出问题时随时能回退到旧版本。
// 全部产物用相对路径（base './'），子目录部署（GitHub Pages 等）天然可用。
export default defineConfig({
  root: 'src',
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(meta.ver),
    __APP_BUILD__: JSON.stringify(String(meta.build)),
  },
  build: {
    outDir: '../dist',   // 相对 root
    emptyOutDir: true,
    target: 'es2021',
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173, outDir: '../dist' },
});
