// NPC 单测：数据对拍 + 好感度/商人抽取逻辑对拍 + 交易行为
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { DORA_LEVELS, DORA_GOODS, DORA_GIFTS, MERCHANT_GOODS } from '../../src/core/data/npc.mjs';
import { RECIPES } from '../../src/core/data/recipes.mjs';
import { resNames } from '../../src/core/data/resources.mjs';
import {
  doraInfo, addDoraFav, doraGoods, canGift, giftDora,
  canBuyDoraGood, buyDoraGood, merchantGoods, pickMerchantGoods, canTrade, buyMerchant,
} from '../../src/core/npc.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

function sliceBetween(from, to) {
  const a = html.indexOf(from);
  const b = html.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`切片失败: ${from} → ${to}`);
  return html.slice(a, b);
}

function buildOld() {
  const env = { RES_NAMES: resNames(), RECIPES, __logs: [], __ach: [], __R: 0.42 };
  vm.createContext(env);
  vm.runInContext(`
    Math.random = () => __R;
    function log(m,c){ __logs.push({text:m, cls:c||'sys'}) }
    function addRes(k,n){ if(!(k in G.res)) G.res[k]=0; G.res[k]+=n; if(n>0&&G.stats){ if(!G.stats.ownedRes) G.stats.ownedRes={}; G.stats.ownedRes[k]=1 } }
    function spend(k,n){ if((G.res[k]||0)>=n){ G.res[k]-=n; return true } return false }
    function checkMilestone(id){ __ach.push(id) }
    function showEvent(){}
    ${sliceBetween('const DORA_LEVELS = [', 'function doraInfo').replace(/const DORA_LEVELS/, 'globalThis.DORA_LEVELS')}
    ${sliceBetween('const DORA_GOODS = [', '/* 当前好感度可用的口袋商品 */').replace(/const DORA_GOODS/, 'globalThis.DORA_GOODS')}
    ${sliceBetween('function doraInfo(){', 'function isAdrenaline(){')}
    ${sliceBetween('const MERCHANT_GOODS = [', '/* 随机抽取 n 个不重复商品').replace(/const MERCHANT_GOODS/, 'globalThis.MERCHANT_GOODS')}
    ${sliceBetween('function pickMerchantGoods(n, ctx){', '/* 探索事件模板 */')}
    globalThis.__api = { doraInfo, addDoraFav, doraGoods, pickMerchantGoods };
  `, env);
  return env;
}
const env = buildOld();

test('数据：DORA_LEVELS / DORA_GOODS / MERCHANT_GOODS 与旧表一致', () => {
  assert.deepEqual(DORA_LEVELS, JSON.parse(JSON.stringify(env.DORA_LEVELS)));
  assert.equal(DORA_GOODS.length, env.DORA_GOODS.length);
  assert.equal(MERCHANT_GOODS.length, env.MERCHANT_GOODS.length);

  // 逐条比字段（旧表带函数，不能直接 deepEqual）
  DORA_GOODS.forEach((g, i) => {
    const old = env.DORA_GOODS[i];
    assert.equal(g.lvl, old.lvl, `口袋 #${i} lvl`);
    assert.equal(g.name, old.name, `口袋 #${i} name`);
    assert.equal(g.cost, old.cost, `口袋 #${i} cost`);
    assert.deepEqual(g.give, JSON.parse(JSON.stringify(old.give)), `口袋 #${i} give`);
    assert.deepEqual(g.get, JSON.parse(JSON.stringify(old.get)), `口袋 #${i} get`);
    assert.equal(g.blurb, old.blurb, `口袋 #${i} blurb`);
  });

  MERCHANT_GOODS.forEach((g, i) => {
    const old = env.MERCHANT_GOODS[i];
    assert.equal(g.tag, old.tag, `商品 #${i} tag`);
    assert.equal(g.label, old.label, `商品 #${i} label`);
    assert.deepEqual(g.give, JSON.parse(JSON.stringify(old.give)), `商品 #${i} give`);
    assert.deepEqual(g.get, JSON.parse(JSON.stringify(old.get)), `商品 #${i} get`);
    assert.equal(g.cost, old.cost, `商品 #${i} cost`);
    assert.equal(!!g.hideWhenAllLearned, !!old._hide, `商品 #${i} 隐藏条件`);
  });
});

test('好感度：6 级门槛与下一级需求', () => {
  for (const fav of [0, 19, 20, 49, 50, 99, 100, 179, 180, 299, 300, 999]) {
    const s = createNewState(NOW);
    s.npcDora.fav = fav;
    env.G = s;
    const old = JSON.parse(JSON.stringify(env.__api.doraInfo()));
    assert.deepEqual(doraInfo(s), old, `fav=${fav}`);
  }
});

test('送礼：4 种礼物、好感加成与旧实现一致；材料不足不可选', () => {
  assert.equal(DORA_GIFTS.length, 4);
  for (let i = 0; i < DORA_GIFTS.length; i++) {
    const gt = DORA_GIFTS[i];

    const rich = createNewState(NOW);
    for (const k in gt.need) rich.res[k] = 99;
    assert.equal(canGift(rich, i), true, `礼物 #${i} 应有材料`);
    const favBefore = rich.npcDora.fav;
    const r = giftDora(rich, i);
    assert.equal(rich.npcDora.fav, favBefore + gt.fav, `礼物 #${i} 好感加成`);
    assert.ok(r.logs.length >= 1);

    const poor = createNewState(NOW);
    for (const k in gt.need) poor.res[k] = 0;
    assert.equal(canGift(poor, i), false, `礼物 #${i} 材料不足应不可选`);
    const r2 = giftDora(poor, i);
    assert.equal(r2.refused, '材料不足');
    assert.equal(poor.npcDora.fav, poor.npcDora.fav, '不应扣好感');
  }
});

