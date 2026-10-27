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
| **D4** | 内联第三方库（LZString + QR，约 2400 行） | A) 转 npm 依赖　B) 放 `src/vendor/` 保留源码　C) 继续内联 | **A**（2026-10-27 落地）：`qrcode-generator`（与旧内联库同一作者/API）+ `jsqr` + `lz-string`，扫码在 §4.1.8 完成 |
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
- 已知：`/workspace` 装不了依赖（noexec），构建与 `tsc` 都在 `/root` 镜像副本里验证
- **2026-10-25 更新**：`tsc --noEmit` 在本机已能跑通（约 75 秒，不再 SIGABRT），245 个类型错误已清零并进门禁（见 §5.5）

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
| 3.6 | `core/achievements.mjs` | **已完成**：`checkMilestone`（数字=天数里程碑，字符串=白名单）+ `checkZoneAchieve / checkStageAchieve / checkFishAchieve / checkArmorSet`；数据在 `data/achievements.mjs`（MS 76 键 / 白名单 69 条 / 天数奖励 7 档） | 单测 10 条：数据对拍、**MS 字符串键 ↔ 白名单双向一致**、天数里程碑（3/7/15/30/60/100/180）、重复触发幂等、区域/阶段/钓鱼/套装全对拍 |
| 3.7 | `core/npc.mjs` | **已完成**：`doraInfo` / `addDoraFav` / `doraGoods` / `canGift` / `giftDora` / `canBuyDoraGood` / `buyDoraGood` + 商人 `merchantGoods` / `pickMerchantGoods` / `canTrade` / `buyMerchant`；数据在 `data/npc.mjs`（6 级好感 / 10 件口袋 / 4 种礼物 / 23 件商人商品，3 条特殊效果走 `key`） | 单测 11 条：数据逐条对拍、好感 12 档门槛、送礼 4 种、口袋解锁 6 档、图纸两次购买、商人抽取（固定随机 × 学完前后）、两种图纸商品 |
| 3.8 | `core/explore.mjs` + `core/explore-events.mjs` | **已完成**：`exploreZone` / `rollNightEvent` / `pickExploreEvent` / `resolveOption` / `canPickOption` / `lostOpts`；数据在 `data/explore-events.mjs`（**28 条事件**）与 `data/events-night.mjs`（4 条） | 单测 13 条：4 区域 × 3 随机 × 3 天气、夜间 4 种事件 × 季节 × 火堆、**28 个事件 × 每个选项 × 3 随机值的逐字段对拍**（100+ 组合）、条件不足提示、动态选项禁用 |
| 3.9 | `core/wiki.mjs` | **已完成**：`markSeen` / `isUnlocked` / `markEncounter` / `wikiProgress`；`BESTIARY_IDS` 21 条由怪物表派生（`legacyBestiary` 已在 2.2 随存档层搬完） | 单测 5 条：`markSeen` 对拍、21 条 id 与数据表一致、**老档补解锁产出的 id 必须都在清单内**、遭遇解锁、进度统计 |

**实施顺序（2026-10-25 调整）**：3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7 → 3.8 → 3.9。

原来是先搬探索事件，但 `EXPLORE_EVENTS` 的 `eff` 里混了 `startCombat`（流程跳转）、`checkMilestone`（成就）、`weaponAtk`（战斗计算）、`spend`（扣资源），属于最上层，必须等下面全部就位才搬得动。

- **成本**：中（按模块分批）。**关键纪律**：每搬一个模块，`survival.html` 就删掉对应段，**不允许两份实现并存超过一个提交**。

---

## 4. P2 · 表现层（3–5 天）

| # | 任务 | 做法 | 验收 |
|---|---|---|---|
| 4.1 | `ui/render/*` 拆分 | **已完成**：骨架 + 样式 + 状态条 + 13 个行动 + 自动循环 + 存档 + 区域切换 + 探索事件弹窗 + 战斗/Boss 弹窗 + 商人/机器猫菜单 + **制作面板（22 配方）** + **背包（进食/饮水/资源/出售）** + **装备与强化（§4.1.1）** + **附魔台（§4.1.2）** + **菜单（§4.1.3，图鉴/导出导入/存档操作）** + **黑市商店（§4.1.4）** + **技能一览（§4.1.5）** + **进度总览（§4.1.6）** + **更新日志（§4.1.7）** + **扫码导入导出（§4.1.8）**；**§4.1 全部完成** | 构建 20 文件 / 1.26MB；`el()` 引用 16 个全部存在；采集 → 制作 → 生存 → 探索 → 战斗 → 交易 → 装备闭环打通 |

