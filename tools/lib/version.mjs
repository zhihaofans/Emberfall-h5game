// 版本号运算（纯函数）：stamp / 测试共用。
//
// 规则见 AGENT.md §0.3：
//   MAJOR = 不兼容的重大重构或存档不兼容 · MINOR = 新增功能 · PATCH = 修 bug
//   BUILD_CODE 每次发布单调 +1，与版本号解耦，不随 MAJOR 重置

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

/**
 * 解析语义化版本号。
 * @param {string} ver
 * @returns {{major: number, minor: number, patch: number}}
 */
export function parseSemver(ver) {
  const m = SEMVER.exec(String(ver).trim());
  if (!m) throw new Error(`版本号格式不合法: ${ver}`);
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

/**
 * 升级版本号。
 * @param {string} ver 当前版本（如 '2.0.0'）
 * @param {'major'|'minor'|'patch'} kind
 * @returns {string}
 */
export function bumpSemver(ver, kind) {
  const { major, minor, patch } = parseSemver(ver);
  if (kind === 'major') return `${major + 1}.0.0`;
  if (kind === 'minor') return `${major}.${minor + 1}.0`;
  if (kind === 'patch') return `${major}.${minor}.${patch + 1}`;
  throw new Error(`未知的升级类型: ${kind}（只支持 major / minor / patch）`);
}

/**
 * 校验构建号（正整数）。
 * @param {unknown} n
 * @returns {number}
 */
export function normalizeBuild(n) {
  const v = Number(n);
  if (!Number.isInteger(v) || v <= 0) throw new Error(`构建号必须是正整数: ${n}`);
  return v;
}
