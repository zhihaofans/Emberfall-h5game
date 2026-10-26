// 百科图鉴的条目生成（纯逻辑，不碰 DOM）
//
// 对应 survival.html 的 monsterHTML() / matsHTML() / wikiRow()。
// 分工：这里只产出「一条图鉴有哪些行、解锁没有」，渲染成 HTML 是表现层的事。
//
// SSOT：怪物数值一律从 data/monsters.mjs 与 combat 的 bossStats/pharaohStats 取，
// 不在这份文件里重写第二遍数值（原版图鉴是硬编码的，改了战斗就得再改一遍图鉴）。

import { BEASTS, REGION_BEASTS, ROBOTS, MOON_BEASTS } from './data/monsters.mjs';
import { bossStats, pharaohStats, BOSS_EXTRA_DROPS } from './combat.mjs';
import { ZONES } from './data/zones.mjs';
import { resNames, getWhere } from './data/resources.mjs';
import { ENCHANTS } from './data/armor.mjs';
import { isUnlocked } from './wiki.mjs';

/**
 * @typedef {Object} WikiEntry
 * @property {string} id     图鉴 id（与 wiki.BESTIARY_IDS 一致）
 * @property {string} head   标题（含 emoji）
 * @property {string} tag    标题右侧的标签
 * @property {string[]} lines 正文行（数值部分）
 * @property {boolean} seen  是否已遭遇
 */

/** 掉落文本：只列出数量 > 0 的资源
 * @param {any} b
 * @param {string[]} keys
 * @returns {string} */
function dropText(b, keys) {
  const names = resNames();
  return keys
    .filter((k) => (b[k] || 0) > 0)
    .map((k) => `${names[k] || k}×${b[k]}`)
    .join('、');
}

/**
 * 怪物图鉴：21 条，顺序与 BESTIARY_IDS 一致。
 * @param {any} state
 * @returns {WikiEntry[]}
 */
