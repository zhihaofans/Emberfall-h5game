// 存档相关的类型定义（纯类型文件，不产生运行代码）
//
// 为什么用 JSDoc 而不是 .ts：本项目的单测直接 `import` core 模块运行，
// 而 Node 22 没有内置 TypeScript 支持（实测 ERR_NO_TYPESCRIPT）。
// JSDoc + tsconfig 的 `checkJs` 同样能得到 strict 类型检查，且零编译步骤。

/**
 * 资源表：键见 `RESOURCES`（core/data），值为数量。
 * @typedef {Record<string, number>} ResMap
 */

/**
 * 设施 / 装备状态。布尔项表示"是否已制作"，`armor*` 是材质键（'none' | 'leather' | ...）。
 * @typedef {Record<string, boolean | string>} ItemMap
 */

/**
 * 统计数据（成就与图鉴迁移都依赖它）。
 * @typedef {Object} Stats
 * @property {number} explore
 * @property {number} hunt
 * @property {number} craft
 * @property {number} kills
 * @property {number} cook
 * @property {number} days
 * @property {number} events
 * @property {number} fish
 * @property {number} fishTreas
 * @property {number} fishBig
 * @property {number} bossKills
 * @property {number} bossFirstAt
 * @property {number} pharaohKills
 * @property {number} pharaohFirstAt
 * @property {number} totemSave
 * @property {number} ores
 * @property {number} ingots
 * @property {string[]} armorsWorn
 * @property {Record<string, number>} zoneCnt
 * @property {Record<string, number>} ownedRes
 */

/**
 * 单个技能的进度。
 * @typedef {Object} Skill
 * @property {number} lvl
 * @property {number} xp
 */

/**
 * 存档的完整状态。字段顺序与 `newGame()` 保持一致，便于 diff。
 * @typedef {Object} GameState
 * @property {number} v            存档格式版本（= SAVE_FMT）
 * @property {number} day
 * @property {number} hour         0–23
 * @property {number} season       索引 SEASONS
 * @property {number} weather      索引 WEATHERS
 * @property {number} hp
 * @property {number} food
 * @property {number} water
 * @property {number} stam
 * @property {boolean} ill
 * @property {boolean} lightWound
 * @property {boolean} heavyWound
 * @property {ResMap} res
 * @property {ItemMap} items
 * @property {Record<string, number>} upgrades
 * @property {{tblLv: number, weapon: number, armor: number, tool: number}} enchant
 * @property {Stats} stats
 * @property {Record<string, Skill>} skills
 * @property {number} gold
 * @property {number} lastSeen
 * @property {string|null} autoAction
 * @property {number} adrenalineLeft
 * @property {{fire: boolean, puri: boolean, trap: boolean}} offToday
 * @property {{fav: number}} npcDora
 * @property {Record<string, number>} bestiary
 * @property {Record<string, number>} milestones
 * @property {boolean} dead
 * @property {string} deathReason
 * @property {number} [__v1171_comp] 一次性补偿标记（v1.17.1 金币 NaN）
 * @property {number} [__v1274_comp] 一次性补偿标记（v1.27.4 金币 NaN）
 */

export {};
