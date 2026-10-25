#!/bin/bash
# 一键发布脚本：跑测试 → 同步 PWA 元数据 → git commit → 打 tag → 打包 → 一致性核对
# 用法：bash release.sh "更新说明文字"
# 前置：手动在 survival.html 顶部修改 GAME_VERSION / BUILD_CODE / CHANGELOG 后再跑
# 版本号纪律（经验文档二）：功能测试全绿后才 bump，不边改边涨。

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MSG="${1:-chore: 自动化发布}"
cd "$(dirname "$0")"

echo -e "${YELLOW}=== 0. SSOT 校验（同一事实多处是否一致，只读）===${NC}"
if [ ! -f tools/check-ssot.mjs ]; then
  echo -e "${RED}❌ 缺少 tools/check-ssot.mjs，中止发布${NC}"
  exit 1
fi
if ! node tools/check-ssot.mjs; then
  echo -e "${RED}❌ SSOT 校验未通过（版本/CHANGELOG/图标/预缓存/资源表有不一致），中止发布${NC}"
  exit 1
fi
echo -e "${GREEN}✅ SSOT 校验通过${NC}"

echo ""
echo -e "${YELLOW}=== 0.5 类型检查（tsc --noEmit，strict + checkJs）===${NC}"
if [ ! -d node_modules/typescript ]; then
  echo -e "${RED}❌ 缺少依赖：请先在仓库根执行 npm ci，中止发布${NC}"
  exit 1
fi
if ! npm run --silent typecheck; then
  echo -e "${RED}❌ 类型检查未通过（src/ 有类型错误），中止发布${NC}"
  exit 1
fi
echo -e "${GREEN}✅ 类型检查通过${NC}"

echo ""
echo -e "${YELLOW}=== 1. 跑 e2e（统一入口 tests/run-e2e.mjs）===${NC}"
CHROME="${CHROMIUM_PATH:-/usr/bin/chromium}"
export CHROMIUM_PATH="$CHROME"             # tests/_env.js 读取该变量
if [ ! -d node_modules/puppeteer-core ]; then
  echo -e "${RED}❌ 缺少依赖：请先在仓库根执行 npm ci，中止发布${NC}"
  exit 1
fi
if [ ! -x "$CHROME" ]; then
  echo -e "${RED}❌ 浏览器不可执行：$CHROME（可用 CHROMIUM_PATH 覆盖），中止发布${NC}"
  exit 1
fi
if ! node tests/run-e2e.mjs; then
  echo -e "${RED}❌ e2e 未通过（有失败、有文件跑不起来，或 0 断言），中止发布${NC}"
  exit 1
fi
echo -e "${GREEN}✅ e2e 全部通过${NC}"

echo ""
echo -e "${YELLOW}=== 2. 提取当前版本 ===${NC}"
VER=$(grep -oP "GAME_VERSION = '\K[^']+" survival.html | head -1)
BUILD=$(grep -oP "BUILD_CODE = \K\d+" survival.html | head -1)
echo "当前版本: v${VER} (build ${BUILD})"

if [ -z "$VER" ]; then
  echo -e "${RED}❌ 找不到 GAME_VERSION，请检查 survival.html${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}=== 3. 同步 PWA 元数据（版本唯一权威：survival.html）===${NC}"
