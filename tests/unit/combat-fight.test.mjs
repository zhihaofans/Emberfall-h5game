// 战斗回合对拍：fightRound / fightBoss / flee / bossFlee / bait vs 旧 fight(act)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createNewState } from '../../src/core/save.mjs';
import { WEAPONS } from '../../src/core/data/weapons.mjs';
import { BEASTS, ROBOTS, REGION_BEASTS, MOON_BEASTS } from '../../src/core/data/monsters.mjs';
import { resNames } from '../../src/core/data/resources.mjs';
import { ARMOR_MATS, ARMOR_MAT_INFO, ARMOR_SLOTS, armorSlotKey } from '../../src/core/data/armor.mjs';
import { armorDmgMult } from '../../src/core/craft.mjs';
import { fightRound, fightBoss, flee, bossFlee, bait, weaponAtk, bossStats, pharaohStats } from '../../src/core/combat.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(resolve(ROOT, 'legacy/survival.html'), 'utf8');
const NOW = 1_700_000_000_000;

function extractFn(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`找不到 ${name}`);
  const nextFn = html.indexOf('\nfunction ', start + 1);
  const nextComment = html.indexOf('\n/*', start + 1);
  const end = Math.min(...[nextFn, nextComment].filter((i) => i > 0));
  return html.slice(start, end);
}

function buildOld() {
  const env = {
    WEAPONS, RES_NAMES: resNames(),
    ARMOR_MAT_INFO, ARMOR_SLOTS,
    __R: 0.42, __logs: [], __ach: [], __xp: [],
    document: { getElementById: () => ({ classList: { remove() {}, add() {} }, innerHTML: '' }) },
  };
  vm.createContext(env);
  vm.runInContext(`
    Math.random = () => __R;
    function log(m,c){ __logs.push({text:m, cls:c||'sys'}) }
    function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a}
    function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
    function addRes(k,n){ if(!(k in G.res)) G.res[k]=0; G.res[k]+=n; if(n>0&&G.stats){ if(!G.stats.ownedRes) G.stats.ownedRes={}; G.stats.ownedRes[k]=1 } }
    function spend(k,n){ if((G.res[k]||0)>=n){ G.res[k]-=n; return true } return false }
    function addXp(k,n){ __xp.push({skill:k, n:n}) }
    function skillLvl(k){ return (G.skills[k] && G.skills[k].lvl) || 1 }
    function checkMilestone(id){ __ach.push(id) }
    function checkStageAchieve(){ __ach.push('stage') }
    function renderAll(){} function save(){} function checkDeath(){}
    function armorSlotMat(slot){ const k='armor'+slot[0].toUpperCase()+slot.slice(1); return G.items[k]||'none' }
    function weaponAtk(){
      const base = G.items.runeBlade ? WEAPONS.runeBlade : (G.items.huntKing ? WEAPONS.huntKing : (G.items.steel ? WEAPONS.steel : (G.items.iron ? WEAPONS.iron : (G.items.knife ? WEAPONS.knife : WEAPONS.none))));
      const sharp = (G.enchant && G.enchant.weapon)||0;
      return {name:base.name, atk:Math.round(base.atk*(1+sharp*0.10)), baseAtk:base.atk, mult:base.mult, sharp};
    }
    function bossStats(){ const k=G.stats.bossKills||0; return { name:'x', hp:90+k*60, atk:22+k*8, food:30+k*12, leather:12+k*5, metal:8+k*4 } }
    function pharaohStats(){ const k=G.stats.pharaohKills||0; return { name:'👑阿努比斯之仆', hp:220+k*100, atk:32+k*12, food:40+k*15, leather:8+k*3, metal:15+k*5, alloy:8+k*4, rune:2+k, gold:120+k*80 } }
    ${extractFn('armorDmgMult')}
    ${extractFn('fight')}
    globalThis.__fight = fight;
  `, env);
  return env;
}
const env = buildOld();

function oldFight(state, act, opts = {}) {
  env.G = state;
  env.__logs.length = 0;
  env.__ach.length = 0;
  env.__xp.length = 0;
  env.__R = opts.random ?? 0.42;
  env.combat = { b: Object.assign({}, opts.monster), isBoss: !!opts.isBoss, isPharaoh: !!opts.isPharaoh };
  env.__fight(act);
  return {
    logs: JSON.parse(JSON.stringify(env.__logs)),
    ach: [...env.__ach],
    xp: JSON.parse(JSON.stringify(env.__xp)),
    state: JSON.parse(JSON.stringify(env.G)),
  };
}

