// 探索事件（28 条）
//
// 对应 survival.html 的 EXPLORE_EVENTS。文案里的资源名用 `{res:key}` 占位（渲染时替换）。
// 选项效果用声明式指令（见 core/effects.mjs）；个别需要计算的用 `run` 指向具名 handler。
//
// 三个事件的 opts 是动态生成的（opts 留空）：
//   lost     → core/explore-events.mjs 的 lostOpts()
//   merchant → 由 npc 模块的 pickMerchantGoods 生成
//   dora     → 由 npc 模块生成（送礼 / 口袋 / 闲聊 / 离开）

export const EXPLORE_EVENTS = [
  {
    id: 'camp', w: 3, title: '废弃营地', text: '你在一处被遗弃的营地里翻找。',
    opts: [
      { label: '翻找食物', d: '获得{res:food} ×4~8', effects: [{ op: 'res', res: 'food', n: { rnd: [4, 8] } }] },
      { label: '搜集金属', d: '获得{res:metal} ×2~4', effects: [{ op: 'res', res: 'metal', n: { rnd: [2, 4] } }] },
    ],
  },
  {
    id: 'herbg', w: 3, title: '药草丛', text: '一片野生药草在风中摇曳。',
    opts: [
      { label: '采集', d: '获得{res:herb} ×4~7', effects: [{ op: 'res', res: 'herb', n: { rnd: [4, 7] } }] },
    ],
  },
  {
    id: 'can', w: 3, title: '生锈罐头', text: '土里埋着半罐还能吃的罐头。',
    opts: [
      { label: '收下', d: '获得{res:food} ×3', effects: [{ op: 'res', res: 'food', n: 3 }] },
    ],
  },
  {
    id: 'box', w: 3, title: '工具箱', text: '发现一个旧工具箱。',
    opts: [
      { label: '撬开', d: '获得{res:metal} ×3~5', effects: [{ op: 'res', res: 'metal', n: { rnd: [3, 5] } }] },
    ],
  },
  {
    id: 'spring', w: 3, title: '山泉', text: '一泓清泉从岩缝涌出。',
    opts: [
      { label: '痛饮一顿', d: '水分 +25', effects: [{ op: 'delta', field: 'water', n: 25, max: 100 }] },
    ],
  },
  {
    // 选项在 lostOpts() 里动态生成（丢硬币需要金币判定）
    id: 'lost', w: 3, title: '迷路', text: '浓雾遮住了来路，你转了许久才找回方向。', opts: [],
  },
  {
    id: 'trap', w: 2, title: '捕兽夹', text: '杂草丛中藏着一个生锈的捕兽夹！',
    opts: [
      {
        label: '设法挣脱', d: '生命 -10',
        effects: [
          { op: 'delta', field: 'hp', n: -10, min: 1, max: 100 },
          { op: 'log', text: '你被夹伤，流血不止。', cls: 'bad' },
        ],
      },
    ],
  },
  {
    // 商品在事件解析时由 pickMerchantGoods 动态生成
    id: 'merchant', w: 2, title: '流浪商人', kind: 'merchant',
    text: '一个兜帽人推着破车出现：「换点物资吗？我这有 4 样货，包你满意。」', opts: [],
  },
  {
    id: 'surv', w: 2, title: '落难者', text: '一个满脸尘土的人向你讨要食物。',
    opts: [
      {
        label: '分他一些 (生食-3)', d: '他感激地给了你一卷皮革',
        require: { food: 3 }, requireFail: '你拿不出食物。',
        effects: [
          { op: 'res', res: 'food', n: -3 },
          { op: 'res', res: 'leather', n: 2 },
          { op: 'log', text: '落难者塞给你一张鞣过的皮革。', cls: 'good' },
        ],
      },
      { label: '摇头走开', d: '他失望地离开了', effects: [] },
    ],
  },

  /* ─── 沙漠金字塔 ─── */
  {
    id: 'tomb', zone: 'pyramid', w: 2, title: '法老墓室',
    text: '你推开一扇尘封的石门，一具石棺静立在昏暗的墓室中央。',
    opts: [
      {
        label: '开棺！', d: '宝藏/木乃伊/诅咒',
        run: 'tombOpen',
        effects: [],
      },
      { label: '合上石门离开', d: '不打扰沉眠者', effects: [] },
    ],
  },
  {
    id: 'carrion', zone: 'pyramid', w: 2, title: '食尸虫群',
    text: '沙地里突然涌出一群黑压压的食尸虫，沙沙作响地爬向你！',
    opts: [
      { label: '迎战！', d: '与虫群战斗', effects: [{ op: 'combat' }] },
      {
        label: '快跑！', d: '精力 -10，有风险', effects: [{
          op: 'branch', if: { field: 'stam', gte: 10 },
          then: [
            { op: 'delta', field: 'stam', n: -10, min: 0, max: 100 },
            { op: 'log', text: '你连滚带爬逃出了虫群的包围。', cls: 'info' },
          ],
          else: [
            { op: 'delta', field: 'hp', n: -10, min: 0, max: 100 },
            { op: 'log', text: '你精疲力尽，被虫群啃了几口！', cls: 'bad' },
          ],
        }],
      },
    ],
  },
  {
    id: 'sandstorm', zone: 'pyramid', w: 2, title: '沙暴',
    text: '金字塔周围刮起漫天沙暴，黄沙遮天蔽日。',
    opts: [
      {
        label: '就地躲避', d: '精力 -15',
        effects: [
          { op: 'delta', field: 'stam', n: -15, min: 0, max: 100 },
          { op: 'log', text: '沙暴过后你灰头土脸，精力 -15。', cls: 'info' },
        ],
      },
      {
        label: '顶着风走', d: '可能捡到金矿',
        effects: [{
          op: 'random',
          branches: [
            {
              w: 1,
              effects: [
                { op: 'res', res: 'goldOre', n: { rnd: [1, 3] }, log: '风沙过后，脚边竟躺着几块{res:goldOre} ×{n}！', cls: 'good' },
              ],
            },
            {
              w: 1,
              effects: [
                { op: 'delta', field: 'hp', n: -8, min: 0, max: 100 },
                { op: 'log', text: '沙粒打得你生疼，生命 -8。', cls: 'bad' },
              ],
            },
          ],
        }],
      },
    ],
  },
  {
    id: 'goldroom', zone: 'pyramid', w: 1, title: '黄金密室',
    text: '你在金字塔深处发现一间堆满黄金饰品的密室，金光照亮了你的脸。',
    opts: [
      {
        label: '搜刮！', d: '金矿石+金币',
        run: 'goldroomLoot',
        effects: [],
      },
      {
        label: '只取一点就走', d: '安全但少拿',
        effects: [
          { op: 'achievement', id: 'goldroom1' },
          { op: 'res', res: 'goldOre', n: { rnd: [1, 2] }, log: '你谨慎地取走{res:goldOre} ×{n}。', cls: 'info' },
        ],
      },
    ],
  },
  {
    id: 'mummycurse', zone: 'pyramid', w: 1, title: '法老的诅咒',
    text: '墙上刻着一行古文字：「打扰法老者，永受诅咒。」',
    opts: [
      {
        label: '无视它', d: '可能遭报应',
        effects: [{
          op: 'random',
          branches: [
            {
              w: 1,
              effects: [
                { op: 'set', field: 'ill', value: true },
                { op: 'log', text: '☠️ 当晚你噩梦连连，染上了怪病！', cls: 'bad' },
              ],
            },
            { w: 1, effects: [{ op: 'log', text: '什么都没有发生。', cls: 'info' }] },
          ],
        }],
      },
      {
        label: '献上祭品 (生食-3)', d: '求得庇佑',
        require: { food: 3 }, requireFail: '你拿不出祭品。',
        effects: [
          { op: 'res', res: 'food', n: -3 },
          { op: 'log', text: '你献上食物，感觉墓室的阴气淡了几分。', cls: 'good' },
        ],
      },
    ],
  },

  /* ─── 森林 ─── */
  {
    id: 'mushroom', zone: 'forest', w: 3, title: '蘑菇圈',
    text: '一圈肥美的蘑菇在腐木上长成，看起来能吃。',
    opts: [
      { label: '小心采摘', d: '获得{res:food} ×6~10', effects: [{ op: 'res', res: 'food', n: { rnd: [6, 10] } }] },
      { label: '连草药一起采', d: '获得{res:herb} ×2~4', effects: [{ op: 'res', res: 'herb', n: { rnd: [2, 4] } }] },
    ],
  },
  {
    id: 'beehive', zone: 'forest', w: 2, title: '野蜂巢',
    text: '树杈上挂着一个嗡嗡作响的野蜂巢，蜂蜜香甜诱人。',
    opts: [
      {
        label: '冒险掏蜂蜜', d: '生命 -6 · 获得熟食 ×5~8',
        effects: [
          { op: 'delta', field: 'hp', n: -6, min: 1, max: 100 },
          { op: 'res', res: 'cooked', n: { rnd: [5, 8] } },
          { op: 'log', text: '你被蛰得满脸包，但蜂蜜到手了！', cls: 'good' },
        ],
      },
      { label: '绕开', d: '还是别惹它们', effects: [] },
    ],
  },
  {
    id: 'deer', zone: 'forest', w: 2, title: '林间鹿群',
    text: '一群野鹿在溪边饮水，警觉地竖着耳朵。',
    opts: [
      // 依赖武器与狩猎等级，用 handler
      { label: '伏击狩猎', d: '成功：食物×10~16 / 失败：白跑', run: 'deerHunt' },
      { label: '静静离开', d: '不打扰它们', effects: [] },
    ],
  },
  {
    id: 'granny', zone: 'forest', w: 1, title: '外婆的小屋',
    text: '森林深处，一个白发老太太朝你招手：「好孩子，快来外婆家喝口热汤吧。」你总觉得她的眼神有点怪……',
    opts: [
      {
        label: '接过热汤', d: '50% 真外婆送礼 / 50% 大灰狼扑来！',
        effects: [{
          op: 'random',
          branches: [
            {
              w: 1,
              effects: [
                { op: 'res', res: 'food', n: { rnd: [8, 12] } },
                { op: 'res', res: 'herb', n: { rnd: [2, 4] } },
                { op: 'log', text: '🥣 外婆熬的野菜汤温暖了你的胃。（生食+8~12 草药+2~4）', cls: 'good' },
              ],
            },
            {
              w: 1,
              effects: [
                { op: 'log', text: '❗ 老太太忽然咧嘴一笑——露出的是一口獠牙！「大灰狼」撕下伪装扑向你！', cls: 'bad' },
                { op: 'combat', beasts: true },
              ],
            },
          ],
        }],
      },
      {
        label: '试探：「外婆，你耳朵怎么这么大？」', d: '50% 识破狼外婆 / 50% 真外婆给礼物',
        effects: [{
          op: 'random',
          branches: [
            {
              w: 1,
              effects: [
                { op: 'log', text: '👵 她温柔一笑：「是为了听清你的脚步声呀。」（真外婆，获得礼物）', cls: 'good' },
                { op: 'res', res: 'cooked', n: { rnd: [3, 5] } },
                { op: 'res', res: 'clean', n: { rnd: [3, 5] } },
              ],
            },
            {
              w: 1,
              effects: [
                { op: 'log', text: '🐺 她眼神一冷：「是为了……吃掉你啊！」大灰狼撕下伪装扑向你！', cls: 'bad' },
                { op: 'combat', beasts: true },
              ],
            },
          ],
        }],
      },
      { label: '婉拒离开', d: '安全离开', effects: [{ op: 'log', text: '你礼貌地告辞，身后传来老太太幽幽的叹息……', cls: 'info' }] },
    ],
  },

  /* ─── 废墟 ─── */
  {
    // 机器猫菜单由 npc 模块动态生成
    id: 'dora', zone: 'ruins', w: 2, title: '破旧的猫耳机器人', kind: 'dora',
    text: '废墟角落蜷着一只破旧的蓝色人形猫耳机器人，眼睛半亮，看到你后拍了拍鼓鼓的口袋。', opts: [],
  },
  {
    id: 'vending', zone: 'ruins', w: 2, title: '废弃自动售货机',
    text: '一台半塌的自动售货机还亮着微弱的灯。',
    opts: [
      {
        label: '投币试试 (10💰)', d: '随机出货',
        require: { gold: 10 }, requireFail: '你翻遍口袋也凑不出 10 金币。',
        effects: [
          { op: 'gold', n: -10 },
          {
            op: 'random',
            branches: [
              {
                w: 50,
                effects: [
                  { op: 'res', res: 'food', n: { rnd: [5, 9] }, log: '叮！掉出{res:food} ×{n}。', cls: 'good' },
                ],
              },
              {
                w: 30,
                effects: [
                  { op: 'res', res: 'clean', n: { rnd: [3, 6] }, log: '叮！掉出{res:clean} ×{n}。', cls: 'good' },
                ],
              },
              {
                w: 12,
                effects: [
                  { op: 'res', res: 'cooked', n: { rnd: [2, 4] }, log: '叮！掉出{res:cooked} ×{n}！', cls: 'good' },
                ],
              },
              {
                w: 8,
                effects: [
                  { op: 'res', res: 'rune', n: { rnd: [1, 2] }, log: '叮！竟然掉出{res:rune} ×{n}！！', cls: 'good' },
                ],
              },
            ],
          },
        ],
      },
      {
        label: '砸开玻璃', d: '获得金属 ×2，但可能惊动什么',
        effects: [
          { op: 'res', res: 'metal', n: 2 },
          { op: 'log', text: '你砸开玻璃，抓出里面的罐头。', cls: 'good' },
        ],
      },
    ],
  },
  {
    id: 'library', zone: 'ruins', w: 1, title: '倒塌的图书馆',
    text: '断裂的书架下压着几本还算完整的旧书。',
    opts: [
      {
        label: '翻找知识', d: '随机学会一个新配方',
        effects: [
          {
            op: 'learnRecipe',
            log: '你在书中找到了「{name}」的制作方法！',
            failText: '书都烧成了灰，你已经没什么可学的了。',
          },
        ],
      },
      { label: '收集纸页', d: '获得木材 ×5', effects: [{ op: 'res', res: 'wood', n: 5 }] },
    ],
  },
  {
    id: 'radzone', zone: 'ruins', w: 2, title: '辐射泄漏区',
    text: '地上画着褪色的警示标志，空气里弥漫着金属焦味。',
    opts: [
      {
        label: '冒险深入', d: '生命 -15 · 金属×8~12 合金×2~4',
        effects: [
          { op: 'delta', field: 'hp', n: -15, min: 1, max: 100 },
          { op: 'res', res: 'metal', n: { rnd: [8, 12] } },
          { op: 'res', res: 'alloy', n: { rnd: [2, 4] } },
          { op: 'log', text: '你咬牙冲进辐射区拖出一批金属，代价是皮肤灼痛。', cls: 'bad' },
        ],
      },
      { label: '在边缘捡点', d: '金属 ×3~5', effects: [{ op: 'res', res: 'metal', n: { rnd: [3, 5] } }] },
    ],
  },

  /* ─── 河边 ─── */
  {
    id: 'driftbox', zone: 'river', w: 2, title: '漂来的木箱',
    text: '河面上漂来一个捆得结实的防水木箱。',
    opts: [
      {
        label: '捞上来看看', d: '随机物资',
        effects: [{
          op: 'random',
          branches: [
            {
              w: 40,
              effects: [
                { op: 'res', res: 'wood', n: { rnd: [4, 8] }, log: '木箱里是干燥的{res:wood} ×{n}。', cls: 'good' },
              ],
            },
            {
              w: 30,
              effects: [
                { op: 'res', res: 'food', n: { rnd: [3, 6] }, log: '密封的食物罐！{res:food} ×{n}。', cls: 'good' },
              ],
            },
            {
              w: 20,
              effects: [
                { op: 'res', res: 'leather', n: { rnd: [1, 3] }, log: '几块油布包着的{res:leather} ×{n}。', cls: 'good' },
              ],
            },
            {
              w: 10,
              effects: [
                { op: 'res', res: 'luck', n: 1 },
                { op: 'log', text: '一个漂流的幸运方块！', cls: 'good' },
              ],
            },
          ],
        }],
      },
      { label: '任它漂走', d: '无缘无份', effects: [] },
    ],
  },
  {
    id: 'fishschool', zone: 'river', w: 3, title: '浅滩鱼群',
    text: '清澈的浅滩里黑压压一片鱼群！',
    opts: [
      {
        label: '徒手捞鱼', d: '获得{res:food} ×10~16',
        effects: [
          { op: 'res', res: 'food', n: { rnd: [10, 16] } },
          { op: 'log', text: '你捞得满手是鱼！', cls: 'good' },
        ],
      },
      {
        label: '放长线钓大鱼', d: '获得{res:food} ×18~26（需鱼竿）',
        require: { item: 'rod' }, requireFail: '没有鱼竿，只能看着鱼群游走。',
        effects: [
          { op: 'res', res: 'food', n: { rnd: [18, 26] } },
          { op: 'log', text: '你钓上了整整一桶鱼！', cls: 'good' },
        ],
      },
    ],
  },
  {
    id: 'otter', zone: 'river', w: 2, title: '河岸水獭',
    text: '一只圆滚滚的水獭叼着鱼趴在石头上晒太阳。',
    opts: [
      { label: '捡它掉落的鱼', d: '获得{res:food} ×4~8', effects: [{ op: 'res', res: 'food', n: { rnd: [4, 8] } }] },
      {
        label: '尝试捕捉', d: '成功：皮革×3 / 失败：白跑',
        effects: [{
          op: 'random',
          branches: [
            {
              w: 4,
              effects: [
                { op: 'res', res: 'leather', n: 3 },
                { op: 'log', text: '水獭滑不溜手，但你还是拽下一撮皮毛。', cls: 'good' },
              ],
            },
            { w: 6, effects: [{ op: 'log', text: '水獭一个猛子扎进水里不见了。', cls: 'warn' }] },
          ],
        }],
      },
    ],
  },

  /* ─── 山丘 ─── */
  {
    id: 'orevein', zone: 'hills', w: 3, title: '露天矿脉',
    text: '一道裸露的矿脉在阳光下闪着微光。',
    opts: [
      {
        label: '开采', d: '获得{res:metal} ×4~8 · {res:stone} ×3~5',
        effects: [
          { op: 'res', res: 'metal', n: { rnd: [4, 8] } },
          { op: 'res', res: 'stone', n: { rnd: [3, 5] } },
        ],
      },
      {
        label: '仔细敲打', d: '金属 ×6~10（需铁斧）',
        require: { item: 'ironAxe' }, requireFail: '石头太硬，你的工具啃不动。',
        effects: [
          { op: 'res', res: 'metal', n: { rnd: [6, 10] } },
          { op: 'log', text: '铁斧敲开矿脉，露出大块矿石！', cls: 'good' },
        ],
      },
    ],
  },
  {
    id: 'rockfall', zone: 'hills', w: 2, title: '落石',
    text: '山顶传来轰隆声——碎石正往下滚！',
    opts: [
      {
        label: '抱头躲避', d: '生命 -12 · 侥幸捡到石头×3~6',
        effects: [
          { op: 'delta', field: 'hp', n: -12, min: 1, max: 100 },
          { op: 'res', res: 'stone', n: { rnd: [3, 6] } },
          { op: 'log', text: '你被碎石擦伤，但捡到一些可用的石头。', cls: 'bad' },
        ],
      },
      { label: '飞快跑开', d: '毫发无伤', effects: [{ op: 'log', text: '你险之又险地躲开了落石。', cls: 'info' }] },
    ],
  },
  {
    id: 'eaglenest', zone: 'hills', w: 2, title: '鹰巢',
    text: '峭壁上的鹰巢旁散落着动物的残骸。',
    opts: [
      { label: '搜刮残骸', d: '获得{res:food} ×5~9', effects: [{ op: 'res', res: 'food', n: { rnd: [5, 9] } }] },
      {
        label: '冒险掏巢', d: '生命 -8 · 皮革×3~5',
        effects: [
          { op: 'delta', field: 'hp', n: -8, min: 1, max: 100 },
          { op: 'res', res: 'leather', n: { rnd: [3, 5] } },
          { op: 'log', text: '老鹰俯冲啄你，你抱着皮革滚下山坡。', cls: 'bad' },
        ],
      },
    ],
  },
];
