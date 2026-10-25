# TODO · 末日余烬 / Emberfall —— 架构重构（对齐 Vale Farm 分层）

> 最后更新：**2.0.0 / build 102**（2026-10-25），代码仍是单文件 `survival.html`（6436 行 / 435KB）。
> 本文件只放「还没做」的事。每条给：**为什么** · **怎么做** · **验收** · **成本** · 是否需要拍板。
> 优先级：**P0** 地基（不做后面全白做）｜**P1** 逻辑分层｜**P2** 表现层｜**P3** 工程化收尾。

---

## 0. 现状 → 目标

| 维度 | 现在 | 目标（对齐 Vale Farm） |
|---|---|---|
| 形态 | 单个 `survival.html`，HTML+CSS+JS 全内联 | `src/` 分模块源码 → 构建出 `dist/`（多文件 + PWA 可部署） |
| 语言 | 原生 JS，无类型 | TypeScript `strict`，`tsc --noEmit` 把关 |
| 分层 | 无。渲染与逻辑混在同一作用域，靠行号分区 | `core/` 纯逻辑（不碰 DOM、可单测）+ `ui/` 表现层（只调 core 公开函数） |
| 构建 | 无 | Vite 多文件产物（`dist/index.html` + `assets/`），SW 预缓存清单由构建注入 |
| 测试 | 66 个 puppeteer 用例（依赖单文件结构与全局函数） | `tests/unit/` 纯函数单测 + 少量关键路径 e2e |
| 版本 | 常量散落在 html 里 | `public/version.json` 唯一数据源，`tools/stamp.mjs` 一次写齐 |
| 发布 | `release.sh`（bash + git add/commit/tag） | `tools/` 脚本流水线 + CI（typecheck → 单测 → build → e2e → deploy） |

**两条不能破的红线**（迁移期间逐条验收）：老存档能读（fmt 11）· 能构建出可离线部署的 PWA 产物（`dist/`，断网可玩）。
> 「单文件双击即玩」与 `file://` 支持均已取消（2026-10-25，D2）；验证一律走本地 http 服务或部署后的站点。

### 版本策略（2026-10-25 定，不再讨论）

- 重构首发版本 **3.0.0**；`BUILD_CODE` 从 **103** 继续单调递增，不跳号、不随 MAJOR 重置。
- MAJOR 的判定统一为「不兼容的重大重构（运行形态 / 工程结构变化）或存档不兼容」——`survival.html` 的 `VERSION_RULES` 与本文档 §0.3 已改成同一句话。
- `CHANGELOG.md`（仓库根，75 版 / 216 条）是完整历史归档，当前与游戏内 `CHANGELOG` 数组**逐条一致**；重构后由 `tools/stamp.mjs` 从该文件生成内联数据，避免两份手工同步。
- 游戏内显示的版本号旁边还要带 **git hash**（排查线上到底是哪个提交），由构建注入、不手写 —— 见 §5.8。

---

## 1. 需要你拍板的决策点

| # | 决策 | 选项 | 建议与理由 |
|---|---|---|---|
| **D1** | 渲染技术 | A) 继续 DOM/CSS　B) 引入 Phaser | **已定 A**（2026-10-25）：文字/列表交互，Phaser 无收益且体积翻倍 |
| **D2** | 产物形态 | A) 单 HTML　B) 多文件 + PWA 部署 | **已定 B**（2026-10-25）：Vite 多文件产物 + PWA 部署（GitHub Pages）；不再要求「一个 HTML 双击即玩」 |
| **D3** | 是否接受开发需要 Node 工具链 | 是 / 否 | **已定「接受」**（2026-10-25）：改代码走 `npm run dev` / `build` |
| **D4** | 内联第三方库（LZString + QR，约 2400 行） | A) 转 npm 依赖　B) 放 `src/vendor/` 保留源码　C) 继续内联 | **A**，但 QR 生成/扫描若依赖相机权限，单独评估。理由是自研维护 2400 行第三方代码无意义 |
| **D5** | 旧存档支持范围 | A) 只保证 fmt 11 起能读　B) 连 fmt 1–10 全链路迁移 | **A**（现有 `migrateFrom` 已覆盖，迁移后仍需逐代测）。B 只在你手上有更老的档要救时才做 |
| **D6** | 66 个旧 puppeteer 用例 | A) 全部作废重写　B) 抽取断言改成 core 单测　C) 原样保留 | **B**。这些用例的价值在断言（数值、状态、成就），不在 DOM 选择器；能抽的先抽成纯函数测试 |
| **D7** | 单测框架 | A) vitest　B) `node:test` | **已定 B**（2026-10-25）：`node:test` 零依赖、沙箱能跑；vitest 在本机容器里跑不起来，收益抵不过风险 |