### 4.1.1 装备与强化面板（✅ 2026-10-25 已完成，实施记录见文末「实际实现」）

**位置**：不新开页签，接在「制作」页签内 —— `renderCraft()` 的配方列表之后追加两个分区（原版也是制作页里放装备/强化），复用 `.craft-item` 卡片样式。

**core 已就绪，不用改逻辑**：

| 用途 | 现成函数 / 数据 |
|---|---|
| 某部位当前材质 | `armorSlotMat(state, slot)`（`'none'` 表示空） |
| 制作并穿上 | `craftArmor(state, slot, mat)` → `{logs, achievements:['armor1','armorSet'], refused}` |
| 强化 | `upgradeItem(state, key)` → `{logs, achievements:['up1','stage'], refused, time:2}` |
| 强化成本 | `upgradeCost(key, lv)`（Lv.10 起额外符石/合金） |
| 数据 | `ARMOR_MATS`（6 档顺序）/ `ARMOR_MAT_INFO`（name/dmg/cost）/ `ARMOR_SLOTS`（4 部位）/ `UPGRADES`（4 项，max 15） |
| 总减伤 | `armorDmgMult(state)`（可在装备区顶部显示"当前总减伤 xx%"） |

**渲染规则**：

1. **装备区**：4 个部位各一张卡。`idx = ARMOR_MATS.indexOf(当前材质)`，下一档是 `ARMOR_MATS[idx + 1]`（当前 `'none'` 时 idx=-1，下一档正好是 `leather`）。
   - 卡片显示：`头盔 · 当前：🛡铁（减伤 0.92）` + 下一档成本（`金属 3/5 · 皮革 0/1`，缺的红字）
   - 已是 `steel`（最后一档）→ 显示「已是最强」，无按钮
   - 材料够才出「制作并穿上」按钮，`data-armor="slot:mat"`
2. **强化区**：4 项各一张卡。
   - 前置未做 → `需要先制作 🪔铁匠炉`（用 `RECIPES[u.need].name`）
   - 已满级（`lv >= u.max`）→ 「已满级」
   - 否则 → `Lv.N/15 · 成本`，材料够才出「强化到 Lv.N+1」，`data-upgrade="key"`
3. 装备区顶部加一行总减伤：`🛡 当前总减伤 45%（受伤倍率 0.55）`，数据来自 `armorDmgMult(state)`。

**点击处理**（在 `#actions` 的委托里加两个分支）：

```js
const armorBtn = target.closest('[data-armor]');
if (armorBtn) { const [slot, mat] = armorBtn.dataset.armor.split(':'); /* craftArmor */ return; }
const upBtn = target.closest('[data-upgrade]');
if (upBtn) { /* upgradeItem */ return; }
```

两者都是：`refused` → `toast`；否则 `logs` 写日志 → `applyAchievements(r.achievements)` → （强化有 `time` 就 `passTime`）→ `renderAll()` → `save()`。

**必须同时改的一处**：`applyAchievements()` 目前对 `'armorSet'` 是 `continue`（空转）。要补成：

```js
if (a === 'armorSet') { for (const l of checkArmorSet(G).logs) log(l.text, l.cls); }
```

（`checkArmorSet` 从 `core/achievements.mjs` import；它会写 `stats.setsWorn` 并触发 `set*` / `setsAll` / `armorAll`。）

**新增 import**（`src/app.mjs`）：

```js
import { craftArmor, upgradeItem, armorSlotMat, armorDmgMult, upgradeCost } from './core/craft.mjs';
import { UPGRADES } from './core/data/upgrades.mjs';
import { ARMOR_MATS, ARMOR_MAT_INFO, ARMOR_SLOTS } from './core/data/armor.mjs';
import { checkArmorSet } from './core/achievements.mjs';
```

**验收**：

- 新档 → 4 部位全是「空」，第一档皮甲可做（皮革 6）；做完头盔后只有「胸甲」那张变成铜甲可做（升级链按部位独立）
- 强化武器在没做钢刀时显示「需要先制作 ⚔️钢刀」；做了钢刀后能升到 Lv.15，Lv.10 之后成本里出现符石与合金
- 穿满 4 件同材质 → 日志出现对应套装成就；6 套集齐 → `setsAll` + `armorAll`
- 顶部总减伤数值随装备变化（0.885 → 0.522 → 叠符甲可到 0.1 下限）
- `npm run build` 通过、`el()` 引用无缺失