export function monsterEntries(state) {
  const names = resNames();
  /** @type {WikiEntry[]} */
  const out = [];
  /** @type {(id: string, head: string, tag: string, lines: string[]) => void} */
  const push = (id, head, tag, lines) => { out.push({ id, head, tag, lines, seen: isUnlocked(state, id) }); };

  // 1) 常见野兽
  const beastTier = ['常见', '常见', '少见', '罕见'];
  BEASTS.forEach((b, i) => {
    push('beast' + i, `👹 ${b.name}`, beastTier[i] || '',
      [
        `❤️ 生命 <b>${b.hp}</b> · ⚔️ 攻击 <b>${b.atk}</b>`,
        `🎁 掉落：${dropText(b, ['food', 'leather'])}`,
        '📍 探索 / 夜间随机遭遇',
      ]);
  });

  // 2) 区域生物（森林 / 河边 / 山丘；废墟是机器人，单独一组）
  /** @type {Record<'forest'|'river'|'hills', string>} */
  const zoneTier = { forest: '森林·45%', river: '河边·45%', hills: '山丘·45%' };
  /** @type {('forest'|'river'|'hills')[]} */
  const zoneKeys = ['forest', 'river', 'hills'];
  for (const z of zoneKeys) {
    const beast = (REGION_BEASTS[z] || [])[0];
    if (!beast) continue;
    push('zone-' + z, beast.name, `区域生物 · ${zoneTier[z]}`,
      [
        `❤️ 生命 <b>${beast.hp}</b> · ⚔️ 攻击 <b>${beast.atk}</b>`,
        `🎁 掉落：${dropText(beast, ['food', 'leather', 'metal'])}`,
        `📍 仅${ZONES[z].name}区域遭遇`,
      ]);
  }

  // 3) 金字塔怪物
  const pyrTier = ['常见', '少见', '罕见'];
  (REGION_BEASTS.pyramid || []).forEach((b, i) => {
    push('pyr' + i, b.name, `金字塔 · ${pyrTier[i] || ''}`,
      [
        `❤️ 生命 <b>${b.hp}</b> · ⚔️ 攻击 <b>${b.atk}</b>`,
        `🎁 掉落：${dropText(b, ['food', 'leather', 'metal', 'rune'])}`,
        '📍 仅🏜沙漠金字塔区域遭遇（45% 概率）',
      ]);
  });

  // 4) 废土科技（废墟专属）
  const robTier = ['常见', '少见', '罕见'];
  ROBOTS.forEach((r, i) => {
    push('rob' + i, r.name, `废墟科技 · ${robTier[i] || ''}`,
      [
        `❤️ 生命 <b>${r.hp}</b> · ⚔️ 攻击 <b>${r.atk}</b>`,
        `🎁 掉落：${dropText(r, ['metal', 'alloy'])}`,
        '📍 仅🏚废墟区域遭遇（45% 概率）',
      ]);
  });

  // 5) 月圆进化（两条，各自按 id 解锁）
  for (const [id, beast] of Object.entries(MOON_BEASTS)) {
    push('moon-' + id, beast.name, '月圆进化',
      [
        `❤️ 生命 <b>${beast.hp}</b> · ⚔️ 攻击 <b>${beast.atk}</b>`,
        `🎁 掉落：${dropText(beast, ['food', 'leather', 'metal'])}`,
        '📍 每 15 天月圆夜，野狗 / 灰狼进化',
      ]);
  }

  // 6) 兽王三阶段：数值来自 bossStats，不硬编码
  const bossTag = ['首杀', '二阶段', '三阶段'];
  for (let k = 0; k < 3; k++) {
    const bs = bossStats({ stats: { bossKills: k } });
    push('boss' + k, `🐲 ${bs.name}`, bossTag[k],
      [
        `❤️ 生命 <b>${bs.hp}</b> · ⚔️ 攻击 <b>${bs.atk}</b>`,
        `🎁 掉落：${dropText(bs, ['food', 'leather', 'metal'])}${Object.keys(BOSS_EXTRA_DROPS).map((k) => `、${names[k]}×${BOSS_EXTRA_DROPS[k]}`).join('')}`,
        '📍 第 30 天起探索 / 夜间遭遇 · 击败后 45 天以更强形态回归',
      ]);
  }

  // 7) 法老三阶段
  const phTag = ['首杀', '二阶段', '三阶段'];
  for (let k = 0; k < 3; k++) {
    const ps = pharaohStats({ stats: { pharaohKills: k } });
    push('pharaoh' + k, ps.name, phTag[k],
      [
        `❤️ 生命 <b>${ps.hp}</b> · ⚔️ 攻击 <b>${ps.atk}</b>`,
        `🎁 掉落：${dropText(ps, ['food', 'leather', 'metal', 'alloy', 'rune'])}、💰×${ps.gold}`,
        '📍 第 25 天起 🏜金字塔 探索 5% 遭遇 · 击败后 30 天以更强形态回归',
      ]);
  }

  return out;
}

/**
 * 材料百科：23 种资源的获取方式 + 附魔系统说明（不按遭遇解锁，全部可见）。
 * @returns {{id: string, head: string, tag: string, lines: string[]}[]}
 */
export function materialEntries() {
  const names = resNames();
  const where = getWhere();
  /** @type {{id: string, head: string, tag: string, lines: string[]}[]} */
  const out = Object.keys(where).map((k) => ({
    id: k,
    head: names[k] || k,
    tag: '',
    lines: [where[k]],
  }));

  // 附魔系统：文案与数值都从 ENCHANTS 生成，避免图表两处各写一遍
  const enchLines = Object.keys(ENCHANTS).map((k) => {
    const e = ENCHANTS[k];
    const cost = Object.keys(e.base).map((m) => `${names[m] || m}×${e.base[m]}`).join(' ');
    return `${e.name} · ${e.desc} · 起价 ${cost}`;
  });
  out.push({
    id: 'enchant',
    head: '🔮 附魔系统',
    tag: '需附魔台',
    lines: enchLines,
  });

  return out;
}
