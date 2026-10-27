// 黑市商店（14 项）：金币购买，随时可用。
//
// 与 survival.html 的 SHOP 逐一对应，但 `eff` 闭包已改成声明式效果指令
// （见 core/effects.mjs）。行为对拍见 tests/unit/shop-luck.test.mjs。

export const SHOP = {
  herb: { name: '🌿草药 ×3', cost: 12, effects: [{ op: 'res', res: 'herb', n: 3 }] },
  metal: { name: '🔩金属 ×2', cost: 16, effects: [{ op: 'res', res: 'metal', n: 2 }] },
  leather: { name: '👜皮革 ×2', cost: 22, effects: [{ op: 'res', res: 'leather', n: 2 }] },
  med: {
    name: '急救包（治伤病）', cost: 30,
    effects: [
      { op: 'set', field: 'ill', value: false },
      { op: 'set', field: 'heavyWound', value: false },
      { op: 'set', field: 'lightWound', value: false },
    ],
  },
  luck: { name: '🎲幸运方块 ×1', cost: 60, effects: [{ op: 'res', res: 'luck', n: 1 }] },
  rune: { name: '🔮符石 ×1（符文工艺的基石）', cost: 200, effects: [{ op: 'res', res: 'rune', n: 1 }] },
  alloy: { name: '⚙️合金 ×5（高级制作材料）', cost: 300, effects: [{ op: 'res', res: 'alloy', n: 5 }] },
  goldIngot: { name: '🥇金锭 ×1（炼锭产物）', cost: 500, effects: [{ op: 'res', res: 'gold', n: 1 }] },
  lifePotion: { name: '🧪生命药剂 ×1（hp 拉满 + 清伤病）', cost: 200, effects: [{ op: 'res', res: 'lifePotion', n: 1 }] },
  expPotion: { name: '📜经验药水 ×1（所有技能 +1）', cost: 300, effects: [{ op: 'res', res: 'expPotion', n: 1 }] },
  totem: { name: '🪬不死图腾 ×1（免死一次）', cost: 500, effects: [{ op: 'res', res: 'totem', n: 1 }] },
  adren: { name: '💉肾上腺素 ×1（6 小时状态不掉）', cost: 800, effects: [{ op: 'res', res: 'adrenaline', n: 1 }] },
  lucky1: { name: '🎰抽奖券 ×1（试试手气）', cost: 800, effects: [{ op: 'res', res: 'luckyDraw', n: 1 }] },
  lucky5: { name: '🎰🎰抽奖券 ×5（批量更划算）', cost: 3500, effects: [{ op: 'res', res: 'luckyDraw', n: 5 }] },
};

// 商店分组：只决定「渲染顺序与分区标题」，商品本体仍在 SHOP 里。
// 顺序与旧文件 openShop() 的两串数组逐一对应（对拍见 tests/unit/shop.test.mjs）。
export const SHOP_GROUPS = [
  { title: '⚒ 基础物资', ids: ['herb', 'metal', 'leather', 'med', 'luck'] },
  {
    title: '💎 高级道具',
    ids: ['rune', 'alloy', 'goldIngot', 'lifePotion', 'expPotion', 'totem', 'adren', 'lucky1', 'lucky5'],
  },
];