**实际实现（2026-10-25，与上面备忘的差异）**：

- 材质链推进和「材料是否见过」的判断**从 UI 挪进了 core**：新增 `nextArmorMat(state, slot)`（空 → 第一档，到顶 → `null`，脏材质按空处理）、`armorMatVisible(state, mat)`；两者与 `recipeVisible` 共用同一份 `seenAnyCost()`，避免三处各写一遍可见性规则。
- 补了原版的**区块导航** `.craftnav`（⚒ 制作 / 🛡 装备 / ⬆ 强化），走 `data-cnav` + `scrollCraftTo()`；配方列表包进 `#craft0` 当滚动锚点。附魔区就绪后加第 4 个按钮即可。
- `costLine()`（成本行，缺的红字）与 `finishCraftOp()`（refused → toast / 日志 → 成就 → 耗时 → 重渲染 → 存档）抽成公共函数，制作 / 装备 / 强化三处共用，`craftItem()` 缩成两行。
- 新增 CSS：`.armor-sum`、`.armor-sum .mult`、`.craft-item .tag`。
- **备忘里的 import 清单有一处写错**：`upgradeCost` 在 `data/upgrades.mjs`，不在 `craft.mjs`（照抄会在构建时报 `MISSING_EXPORT`）。
- 验证：单测 **161 条**全绿（新增 3 条：逐档推进 + 部位独立 + 可见性）、SSOT 12 项通过、`npm run build` 20 文件 / 1269.7 KB、无头 DOM 冒烟 29 项通过（本机 Chromium 起不来，真实浏览器与 e2e 交给 CI）。
- **未验证**：真实浏览器里的窄屏排版（390×844 下装备卡是否挤压）、CI e2e。

### 4.1.2 附魔台（✅ 2026-10-25 已完成）

**位置**：制作页第 4 个区块，导航第 4 个按钮 `data-cnav="craftEn"`，复用 `.craft-item` 卡片。

- 未做附魔台 → 只出提示卡（写清 `RECIPES.enchantTbl.cost`，成本走 `costLine()`，不硬编码文案），不给按钮
- 附魔台：`Lv.N/5 · 成本` +「升级到 Lv.N+1」；满级显示「已满级 · 可附魔至 5 级」
- 3 种附魔（锋利 / 保护 / 效率）：`lv >= 5` → 已满级；`lv >= tblLv` → 「需先把附魔台升到 Lv.lv+1」；否则成本行 + 附魔按钮
- 点击：`data-enchtbl` / `data-enchant="kind"`，走同一条 `finishCraftOp()`（refused → toast / 日志 → 成就 → 耗时 → 重渲染 → 存档）
- core 未改动：`enchantItem` / `upgradeEnchantTbl` / `enchantCost` / `enchantTblCost` 早在 P1 就位

**验证**：单测 162 全绿（附魔逻辑本来就在对拍里）、`tsc` 0 错误、构建 20 文件、无头 DOM 冒烟 14 条新增断言全过
（未做附魔台 → 提示；升级扣 stone4/metal2/rune1；Lv.1 后 3 项解锁；附魔扣 rune2/alloy2；`Lv.1/1` 文案）。
**未验证**：真实浏览器里的排版（4 个导航按钮在 390px 宽度下是否挤）。

### 4.1.3 菜单（✅ 2026-10-25 已完成第一批）

**位置**：右上角 ☰ → `#modal` / `#modalcard`（骨架早就在 index.html 与 style.css 里，直接复用 `.mbtn`）。

**这一批做了什么**

| 项 | 说明 |
|---|---|
| 主菜单 | 版本 + 天数 + 生存状态；6 个入口（图鉴 / 导出 / 导入 / 手动保存 / 新游戏 / 清除存档） |
| 百科图鉴 | 两个分页。怪物 21 条（与 `BESTIARY_IDS` 同序），未遭遇只露名字、数值全部打码；材料 23 种资源 + 附魔说明，全部可见 |
| 导出 | 存档文本 + 复制到剪贴板（含 `execCommand` 降级）+ 下载 .txt |
| 导入 | 粘贴文本 → 容忍前后夹带说明 → `parseSavePayload`（兼容 `EMBER` / `EMBER1`）→ 覆盖并立即落盘 |
| 存档操作 | 手动保存 / 新游戏 / 清除本地存档，危险操作走**自绘二次确认**（不用 `window.confirm`，桩环境与 e2e 可断言） |

