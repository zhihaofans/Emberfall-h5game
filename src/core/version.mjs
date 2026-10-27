// 版本展示：把「版本号 / 构建号 / git hash」拼成一处文案。
//
// 规则（TODO §5.8）：游戏内所有版本号文案都从这里取，不允许各处手拼，
// 否则线上出问题时没法判断玩家跑的是哪个提交。
//
//   v2.0.0 · build 102 · d87fc72
//   v3.0.0 · build 103 · d87fc72-dirty
//   v2.0.0 · build 102              （无 git 环境，sha 缺省）
//
// sha 里的 -dirty 由构建期判断（tools/lib/git.mjs），这里只负责拼接。

/**
 * @param {string} ver 语义化版本号（不带 v）
 * @param {string|number} [build] 构建号
 * @param {string} [sha] 短 hash，可带 -dirty
 * @returns {string}
 */
export function versionLabel(ver, build, sha) {
  const parts = [`v${ver}`];
  if (build !== undefined && build !== null && String(build) !== '') parts.push(`build ${build}`);
  if (sha) parts.push(String(sha));
  return parts.join(' · ');
}
