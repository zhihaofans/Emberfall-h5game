# 末日余烬 / Emberfall

末日废土文字生存点击游戏（挂机 + 探索 + 制作 + 战斗 + 附魔）。纯前端，存档只存在本机，可装到桌面离线玩。

## 玩

- 线上（GitHub Pages，新版 `dist/`）：<https://zhihaofans.github.io/Emberfall-h5game/>
- 旧的单文件版本：`survival.html`（直接双击；重构切换前保留作回退）

## 开发

```bash
npm ci            # 装依赖（TypeScript / Vite / puppeteer-core）
npm run dev       # 本地开发（Vite，入口 src/index.html）
npm run build     # 构建 dist/（多文件 PWA 产物，含 SW 预缓存清单）
npm run preview   # 预览 dist/（localhost 下 SW 与摄像头都可用）
npm run verify    # SSOT 校验 + tsc --noEmit + 单测（不需要浏览器）
npm run e2e       # 真浏览器 e2e（需要 Chromium；本地起不来就交给 CI）
```

版本号唯一源是 `version.json`：改代码时不动版本号，发版时统一 bump（规则见 `AGENT.md` §0.3）。

- 项目结构与协作铁律：`AGENT.md`
- 重构进度与待办：`dev-docs/TODO.md`
- 已知“离谱设定”与修正记录：`dev-docs/SUSPECTED.md`

## 部署

推送 `master` → CI（SSOT / 类型 / 单测 / e2e）全绿 → `Deploy` workflow 把 `dist/` 发到 GitHub Pages。

首次启用需要在仓库 Settings → Pages → Source 选 **GitHub Actions**（之前是“分支部署”，所以线上一直是旧版单文件）。