**新增 core 模块 `bestiary.mjs`**：图鉴条目生成（纯函数，`monsterEntries(state)` / `materialEntries()`）。
数值一律从 `data/monsters.mjs` + `combat.bossStats/pharaohStats` 取，**不在图鉴里重写第二遍**
（原版 `monsterHTML()` 是硬编码的，改战斗就得再改一遍图鉴）。

**配套 SSOT 改动**：战斗里兽王的固定掉落 `luck×1 / rune×1` 原本硬编码在 `fightBoss()` 的结算与日志里，
现在抽成 `combat.BOSS_EXTRA_DROPS`，结算、日志、图鉴三处共用；对拍测试逐字通过，行为未变。

**还没做（下一步）**：扫码导入导出（原版内联 QR 生成 + jsQR，属独立一块）。
（黑市商店见 §4.1.4；技能一览见 §4.1.5；进度总览见 §4.1.6；更新日志见 §4.1.7；安装入口随 §4.5 一起做完了。）

**验证**：单测 166 全绿（新增 4 条：条目 id 与 `BESTIARY_IDS` 同序 / 解锁联动 / 数值来自战斗数据 / 材料条目数）、
`tsc` 0 错误、构建 20 文件 / 1292.7 KB、无头 DOM 冒烟 67 项通过（含菜单开合、图鉴分页与打码、导出文本、
导入金币 777 生效、新游戏回第 1 天、清档后立刻落新档）。
**未验证**：真实浏览器里的弹窗滚动与键盘遮挡（iOS Safari）。

### 4.1.4 黑市商店（✅ 2026-10-27 已完成）

**位置**：菜单第一项「🏪 黑市商店（💰N）」，与旧版顺序一致（在图鉴之前）；复用 `#modal` + `.mbtn` + `.craft-sep`，没加新 CSS。

**做了什么**

| 层 | 内容 |
|---|---|
| 数据 | `data/shop.mjs` 新增 `SHOP_GROUPS`（两组标题 + id 顺序），商品本体 `SHOP` 未动 |
| core | 新增 `core/shop.mjs`：`shopItem` / `canBuyShop` / `canBuyAnyShop` / `buyShopItem`；扣款与效果顺序、日志文案、`good` 分类与旧 `buyItem()` 一致 |
| UI | `renderShop()` 画两组商品；`buyShop()` 负责 refused → toast、日志、重渲染、存档、**原地刷新金币与按钮态**（不重建弹窗，保住滚动位置）；买完没钱再买时提示「金币已不足以再购买」 |
| 测试 | `tests/unit/shop.test.mjs` 5 条：分组标题/顺序从 `survival.html` 的 `openShop()` 切出来逐项对拍、14 件逐件购买与 `applyEffects` 对拍、金币不足零改动、未知 id、刚好买一次到 0 |

**与旧实现的差异**：无行为差异。旧版买不起的商品只是置灰但仍能点（点了才 toast），新版给按钮加 `disabled`，与旧版"置灰"外观一致、少一次无效点击。

**验证**：单测 **171** 全绿（+5）、`tsc` 0 错误、SSOT 12 项、构建 20 文件 / 1292.7 KB、产物里含商店用到的 `data-shop` 委托。
**未验证**：真实浏览器里的弹窗滚动与 390px 窄屏排版（本地 Chromium 起不来，交 CI + 手点）。

### 4.1.5 技能一览（✅ 2026-10-27 已完成）

**位置**：菜单第二项「🏅 技能一览」（商店之后、图鉴之前，与旧版顺序一致）；复用 `#modal` 与已有的 `.skillrow` 样式，没加新 CSS。

- 新增 `core/skills.mjs` 的 `skillRows(state)`：7 行 `{key, name, desc, lvl, xp, need, pct}`，顺序与 `SKILLS` 一致
- 数值全部来自 `data/skills.mjs`（`SKILL_NAMES` / `SKILL_DESC` / `xpNeed`），**面板不再自己算公式**（旧 `openSkills()` 把 `xpNeed` 与百分比写在模板里）
- 缺字段兜底：`skills` 为空或某个技能键缺失 → 按 Lv.1 / 0 经验渲染，不抛错
- 给 `SKILL_DESC` 补了 `Record<string, string>` 注解（与 `SKILL_NAMES` 一致），否则 `tsc` 报索引签名错误

