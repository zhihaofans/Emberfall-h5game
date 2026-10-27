// CHANGELOG 的解析 / 渲染（check-ssot 与 sync-meta 共用，避免两份实现漂移）
//
// 唯一源：仓库根的 CHANGELOG.md
// 生成物：survival.html 里的内联 `const CHANGELOG = [...]`
//
// 解析器本身已挪到 `src/core/changelog.mjs`（新架构运行时也要用它），这里 re-export，
// 保证「md → 条目」只有一份实现。

export { parseChangelogMd } from '../../src/core/changelog.mjs';

// html 源码里的内联数组 → 同样的结构
export function parseChangelogInline(src) {
  const s = src.indexOf('const CHANGELOG = [');
  if (s < 0) return [];
  const e = src.indexOf('\n];', s);
  const block = src.slice(s, e);
  const out = [];
  const un = (t) => t.replace(/\\(['\\])/g, '$1'); // 与 renderChangelogJs 的转义对称
  const re = /\{ver:'([^']+)', date:'([^']+)', title:'((?:[^'\\]|\\.)*)', notes:\[([\s\S]*?)\]\}/g;
  let m;
  while ((m = re.exec(block))) {
    const notes = [...m[4].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => un(x[1]));
    out.push({ ver: m[1], date: m[2], title: un(m[3]), notes });
  }
  return out;
}

// 渲染成与现有源码逐字符一致的 JS 块（缩进 2/4 空格、单引号、每条 notes 尾逗号）
export function renderChangelogJs(versions) {
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const lines = ['const CHANGELOG = ['];
  versions.forEach((v, i) => {
    lines.push(`  {ver:'${esc(v.ver)}', date:'${esc(v.date)}', title:'${esc(v.title)}', notes:[`);
    for (const n of v.notes) lines.push(`    '${esc(n)}',`);
    // 数组最后一项不带尾逗号（与现有源码保持逐字符一致）
    lines.push(i === versions.length - 1 ? '  ]}' : '  ]},');
  });
  lines.push('];');
  return lines.join('\n');
}
