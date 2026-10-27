# 末日余烬 / Emberfall

末日废土文字生存点击游戏（挂机 + 探索 + 制作 + 战斗 + 附魔）。纯前端，存档只存在本机，可装到桌面离线玩。

## 玩

- 线上（GitHub Pages，新版 `dist/`）：<https://zhihaofans.github.io/Emberfall-h5game/>
- 旧的单文件版本：`legacy/survival.html`（冻结的 2.0.0，只作单测对拍基准，不再发布）

## 开发

```bash
npm ci            # 装依赖（TypeScript / Vite / puppeteer-core）
npm run dev       # 本地开发（Vite，入口 src/index.html）
npm run build     # 构建 dist/（多文件 PWA 产物，含 SW 预缓存清单）
npm run preview   # 预览 dist/（localhost 下 SW 与摄像头都可用）
npm run verify    # SSOT 校验 + tsc --noEmit + 单测（不需要浏览器）
npm run e2e       # 真浏览器 e2e（需要 Chromium；本地起不来就交给 CI）
npm run stamp -- --bump patch --note "说明"   # 改版本号（唯一源 version.json，自动同步三处）
npm run release   # SSOT + 类型 + 单测 + 构建 + 打包（不做 git commit/tag）
```

版本号唯一源是 `version.json`：改代码时不动版本号，发版时统一 bump（规则见 `AGENT.md` §0.3）。

- 项目结构与协作铁律：`AGENT.md`
- 重构进度与待办：`dev-docs/TODO.md`
- 已知“离谱设定”与修正记录：`dev-docs/SUSPECTED.md`

## 部署

推送 `master` → CI（SSOT / 类型 / 单测 / e2e）全绿 → `Deploy` workflow 构建 `dist/` 并强制推送到独立的 **`gh-pages`** 分支 → GitHub Pages 从该分支发布。

一次配置：仓库 Settings → Pages → Build and deployment → Source 选 **Deploy from a branch**，分支选 **`gh-pages`**、目录 **/ (root)**。
`gh-pages` 只保留当前版本的产物（每次强制单提交），源码分支保持干净；换静态托管时也可以直接拉这个分支。