**验证**：单测 **175** 全绿（+4：顺序与名称、1–60 级经验曲线、百分比夹取、缺字段兜底）、`tsc` 0 错误、SSOT 12 项、构建 20 文件 / 1292.7 KB。

### 4.1.6 进度总览（✅ 2026-10-27 已完成）

**位置**：菜单第三项「📈 进度总览」（技能之后、图鉴之前）；9 个区块全部复用现有 `.prow / .pbar / .wpnrow / .achlist / .ach` 样式，**没加新 CSS**。

| 层 | 内容 |
|---|---|
| 数据 | 新增 `data/progress.mjs`：`DAY_TARGETS`、`SKILL_MAX_LV`、`ACHIEVEMENT_SHOWCASE`（54 条 id+短标签，与旧清单逐项对拍） |
| core | 新增 `core/progress.mjs`：`dayProgress` / `craftProgress` / `upgradeProgress` / `skillProgress` / `weaponProgress` / `bossProgress` / `pharaohProgress` / `doraProgress` / `achievementProgress` + `pct` / `missingCostText` / `isAchievementId` |
| UI | `renderProgress()` 拼 9 个区块；成就「查看剩余 N 个」走 `data-ach-toggle` 委托展开（不用内联 `onclick`） |

**与旧版的 3 处展示修正**（已登记 `SUSPECTED.md` #8–#10，纯展示、不动玩法与存档）：

1. 强化进度分母：`键数×10`（40）→ 按 `UPGRADES[].max` 求和（60）
2. 武器路线：手写数组停在猎王刀 → 由 `WEAPONS` 键序派生（含 🔮符刃）
3. 材料缺口：旧印需求总量「（缺 10）」→ 真实缺口「（缺 7）」

**验证**：单测 **187** 全绿（+12）、`tsc` 0 错误、SSOT 12 项、构建 20 文件 / 1292.7 KB（产物含「进度总览」）。
**未验证**：真实浏览器里 9 个区块的滚动与 390px 窄屏排版、成就展开的点击手感（本地 Chromium 起不来，交 CI + 手点）。

### 4.1.7 更新日志（✅ 2026-10-27 已完成）

**位置**：菜单「📜 更新日志」（图鉴之后、导出之前，与旧版顺序一致）。

**做法（没有生成器，也没有第二份数据）**

- `src/core/data/changelog.mjs`：`import md from '../../../CHANGELOG.md?raw'`（Vite 的 `?raw` 把原文当字符串打进包），
  再交给 `parseChangelogMd` 解析 → 面板直接显示。**md 改了，面板立刻跟着变**，不需要 `sync-meta` 再同步一次。
- 解析器从 `tools/lib/changelog.mjs` **挪到 `src/core/changelog.mjs`**，tools 侧改为 re-export：
  `parseChangelogMd` 全仓库只有一份实现（单测断言两侧是同一个函数引用）。
- 顺带把 `VERSION_RULES`（SemVer 三行）与 `changelogStats()`（版本数/条目数/最新版）也放进 core。
- 面板：版本规则卡片 + 75 个版本全量列表，复用 `.skillrow` 与 `<ul><li>`；`build` 号来自 `__APP_BUILD__`（此前已注入但没人用）。

**验证**：单测 **191** 全绿（+4：解析器同源、概览数字、版本号唯一且降序、版本规则口径）、
`tsc` 0 错误、SSOT 12 项、构建 20 文件 / **142 KB**（较上一版 +32 KB，即 CHANGELOG.md 原文）。
**未验证**：真实浏览器里 75 条历史的长列表滚动（交 CI / 手点）。

### 4.1.8 扫码导入导出（✅ 2026-10-27 已完成，D4 落地）

**依赖**（纯 JS，浏览器直接用；`package.json` 里 3 个运行时 + 1 个类型）

| 包 | 用途 |
|---|---|
| `qrcode-generator@2` | 生成二维码（与旧内联库同一作者、同 API：`qrcode(0,'M')`） |
| `jsqr@1.4` | 解码摄像头画面 |
| `lz-string@1.5` + `@types/lz-string` | `EMQR1` 压缩格式（二维码容量有限） |

