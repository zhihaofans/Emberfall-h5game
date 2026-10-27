// Git 元信息（构建期用）：取短 hash，工作区有改动时加 -dirty。
//
// 为什么放这里：vite.config.ts（构建/开发注入 __APP_COMMIT__）与 tools/build.mjs
// （写 dist/version.json）都要用同一份判断，避免两处各写一遍 git 调用。

import { spawnSync } from 'node:child_process';

/**
 * @param {string} cwd 仓库根目录
 * @param {{dirty?: boolean}} [opts] dirty=false 时不检查工作区
 * @returns {string} 7 位短 hash；非 git 环境或取不到时返回 'unknown'
 */
export function gitShortSha(cwd, opts = {}) {
  const wantDirty = opts.dirty !== false;
  try {
    const rev = spawnSync('git', ['rev-parse', '--short=7', 'HEAD'], { cwd, encoding: 'utf8' });
    const sha = (rev.stdout || '').trim();
    if (rev.status !== 0 || !sha) return 'unknown';
    if (!wantDirty) return sha;

    const st = spawnSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' });
    const dirty = st.status === 0 && (st.stdout || '').trim().length > 0;
    return dirty ? `${sha}-dirty` : sha;
  } catch {
    return 'unknown';
  }
}
