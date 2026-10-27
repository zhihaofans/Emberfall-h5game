# legacy/survival.html —— 冻结的旧实现（只读）

这个文件是 2.0.0 的单文件版本，**已停止演进**，只为两件事保留：

1. **单测对拍基准**：`tests/unit/*.test.mjs` 把这里的 40 张数据表与同名函数当作 oracle，
   迁移后仍逐字段比对（`legacy/survival.html` 被改动，对拍就失去意义）。
2. **旧 e2e 回归**：`tests/run-e2e.mjs --legacy` 仍可跑旧套件（默认已切换到新架构的 e2e）。

## 规则

- **不要修改本目录里的任何文件**：它代表 2.0.0 的线上行为，改它 = 改测试基准。
- **不要发布它**：`tools/build.mjs` 只产出 `dist/`；`tools/package.mjs` 只打 `dist/` 的内容，
  新产物里没有这个文件。
- 版本号停留在 2.0.0 / build 102（`GAME_VERSION` / `BUILD_CODE`），**不随 3.0.0 更新**。
- 新代码/新功能一律写在 `src/`，行为差异用 `dev-docs/SUSPECTED.md` 记录。

## 什么时候可以删

新架构的 core 单测不再依赖对拍（或已用快照替代）之后，整个目录可以删除。
在那之前删除会一次性失去 20 个测试文件的基准。