**格式（与旧版逐字节互认，单测逐条对拍）**

| 前缀 | 内容 | 用途 |
|---|---|---|
| `EMBER:` | base64(UTF-8 JSON) | 标准导出码，与旧版 `exportCode()` 同格式 |
| `EMBER1:` | 同上 | v1.0.0 旧标识，只读兼容 |
| `EMQR1:` | LZ 压缩的 base64 | 二维码专用 |
| （无前缀） | 裸 JSON | 兼容早期新架构导出 / 手工粘贴 |

**实现**

- 新增 `src/core/codec.mjs`：`exportCode` / `exportQrCode` / `parseSaveCode`（纯函数，坏数据一律返回 null）
- 新增 `src/ui/qr.mjs`：`makeQrCanvas()`（白底 + 4 模块静默区）+ `startScanner()` / `stopScanner()`（后置摄像头、每 400ms 抽 1/2 分辨率帧、jsQR）
- 导出面板：顶部二维码 + 复制 / 下载；导入面板：新增「📷 扫码导入」；`src/index.html` 补 `#scanner` 全屏层（CSS 早就在）
- **按需加载**：`ui/qr.mjs` 用动态 `import()` —— 不打开导出/扫码就不下载这 152 KB（gzip 54 KB）；SW 仍会把该 chunk 一起预缓存，装到桌面后离线可用
- 旧版导入时的 `_imported` 防坏档标记未搬：新架构还没有离线结算（`settleOffline`），等补它时一起做

**验证**：单测 **202** 全绿（+7：三种格式与裸 JSON 往返、与旧版 base64 正文对拍、满状态仍能塞进二维码、坏数据拒绝）；
`tsc` 0 错误、SSOT 12 项、构建 21 文件 / 1496.6 KB（主包 gzip 56 KB，QR chunk 54 KB 按需）。
**未验证**：真机摄像头扫码（权限、对焦、光照）、iOS Safari 的相机与「添加到主屏幕」组合（本地无浏览器，交手测）。


| 4.2 | `ui/dom.ts` 小部件 | 复用现有 `toast / log / modal` 形态，不另造一套 | 可视化回归截图（窄屏 390×844 与桌面各一张） |
| 4.3 | 事件绑定集中化 | 替掉 HTML 内联 `onclick="fn()"`（当前有大量全局函数被内联引用） | 产物里 `onclick=` 出现次数 = 0；键盘/触控均可用 |
| 4.4 | `dev/guard.ts` | 6100–6300 防崩溃（EBH 哨兵 + HTML 备份） | 故意让启动抛错，能出降级页并可一键恢复 |
| 4.5 | `src/pwa.ts`（实际落地为 `src/pwa.mjs`） | ✅ **已完成（2026-10-27）**：注册条件 / 更新提示三源 / 离线标识 / 安装引导 / 持久化存储；菜单加「📲 安装到桌面」入口；`src/index.html` 补齐 manifest 与 iOS 图标/启动图标签 | SW 只在安全上下文注册；`https` 下首次安装不误报"已更新"；断网重载界面+存档正常 |

- **成本**：中。**风险**：渲染层最容易在拆分时引入"少更新一次"的 bug —— 建议先建立 `renderAll()` 的调用点清单，再动手。

### 4.5.1 PWA 层实施记录（✅ 2026-10-27）

| 做了什么 | 位置 |
|---|---|
| PWA 能力整套搬过来：SW 注册条件、`updatefound` / `controllerchange` / 切前台比对 `version.json` 三个更新提示源、离线/在线提示条、`beforeinstallprompt` 与 iOS「添加到主屏幕」引导、`storage.persist()` | `src/pwa.mjs` |
| 纯判断抽成可测函数：`isStandalone` / `isIOS` / `canInstall`（默认参数取 `globalThis`，单测传假对象） | 同上 |
| 启动顺序：`boot()` 之后 `bootPWA({ version: __APP_VERSION__, toast })`，**只依赖注入的 toast**，不 import `app.mjs` | `src/main.ts` |
| 菜单「📲 安装到桌面（可离线全屏玩）」：仅在 `canInstallNow()` 为真时出现（已安装 / 桌面端还没拿到 prompt 时不显示） | `src/app.mjs` |
| `src/index.html` 补齐 `<link rel="manifest">`、`apple-mobile-web-app-*`、`apple-touch-icon`、6 张启动图 —— 之前只迁了 `theme-color`，缺 manifest 会导致装不上 | `src/index.html` |

