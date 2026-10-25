// 钓鱼掉落池：宝藏 6 条 / 垃圾 7 条（按 w 权重抽取）
//
// 与 survival.html 里 doAction 的 'fish' 分支内联的两张表逐一对应。
// `ach` 字段表示命中后要触发的成就（由流程层转成 checkFishAchieve）。

export const TREASURES = [
  {
    w: 3, txt: '🪙 钓上一个沉甸甸的钱袋！',
    effects: [{ op: 'gold', n: { rnd: [20, 45] }, log: '💰 金币 +{n}。', cls: 'good' }],
  },
  {
    w: 2, txt: '📦 捞出个生锈铁箱！',
    effects: [
      { op: 'res', res: 'metal', n: { rnd: [4, 7] } },
      { op: 'res', res: 'alloy', n: { rnd: [1, 3] } },
      { op: 'log', text: '🔩金属+4~7 ⚙️合金+1~3', cls: 'good' },
    ],
  },
  {
    w: 1, txt: '🎲 一个湿漉漉的幸运方块！',
    effects: [
      { op: 'res', res: 'luck', n: 1 },
      { op: 'log', text: '{res:luck} ×1', cls: 'good' },
    ],
  },
  {
    w: 1, txt: '🔮 符石！居然被鱼叼着！',
    ach: 'rune',
    effects: [
      { op: 'res', res: 'rune', n: 1 },
      { op: 'log', text: '{res:rune} ×1', cls: 'good' },
    ],
  },
  {
    w: 2, txt: '🚰 密封水壶完好无损！',
    effects: [
      { op: 'res', res: 'clean', n: { rnd: [6, 10] } },
      { op: 'log', text: '{res:clean}+6~10', cls: 'good' },
    ],
  },
  {
    w: 1, txt: '📜 湿透的图纸……还能看懂！',
    ach: 'blueprint',
    effects: [{ op: 'learnRecipe' }],
  },
];

export const JUNK = [
  {
    w: 3, txt: '🥾 一只破皮靴，也许是上个时代的。',
    effects: [
      { op: 'res', res: 'leather', n: 1 },
      { op: 'log', text: '{res:leather} ×1', cls: 'info' },
    ],
  },
  {
    w: 3, txt: '🪨 河卵石，至少有点分量。',
    effects: [
      { op: 'res', res: 'stone', n: { rnd: [2, 4] } },
      { op: 'log', text: '{res:stone}+2~4', cls: 'info' },
    ],
  },
  {
    w: 3, txt: '🪵 漂在水里的浮木。',
    effects: [
      { op: 'res', res: 'wood', n: { rnd: [2, 4] } },
      { op: 'log', text: '{res:wood}+2~4', cls: 'info' },
    ],
  },
  {
    w: 2, txt: '🦴 鱼骨，勉强能啃一啃。',
    effects: [
      { op: 'res', res: 'food', n: { rnd: [1, 3] } },
      { op: 'log', text: '{res:food}+1~3', cls: 'info' },
    ],
  },
  {
    w: 2, txt: '🔩 生锈的铁钩子。',
    effects: [
      { op: 'res', res: 'metal', n: 1 },
      { op: 'log', text: '{res:metal} ×1', cls: 'info' },
    ],
  },
  {
    w: 1, txt: '🌿 一团水草，泡得发烂。',
    effects: [
      { op: 'res', res: 'herb', n: 1 },
      { op: 'log', text: '{res:herb} ×1', cls: 'info' },
    ],
  },
  {
    w: 2, txt: '🧴 空瓶子，瓶塞还带着霉味。',
    effects: [],
  },
];
