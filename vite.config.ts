import { defineConfig } from 'vite';

// 迁移期约定：Vite 以 src/ 为根，入口是 src/index.html。
// 仓库根现有的 index.html / survival.html **保持不动** —— 新代码出问题时随时能回退到旧版本。
// 全部产物用相对路径（base './'），子目录部署（GitHub Pages 等）天然可用。
export default defineConfig({
  root: 'src',
  base: './',
  build: {
    outDir: '../dist',   // 相对 root
    emptyOutDir: true,
    target: 'es2021',
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173, outDir: '../dist' },
});
