// 进度总览的展示数据（目标线 / 成就展示清单 / 技能等级上限）
//
// 这些是「给玩家看的进度参照」，不是玩法数据：
//   - 玩法数值仍以 recipes / upgrades / skills / weapons / npc 等表为准；
//   - 成就清单只挑选有代表性的一部分（id 必须是 WHITELIST 成员或天数里程碑 dN），
//     单测会校验 id 合法性与条目数，避免搬家时抄错。

/** 天数目标线（旧 openProgress 的四条目标 + 100 天通关感） */
export const DAY_TARGETS = [7, 15, 30, 60, 100];

/** 技能等级上限（进度条分母用；游戏内没有硬性封顶，这是展示目标） */
export const SKILL_MAX_LV = 50;

/**
 * 成就展示清单（顺序即展示顺序）。
 * label 是短标签，不取 MS 的完整文案 —— 面板一行要塞下 50+ 个 chip。
 * @type {{id: string, label: string}[]}
 */
export const ACHIEVEMENT_SHOWCASE = [
  { id: 'd3', label: '生存 3 天' },
  { id: 'd7', label: '生存 7 天' },
  { id: 'd15', label: '生存 15 天' },
  { id: 'd30', label: '生存 30 天' },
  { id: 'craft1', label: '第一件制作' },
  { id: 'kill1', label: '首次击败野兽' },
  { id: 'allcraft', label: '全副武装' },
  { id: 'boss', label: '击败兽王' },
  { id: 'up1', label: '首次强化' },
  { id: 'fish1', label: '首次钓到鱼' },
  { id: 'fish10', label: '钓鱼 10 次' },
  { id: 'fish50', label: '钓鱼 50 次' },
  { id: 'fish100', label: '钓鱼 100 次' },
  { id: 'fishBig', label: '钓到罕见大鱼' },
  { id: 'fishTreas', label: '钓到宝藏' },
  { id: 'fishRune', label: '钓到符石' },
  { id: 'fishBlueprint', label: '钓到图纸' },
  { id: 'fishLv25', label: '渔猎 25 级' },
  { id: 'totem1', label: '在死亡边缘蹦迪' },
  { id: 'totem3', label: '与死神共舞' },
  { id: 'totem10', label: '死神都怕你' },
  { id: 'armor1', label: '第一件护甲' },
  { id: 'armorIron', label: '铁甲' },
  { id: 'armorSteel', label: '钢甲加身' },
  { id: 'armorAll', label: '护甲收藏家' },
  { id: 'oreCopper', label: '挖到铜矿' },
  { id: 'oreSilver', label: '挖到银矿' },
  { id: 'oreGold', label: '挖到金矿' },
  { id: 'smelt1', label: '首次炼锭' },
  { id: 'ingotAll', label: '冶金大师' },
  { id: 'for1', label: '森林首次' },
  { id: 'for10', label: '森林 10 次' },
  { id: 'for50', label: '森林 50 次' },
  { id: 'rui1', label: '废墟首次' },
  { id: 'rui10', label: '废墟 10 次' },
  { id: 'rui50', label: '废墟 50 次' },
  { id: 'riv1', label: '河边首次' },
  { id: 'riv10', label: '河边 10 次' },
  { id: 'riv50', label: '河边 50 次' },
  { id: 'hil1', label: '山丘首次' },
  { id: 'hil10', label: '山丘 10 次' },
  { id: 'hil50', label: '山丘 50 次' },
  { id: 'pyr1', label: '金字塔首次' },
  { id: 'pyr10', label: '金字塔 10 次' },
  { id: 'pyr50', label: '金字塔 50 次' },
  { id: 'mummy1', label: '木乃伊杀手' },
  { id: 'tomb1', label: '盗墓贼' },
  { id: 'goldroom1', label: '寻宝者' },
  { id: 'pharaoh1', label: '法老终结者' },
  { id: 'pharaoh2', label: '死亡执政官' },
  { id: 'pharaoh3', label: '永恒法老' },
  { id: 'robbed1', label: '破财消灾' },
  { id: 'goldEater', label: '钱包吞噬者' },
  { id: 'dora6', label: '口袋里的朋友' },
];