function armedState() {
  const s = createNewState(NOW);
  s.items.steel = true;
  s.upgrades.weapon = 2;
  s.skills.combat.lvl = 5;
  s.hp = 100;
  for (const slot of Object.keys(ARMOR_SLOTS)) s.items[armorSlotKey(slot)] = 'iron';
  return s;
}

test('普通怪：单回合击杀与未击杀都与旧实现一致', () => {
  const cases = [
    ['击杀弱怪', { name: '野狗', hp: 20, atk: 8, food: 5, leather: 2 }, 100],
    ['未击杀', { name: '黑熊', hp: 999, atk: 20, food: 18, leather: 6 }, 100],
    ['低血量受伤', { name: '黑熊', hp: 999, atk: 20, food: 18, leather: 6 }, 45],
    ['木乃伊（成就）', { name: '🧟木乃伊', hp: 55, atk: 20, food: 0, leather: 2, metal: 0, rune: 1 }, 100],
  ];
  for (const [label, monster, hp] of cases) {
    const base = armedState();
    base.hp = hp;

    const fresh = JSON.parse(JSON.stringify(base));
    const old = oldFight(base, 'fight', { monster });

    const r = fightRound(fresh, monster, { random: () => 0.42 });

    assert.deepEqual(r.logs, old.logs, `${label}：日志不一致`);
    assert.deepEqual(r.xp, old.xp, `${label}：经验不一致`);
    assert.deepEqual(r.achievements, old.ach, `${label}：成就不一致`);
    assert.deepEqual(fresh, old.state, `${label}：状态不一致`);
  }
});

test('Boss 战败：与旧实现一致', () => {
  const opts = { monster: { name: '废土兽王', hp: 9999, atk: 99, food: 30, leather: 12, metal: 8 }, isBoss: true };
  const base = armedState();
  base.hp = 20;

  const fresh = JSON.parse(JSON.stringify(base));
  const old = oldFight(base, 'fight', { ...opts, random: 0.42 });
  const r = fightBoss(fresh, opts, { random: () => 0.42 });

  assert.equal(r.victory, false);
  assert.deepEqual(r.logs, old.logs);
  assert.deepEqual(r.xp, old.xp);
  assert.deepEqual(fresh, old.state);
});

// ⚠ 旧实现有 bug：`const b=combat.b; combat=null;` 之后又读 `combat.isPharaoh`，
//    所以**击杀 Boss 时会抛 TypeError**（奖励、计数、成就全部不发）。
//    这里无法对拍，只验证新实现按"原意"给出的结果。详见 SUSPECTED.md 第 7 条。
test('Boss 胜利：旧实现会抛异常，这里验证新实现的正确奖励', () => {
  // 复现旧实现的异常
  const boom = armedState();
  const boomMonster = { name: '废土兽王', hp: 90, atk: 22, food: 30, leather: 12, metal: 8 };
  env.G = boom;
  env.__logs.length = 0;
  env.__R = 0.42;
  env.combat = { b: Object.assign({}, boomMonster), isBoss: true, isPharaoh: false };
  assert.throws(() => env.__fight('fight'), /isPharaoh/, '旧实现应当抛异常');

  // 新实现：正常结算
  const s = armedState();
  const before = {
    food: s.res.food, leather: s.res.leather, metal: s.res.metal,
    luck: s.res.luck, rune: s.res.rune,
  };
  const r = fightBoss(s, { monster: boomMonster, isBoss: true, isPharaoh: false }, { random: () => 0.42 });

  assert.equal(r.victory, true);
  assert.equal(s.stats.bossKills, 1);
  assert.equal(s.stats.kills, 1);
  assert.ok(r.achievements.includes('boss'));
  assert.ok(s.res.food > before.food, '应当拿到食物奖励');
  assert.ok(s.res.metal > before.metal, '应当拿到金属奖励');
  assert.ok(s.res.rune >= before.rune + 1, '兽王必掉 1 符石');
});

test('法老胜利：奖励含金币与金矿石，成就 pharaoh1', () => {
  const s = armedState();
  const goldBefore = s.gold;
  const monster = { name: '👑阿努比斯之仆', hp: 220, atk: 32, food: 40, leather: 8, metal: 15, alloy: 8, rune: 2 };
  const r = fightBoss(s, { monster, isBoss: true, isPharaoh: true }, { random: () => 0.42 });

  assert.equal(r.victory, true);
  assert.equal(s.stats.pharaohKills, 1);
  assert.ok(s.gold > goldBefore, '应当拿到金币');
  assert.ok(r.achievements.includes('pharaoh1'));
});