**没改**：`sw.js`（`ASSETS` 仍由 `tools/build.mjs` 按 dist 产物生成）、`manifest.json`、旧 `survival.html` 的 PWA 段。

**验证**：单测 **195** 全绿（+4：独立窗口判定、iOS/iPadOS 识别、安卓不误判、可安装三态）；
`tsc` 0 错误；SSOT 12 项（dist 里 `BUILD=102`、`./assets/*.js|css` 都进了预缓存、6 张启动图引用可解析）；
构建 20 文件 / 142 KB。
**未验证**：真实 `https` 环境下的安装流程、SW 更新提示、断网重载（本地 Chromium 起不来 —— 本机只能验到「产物结构正确」）。

---

## 5. P3 · 工程化收尾

| # | 任务 | 验收 |
|---|---|---|
| 5.0 | **生成器接管（SSOT 落地）** —— ✅ 已完成（2026-10-25）：`tools/sync-meta.mjs` 从 `version.json` + `CHANGELOG.md` 生成 html 的 `GAME_VERSION`/`BUILD_CODE`/`CHANGELOG` 与 `sw.js` 的 `BUILD`；`--check` / `--dry-run` 两种只读模式 | 幂等基线与现有源码逐字节一致；副本里改源 → check 红 → sync → check 绿 → 复跑 0 改动 |
| 5.1 | `tools/build.mjs`：清产物 → vite build → 注入 SW 预缓存清单 | 产物版本号与 `sw.js` 的 `BUILD` 一致；重复构建字节稳定 |
| 5.2 | `tools/stamp.mjs`：`--bump/--set/--build`，写版本唯一源并回读校验；同时从 `CHANGELOG.md` 生成游戏内 `CHANGELOG` 数组 —— ✅ **已完成（2026-10-27）**：`--bump major\|minor\|patch` / `--set` / `--build` / `--note` / `--check`，只写 `version.json`，随后调 `sync-meta` 生成三处并回读 | 三处（html / sw / version.json）不一致时直接失败；`CHANGELOG.md` 与内联数组逐条一致（`check-ssot` 在管） |
| 5.3 | `tools/package.mjs`：只打运行时文件 zip —— ✅ **已完成（2026-10-27）**：系统 `zip` 打 `dist/`，包内回读 `version.json` / `sw.js` 的 `BUILD`，并按产物 mtime 判新鲜度 | 包内版本一致性核对 + 防过期 |
| 5.4 | 替换 `release.sh` —— ✅ **已完成（2026-10-27）**：`tools/release.mjs` 负责 SSOT → tsc → 单测 →（可选 e2e）→ 构建 → 打包；`release.sh` 退化成一层包装 | 发布不再由 bash 里 `git add -A` 完成；commit/tag 由你执行 |
| 5.5 | CI（GitHub Actions） | typecheck → 单测 → build → e2e → deploy，全绿才发。**2026-10-25**：`npm run typecheck` 并入 `verify` / CI verify job / `release.sh`。**2026-10-27**：新增 `.github/workflows/deploy.yml`（CI 成功 → 构建 dist → 发 Pages），并补 `README` 的开发/部署说明；**仍需你在仓库 Settings → Pages 把 Source 改成 GitHub Actions** |
| 5.6 | e2e 只留关键路径 | 启动、存档往返、离线重载、安装提示、战斗一场、Boss 一场 |
| 5.7 | 文档同步 | `AGENT.md` 代码地图按新目录重写；`CHANGELOG` 补 3.0.0；`README` 加开发命令 |
| 5.8 | **版本号旁显示 git hash** —— ✅ **已完成（2026-10-27）**：`tools/lib/git.mjs` 取短 hash（脏工作区 `-dirty`），vite 注入 `__APP_COMMIT__`，`dist/version.json` 写 `sha` 并自检；游戏内文案统一走 `core/version.mjs` 的 `versionLabel()`（启动日志 / 主菜单 / 版本规则卡片） | 显示值与 `git rev-parse --short HEAD` 一致；有未提交改动显示 `-dirty`；无 git 环境显示 `unknown`；构建自检 sha 与 HEAD |

### 5.9 发布链路实施记录（2026-10-27）