---

## 2. P0 · 地基（先做，1–2 天）

### 2.1 建工程骨架 —— Vite 多文件产物，本地 http 打开即玩 —— ✅ 已完成（2026-10-25）

- 产物：`npm run build` → `dist/`（19 个文件 / 1.18 MB），含 `index.html` + `assets/*.js` + `icons/` + `splash/` + `screenshots/` + `manifest.json` + `version.json` + `sw.js`
- `tools/build.mjs`：清产物 → vite build → 复制静态资源 → **按 `dist/` 真实产物生成 `sw.js` 的 `ASSETS`（18 项）**并注入 `BUILD`
- 实测：`sw.js` 语法 OK；http 服务下 `index.html` / `manifest.json` / `sw.js` / `version.json` / 图标 / assets **全部 200**
- `manifest.json` 的 `start_url` 改为 `./index.html`（旧版 `index.html` 会 redirect，两种形态都能启动）
- 已知：本机 `tsc` SIGABRT、`/workspace` 装不了依赖，构建在 `/root` 镜像副本里验证；类型检查交给 CI

- **为什么**：没有骨架，后面每个模块都无处安放；产物要能直接部署成可安装、可离线的 PWA。
- **怎么做**：
  1. `package.json` 补脚本：`dev` / `build` / `preview` / `typecheck`（已有 `ssot`/`unit`/`e2e`/`verify`）
  2. `tsconfig.json`：`strict`、`target ES2021`、`moduleResolution Bundler`、`noEmit`
  3. `vite.config.ts`：`base: './'`（子目录部署可用）、`build.target es2021`、`outDir dist/`、`emptyOutDir`（**产物不入库**）
  4. `src/main.ts` + `src/core/` + `src/ui/` 空壳；Vite 入口用 `src/index.html`，**根目录现有的 `index.html` / `survival.html` 迁移期不动**（保证随时能回退到当前可玩版本）
  5. `tools/build.mjs`：vite build 之后把 `icons/` `splash/` `screenshots/` `manifest.json` `sw.js` `version.json` 复制进 `dist/`，并注入 SW 预缓存清单
- **验收**：`npm run build` 产出 `dist/`；`python3 -m http.server -d dist` 打开能进游戏壳、`console` 0 报错；`dist/` 里图标与启动图路径全部可解析；断网重载仍可玩（SW 生效）。
- **成本**：小。**依赖**：D2、D3。

### 2.2 先搬存档层（`core/save.mjs`）—— ✅ 已完成（2026-10-25）

- 产物：`src/core/save.mjs`（纯函数：`createNewState` / `normalizeState` / `migrateFrom` / `legacyBestiary` / `serialize` / `parseSavePayload`）+ `src/core/types.mjs`（JSDoc 类型）
- 单测 `tests/unit/save.test.mjs` **13 条**：默认值 / 幂等 / clamp / 一次性补偿 / 迁移链（fmt1→11）/ 往返 / 非法输入 / 图鉴推断 / lastSeen / **未来字段不被吞**
- **两处真 bug：新实现已修，旧的 `survival.html` 暂不改，随重构整体切换时一并生效**（2026-10-25 决定）
  1. `lastSeen | 0` 把 13 位时间戳截成 32 位负数 → 每次载入都白拿 8 小时离线收益
  2. `newGame()` 漏写 `__v1274_comp` → 新玩家第一次读档白拿 1 图腾 + 2 抽奖券
- 迁移策略：新模块与旧实现并存，靠单测保证行为一致；等 P2 表现层搬完，整体切到 `src/` 后再删旧代码

### 2.3 定测试基建 —— ✅ 已完成（2026-10-25）

- 本地层：`npm run verify` = SSOT 校验 + `node --test` 单测（11 条，**实测 EXIT=0**），不需要浏览器
- 浏览器层：`tests/run-e2e.mjs` 统一入口（白名单 15 个 / `--all` 全部），把"进程崩了但 0 断言"也算失败
- CI：`.github/workflows/ci.yml` 两个 job（`verify` 无浏览器 → `e2e` 用 `browser-actions/setup-chrome`），另有 `workflow_dispatch` 可跑全部用例
- 依赖统一到仓库根 `package.json`（`puppeteer-core`），`tests/package.json` 只留 `"type": "commonjs"`
- 已知限制：沙箱里 `npm ci` 会因 `/workspace` 不能建符号链接而 EPERM、Chromium 打不开页面 —— e2e 以 CI 为准

