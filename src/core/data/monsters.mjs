// 怪物表：通用野兽 / 废墟机器人 / 区域特色怪 / 月圆进化
//
// 与 survival.html 的 BEASTS / ROBOTS / REGION_BEASTS / MOON_BEASTS 逐一对应。
// 注意 REGION_BEASTS.ruins 直接引用 ROBOTS（原实现就是同一个数组，不要复制成两份）。

export const BEASTS = [{"name":"野狗","hp":20,"atk":8,"food":5,"leather":2},{"name":"灰狼","hp":30,"atk":12,"food":8,"leather":3},{"name":"野猪","hp":40,"atk":14,"food":12,"leather":4},{"name":"黑熊","hp":60,"atk":20,"food":18,"leather":6}];

export const ROBOTS = [{"name":"🤖锈蚀哨兵","hp":25,"atk":10,"food":0,"leather":0,"metal":3,"alloy":0},{"name":"⚙️巡逻机甲","hp":45,"atk":18,"food":0,"leather":0,"metal":6,"alloy":2},{"name":"🛠装配线守卫","hp":70,"atk":24,"food":0,"leather":0,"metal":10,"alloy":4}];

export const REGION_BEASTS = {
  "forest": [{"name":"🌲野人","hp":35,"atk":14,"food":10,"leather":4,"metal":0}],
  "ruins": ROBOTS,
  "river": [{"name":"🐊沼泽鳄鱼","hp":50,"atk":18,"food":12,"leather":6,"metal":0}],
  "hills": [{"name":"🦅山岩巨鹰","hp":40,"atk":16,"food":8,"leather":5,"metal":2}],
  "pyramid": [{"name":"🪳食尸虫","hp":25,"atk":11,"food":3,"leather":0,"metal":0,"rune":0},{"name":"🧟木乃伊","hp":55,"atk":20,"food":0,"leather":2,"metal":0,"rune":1},{"name":"🐍沙漠眼镜蛇","hp":45,"atk":18,"food":2,"leather":3,"metal":1,"rune":0}],
};

export const MOON_BEASTS = {
  "dog": {"name":"🌕嗜血凶犬","hp":35,"atk":15,"food":8,"leather":3,"metal":1},
  "wolf": {"name":"🌕月狼","hp":55,"atk":22,"food":12,"leather":4,"metal":2},
};
