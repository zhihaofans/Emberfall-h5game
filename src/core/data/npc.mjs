// NPC 数据：猫耳机器人（好感度 / 万能口袋 / 送礼）与流浪商人（商品池）
//
// 对应 survival.html 的 DORA_LEVELS / DORA_GOODS / MERCHANT_GOODS。
// 带 `key` 的条目表示效果不是「给货」，而是特殊逻辑（学图纸等），由 core/npc.mjs 处理。

export const DORA_LEVELS = [
  {"lvl":1,"name":"陌生","need":0},
  {"lvl":2,"name":"眼熟","need":20},
  {"lvl":3,"name":"信赖","need":50},
  {"lvl":4,"name":"好友","need":100},
  {"lvl":5,"name":"挚友","need":180},
  {"lvl":6,"name":"家人","need":300},
];

/** 万能口袋商品（按好感等级解锁）
 * @type {{lvl: number, name: string, cost: number, give: Record<string, number>, get: Record<string, number>, blurb: string, key?: string}[]} */
export const DORA_GOODS = [
  {"lvl":1,"name":"用 5 生食换 3 净水","cost":0,"give":{"food":5},"get":{"clean":3},"blurb":"「前辈说过，水比什么都金贵。」"},
  {"lvl":1,"name":"用 3 石头换 2 木材","cost":0,"give":{"stone":3},"get":{"wood":2},"blurb":"「口袋里有几根干木头。」"},
  {"lvl":2,"name":"🎰 抽奖券 ×1","cost":500,"give":{"alloy":5},"get":{"luckyDraw":1},"blurb":"「跟前辈学的，试试手气！」"},
  {"lvl":2,"name":"🧪 生命药剂 ×1","cost":300,"give":{},"get":{"lifePotion":1},"blurb":"「绿瓶子的药水，能救命。」"},
  {"lvl":3,"name":"🪬 不死图腾 ×1","cost":800,"give":{"alloy":8,"rune":2},"get":{"totem":1},"blurb":"「前辈的宝贝……可别弄丢啊。」"},
  {"lvl":3,"name":"💉 肾上腺素 ×1","cost":600,"give":{"alloy":5},"get":{"adrenaline":1},"blurb":"「打一针精神百倍。」"},
  {"lvl":4,"name":"🔮 符石 ×3（好友价）","cost":900,"give":{"alloy":10},"get":{"rune":3},"blurb":"「老朋友了，给你便宜点。」"},
  {"lvl":4,"name":"🥇 金锭 ×2（好友价）","cost":800,"give":{},"get":{"gold":2},"blurb":"「好货当然留给自己人。」"},
  {"lvl":5,"name":"🔮 符刃图纸（未学则教）","cost":1500,"give":{"alloy":20,"rune":10},"get":{},"blurb":"「前辈的绝活，教你也无妨！」","key":"runeBladeRecipe"},
  {"lvl":5,"name":"🎰🎰 抽奖券 ×3（挚友特供）","cost":1800,"give":{"alloy":10},"get":{"luckyDraw":3},"blurb":"「多抽几把，说不定中大奖。」"},
];

/** 送礼表：好感度加成
 * @type {{label: string, need: Record<string, number>, fav: number, blurb: string}[]} */
export const DORA_GIFTS = [
  { label: "🤝 送 🔩金属×5", need: { metal: 5 }, fav: 8, blurb: "它接过金属零件，眼睛亮了一下" },
  { label: "🤝 送 ⚙️合金×2", need: { alloy: 2 }, fav: 15, blurb: "它爱不释手地摆弄着合金" },
  { label: "🤝 送 🔮符石×1", need: { rune: 1 }, fav: 25, blurb: "它小心翼翼地收进口袋最深处" },
  { label: "🤝 送 🍖食物×10", need: { food: 10 }, fav: 5, blurb: "它说这味道让它想起前辈的铜锣烧" },
];

/** 流浪商人商品池（每次随机抽 4 件）
 * @type {{tag: string, label: string, give: Record<string, number>, get: Record<string, number>, blurb: string, cost?: number, key?: string, hideWhenAllLearned?: boolean}[]} */