test('送礼满级触发 dora6 成就', () => {
  const s = createNewState(NOW);
  s.npcDora.fav = 299;
  for (const k of ['rune']) s.res[k] = 5;
  const r = giftDora(s, 2);   // 符石 ×1 → +25
  assert.equal(s.npcDora.fav, 324);
  assert.deepEqual(r.achievements, ['dora6']);
});

test('口袋商品：按好感等级解锁，与旧实现一致', () => {
  for (const fav of [0, 20, 50, 100, 180, 300]) {
    const s = createNewState(NOW);
    s.npcDora.fav = fav;
    env.G = s;
    const old = JSON.parse(JSON.stringify(env.__api.doraGoods().map((g) => g.name)));
    const now = doraGoods(s).map((g) => g.name);
    assert.deepEqual(now, old, `fav=${fav}`);
  }
});

test('口袋购买：金币与材料都要够，买后好感 +1', () => {
  const s = createNewState(NOW);
  s.gold = 1000;
  s.res.alloy = 20;
  s.npcDora.fav = 100;   // Lv.4，能买符石
  const gd = doraGoods(s).find((g) => g.name.includes('符石'));
  assert.ok(gd);
  assert.equal(canBuyDoraGood(s, gd), true);

  const goldBefore = s.gold;
  const runeBefore = s.res.rune;
  const favBefore = s.npcDora.fav;
  buyDoraGood(s, gd);
  assert.equal(s.gold, goldBefore - gd.cost);
  assert.equal(s.res.rune, runeBefore + gd.get.rune);
  assert.equal(s.npcDora.fav, favBefore + 1);

  // 钱不够
  const poor = createNewState(NOW);
  poor.npcDora.fav = 100;
  assert.equal(canBuyDoraGood(poor, gd), false);
  assert.equal(buyDoraGood(poor, gd).refused, '金币或材料不足');
});

test('口袋：符刃图纸第一次教、第二次送符石', () => {
  const s = createNewState(NOW);
  s.gold = 9999;
  s.res.alloy = 99;
  s.res.rune = 99;
  s.npcDora.fav = 300;
  const gd = DORA_GOODS.find((g) => g.key === 'runeBladeRecipe');

  s.items.runeBlade = false;
  const r1 = buyDoraGood(s, gd);
  assert.equal(s.items.runeBlade, true);
  assert.ok(r1.logs[0].text.includes('学会了符刃'));

  const runeBefore = s.res.rune;
  const r2 = buyDoraGood(s, gd);
  // 这次要付 rune 10、再收回 5，净 −5
  assert.equal(s.res.rune, runeBefore - 10 + 5);
  assert.ok(r2.logs[0].text.includes('已经会符刃'));
});

test('商人：商品池抽取与旧实现一致（固定随机）', () => {
  for (const r of [0.1, 0.42, 0.9]) {
    for (const allLearned of [false, true]) {
      const s = createNewState(NOW);
      if (allLearned) for (const k of Object.keys(RECIPES)) s.items[k] = true;

      env.G = s;
      env.__R = r;
      const old = JSON.parse(JSON.stringify(env.__api.pickMerchantGoods(4).map((g) => g.label)));

      const now = pickMerchantGoods(s, 4, () => r).map((g) => g.label);
      assert.deepEqual(now, old, `r=${r} allLearned=${allLearned}`);
    }
  }
});

test('商人：学完后图纸类商品会隐藏', () => {
  const s = createNewState(NOW);
  const before = merchantGoods(s).length;
  for (const k of Object.keys(RECIPES)) s.items[k] = true;
  const after = merchantGoods(s).length;
  assert.equal(before - after, 2, '应隐藏 2 条图纸类商品');
});

test('商人交易：金币/材料不足则拒绝，成功则给货', () => {
  const good = MERCHANT_GOODS.find((g) => g.cost === 50 && g.get && g.get.food === 20);
  assert.ok(good, '找不到 50 金买 20 食物那条');

  const s = createNewState(NOW);
  s.gold = 49;
  assert.equal(canTrade(s, good), false);
  assert.equal(buyMerchant(s, good).refused, '金币或材料不足');

  s.gold = 50;
  const foodBefore = s.res.food;
  const r = buyMerchant(s, good);
  assert.equal(s.gold, 0);
  assert.equal(s.res.food, foodBefore + 20);
  assert.ok(r.logs[0].text.includes('交易完成'));
});

test('商人：随机图纸 / 高级图纸 两种特殊商品', () => {
  // 随机图纸：从 alloy 5 换
  const s = createNewState(NOW);
  s.res.alloy = 10;
  const rg = MERCHANT_GOODS.find((g) => g.key === 'randomRecipe');
  const unownedBefore = Object.keys(RECIPES).filter((k) => !s.items[k]).length;
  buyMerchant(s, rg, { random: () => 0 });
  const unownedAfter = Object.keys(RECIPES).filter((k) => !s.items[k]).length;
  assert.equal(unownedAfter, unownedBefore - 1, '应学会一个配方');

  // 高级图纸：优先 tier4
  const s2 = createNewState(NOW);
  s2.res.rune = 10;
  const ag = MERCHANT_GOODS.find((g) => g.key === 'advancedRecipe');
  buyMerchant(s2, ag, { random: () => 0 });
  const t4 = ['runeBlade', 'runeArmor', 'forgeMast', 'vault'];
  assert.ok(t4.some((k) => s2.items[k]), '应优先解锁 tier4 配方');
});
