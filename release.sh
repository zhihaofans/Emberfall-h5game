#!/bin/bash
# 兼容旧入口：真正的流水线在 tools/release.mjs。
#
# 变化（2026-10-27，TODO §5.4）：不再由 bash 里 git add -A / commit / tag —— 那几步
# 改成「人确认后执行」，脚本只负责校验、构建、打包。
#
# 用法：
#   bash release.sh           # SSOT + 类型 + 单测 + 构建 + 打包
#   bash release.sh --e2e     # 额外跑真浏览器 e2e
set -e
cd "$(dirname "$0")"
exec node tools/release.mjs "$@"