### 2.4 先立「只改一处」的校验（`check-ssot`，只查不写）—— ✅ 已完成（2026-10-25）

- 产物：`tools/check-ssot.mjs`（只读，6 类校验）。当前基线：**11 项通过 / 0 失败 / 2 项提示**（提示 = `RES_PRICE` 有意缺 totem/adrenaline；`icons/` 有 2 个未被引用的资产文件）。
- 已验证有效：版本号漂移、CHANGELOG 漂移、图标文件缺失、SW 预缓存指向不存在文件 —— 四类都会打印差异并 `exit 1`。
- 2026-10-25 已补齐 `GET_WHERE` 缺的 `expPotion / luckyDraw / lifePotion` 三条（材料百科不再漏项），顺带修正 `totem` 的「唯一获取途径」错误表述。

- **为什么**：`AGENT.md` §0.5 定了 SSOT 原则，但生成器要等构建链就位。在生成器之前，先用校验脚本把现有的 5 处重复钉住，避免重构期间两边漂移 —— 这次已经抓到「强化倍率、探索事件数、MAJOR 定义」三处文案与代码不一致。
- **怎么做**：`tools/check-ssot.mjs` 逐项比对（全部只读，不改文件）：
  1. `version.json` 的 `ver`/`build` ↔ `GAME_VERSION`/`BUILD_CODE` ↔ `sw.js` 的 `BUILD`
  2. `CHANGELOG.md` ↔ 内联 `CHANGELOG` 数组（版本数 / 条目数 / 逐条文本）
  3. `manifest.json` 的 `icons[]` ↔ `icons/` 实际文件
  4. `sw.js` 的 `ASSETS` ↔ 运行时文件清单
  5. `splash/` 文件 ↔ `<link rel="apple-touch-startup-image">` 条数
- **验收**：一致时 exit 0 并逐项打印 `OK <数量>`；任一不一致 exit 1 并打印差异。故意改坏一处必须变红。
- **成本**：小。

---

## 3. P1 · 逻辑分层（3–5 天）

> 原则：`src/core/**` 一律不 import DOM、不 import Phaser/任何渲染代码，全部纯函数，状态显式传入传出。

| # | 目标模块 | 从 `survival.html` 搬什么 | 验收 |
|---|---|---|---|
| 3.1 | `core/data/*.mjs` | **已搬 10 张**：`resources` / `skills` / `zones` / `actions` / `recipes` / `upgrades` / `weapons` / `monsters` / `shop` / `luck-events`；**剩余都带效果函数**（`ENCHANTS.effect`、`MERCHANT_GOODS`、`DORA_GOODS`、`EXPLORE_EVENTS`），随对应逻辑模块一起搬 | 数值快照 + 与旧文件逐项 diff（已建立对拍模式：36 条零漂移断言 + 交叉引用校验） |
| 3.2 | `core/time.mjs` | `passTime / nextDay / tick / applyPassive / checkDeath`、季节天气 | 单测：跨日结算、饥饿/口渴掉血、死亡与图腾复活、睡眠被偷 |
| 3.3 | `core/actions.mjs` | **已完成**：前置检查 `checkAction` / 精力结算 `payActionCost` / 13 个行动产出（进食·饮水·睡觉·治疗·取水·烹饪·烧水·砍柴·狩猎·熔炼·采矿·炼锭·钓鱼）+ `data/fishing.mjs` 掉落表；自动循环 `startAuto / stopAuto / nextAutoAction` | 单测 26 条：材料不足不扣精力（历史坑 #4）、27 组前置检查对拍、13 个行动**逐字段对拍**（含钓鱼五分支）、自动循环 6 条对拍 |
| 3.4 | `core/craft.mjs` | `doCraft / craftArmor / upgradeItem / upgradeCost / recipeVisible / hasRes / spend / addRes` | 单测：22 配方解锁链、装备材质链、强化 10 级后额外消耗 |
| 3.5 | `core/combat.mjs` | `weaponAtk / armorDmgMult / fight / startCombat / bossStats / pharaohStats` | 单测：伤害公式（含强化/附魔/技能）、减伤下限 0.1、Boss 三阶段 |
| 3.6 | `core/achievements.mjs` | `checkMilestone` 白名单 + `checkZoneAchieve / checkStageAchieve / checkFishAchieve / checkArmorSet` | 单测：`MS` 里 76 个文案 id 与白名单**双向一致**（新增成就漏登记直接红） |
| 3.7 | `core/npc.mjs` | `doraInfo / addDoraFav / doraGoods / doraGiftOpts …`、流浪商人 | 单测：好感 6 级门槛、按等级解锁商品、金币不足禁用 |
| 3.8 | `core/explore.mjs` | `doExplore / rollExploreEvent / resolveEvent / lostOpts / pickMerchantGoods`、`EXPLORE_EVENTS` / `NIGHT_EVENTS` | 单测：按 `w` 权重抽（打桩随机源）、`disabled` 选项不消耗事件、区域特色怪 45% |
| 3.9 | `core/wiki.mjs` | `wikiSeen / wikiUnlocked / legacyBestiary` | 单测：遭遇即解锁、老档补解锁、未解锁字段显示遮罩 |