| # | 产物 | 说明 |
|---|---|---|
| 5.8 | `tools/lib/git.mjs` · `src/core/version.mjs` · `vite.config.ts` · `tools/build.mjs` | 短 hash 取 `git rev-parse --short=7 HEAD`（脏工作区 `-dirty`，非 git 环境 `unknown`）；Vite 注入 `__APP_COMMIT__`；`dist/version.json` 额外写 `sha` 并回读自检（sha 必须与 HEAD 一致） |
| 5.2 | `tools/lib/version.mjs` · `tools/stamp.mjs` | `bumpSemver` / `normalizeBuild` 纯函数；stamp 只写 `version.json`，再调 `sync-meta` 生成 html/sw 并回读三处 |
| 5.3 | `tools/package.mjs` | 系统 `zip` 打 `dist/` → `末日余烬-<ver>.zip`；包内回读 ver/build/BUILD；产物 mtime 早于包才算新鲜 |
| 5.4 | `tools/release.mjs` · `release.sh` | 流水线：SSOT → tsc → 单测 →（`--e2e` 可选）→ 构建 → 打包；**不再 git add/commit/tag** |

**实测**：`stamp --bump patch` → v2.0.1 / build 103 / 三处同步 → `git checkout` 回滚后 `--check` 仍绿；
`release` 全流程 exit 0，包 1230.0 KB（21 个产物 / 1496.8 KB）。
**未验证**：`--e2e` 分支（本地无 Chromium，CI 覆盖）；zip 在 Windows 解压的中文文件名（用系统 zip，UTF-8 与旧包一致）。

### 5.5.1 Pages 部署记录（2026-10-27）

- 新增 `.github/workflows/deploy.yml`：`workflow_run` 监听 CI 完成 → **只有 CI 成功才部署** → checkout `head_sha` → `npm ci` → `npm run build` → **推送到独立 `gh-pages` 分支**（强制单提交 + `.nojekyll`）
- 权限：`contents: read` / `pages: write` / `id-token: write`；`concurrency.group: pages`，不取消进行中的部署
- **一次性设置**：仓库 Settings → Pages → Source 选 **Deploy from a branch** → 分支 `gh-pages` / 目录 `/ (root)`（2026-10-27 从 Actions 部署改为独立分支部署）
- 为什么不在 push 里直接 build+deploy：避免 CI 红了站点却已更新；`workflow_dispatch` 留给补发与链路验证
- 子路径部署没问题：`base: './'`，`manifest` / `sw.js` / 图标全是相对路径，Pages 的 `/Emberfall-h5game/` 下可用；SW 作用域自然限定在该子路径
- **验证**：YAML 语法已用 `js-yaml` 解析通过；真实部署要等服务端（push + 改 Pages 设置）——本地无法验证

---

## 6. 沙箱环境实测结论（决定「在哪验证」）

| 能力 | 结果 | 证据 |
|---|---|---|
| `/workspace` 执行文件 | ❌ 不行 | 脚本 `chmod +x` 后执行返回 126 |
| `/workspace` 建符号链接 | ❌ 不行 | `cp -r` 时 `Operation not permitted` |
| `/root` 执行文件 | ✅ 可以 | 脚本执行返回 0 |
| npm registry | ✅ 通 | `npm install esbuild` 17s 成功 |
| **vite + singlefile 构建** | ✅ **可以**（在 `/root`） | vite 8.3.5 构建成功，产物单 HTML 838B，JS 已内联 |
| `tsc --noEmit` | ✅ 可以（在 `/root` 镜像） | 2026-10-25 复测：约 75 秒，exit 0；早先版本曾 SIGABRT（`uv__io_poll`，exit 134） |
| `vitest run` | ❌ 失败 | transform 阶段报 `invalid JS syntax`（Vale Farm 时期亦不可用） |
| `node --test` | ✅ 可以 | 1 pass / exit 0 |
| Chromium e2e | ❌ 不行 | 打开页面 SIGTRAP（exit 133） |

**结论**：沙箱内能验证「类型检查 + 构建产物 + 纯函数单测（`node:test`）+ 语法」；**不能**验证「浏览器 e2e」。
因此重构期的 git 工作流：源码在 `/workspace` 编辑，构建/类型检查/测试在 `/root` 的镜像副本里跑（tar 复制 + 软链 `node_modules` 后执行），e2e 交给 CI。

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
