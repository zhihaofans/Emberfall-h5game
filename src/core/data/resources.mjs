// 资源表：**唯一数据源**。
//
// 以前同一份资源信息散在 5 处（RES_NAMES / RES_PRICE / GET_WHERE /
// newGame().res / normalizeState().res），新增一种资源要改 5 个地方、漏一处就静默丢数据。
// 现在只有这张表，其余全部由下方派生函数生成（见 AGENT.md §0.6）。
//
// 字段说明：
//   id    存档里的键名（一旦发布不可改）
//   name  显示名（含 emoji）
//   price 卖出单价；null = 不可出售（渲染层 `if (!RES_PRICE[k]) return;`）
//   init  存档默认值 / 新档初始数量
//   from  材料百科里的"获取途径"文案

export const RESOURCES = [
  {
    id: "wood",
    name: "🪵木材",
    price: 1,
    init: 4,
    from: "🪓 砍柴（森林/行动页）· 🏚 废墟探索翻找 · 🎣 钓鱼垃圾（浮木）",
  },
  {
    id: "stone",
    name: "🪨石头",
    price: 1,
    init: 2,
    from: "⛏ 采石（行动页）· ⛰ 山丘探索 · 🎣 钓鱼垃圾（河卵石）",
  },
  {
    id: "food",
    name: "🍖生食",
    price: 2,
    init: 2,
    from: "🎣 钓鱼 · 🪤 捕兽夹（每日）· 🌾 温室（每日）· 🎯 狩猎 · 🗺 探索 · 🎲 幸运方块",
  },
  {
    id: "cooked",
    name: "🍗熟食",
    price: 3,
    init: 0,
    from: "🔥 烹饪（需火堆，2 生食→3 熟食）· 🍲 自动厨房（Tier5，每日）· 🗺 探索（罐头/蜂蜜）",
  },
  {
    id: "water",
    name: "💧生水",
    price: 1,
    init: 0,
    from: "💧 河边取水（行动页）",
  },
  {
    id: "clean",
    name: "🚰净水",
    price: 3,
    init: 2,
    from: "🔥 烧水（需火堆）· ⚗️ 净水器（每日）· ☀️ 太阳能烧水壶（Tier5，每日）· 🎣 钓鱼宝藏（密封水壶）",
  },
  {
    id: "herb",
    name: "🌿草药",
    price: 3,
    init: 2,
    from: "🌿 森林探索 · 🏚 废墟探索 · 🎣 钓鱼垃圾（水草）· 🛒 流浪商人",
  },
  {
    id: "metal",
    name: "🔩金属",
    price: 5,
    init: 0,
    from: "🏚 废墟探索 · ⛰ 山丘探索 · 🤖 废墟机器人掉落 · 🎣 钓鱼垃圾（铁钩）/宝藏（铁箱）· 🛒 黑市/流浪商人",
  },
  {
    id: "leather",
    name: "👜皮革",
    price: 8,
    init: 0,
    from: "🎯 狩猎 · ⚔️ 战斗掉落 · 🏞 河边探索（水獭）· 🛒 黑市",
  },
  {
    id: "alloy",
    name: "⚙️合金",
    price: 10,
    init: 0,
    from: "⚒ 熔炼（需铁匠炉，2 金属→1 合金）· 🔥 大师炉加成（Tier4）· 🎣 钓鱼宝藏（铁箱）",
  },
  {
    id: "luck",
    name: "🎲幸运方块",
    price: 0,
    init: 0,
    from: "🎲 黑市购买 · 🗺 探索掉落（3%）· 👹 Boss 战利品 · 🎣 钓鱼宝藏",
  },
  {
    id: "rune",
    name: "🔮符石",
    price: 25,
    init: 0,
    from: "🏚 废墟/⛰ 山丘/🏜金字塔探索（5%）· 👹 兽王战利品 · 🧟 金字塔木乃伊 · 🎣 钓鱼宝藏 · 🛒 流浪商人（高价）",
  },
  {
    id: "totem",
    name: "🪬不死图腾",
    price: null,
    init: 0,
    from: "🎲 幸运方块稀有掉落 · 👹 兽王 40% 掉落 · 🛒 黑市/流浪商人 500 金 · 🤖 机器猫（好感 3 级）",
  },
  {
    id: "copperOre",
    name: "🥉铜矿石",
    price: 2,
    init: 0,
    from: "⛏ 采矿（45%）· 山丘探索",
  },
  {
    id: "silverOre",
    name: "🥈银矿石",
    price: 4,
    init: 0,
    from: "⛏ 采矿（15%）· 山丘探索",
  },
  {
    id: "goldOre",
    name: "🥇金矿石",
    price: 8,
    init: 0,
    from: "⛏ 采矿（3%）· 🏜金字塔探索/事件（黄金密室/沙暴）",
  },
  {
    id: "copper",
    name: "🥉铜锭",
    price: 5,
    init: 0,
    from: "🔥 炼锭（铁匠炉，铜矿石→铜锭）",
  },
  {
    id: "silver",
    name: "🥈银锭",
    price: 9,
    init: 0,
    from: "🔥 炼锭（铁匠炉，银矿石→银锭）",
  },
  {
    id: "gold",
    name: "🥇金锭",
    price: 18,
    init: 0,
    from: "🔥 炼锭（铁匠炉，金矿石→金锭）",
  },
  {
    id: "adrenaline",
    name: "💉肾上腺素",
    price: null,
    init: 0,
    from: "👹 兽王 30% 掉落 · 🎲 幸运方块稀有掉落 · 🛒 流浪商人神秘商品（8合金+3符文）",
  },
  {
    id: "expPotion",
    name: "📜经验药水",
    price: 0,
    init: 0,
    from: "🛒 黑市 300 金 · 🛒 流浪商人 300 金",
  },
  {
    id: "luckyDraw",
    name: "🎰抽奖券",
    price: 0,
    init: 0,
    from: "🛒 黑市 800 金（×5 则 3500）· 🛒 流浪商人 800 / 1500 金 · 🤖 机器猫（好感 2 级 500 金+合金 5 / 5 级 1800 金+合金 10）",
  },
  {
    id: "lifePotion",
    name: "🧪生命药剂",
    price: 0,
    init: 0,
    from: "🛒 黑市 200 金 · 🛒 流浪商人 200 金 · 🤖 机器猫（好感 2 级，300 金）；游戏内无制作配方",
  },
];