# sw.js 缓存名注入构建号 → 缓存名变化 → 新 SW 安装 + 旧缓存清理
sed -i "s/const BUILD = '[^']*';/const BUILD = '${BUILD}';/" sw.js
# version.json：供页面切回前台时静默比对（SW 字节不变时的兜底更新路径）
cat > version.json <<EOF
{
  "ver": "${VER}",
  "build": ${BUILD},
  "name": "末日余烬",
  "en": "Emberfall",
  "note": "${MSG}"
}
EOF
# 回读校验：三处必须一致，缺一处老用户就会一直看到旧版本
CHK_VER=$(grep -oP '"ver":\s*"\K[^"]+' version.json | head -1)
CHK_BUILD=$(grep -oP "const BUILD = '\K\d+" sw.js | head -1)
# CACHE 由 'emberfall-' + BUILD 拼接，校验拼接式存在即可（缓存名随 BUILD 变化）
CHK_CACHE_FORM=$(grep -cP "const CACHE = 'emberfall-' \+ BUILD;" sw.js || true)
if [ "$CHK_VER" != "$VER" ] || [ "$CHK_BUILD" != "$BUILD" ] || [ "$CHK_CACHE_FORM" != "1" ]; then
  echo -e "${RED}❌ 版本不一致：html=$VER json=$CHK_VER sw.BUILD=$CHK_BUILD cacheForm=$CHK_CACHE_FORM${NC}"
  exit 1
fi
echo -e "${GREEN}✅ sw.js BUILD=${CHK_BUILD} / CACHE=emberfall-<BUILD> / version.json=${CHK_VER}${NC}"

# 检查是否已有此 tag
if git rev-parse "v$VER" >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠ 标签 v$VER 已存在，将替换${NC}"
fi

echo ""
echo -e "${YELLOW}=== 4. git add + commit ===${NC}"
git add -A
if git diff --staged --quiet; then
  echo -e "${YELLOW}⚠ 没有改动，跳过 commit${NC}"
else
  git commit -m "v$VER · $MSG"
  echo -e "${GREEN}✅ commit 完成${NC}"
fi

echo ""
echo -e "${YELLOW}=== 5. 打 tag ===${NC}"
git tag -a "v$VER" -m "v$VER · $MSG" -f
echo -e "${GREEN}✅ tag v$VER 已打${NC}"

echo ""
echo -e "${YELLOW}=== 6. 重新打包（只含运行时文件，不含工程/平台配置）===${NC}"
ZIP_NAME="末日余烬-${VER}.zip"
rm -f "$ZIP_NAME"
zip -q -r "$ZIP_NAME" survival.html index.html manifest.json sw.js version.json \
    icons splash screenshots
SIZE=$(ls -lh "$ZIP_NAME" | awk '{print $5}')
echo -e "${GREEN}✅ 备份包: $ZIP_NAME ($SIZE)${NC}"

echo ""
echo -e "${YELLOW}=== 7. 三处一致性核对（源码 / 元数据 / 包内）===${NC}"
ZIP_VER=$(unzip -p "$ZIP_NAME" survival.html | grep -oP "GAME_VERSION = '\K[^']+" | head -1)
ZIP_BUILD=$(unzip -p "$ZIP_NAME" sw.js | grep -oP "const BUILD = '\K\d+" | head -1)
if [ "$ZIP_VER" != "$VER" ] || [ "$ZIP_BUILD" != "$BUILD" ]; then
  echo -e "${RED}❌ 包内版本不一致：html=$ZIP_VER sw=$ZIP_BUILD（期望 $VER/$BUILD）${NC}"
  exit 1
fi
echo -e "${GREEN}✅ 包内版本一致：v${ZIP_VER} / build ${ZIP_BUILD}${NC}"

# 打包必须晚于所有源文件（防「打了包又改代码」）
NEWER=$(find . -type f -newer "$ZIP_NAME" \
  -not -path "./.git/*" -not -name "*.zip" 2>/dev/null | head -5)
if [ -n "$NEWER" ]; then
  echo -e "${YELLOW}⚠ 打包后源文件又有变动，包可能已过期：${NC}"
  echo "$NEWER"
else
  echo -e "${GREEN}✅ 包为最新（无源文件晚于包）${NC}"
fi

echo ""
echo -e "${GREEN}=== 发布完成 ===${NC}"
echo "版本: v${VER} (build ${BUILD})"
echo "说明: $MSG"
echo "打包: $ZIP_NAME"
echo "标签: $(git log --oneline -1 --decorate)"
echo ""
echo "如需推送到远程："
echo "  git push origin $(git rev-parse --abbrev-ref HEAD) --tags"
