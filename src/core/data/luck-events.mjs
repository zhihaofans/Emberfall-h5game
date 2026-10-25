// 幸运方块事件池（18 种，按 w 权重抽取）：好 11 种 / 坏 7 种。
//
// 与 survival.html 的 LUCK_EVENTS 逐一对应，`eff` 闭包改成声明式效果指令。
// 日志文案里的资源名用 `{res:key}` 占位（执行器代填），不再拼接 RES_NAMES。
// 行为对拍见 tests/unit/shop-luck.test.mjs。

export const LUCK_EVENTS = [
  // —— 好事件 ——
  {
    w: 3, name: '金属富矿',
    effects: [
      { op: 'res', res: 'metal', n: 30 },
      { op: 'log', text: '🎁 幸运方块涌出大量{res:metal} ×30！', cls: 'good' },
    ],
  },
  {
    w: 3, name: '皮革大礼',
    effects: [
      { op: 'res', res: 'leather', n: 20 },
      { op: 'log', text: '🎁 一捆{res:leather}滚落而出 ×20。', cls: 'good' },
    ],
  },
  {
    w: 3, name: '纯净水泉',
    effects: [
      { op: 'res', res: 'clean', n: 30 },
      { op: 'log', text: '🎁 甘甜的{res:clean}涌出 ×30。', cls: 'good' },
    ],
  },
  {
    w: 2, name: '食物满仓',
    effects: [
      { op: 'res', res: 'food', n: 50 },
      { op: 'log', text: '🎁 一桌丰盛的{res:food}出现 ×50！', cls: 'good' },
    ],
  },
  {
    w: 2, name: '金币雨',
    effects: [
      { op: 'gold', n: 100 },
      { op: 'log', text: '💰 金币像雨一样落下，+100！', cls: 'good' },
    ],
  },
  {
    w: 1, name: '合金之心',
    effects: [
      { op: 'res', res: 'alloy', n: 5 },
      { op: 'log', text: '🎁 5 颗{res:alloy}闪耀而出。', cls: 'good' },
    ],
  },
  {
    w: 2, name: '全愈圣水',
    effects: [
      { op: 'set', field: 'hp', value: 100 },
      { op: 'set', field: 'ill', value: false },
      { op: 'set', field: 'heavyWound', value: false },
      { op: 'set', field: 'lightWound', value: false },
      { op: 'log', text: '🎁 生命/伤病全满。', cls: 'good' },
    ],
  },
  {
    w: 2, name: '珍稀草药',
    effects: [
      { op: 'res', res: 'herb', n: 30 },
      { op: 'log', text: '🎁 整片{res:herb}草丛 ×30。', cls: 'good' },
    ],
  },
  {
    w: 1, name: '隐藏宝箱',
    effects: [
      { op: 'res', res: 'metal', n: 15 },
      { op: 'res', res: 'leather', n: 10 },
      { op: 'res', res: 'alloy', n: 2 },
      { op: 'gold', n: 60 },
      { op: 'log', text: '🎁 隐藏宝箱被发现！大量物资 + 金币 +60。', cls: 'good' },
    ],
  },
  // —— 坏事件 ——
  {
    w: 3, name: '陷阱',
    effects: [
      { op: 'delta', field: 'hp', n: -20, min: 1, max: 100 },
      { op: 'log', text: '💥 踩到了隐藏陷阱！-20 HP', cls: 'bad' },
    ],
  },
  {
    w: 2, name: '疾病孢子',
    effects: [
      { op: 'set', field: 'ill', value: true },
      { op: 'log', text: '💥 吸入有毒孢子，感染了疾病！', cls: 'bad' },
    ],
  },
  {
    w: 2, name: '炸药',
    effects: [
      { op: 'delta', field: 'hp', n: -35, min: 1, max: 100 },
      { op: 'log', text: '💥 方块爆炸了！-35 HP', cls: 'bad' },
    ],
  },
  {
    w: 2, name: '小偷偷取',
    effects: [{ op: 'steal', n2: [3, 8] }],
  },
  {
    w: 1, name: '时空错乱',
    effects: [
      { op: 'delta', field: 'day', n: -1, min: 1 },
      { op: 'log', text: '💥 时光倒流了一天……', cls: 'bad' },
    ],
  },
  {
    w: 1, name: '重伤',
    effects: [
      { op: 'set', field: 'heavyWound', value: true },
      { op: 'delta', field: 'hp', n: -15, min: 1, max: 100 },
      { op: 'log', text: '💥 被碎片划出重伤！', cls: 'bad' },
    ],
  },
  {
    w: 2, name: '能量衰减',
    effects: [
      { op: 'delta', field: 'stam', n: -40, min: 0 },
      { op: 'log', text: '💥 你突然全身乏力，精力 -40。', cls: 'bad' },
    ],
  },
  {
    w: 1, name: '不死图腾',
    effects: [
      { op: 'res', res: 'totem', n: 1 },
      { op: 'log', text: '🪬 图腾的微光在你掌心亮起——它能在死亡边缘救你一命！', cls: 'good' },
    ],
  },
  {
    w: 1, name: '肾上腺素',
    effects: [
      { op: 'res', res: 'adrenaline', n: 1 },
      { op: 'log', text: '💉 一瓶泛着荧光的药剂——肾上腺素！注射后 6 小时状态不下降！', cls: 'good' },
    ],
  },
];