**实施顺序（2026-10-25 调整）**：3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7 → 3.8 → 3.9。

原来是先搬探索事件，但 `EXPLORE_EVENTS` 的 `eff` 里混了 `startCombat`（流程跳转）、`checkMilestone`（成就）、`weaponAtk`（战斗计算）、`spend`（扣资源），属于最上层，必须等下面全部就位才搬得动。

- **成本**：中（按模块分批）。**关键纪律**：每搬一个模块，`survival.html` 就删掉对应段，**不允许两份实现并存超过一个提交**。

---

## 4. P2 · 表现层（3–5 天）

| # | 任务 | 做法 | 验收 |
|---|---|---|---|
| 4.1 | `ui/render/*` 拆分 | 5400–6100 段按面板拆：菜单/商店/技能/百科/进度/行动/背包 | 每个渲染函数**只读状态、只写自己的容器**；不允许互调，统一 `renderAll()` |
| 4.2 | `ui/dom.ts` 小部件 | 复用现有 `toast / log / modal` 形态，不另造一套 | 可视化回归截图（窄屏 390×844 与桌面各一张） |
| 4.3 | 事件绑定集中化 | 替掉 HTML 内联 `onclick="fn()"`（当前有大量全局函数被内联引用） | 产物里 `onclick=` 出现次数 = 0；键盘/触控均可用 |
| 4.4 | `dev/guard.ts` | 6100–6300 防崩溃（EBH 哨兵 + HTML 备份） | 故意让启动抛错，能出降级页并可一键恢复 |
| 4.5 | `src/pwa.ts` | 6299–6436 PWA 层：注册条件、更新提示三源、离线标识 | SW 只在安全上下文注册；`https` 下首次安装不误报"已更新"；断网重载界面+存档正常 |

- **成本**：中。**风险**：渲染层最容易在拆分时引入"少更新一次"的 bug —— 建议先建立 `renderAll()` 的调用点清单，再动手。

---

## 5. P3 · 工程化收尾

| # | 任务 | 验收 |
|---|---|---|
| 5.0 | **生成器接管（SSOT 落地）** —— ✅ 已完成（2026-10-25）：`tools/sync-meta.mjs` 从 `version.json` + `CHANGELOG.md` 生成 html 的 `GAME_VERSION`/`BUILD_CODE`/`CHANGELOG` 与 `sw.js` 的 `BUILD`；`--check` / `--dry-run` 两种只读模式 | 幂等基线与现有源码逐字节一致；副本里改源 → check 红 → sync → check 绿 → 复跑 0 改动 |
| 5.1 | `tools/build.mjs`：清产物 → vite build → 注入 SW 预缓存清单 | 产物版本号与 `sw.js` 的 `BUILD` 一致；重复构建字节稳定 |
| 5.2 | `tools/stamp.mjs`：`--bump/--set/--build`，写版本唯一源并回读校验；同时从 `CHANGELOG.md` 生成游戏内 `CHANGELOG` 数组 | 三处（html / sw / version.json）不一致时直接失败；`CHANGELOG.md` 与内联数组逐条一致 |
| 5.3 | `tools/package.mjs`：只打运行时文件 zip | 包内版本一致性核对 + `find -newer` 防过期 |
| 5.4 | 替换 `release.sh` | 发布不再由 bash 里 `git add -A` 完成；commit/tag 仍由你执行 |
| 5.5 | CI（GitHub Actions） | typecheck → 单测 → build → e2e → deploy，全绿才发 |
| 5.6 | e2e 只留关键路径 | 启动、存档往返、离线重载、安装提示、战斗一场、Boss 一场 |
| 5.7 | 文档同步 | `AGENT.md` 代码地图按新目录重写；`CHANGELOG` 补 3.0.0；`README` 加开发命令 |
| 5.8 | **版本号旁显示 git hash**：`tools/build.mjs` 读 `git rev-parse --short=7 HEAD`（工作区脏则加 `-dirty`，取不到写 `unknown`），注入 `version.json` 与构建产物；游戏内 4 处版本号文案（启动日志 / 主菜单 / 死亡页 / 版本规则面板）统一从 `core/version` 读取，**不允许各处手拼** | 显示值与 `git rev-parse --short HEAD` 一致；有未提交改动显示 `-dirty`；无 git 环境（解压的 zip）显示 `unknown` 且不报错；`check-ssot` 增加「产物 sha ↔ 当前 HEAD」校验 |

