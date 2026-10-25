// 源码文本的轻量解析工具（不执行、不依赖 DOM，纯字符串处理）
// check-ssot 与单测共用，避免两份实现漂移。

// 取出 `const NAME = { ... }` 的对象体（按花括号配对，不解析嵌套语义）
export function objectBody(src, name) {
  const start = src.indexOf(`const ${name} = {`);
  if (start < 0) return null;
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return null;
}

// 取对象体的顶层键名（用于"键即资源 id"的扁平表；嵌套对象只取外层的键）
export function topLevelKeys(body) {
  const keys = [];
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') depth--;
    else if (depth === 0) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*:/.exec(body.slice(i));
      if (m && (i === 0 || /[\s,{]/.test(body[i - 1]))) {
        keys.push(m[1]);
        i += m[0].length - 1;
      }
    }
  }
  return keys;
}

// 取扁平对象体（`{a:1, b:2}`）里的键集合，值形式不限
export function flatKeys(body) {
  return new Set([...body.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map((m) => m[1]));
}
