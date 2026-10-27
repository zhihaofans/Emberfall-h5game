// 更新日志数据：直接引入仓库根的 CHANGELOG.md（Vite `?raw`），运行时解析。
//
// 唯一源就是那个 md —— 不再生成第二份数组，也就不存在「md 改了、面板没跟上」。
// 构建期 tools/lib/changelog.mjs 仍用它把内联数组写进 survival.html（同一份解析器）。

import md from '../../../CHANGELOG.md?raw';
import { parseChangelogMd } from '../changelog.mjs';

export const CHANGELOG = parseChangelogMd(md);