---

## 6. 沙箱环境实测结论（决定「在哪验证」）

| 能力 | 结果 | 证据 |
|---|---|---|
| `/workspace` 执行文件 | ❌ 不行 | 脚本 `chmod +x` 后执行返回 126 |
| `/workspace` 建符号链接 | ❌ 不行 | `cp -r` 时 `Operation not permitted` |
| `/root` 执行文件 | ✅ 可以 | 脚本执行返回 0 |
| npm registry | ✅ 通 | `npm install esbuild` 17s 成功 |
| **vite + singlefile 构建** | ✅ **可以**（在 `/root`） | vite 8.3.5 构建成功，产物单 HTML 838B，JS 已内联 |
| `tsc --noEmit` | ❌ 崩 | SIGABRT，`uv__io_poll` 断言失败（exit 134） |
| `vitest run` | ❌ 失败 | transform 阶段报 `invalid JS syntax`（Vale Farm 时期亦不可用） |
| `node --test` | ✅ 可以 | 1 pass / exit 0 |
| Chromium e2e | ❌ 不行 | 打开页面 SIGTRAP（exit 133） |

**结论**：沙箱内能验证「构建产物 + 纯函数单测（`node:test`）+ 语法」；**不能**验证「类型检查 + 浏览器 e2e」。
因此重构期的 git 工作流建议：源码在 `/workspace` 编辑，构建/测试在 `/root` 的镜像副本里跑（`rsync` 后执行），或直接在本机/CI 上把关 `tsc` 与 e2e。

---

## 7. 迁移风险清单（每条都要有对应验收）

1. **存档静默丢字段** —— 新字段必须同时进 `newGame` + `normalizeState` 默认值 + `migrateFrom`，并补 round-trip 单测（历史坑 #2）。
2. **数值漂移** —— 40 张表手工搬运极易抄错；用「旧文件解析 → 新模块导出 → 逐键深比较」的脚本卡一遍，差异必须为零。
3. **内联 `onclick` 断裂** —— 147 个函数被 HTML 内联引用，拆模块后需全量替换为事件委托，否则按钮"点了没反应"。
4. **渲染函数互调导致递归** —— 拆分时先画调用图，统一走 `renderAll()`。
5. **产物体积** —— 单文件内联后仍应可控；每次构建记录体积，超阈值就查是不是把大依赖打进来了。
6. **照搬离谱设定** —— 老代码里数值/机制明显不合理时，默认按原样搬（保证行为等价），但必须登记到 [`SUSPECTED.md`](SUSPECTED.md)（源码位置 / 影响 / 建议 / 影响面），等用户拍板后再作为独立改动提交（见 `AGENT.md` §0.1）。

---

## 8. 里程碑

| 里程碑 | 内容 | 完成标志 |
|---|---|---|
| **M1** | 骨架可构建 | 单文件产物经本地 http 打开正常，0 报错 |
| **M2** | 存档可迁移 | fmt 11 真档 round-trip 全绿 |
| **M3** | core 全分层 | 9 个 core 模块 + 单测，`tsc` 干净 |
| **M4** | 表现层拆完 | 功能等价，关键路径手测通过 |
| **M5** | 流水线 + CI | 一条命令出包，CI 全绿 |
| **M6** | 3.0.0 发版 | 老档可读、PWA 可装、离线可玩 |

---

## 9. 明确不做（避免走回头路）

- 不引入 Phaser（除非 D1 改判）。
- 不为了"架构好看"把纯数据表包成 class 或加状态容器 —— 数据就是数据。
- 不在重构同一提交里调数值/加玩法；行为必须等价，改玩法单开一条。
- 不把 `dist/` 产物提交进仓库。
- 不删 `tests/` 里历史用例，先抽断言、再淘汰选择器（D6）。