test('逃跑：成功 / 失败 / 饥饿引开 / Boss 撤离', () => {
  const monster = { name: '灰狼', hp: 30, atk: 12 };

  // 逃跑成功（0.42 < 0.55）
  {
    const base = armedState();
    const fresh = JSON.parse(JSON.stringify(base));
    const old = oldFight(base, 'flee', { monster, random: 0.42 });
    const r = flee(fresh, monster, { random: () => 0.42 });
    assert.deepEqual(r.logs, old.logs);
    assert.deepEqual(fresh, old.state);
  }
  // 逃跑失败（0.9 > 0.55）
  {
    const base = armedState();
    const fresh = JSON.parse(JSON.stringify(base));
    const old = oldFight(base, 'flee', { monster, random: 0.9 });
    const r = flee(fresh, monster, { random: () => 0.9 });
    assert.deepEqual(r.logs, old.logs);
    assert.deepEqual(fresh, old.state);
  }
  // Boss 撤离成功（0.42 < 0.8）
  {
    const base = armedState();
    const fresh = JSON.parse(JSON.stringify(base));
    const old = oldFight(base, 'bossflee', { monster, random: 0.42 });
    const r = bossFlee(fresh, { random: () => 0.42 });
    assert.deepEqual(r.logs, old.logs);
    assert.deepEqual(fresh, old.state);
  }
  // Boss 撤离失败（0.9 > 0.8）→ 重伤
  {
    const base = armedState();
    const fresh = JSON.parse(JSON.stringify(base));
    const old = oldFight(base, 'bossflee', { monster, random: 0.9 });
    const r = bossFlee(fresh, { random: () => 0.9 });
    assert.deepEqual(r.logs, old.logs);
    assert.deepEqual(fresh, old.state);
  }
  // 扔食物成功
  {
    const base = armedState();
    base.res.food = 10;
    const fresh = JSON.parse(JSON.stringify(base));
    const old = oldFight(base, 'bait', { monster, random: 0.42 });
    const r = bait(fresh, monster, { random: () => 0.42 });
    assert.deepEqual(r.logs, old.logs);
    assert.deepEqual(fresh, old.state);
  }
  // 扔食物失败
  {
    const base = armedState();
    base.res.food = 10;
    const fresh = JSON.parse(JSON.stringify(base));
    const old = oldFight(base, 'bait', { monster, random: 0.9 });
    const r = bait(fresh, monster, { random: () => 0.9 });
    assert.deepEqual(r.logs, old.logs);
    assert.deepEqual(fresh, old.state);
  }
  // 没有食物：原实现什么都不做（连日志都没有）
  {
    const base = armedState();
    base.res.food = 0;
    const fresh = JSON.parse(JSON.stringify(base));
    const old = oldFight(base, 'bait', { monster, random: 0.42 });
    const r = bait(fresh, monster, { random: () => 0.42 });
    assert.deepEqual(r.logs, old.logs);
    assert.deepEqual(fresh, old.state);
  }
});

test('伤害公式：武器命中数随强化/技能/锋利提升（与旧实现一致）', () => {
  for (const weapon of ['knife', 'iron', 'steel', 'huntKing', 'runeBlade']) {
    for (const up of [0, 5]) {
      for (const sharp of [0, 3]) {
        const s = createNewState(NOW);
        for (const w of ['knife', 'iron', 'steel', 'huntKing', 'runeBlade']) s.items[w] = false;
        s.items[weapon] = true;
        s.upgrades.weapon = up;
        s.enchant.weapon = sharp;
        s.skills.combat.lvl = 1;
        s.hp = 100;

        const fresh = JSON.parse(JSON.stringify(s));
        const old = oldFight(s, 'fight', { monster: { name: '木桩', hp: 9999, atk: 1, food: 0, leather: 0 }, random: 0.42 });
        const r = fightRound(fresh, { name: '木桩', hp: 9999, atk: 1, food: 0, leather: 0 }, { random: () => 0.42 });

        assert.deepEqual(r.logs, old.logs, `${weapon}/强化${up}/锋利${sharp}`);
        assert.deepEqual(fresh, old.state, `${weapon}/强化${up}/锋利${sharp}：状态不一致`);
      }
    }
  }
});
