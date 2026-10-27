// 效果执行器单测（纯函数：状态 + 指令 → 新状态 + 日志）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNewState } from '../../src/core/save.mjs';
import { applyEffects, fillResText } from '../../src/core/effects.mjs';

const NOW = 1_700_000_000_000;
const fresh = () => createNewState(NOW);

test('res：加资源并记录"曾经拥有过"', () => {
  const s = fresh();
  const logs = applyEffects(s, [{ op: 'res', res: 'metal', n: 30 }]);
  assert.equal(s.res.metal, 30);
  assert.equal(s.stats.ownedRes.metal, 1);
  assert.deepEqual(logs, []);
});

test('res：扣资源不会写 ownedRes', () => {
  const s = fresh();
  s.res.metal = 5;
  applyEffects(s, [{ op: 'res', res: 'metal', n: -3 }]);
  assert.equal(s.res.metal, 2);
  assert.equal(s.stats.ownedRes.metal, undefined);
});

test('res：未知资源键会自动补 0 再加', () => {
  const s = fresh();
  applyEffects(s, [{ op: 'res', res: 'brandNew', n: 4 }]);
  assert.equal(s.res.brandNew, 4);
});

test('gold：增减且不低于 0', () => {
  const s = fresh();
  applyEffects(s, [{ op: 'gold', n: 100 }]);
  assert.equal(s.gold, 100);
  applyEffects(s, [{ op: 'gold', n: -500 }]);
  assert.equal(s.gold, 0);
});

test('set：字段直接赋值（布尔 / 数值都行）', () => {
  const s = fresh();
  applyEffects(s, [{ op: 'set', field: 'ill', value: true }, { op: 'set', field: 'hp', value: 100 }]);
  assert.equal(s.ill, true);
  assert.equal(s.hp, 100);
});

test('delta：增减并夹取上下限', () => {
  const s = fresh();
  s.hp = 10;
  applyEffects(s, [{ op: 'delta', field: 'hp', n: -20, min: 1, max: 100 }]);
  assert.equal(s.hp, 1);            // 下限 1（幸运方块陷阱不会致死）
  s.stam = 90;
  applyEffects(s, [{ op: 'delta', field: 'stam', n: -40, min: 0 }]);
  assert.equal(s.stam, 50);
});

test('log：支持 {res:key} 占位符', () => {
  const s = fresh();
  const logs = applyEffects(s, [{ op: 'res', res: 'metal', n: 30 }, { op: 'log', text: '🎁 涌出大量{res:metal} ×30！', cls: 'good' }]);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].text, '🎁 涌出大量🔩金属 ×30！');
  assert.equal(logs[0].cls, 'good');
});

test('steal：随机偷取（注入随机源 → 结果确定）', () => {
  const s = fresh();
  s.res = { wood: 10, stone: 0 };
  const logs = applyEffects(s, [{ op: 'steal', n2: [3, 8] }], { random: () => 0 });
  assert.equal(s.res.wood, 7);      // 选中 wood，偷 min(10, 3) = 3
  assert.match(logs[0].text, /丢了 ×3/);
  assert.equal(logs[0].cls, 'bad');
});

test('steal：没有可偷资源时给保底文案', () => {
  const s = fresh();
  s.res = { wood: 0 };
  const logs = applyEffects(s, [{ op: 'steal', n2: [3, 8] }], { random: () => 0 });
  assert.equal(logs[0].text, '💥 好像什么都没发生……');
});

test('steal：不会偷走幸运方块（原实现特意排除）', () => {
  const s = fresh();
  s.res = { luck: 5 };
  const logs = applyEffects(s, [{ op: 'steal', n2: [3, 8] }], { random: () => 0 });
  assert.equal(s.res.luck, 5);
  assert.equal(logs[0].text, '💥 好像什么都没发生……');
});

test('组合效果：隐藏宝箱（多资源 + 金币 + 日志）', () => {
  const s = fresh();
  const logs = applyEffects(s, [
    { op: 'res', res: 'metal', n: 15 },
    { op: 'res', res: 'leather', n: 10 },
    { op: 'res', res: 'alloy', n: 2 },
    { op: 'gold', n: 60 },
    { op: 'log', text: '🎁 隐藏宝箱被发现！大量物资 + 金币 +60。', cls: 'good' },
  ]);
  assert.equal(s.res.metal, 15);
  assert.equal(s.res.leather, 10);
  assert.equal(s.res.alloy, 2);
  assert.equal(s.gold, 60);
  assert.equal(logs.length, 1);
});

test('未知指令直接抛错（避免静默失效）', () => {
  const s = fresh();
  assert.throws(() => applyEffects(s, [{ op: 'nope' }]), /未知的效果指令/);
});

test('fillResText：把 {res:key} 换成中文名，未知键原样保留', () => {
  assert.equal(fillResText('获得{res:metal} ×3~5'), '获得🔩金属 ×3~5');
  assert.equal(fillResText('{res:wood}与{res:stone}'), '🪵木材与🪨石头');
  assert.equal(fillResText('{res:nope}'), '{res:nope}');
  assert.equal(fillResText('没有占位'), '没有占位');
});