export const MERCHANT_GOODS = [
  {"tag":"公平","label":"用 3 木材换 4 生食","give":{"wood":3},"get":{"food":4},"blurb":"「生食都是刚打到的，新鲜！」"},
  {"tag":"公平","label":"用 2 金属换 3 草药","give":{"metal":2},"get":{"herb":3},"blurb":"「草药能治百病，老顾客都爱买。」"},
  {"tag":"公平","label":"用 1 皮革换 2 净水","give":{"leather":1},"get":{"clean":2},"blurb":"「皮革是硬通货，净水嘛……」"},
  {"tag":"公平","label":"用 4 石头换 3 木材","give":{"stone":4},"get":{"wood":3},"blurb":"「修城墙用得着。」"},
  {"tag":"公平","label":"用 5 木材换 2 石头","give":{"wood":5},"get":{"stone":2},"blurb":"「伐木场换采石场，各取所需。」"},
  {"tag":"稀有","label":"用 10 金属换 1 符石","give":{"metal":10},"get":{"rune":1},"blurb":"「符石啊，废墟里挖出来的。」"},
  {"tag":"稀有","label":"用 30 食物换 1 符石","give":{"food":30},"get":{"rune":1},"blurb":"「食物过剩的旅行者最爱这个。」"},
  {"tag":"稀有","label":"用 50 金币买 1 符石","give":{},"get":{"rune":1},"cost":50,"blurb":"「现金也行，爽快。」"},
  {"tag":"稀有","label":"用 5 皮革+3 金属换 1 符石","give":{"leather":5,"metal":3},"get":{"rune":1},"blurb":"「两样都要，这价才公道。」"},
  {"tag":"神秘","label":"用 5 合金换 1 随机图纸","give":{"alloy":5},"get":{},"blurb":"「能学一项新制作，赌一把！」","hideWhenAllLearned":true,"key":"randomRecipe"},
  {"tag":"神秘","label":"用 20 金属换 1 幸运方块","give":{"metal":20},"get":{"luck":1},"blurb":"「好运或厄运，开出来才知道。」"},
  {"tag":"神秘","label":"用 3 皮革+2 草药换 1 符文碎片","give":{"leather":3,"herb":2},"get":{"rune":1},"blurb":"「炼金术士会要的。」"},
  {"tag":"神秘","label":"用 8 合金+3 符文换 1 肾上腺素","give":{"alloy":8,"rune":3},"get":{"adrenaline":1},"blurb":"「禁药……6 小时内你不会感到任何饥饿与疲惫。」"},
  {"tag":"现金","label":"花 50 金币买 20 食物","give":{},"get":{"food":20},"cost":50,"blurb":"「囤点粮心里踏实。」"},
  {"tag":"现金","label":"花 30 金币买 10 净水","give":{},"get":{"clean":10},"cost":30,"blurb":"「干净水比黄金贵。」"},
  {"tag":"现金","label":"花 100 金币买 5 合金","give":{},"get":{"alloy":5},"cost":100,"blurb":"「工业原料，童叟无欺。」"},
  {"tag":"现金","label":"花 500 金币买 1 金锭","give":{},"get":{"gold":1},"cost":500,"blurb":"「银行家才买得起。」"},
  {"tag":"现金","label":"花 300 金币买 1 经验药水","give":{},"get":{"expPotion":1},"cost":300,"blurb":"「一口气让所有技能 +1。」"},
  {"tag":"现金","label":"花 800 金币买 1 抽奖券","give":{},"get":{"luckyDraw":1},"cost":800,"blurb":"「试试手气？」"},
  {"tag":"现金","label":"花 200 金币买 1 生命药剂","give":{},"get":{"lifePotion":1},"cost":200,"blurb":"「回血 100 + 清除伤病。」"},
  {"tag":"现金","label":"花 500 金币买 1 不死图腾","give":{},"get":{"totem":1},"cost":500,"blurb":"「保命必备。」"},
  {"tag":"现金","label":"花 1500 金币买 5 抽奖券","give":{},"get":{"luckyDraw":5},"cost":1500,"blurb":"「批量更划算，试试手气？」"},
  {"tag":"黑心","label":"用 5 符文碎片换 1 高级图纸","give":{"rune":5},"get":{},"blurb":"「买十张低级图纸才能炼出一张这个。」","hideWhenAllLearned":true,"key":"advancedRecipe"},
];