/** 全部资源 id（存档键名，顺序稳定） */
export const RES_IDS = RESOURCES.map((r) => r.id);

/**
 * 显示名表（对应旧的 RES_NAMES）。
 * @returns {Record<string, string>}
 */
export function resNames() {
  return Object.fromEntries(RESOURCES.map((r) => [r.id, r.name]));
}

/**
 * 卖出单价表（对应旧的 RES_PRICE）。
 * `price === null` 的资源**不进表** —— 渲染层是 `if (!RES_PRICE[k]) return;`，
 * 查不到即不显示"出售"按钮（旧实现里 totem / adrenaline 就是这样）。
 * @returns {Record<string, number>}
 */
export function resPrices() {
  return Object.fromEntries(RESOURCES.filter((r) => r.price !== null).map((r) => [r.id, r.price]));
}

/**
 * 材料百科的获取途径（对应旧的 GET_WHERE）。
 * @returns {Record<string, string>}
 */
export function getWhere() {
  return Object.fromEntries(RESOURCES.map((r) => [r.id, r.from]));
}

/**
 * 存档默认值 / 新档初始数量（对应 newGame().res 与 normalizeState 的 res 兜底）。
 * @returns {Record<string, number>}
 */
export function defaultRes() {
  return Object.fromEntries(RESOURCES.map((r) => [r.id, r.init]));
}
