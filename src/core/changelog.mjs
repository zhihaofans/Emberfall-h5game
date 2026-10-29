// 更新日志：把 CHANGELOG.md 解析成结构化数据（唯一源 = 仓库根 CHANGELOG.md）。
//
// 之前这是 `tools/lib/changelog.mjs` 里的解析器，只服务于构建期（生成 survival.html 的内联数组）。
// 新架构直接在运行时读原文（`data/changelog.mjs` 用 Vite 的 `?raw` 引入），所以解析逻辑
// 收到这里一份，tools 侧改为 re-export，避免「同一份 md 两个解析器」。

/**
 * @typedef {Object} ChangelogEntry
 * @property {string} ver 版本号（不含 v 前缀）
 * @property {string} date YYYY-MM-DD
 * @property {string} title 一句话主题
 * @property {string[]} notes 条目
 */

/**
 * 版本规则（菜单 → 更新日志顶部的说明卡片）。
 * 与 `survival.html` 的 `VERSION_RULES` 一致；MAJOR 的定义见 AGENT.md §0.4。
 * @type {[string, string, string][]}
 */
export const VERSION_RULES = [
  ['MAJOR · 主版本', '不兼容的重大重构（运行形态 / 工程结构）或存档不兼容', '如 3.0.0'],
  ['MINOR · 次版本', '新增功能（向后兼容）', '如 1.4.0'],
  ['PATCH · 修订号', '缺陷修复（向后兼容）', '如 1.3.1'],
];

/**
 * md → 条目数组（新版本在前，与文件顺序一致）。
 * 只认 `## vX.Y.Z · YYYY-MM-DD`、`**标题**`、`- 条目` 三种行；
 * 文件头的统计表格与空行会被忽略。
 * @param {string} md
 * @returns {ChangelogEntry[]}
 */
export function parseChangelogMd(md) {
  /** @type {ChangelogEntry[]} */
  const out = [];
  /** @type {ChangelogEntry|null} */
  let cur = null;
  for (const ln of String(md).split('\n')) {
    const h = /^## v([0-9.]+) · (\d{4}-\d{2}-\d{2})/.exec(ln);
    if (h) { cur = { ver: h[1], date: h[2], title: '', notes: [] }; out.push(cur); continue; }
    if (!cur) continue;
    const t = /^\*\*(.+)\*\*$/.exec(ln);
    if (t) { cur.title = t[1]; continue; }
    const n = /^- (.+)$/.exec(ln);
    if (n) cur.notes.push(n[1]);
  }
  return out;
}

/**
 * 概览数字（面板副标题用）。
 * @param {ChangelogEntry[]} entries
 * @returns {{versions: number, notes: number, latest: ChangelogEntry|null}}
 */
export function changelogStats(entries) {
  return {
    versions: entries.length,
    notes: entries.reduce((s, e) => s + e.notes.length, 0),
    latest: entries[0] ?? null,
  };
}
