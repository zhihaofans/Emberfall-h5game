// 行动表：14 个行动的耗时 / 精力 / 自动解锁等级 / 对应技能
//
// 与 survival.html 的 ACTIONS 逐一对应。autoLv 是"能开启自动循环"的技能等级门槛。

/** 13 个行动（key 即行动 id）
 * @type {Record<string, {name: string, sub: string, time: number, stam: number, kind: string, auto: boolean, skill?: string, autoLv?: number}>} */
export const ACTIONS = {
  "explore": {"name":"探索","sub":"随机事件","time":2,"stam":18,"kind":"explore","auto":false,"skill":"explore"},
  "chop": {"name":"砍柴","sub":"自动·木材","time":1,"stam":8,"kind":"chop","auto":true,"skill":"chop","autoLv":3},
  "hunt": {"name":"狩猎","sub":"需石刀","time":2,"stam":20,"kind":"hunt","auto":true,"skill":"hunt","autoLv":5},
  "fish": {"name":"捕鱼","sub":"需鱼竿","time":2,"stam":16,"kind":"fish","auto":true,"skill":"fish","autoLv":5},
  "fetch": {"name":"取水","sub":"自动·生水","time":1,"stam":8,"kind":"fetch","auto":true,"skill":"explore","autoLv":3},
  "smelt": {"name":"熔炼","sub":"需铁匠炉·合金","time":1,"stam":6,"kind":"smelt","auto":true,"skill":"mine","autoLv":8},
  "mineOre": {"name":"采矿","sub":"自动·石头+矿石","time":1,"stam":8,"kind":"mineOre","auto":true,"skill":"mine","autoLv":5},
  "smeltOre": {"name":"炼锭","sub":"需铁匠炉·矿→锭","time":1,"stam":5,"kind":"smeltOre","auto":true,"skill":"mine","autoLv":8},
  "cook": {"name":"烹饪","sub":"需火堆","time":1,"stam":5,"kind":"cook","auto":true,"skill":"cook","autoLv":5},
  "boil": {"name":"烧水","sub":"需火堆","time":1,"stam":5,"kind":"boil","auto":true,"skill":"cook","autoLv":5},
  "eat": {"name":"进食","sub":"→饱食","time":0,"stam":0,"kind":"eat","auto":false},
  "drink": {"name":"饮水","sub":"→水分","time":0,"stam":0,"kind":"drink","auto":false},
  "sleep": {"name":"睡觉","sub":"8小时","time":8,"stam":0,"kind":"sleep","auto":false},
  "heal": {"name":"治疗","sub":"用草药","time":1,"stam":6,"kind":"heal","auto":false},
};
