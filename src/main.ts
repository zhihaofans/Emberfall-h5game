// 应用入口（迁移期骨架）
// 这一步只验证「TypeScript → Vite → dist/」的构建链路能跑通；
// 游戏逻辑后续按 core/（纯逻辑）与 ui/（渲染）两层，从 survival.html 逐个模块搬过来。

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('挂载点 #app 不存在');

app.textContent = '末日余烬 · 骨架就绪';
console.log('[emberfall] boot ok');
