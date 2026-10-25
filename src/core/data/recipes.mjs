// 配方表（22 条，5 阶）：材料 / 耗时 / 前置设施 / 技能门槛
//
// 与 survival.html 的 RECIPES 逐一对应。
// needLv / skill：未达等级时制作面板只显示等级要求（不显示材料）。

export const RECIPES = {
  "axe": {"name":"🪓石斧","desc":"砍柴量 +50%","cost":{"stone":8,"wood":5},"time":2,"need":null,"tier":1,"needLv":3,"skill":"chop"},
  "knife": {"name":"🔪石刀","desc":"狩猎/战斗必需","cost":{"stone":6,"wood":4},"time":2,"need":null,"tier":1,"needLv":1,"skill":"hunt"},
  "fire": {"name":"🔥火堆","desc":"烹饪/烧水/冬季取暖","cost":{"stone":6,"wood":10},"time":3,"need":null,"tier":1,"needLv":1,"skill":"explore"},
  "puri": {"name":"⚗️净水器","desc":"生水自动净化","cost":{"stone":5,"wood":8,"metal":4},"time":3,"need":null,"tier":1,"needLv":3,"skill":"mine"},
  "rod": {"name":"🎣鱼竿","desc":"解锁捕鱼","cost":{"wood":10,"metal":3},"time":2,"need":null,"tier":1,"needLv":1,"skill":"fish"},
  "trap": {"name":"🪤捕兽夹","desc":"每天自动获得食物","cost":{"metal":4,"wood":5},"time":2,"need":null,"tier":1,"needLv":3,"skill":"hunt"},
  "bed": {"name":"🛏️床铺","desc":"睡觉更安稳","cost":{"wood":15,"leather":6},"time":3,"need":null,"tier":1,"needLv":5,"skill":"explore"},
  "kit": {"name":"💊药箱","desc":"治疗效果翻倍","cost":{"herb":12,"metal":2},"time":2,"need":null,"tier":1,"needLv":3,"skill":"explore"},
  "iron": {"name":"🗡️铁刀","desc":"强力武器","cost":{"metal":10,"wood":4},"time":3,"need":null,"tier":1,"needLv":5,"skill":"mine"},
  "ironAxe": {"name":"🪚铁斧","desc":"砍柴量再 +100%","cost":{"metal":8,"wood":6},"time":3,"need":"axe","tier":2},
  "steel": {"name":"⚔️钢刀","desc":"强力武器","cost":{"metal":12,"leather":4},"time":3,"need":"iron","tier":2},
  "farm": {"name":"🌾温室","desc":"每天自动产粮食","cost":{"wood":15,"stone":10,"leather":6},"time":4,"need":"fire","tier":2},
  "tower": {"name":"🗼瞭望塔","desc":"探索收获 +50%","cost":{"wood":20,"stone":15},"time":4,"need":"axe","tier":2},
  "forge": {"name":"⚒️铁匠炉","desc":"解锁熔炼/金属+50%","cost":{"stone":12,"metal":6},"time":3,"need":"iron","tier":2},
  "huntKing": {"name":"🔱猎王刀","desc":"传说武器","cost":{"alloy":8,"leather":6},"time":4,"need":"steel","tier":3},
  "runeBlade": {"name":"🔮符刃","desc":"终极武器 atk 60","cost":{"alloy":10,"metal":10,"rune":5},"time":5,"need":"huntKing","tier":4},
  "runeArmor": {"name":"🛡符甲","desc":"受击 HP-3 → -1","cost":{"leather":12,"metal":8,"rune":3},"time":4,"need":"steel","tier":4},
  "forgeMast": {"name":"🔥大师炉","desc":"金属/合金产量 +50%","cost":{"stone":20,"metal":15,"rune":2},"time":5,"need":"forge","tier":4},
  "vault": {"name":"🏛永恒仓库","desc":"每日食物/水消耗减半","cost":{"stone":30,"wood":40,"rune":6},"time":6,"need":"tower","tier":4},
  "enchantTbl": {"name":"🔮附魔台","desc":"解锁附魔：锋利/保护/效率","cost":{"metal":15,"leather":8,"rune":4},"time":4,"need":"forge","tier":4},
  "autokitchen": {"name":"🍲自动厨房","desc":"每日自动烹 10 生食→15 熟食","cost":{"metal":25,"alloy":12,"rune":4},"time":6,"need":"forge","tier":5},
  "solarBoiler": {"name":"☀️太阳能烧水壶","desc":"每日自动烧 12 生水→12 净水","cost":{"metal":18,"alloy":10,"stone":15,"rune":3},"time":6,"need":"forge","tier":5},
};
