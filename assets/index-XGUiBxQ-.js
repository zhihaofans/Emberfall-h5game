var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t,t.exports),e=null),t.exports),s=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},c=(n,r,o)=>(o=n==null?{}:e(i(n)),s(r||!n||!n.__esModule||!a.call(n,`default`)?t(o,`default`,{value:n,enumerable:!0}):o,n));(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var l=[{id:`wood`,name:`🪵木材`,price:1,init:4,from:`🪓 砍柴（森林/行动页）· 🏚 废墟探索翻找 · 🎣 钓鱼垃圾（浮木）`},{id:`stone`,name:`🪨石头`,price:1,init:2,from:`⛏ 采石（行动页）· ⛰ 山丘探索 · 🎣 钓鱼垃圾（河卵石）`},{id:`food`,name:`🍖生食`,price:2,init:2,from:`🎣 钓鱼 · 🪤 捕兽夹（每日）· 🌾 温室（每日）· 🎯 狩猎 · 🗺 探索 · 🎲 幸运方块`},{id:`cooked`,name:`🍗熟食`,price:3,init:0,from:`🔥 烹饪（需火堆，2 生食→3 熟食）· 🍲 自动厨房（Tier5，每日）· 🗺 探索（罐头/蜂蜜）`},{id:`water`,name:`💧生水`,price:1,init:0,from:`💧 河边取水（行动页）`},{id:`clean`,name:`🚰净水`,price:3,init:2,from:`🔥 烧水（需火堆）· ⚗️ 净水器（每日）· ☀️ 太阳能烧水壶（Tier5，每日）· 🎣 钓鱼宝藏（密封水壶）`},{id:`herb`,name:`🌿草药`,price:3,init:2,from:`🌿 森林探索 · 🏚 废墟探索 · 🎣 钓鱼垃圾（水草）· 🛒 流浪商人`},{id:`metal`,name:`🔩金属`,price:5,init:0,from:`🏚 废墟探索 · ⛰ 山丘探索 · 🤖 废墟机器人掉落 · 🎣 钓鱼垃圾（铁钩）/宝藏（铁箱）· 🛒 黑市/流浪商人`},{id:`leather`,name:`👜皮革`,price:8,init:0,from:`🎯 狩猎 · ⚔️ 战斗掉落 · 🏞 河边探索（水獭）· 🛒 黑市`},{id:`alloy`,name:`⚙️合金`,price:10,init:0,from:`⚒ 熔炼（需铁匠炉，2 金属→1 合金）· 🔥 大师炉加成（Tier4）· 🎣 钓鱼宝藏（铁箱）`},{id:`luck`,name:`🎲幸运方块`,price:0,init:0,from:`🎲 黑市购买 · 🗺 探索掉落（3%）· 👹 Boss 战利品 · 🎣 钓鱼宝藏`},{id:`rune`,name:`🔮符石`,price:25,init:0,from:`🏚 废墟/⛰ 山丘/🏜金字塔探索（5%）· 👹 兽王战利品 · 🧟 金字塔木乃伊 · 🎣 钓鱼宝藏 · 🛒 流浪商人（高价）`},{id:`totem`,name:`🪬不死图腾`,price:null,init:0,from:`🎲 幸运方块稀有掉落 · 👹 兽王 40% 掉落 · 🛒 黑市/流浪商人 500 金 · 🤖 机器猫（好感 3 级）`},{id:`copperOre`,name:`🥉铜矿石`,price:2,init:0,from:`⛏ 采矿（45%）· 山丘探索`},{id:`silverOre`,name:`🥈银矿石`,price:4,init:0,from:`⛏ 采矿（15%）· 山丘探索`},{id:`goldOre`,name:`🥇金矿石`,price:8,init:0,from:`⛏ 采矿（3%）· 🏜金字塔探索/事件（黄金密室/沙暴）`},{id:`copper`,name:`🥉铜锭`,price:5,init:0,from:`🔥 炼锭（铁匠炉，铜矿石→铜锭）`},{id:`silver`,name:`🥈银锭`,price:9,init:0,from:`🔥 炼锭（铁匠炉，银矿石→银锭）`},{id:`gold`,name:`🥇金锭`,price:18,init:0,from:`🔥 炼锭（铁匠炉，金矿石→金锭）`},{id:`adrenaline`,name:`💉肾上腺素`,price:null,init:0,from:`👹 兽王 30% 掉落 · 🎲 幸运方块稀有掉落 · 🛒 流浪商人神秘商品（8合金+3符文）`},{id:`expPotion`,name:`📜经验药水`,price:0,init:0,from:`🛒 黑市 300 金 · 🛒 流浪商人 300 金`},{id:`luckyDraw`,name:`🎰抽奖券`,price:0,init:0,from:`🛒 黑市 800 金（×5 则 3500）· 🛒 流浪商人 800 / 1500 金 · 🤖 机器猫（好感 2 级 500 金+合金 5 / 5 级 1800 金+合金 10）`},{id:`lifePotion`,name:`🧪生命药剂`,price:0,init:0,from:`🛒 黑市 200 金 · 🛒 流浪商人 200 金 · 🤖 机器猫（好感 2 级，300 金）；游戏内无制作配方`}];l.map(e=>e.id);function u(){return Object.fromEntries(l.map(e=>[e.id,e.name]))}function d(){return Object.fromEntries(l.filter(e=>e.price!==null).map(e=>[e.id,e.price]))}function f(){return Object.fromEntries(l.map(e=>[e.id,e.from]))}function p(){return Object.fromEntries(l.map(e=>[e.id,e.init]))}var m=`EMBER`;function h(e,t,n){return Math.max(t,Math.min(n,e))}function g(){return{v:11,day:1,hour:8,season:0,weather:0,hp:100,food:100,water:100,stam:100,ill:!1,lightWound:!1,heavyWound:!1,res:p(),items:{axe:!1,knife:!1,fire:!1,puri:!1,rod:!1,trap:!1,bed:!1,kit:!1,iron:!1,ironAxe:!1,steel:!1,farm:!1,tower:!1,forge:!1,huntKing:!1,armorHead:`none`,armorBody:`none`,armorLegs:`none`,armorBoots:`none`,runeBlade:!1,runeArmor:!1,forgeMast:!1,vault:!1,autokitchen:!1,solarBoiler:!1,enchantTbl:!1},upgrades:{weapon:0,axe:0,rod:0,trap:0},enchant:{tblLv:0,weapon:0,armor:0,tool:0},stats:{explore:0,hunt:0,craft:0,kills:0,cook:0,days:1,events:0,fish:0,fishTreas:0,fishBig:0,bossKills:0,bossFirstAt:0,pharaohKills:0,pharaohFirstAt:0,totemSave:0,ores:0,ingots:0,armorsWorn:[],zoneCnt:{},ownedRes:{}},skills:{chop:{lvl:1,xp:0},mine:{lvl:1,xp:0},hunt:{lvl:1,xp:0},fish:{lvl:1,xp:0},explore:{lvl:1,xp:0},cook:{lvl:1,xp:0},combat:{lvl:1,xp:0}},gold:0,lastSeen:0,autoAction:null,adrenalineLeft:0,offToday:{fire:!1,puri:!1,trap:!1},npcDora:{fav:0},bestiary:{},milestones:{},dead:!1,deathReason:``}}function _(e=Date.now()){let t=g();return t.stats.days=0,t.lastSeen=e,t.__v1171_comp=1,t.__v1274_comp=1,t}function ee(e){let t={},n=e.stats&&e.stats.kills||0;[1,2,3,4].forEach((e,r)=>{n>=e&&(t[`beast`+r]=1)});let r=e.stats&&e.stats.zoneCnt||{};(r.forest||0)>=1&&(t[`zone-forest`]=1),(r.river||0)>=1&&(t[`zone-river`]=1),(r.hills||0)>=1&&(t[`zone-hills`]=1),(r.ruins||0)>=1&&(t.rob0=1,(r.ruins||0)>=3&&(t.rob1=1),(r.ruins||0)>=6&&(t.rob2=1)),(r.pyramid||0)>=1&&(t.pyr0=1,(r.pyramid||0)>=3&&(t.pyr1=1),(r.pyramid||0)>=6&&(t.pyr2=1));let i=e.stats&&e.stats.bossKills||0;[1,2,3].forEach((e,n)=>{i>=e&&(t[`boss`+n]=1)});let a=e.stats&&e.stats.pharaohKills||0;return[1,2,3].forEach((e,n)=>{a>=e&&(t[`pharaoh`+n]=1)}),n>=6&&(t[`moon-dog`]=1),n>=10&&(t[`moon-wolf`]=1),t}function te(e,t=Date.now()){let n=g(),r=n.skills,i=e;i&&typeof i==`object`||(i={});for(let e in n)if(!(e in i))i[e]=n[e];else if(e===`res`||e===`items`||e===`stats`||e===`milestones`||e===`skills`){if(typeof i[e]!=`object`||!i[e])i[e]=n[e];else for(let t in n[e])t in i[e]||(i[e][t]=n[e][t])}if(i.skills)for(let e in r)i.skills[e]?(i.skills[e].lvl=Math.max(1,i.skills[e].lvl|0||1),i.skills[e].xp=Math.max(0,i.skills[e].xp|0||0)):i.skills[e]={lvl:1,xp:0};i.stats&&typeof i.stats==`object`||(i.stats={}),i.stats.zoneCnt&&typeof i.stats.zoneCnt==`object`||(i.stats.zoneCnt={}),i.stats.ownedRes&&typeof i.stats.ownedRes==`object`||(i.stats.ownedRes={}),i.npcDora&&typeof i.npcDora==`object`||(i.npcDora={fav:0}),i.bestiary&&typeof i.bestiary==`object`||(i.bestiary={}),i.day=Math.max(1,i.day|0||1),i.hour=((i.hour|0)%24+24)%24,i.season=Math.max(0,i.season|0||0),i.weather=Math.max(0,i.weather|0||0),[`hp`,`food`,`water`,`stam`].forEach(e=>{i[e]=h(i[e]|0||0,0,100)}),typeof i.gold==`number`&&isFinite(i.gold)||(i.gold=0),i.gold=Math.max(0,i.gold|0||0),i.__v1171_comp||(i.__v1171_comp=1,i.res||(i.res={}),i.res.luck=(i.res.luck||0)+100),i.__v1274_comp||(i.__v1274_comp=1,i.res||(i.res={}),i.res.totem=(i.res.totem||0)+1,i.res.luckyDraw=(i.res.luckyDraw||0)+2);let a=Number(i.lastSeen);return i.lastSeen=Number.isFinite(a)&&a>0?a:t,i.autoAction=null,i.dead=!!i.dead,i}function ne(e,t,n=Date.now()){if(t=t|0||1,t<2&&(e.skills={chop:{lvl:1,xp:0},mine:{lvl:1,xp:0},hunt:{lvl:1,xp:0},fish:{lvl:1,xp:0},explore:{lvl:1,xp:0},cook:{lvl:1,xp:0},combat:{lvl:1,xp:0}},e.gold=0,e.lastSeen=n,e.autoAction=null),t<3&&(e.items||={},[`ironAxe`,`steel`,`farm`,`tower`,`forge`].forEach(t=>{t in e.items||(e.items[t]=!1)}),e.offToday={fire:!1,puri:!1,trap:!1}),t<4&&(e.items||={},`huntKing`in e.items||(e.items.huntKing=!1),e.res||={},`alloy`in e.res||(e.res.alloy=0),e.upgrades={weapon:0,axe:0,rod:0,trap:0}),t<5&&(e.items||={},e.res||={},`rune`in e.res||(e.res.rune=0),[`runeBlade`,`runeArmor`,`forgeMast`,`vault`].forEach(t=>{t in e.items||(e.items[t]=!1)})),t<6&&(e.items||={},[`autokitchen`,`solarBoiler`].forEach(t=>{t in e.items||(e.items[t]=!1)})),t<7&&(e.items||={},`enchantTbl`in e.items||(e.items.enchantTbl=!1),e.enchant?(`tblLv`in e.enchant||(e.enchant.tblLv=0),[`weapon`,`armor`,`tool`].forEach(t=>{t in e.enchant||(e.enchant[t]=0)})):e.enchant={tblLv:0,weapon:0,armor:0,tool:0}),t<8&&(e.items||={},`armor`in e.items||(e.items.armor=`none`),e.res||={},[`copperOre`,`silverOre`,`goldOre`,`copper`,`silver`,`gold`].forEach(t=>{t in e.res||(e.res[t]=0)})),t<9){e.items||={};let t=e.items.armor||`none`;[`head`,`body`,`legs`,`boots`].forEach(t=>{let n=`armor`+t[0].toUpperCase()+t.slice(1);n in e.items||(e.items[n]=`none`)}),t!==`none`&&e.items.armorBody===`none`&&(e.items.armorBody=t),delete e.items.armor}return t<10&&(e.res||={},`adrenaline`in e.res||(e.res.adrenaline=0),`adrenalineLeft`in e||(e.adrenalineLeft=0)),t<11&&(e.bestiary=ee(e)),e.v=11,e}function re(e,t){return JSON.stringify({tag:m,fmt:11,ver:t,g:e})}function ie(e,t=Date.now()){if(!e||e.tag!==`EMBER`&&e.tag!==`EMBER1`||!e.g)return null;let n=e.fmt|0||e.v|0||1;return te(ne(e.g,n,t),t)}var v={explore:{name:`探索`,sub:`随机事件`,time:2,stam:18,kind:`explore`,auto:!1,skill:`explore`},chop:{name:`砍柴`,sub:`自动·木材`,time:1,stam:8,kind:`chop`,auto:!0,skill:`chop`,autoLv:3},hunt:{name:`狩猎`,sub:`需石刀`,time:2,stam:20,kind:`hunt`,auto:!0,skill:`hunt`,autoLv:5},fish:{name:`捕鱼`,sub:`需鱼竿`,time:2,stam:16,kind:`fish`,auto:!0,skill:`fish`,autoLv:5},fetch:{name:`取水`,sub:`自动·生水`,time:1,stam:8,kind:`fetch`,auto:!0,skill:`explore`,autoLv:3},smelt:{name:`熔炼`,sub:`需铁匠炉·合金`,time:1,stam:6,kind:`smelt`,auto:!0,skill:`mine`,autoLv:8},mineOre:{name:`采矿`,sub:`自动·石头+矿石`,time:1,stam:8,kind:`mineOre`,auto:!0,skill:`mine`,autoLv:5},smeltOre:{name:`炼锭`,sub:`需铁匠炉·矿→锭`,time:1,stam:5,kind:`smeltOre`,auto:!0,skill:`mine`,autoLv:8},cook:{name:`烹饪`,sub:`需火堆`,time:1,stam:5,kind:`cook`,auto:!0,skill:`cook`,autoLv:5},boil:{name:`烧水`,sub:`需火堆`,time:1,stam:5,kind:`boil`,auto:!0,skill:`cook`,autoLv:5},eat:{name:`进食`,sub:`→饱食`,time:0,stam:0,kind:`eat`,auto:!1},drink:{name:`饮水`,sub:`→水分`,time:0,stam:0,kind:`drink`,auto:!1},sleep:{name:`睡觉`,sub:`8小时`,time:8,stam:0,kind:`sleep`,auto:!1},heal:{name:`治疗`,sub:`用草药`,time:1,stam:6,kind:`heal`,auto:!1}},ae=[`春`,`夏`,`秋`,`冬`],oe=[`晴`,`阴`,`小雨`,`暴雨`,`暴风雪`];function se(e){return Math.floor((e-1)/10)%4}function ce(e,t=Math.random){let n=t();return e===3?n<.45?0:n<.7?1:n<.85?2:n<.95?3:4:n<.5?0:n<.75?1:n<.9?2:4}function le({weather:e,day:t,hasVault:n,adrenaline:r}){if(r)return{food:0,water:0};let i=t>30?1.15:1,a=n?.5:1;return{food:Math.round((e>=3?18:15)*i*a),water:Math.round((e===4?28:20)*i*a)}}function ue(e,t){e.adrenalineLeft>0&&(e.adrenalineLeft=Math.max(0,e.adrenalineLeft-t)),e.hour+=t;let n=0;for(;e.hour>=24;)e.hour-=24,n++;return n}function de(e){let t=[],n=e=>Math.max(0,Math.min(100,e));return(e.adrenalineLeft||0)>0||(e.food<=0&&(e.hp=n(e.hp-6),t.push({text:`你饿得头晕眼花……`,cls:`bad`})),e.water<=0&&(e.hp=n(e.hp-8),t.push({text:`你渴得嘴唇干裂……`,cls:`bad`})),e.ill&&(e.hp=n(e.hp-5)),e.heavyWound?e.hp=n(e.hp-4):e.lightWound&&(e.hp=n(e.hp-2))),e.food<25&&t.push({text:`⚠ 饱食见底，快找吃的！`,cls:`warn`}),e.water<25&&t.push({text:`⚠ 水分见底，快去找水！`,cls:`warn`}),t}var y={axe:{name:`🪓石斧`,desc:`砍柴量 +50%`,cost:{stone:8,wood:5},time:2,need:null,tier:1,needLv:3,skill:`chop`},knife:{name:`🔪石刀`,desc:`狩猎/战斗必需`,cost:{stone:6,wood:4},time:2,need:null,tier:1,needLv:1,skill:`hunt`},fire:{name:`🔥火堆`,desc:`烹饪/烧水/冬季取暖`,cost:{stone:6,wood:10},time:3,need:null,tier:1,needLv:1,skill:`explore`},puri:{name:`⚗️净水器`,desc:`生水自动净化`,cost:{stone:5,wood:8,metal:4},time:3,need:null,tier:1,needLv:3,skill:`mine`},rod:{name:`🎣鱼竿`,desc:`解锁捕鱼`,cost:{wood:10,metal:3},time:2,need:null,tier:1,needLv:1,skill:`fish`},trap:{name:`🪤捕兽夹`,desc:`每天自动获得食物`,cost:{metal:4,wood:5},time:2,need:null,tier:1,needLv:3,skill:`hunt`},bed:{name:`🛏️床铺`,desc:`睡觉更安稳`,cost:{wood:15,leather:6},time:3,need:null,tier:1,needLv:5,skill:`explore`},kit:{name:`💊药箱`,desc:`治疗效果翻倍`,cost:{herb:12,metal:2},time:2,need:null,tier:1,needLv:3,skill:`explore`},iron:{name:`🗡️铁刀`,desc:`强力武器`,cost:{metal:10,wood:4},time:3,need:null,tier:1,needLv:5,skill:`mine`},ironAxe:{name:`🪚铁斧`,desc:`砍柴量再 +100%`,cost:{metal:8,wood:6},time:3,need:`axe`,tier:2},steel:{name:`⚔️钢刀`,desc:`强力武器`,cost:{metal:12,leather:4},time:3,need:`iron`,tier:2},farm:{name:`🌾温室`,desc:`每天自动产粮食`,cost:{wood:15,stone:10,leather:6},time:4,need:`fire`,tier:2},tower:{name:`🗼瞭望塔`,desc:`探索收获 +50%`,cost:{wood:20,stone:15},time:4,need:`axe`,tier:2},forge:{name:`⚒️铁匠炉`,desc:`解锁熔炼/金属+50%`,cost:{stone:12,metal:6},time:3,need:`iron`,tier:2},huntKing:{name:`🔱猎王刀`,desc:`传说武器`,cost:{alloy:8,leather:6},time:4,need:`steel`,tier:3},runeBlade:{name:`🔮符刃`,desc:`终极武器 atk 60`,cost:{alloy:10,metal:10,rune:5},time:5,need:`huntKing`,tier:4},runeArmor:{name:`🛡符甲`,desc:`受击 HP-3 → -1`,cost:{leather:12,metal:8,rune:3},time:4,need:`steel`,tier:4},forgeMast:{name:`🔥大师炉`,desc:`金属/合金产量 +50%`,cost:{stone:20,metal:15,rune:2},time:5,need:`forge`,tier:4},vault:{name:`🏛永恒仓库`,desc:`每日食物/水消耗减半`,cost:{stone:30,wood:40,rune:6},time:6,need:`tower`,tier:4},enchantTbl:{name:`🔮附魔台`,desc:`解锁附魔：锋利/保护/效率`,cost:{metal:15,leather:8,rune:4},time:4,need:`forge`,tier:4},autokitchen:{name:`🍲自动厨房`,desc:`每日自动烹 10 生食→15 熟食`,cost:{metal:25,alloy:12,rune:4},time:6,need:`forge`,tier:5},solarBoiler:{name:`☀️太阳能烧水壶`,desc:`每日自动烧 12 生水→12 净水`,cost:{metal:18,alloy:10,stone:15,rune:3},time:6,need:`forge`,tier:5}},fe=[`chop`,`mine`,`hunt`,`fish`,`explore`,`cook`,`combat`],pe={chop:`砍伐`,mine:`采掘`,hunt:`狩猎`,fish:`渔猎`,explore:`探索`,cook:`烹饪`,combat:`战斗`},me={chop:`每级 砍柴产量 +8%`,mine:`每级 采石产量 +5%`,hunt:`每级 狩猎成功率 +4%`,fish:`每级 捕鱼成功率 +1.2%`,explore:`每级 探索收获 +8%`,cook:`每级 烹饪产出 +10%`,combat:`每级 武器伤害 +5%`};function he(e){return Math.round(8*e*e+12*e)}var b={weapon:{name:`强化武器`,desc:`每级 武器伤害 +10%`,base:{metal:4,leather:1},need:`steel`,max:15},axe:{name:`强化斧头`,desc:`每级 砍柴产量 +10%`,base:{metal:2,wood:2},need:`ironAxe`,max:15},rod:{name:`强化鱼竿`,desc:`每级 捕鱼成功率 +6%`,base:{metal:1},need:`rod`,max:15},trap:{name:`强化捕兽夹`,desc:`每级 捕兽夹产量 +15%`,base:{metal:1},need:`trap`,max:15}};function ge(e,t){let n=b[e];if(!n)return{};let r={};for(let e in n.base)r[e]=Math.round(n.base[e]*(t+1));return t>=10&&(r.rune=t-9,r.alloy=Math.round((t-9)*1.5)),r}var x=[`leather`,`copper`,`iron`,`silver`,`gold`,`steel`],S={leather:{name:`🦺皮`,dmg:.97,cost:{leather:6}},copper:{name:`🥉铜`,dmg:.95,cost:{copper:4,leather:1}},iron:{name:`🛡铁`,dmg:.92,cost:{metal:5,leather:1}},silver:{name:`🥈银`,dmg:.9,cost:{silver:4,leather:1}},gold:{name:`🥇金`,dmg:.88,cost:{gold:4,leather:1}},steel:{name:`⚙️钢`,dmg:.85,cost:{alloy:5,leather:1}}},C={head:{name:`头盔`},body:{name:`胸甲`},legs:{name:`裤子`},boots:{name:`靴子`}};function _e(e){return`armor`+e[0].toUpperCase()+e.slice(1)}var w={weapon:{name:`🗡 锋利`,desc:`武器伤害 +10%/级`,base:{rune:2,alloy:2},perLevel:.1},armor:{name:`🛡 保护`,desc:`受击伤害 -8%/级`,base:{rune:2,leather:3},perLevel:.08},tool:{name:`⚒ 效率`,desc:`采集产量 +8%/级`,base:{rune:2,metal:3},perLevel:.08}};function ve(e,t){let n={},r=w[e].base;for(let e in r)n[e]=r[e]*(t+1);return n}function ye(e){return{stone:4*(e+1),metal:2*(e+1),rune:e+1}}function T(e,t,n){t in e.res||(e.res[t]=0),e.res[t]+=n,n>0&&e.stats&&(e.stats.ownedRes||(e.stats.ownedRes={}),e.stats.ownedRes[t]=1)}function E(e,t,n){return(e.res[t]||0)>=n&&(e.res[t]-=n,!0)}function D(e,t){return!!e.items[t]}function O(e,t){return e.skills&&e.skills[t]&&e.skills[t].lvl||1}function k(e,t){for(let n in t)if((e.res[n]||0)<t[n])return!1;return!0}function be(e,t){return e.items[_e(t)]||`none`}function xe(e){let t=1;for(let n in C){let r=S[be(e,n)];r&&(t*=r.dmg)}let n=e.items.runeArmor?1/3:1,r=1-(e.enchant&&e.enchant.armor||0)*.08;return Math.max(.1,t*n*r)}function Se(e,t){let n=e.stats&&e.stats.ownedRes||{};for(let r in t)if((e.res[r]||0)>=1||n[r])return!0;return!1}function Ce(e,t){let n=y[t];return!n||!n.cost||Se(e,n.cost)}function we(e,t){if(!C[t])return null;let n=be(e,t),r=x.indexOf(n);return n===`none`||r<0?x[0]||null:r<x.length-1?x[r+1]:null}function Te(e,t){let n=S[t];return!n||!n.cost?!1:Se(e,n.cost)}function Ee(e,t){let n=[],r=y[t];if(!r)return{logs:n};if(e.items[t])return{logs:n,refused:`已经制作过了`};if(r.need&&!e.items[r.need])return{logs:n,refused:`需要先制作`+y[r.need].name};if(r.needLv&&r.skill&&O(e,r.skill)<r.needLv){let t=O(e,r.skill);return{logs:n,refused:`需要 ${pe[r.skill]||r.skill} Lv.${r.needLv} 才能制作（当前 Lv.${t}）`}}if(!k(e,r.cost))return{logs:n,refused:`材料不足`};for(let t in r.cost)E(e,t,r.cost[t]);e.items[t]=!0,e.stats.craft++,n.push({text:`🔨 制作完成：${r.name}！${r.desc}`,cls:`good`}),t===`fire`&&n.push({text:`你点燃了火堆，这是夜晚的温暖与安全。`,cls:`info`}),t===`ironAxe`&&n.push({text:`铁斧在手，砍树如切豆腐。`,cls:`info`}),t===`steel`&&n.push({text:`钢刀寒光凛冽，野兽见了绕道走。`,cls:`info`});let i=[`craft1`,`stage`];return Object.keys(y).every(t=>e.items[t])&&i.push(`allcraft`),{logs:n,achievements:i,time:r.time}}function De(e,t){let n=[],r=b[t];if(!r)return{logs:n};if(r.need&&!e.items[r.need])return{logs:n,refused:`需要先制作`+y[r.need].name};let i=e.upgrades[t]||0,a=r.max||10;if(i>=a)return{logs:n,refused:`已达最高强化等级（Lv.`+a+`）`};let o=ge(t,i);if(!k(e,o))return{logs:n,refused:`材料不足`};for(let t in o)E(e,t,o[t]);e.upgrades[t]=i+1,e.stats.craft++;let s=u(),c=Object.keys(o).map(e=>s[e]+`×`+o[e]).join(` `);return n.push({text:`⬆ ${r.name} → Lv.${i+1}/${a}！${r.desc}（耗 ${c}）`,cls:`good`}),{logs:n,achievements:[`up1`,`stage`],time:2}}function Oe(e,t,n){let r=[],i=_e(t),a=x.indexOf(n);if(a<0||!C[t])return{logs:r};let o=be(e,t);if(o===n)return{logs:r,refused:`已经装备`+S[n].name+C[t].name};if(a>0){let e=x[a-1];if(o!==e)return{logs:r,refused:`升级链：需先装备${S[e].name}${C[t].name}`}}let s=S[n].cost;if(!k(e,s))return{logs:r,refused:`材料不足`};for(let t in s)E(e,t,s[t]);e.items[i]=n,e.stats.craft++,e.stats.armorsWorn||(e.stats.armorsWorn=[]);let c=t+`:`+n;e.stats.armorsWorn.includes(c)||e.stats.armorsWorn.push(c);let l=Object.keys(C).every(t=>be(e,t)===n);return r.push({text:`🛡 你穿上了${S[n].name}${C[t].name}${l?`（套装达成！）`:``}。`,cls:`good`}),{logs:r,achievements:[`armor1`,`armorSet`]}}function ke(e,t){let n=[];if(!e.items.enchantTbl)return{logs:n,refused:`需要先制作🔮附魔台`};let r=e.enchant[t]||0;if(r>=(e.enchant.tblLv||0))return{logs:n,refused:`附魔台等级不足，请先升级附魔台`};let i=ve(t,r);if(!k(e,i))return{logs:n,refused:`材料不足`};for(let t in i)E(e,t,i[t]);return e.enchant[t]=r+1,e.stats.craft++,n.push({text:`✨ ${w[t].name} 附魔提升到 Lv.${r+1}！${w[t].desc}`,cls:`good`}),{logs:n,time:1}}function Ae(e){let t=[];if(!e.items.enchantTbl)return{logs:t,refused:`需要先制作🔮附魔台`};let n=e.enchant.tblLv||0;if(n>=5)return{logs:t,refused:`附魔台已满级`};let r=ye(n);if(!k(e,r))return{logs:t,refused:`材料不足`};for(let t in r)E(e,t,r[t]);return e.enchant.tblLv=n+1,t.push({text:`🔮 附魔台升级到 Lv.${n+1}/5！现在可附魔至 ${n+1} 级。`,cls:`good`}),{logs:t,time:2}}var je=[{w:3,txt:`🪙 钓上一个沉甸甸的钱袋！`,effects:[{op:`gold`,n:{rnd:[20,45]},log:`💰 金币 +{n}。`,cls:`good`}]},{w:2,txt:`📦 捞出个生锈铁箱！`,effects:[{op:`res`,res:`metal`,n:{rnd:[4,7]}},{op:`res`,res:`alloy`,n:{rnd:[1,3]}},{op:`log`,text:`🔩金属+4~7 ⚙️合金+1~3`,cls:`good`}]},{w:1,txt:`🎲 一个湿漉漉的幸运方块！`,effects:[{op:`res`,res:`luck`,n:1},{op:`log`,text:`{res:luck} ×1`,cls:`good`}]},{w:1,txt:`🔮 符石！居然被鱼叼着！`,ach:`rune`,effects:[{op:`res`,res:`rune`,n:1},{op:`log`,text:`{res:rune} ×1`,cls:`good`}]},{w:2,txt:`🚰 密封水壶完好无损！`,effects:[{op:`res`,res:`clean`,n:{rnd:[6,10]}},{op:`log`,text:`{res:clean}+6~10`,cls:`good`}]},{w:1,txt:`📜 湿透的图纸……还能看懂！`,ach:`blueprint`,effects:[{op:`learnRecipe`}]}],Me=[{w:3,txt:`🥾 一只破皮靴，也许是上个时代的。`,effects:[{op:`res`,res:`leather`,n:1},{op:`log`,text:`{res:leather} ×1`,cls:`info`}]},{w:3,txt:`🪨 河卵石，至少有点分量。`,effects:[{op:`res`,res:`stone`,n:{rnd:[2,4]}},{op:`log`,text:`{res:stone}+2~4`,cls:`info`}]},{w:3,txt:`🪵 漂在水里的浮木。`,effects:[{op:`res`,res:`wood`,n:{rnd:[2,4]}},{op:`log`,text:`{res:wood}+2~4`,cls:`info`}]},{w:2,txt:`🦴 鱼骨，勉强能啃一啃。`,effects:[{op:`res`,res:`food`,n:{rnd:[1,3]}},{op:`log`,text:`{res:food}+1~3`,cls:`info`}]},{w:2,txt:`🔩 生锈的铁钩子。`,effects:[{op:`res`,res:`metal`,n:1},{op:`log`,text:`{res:metal} ×1`,cls:`info`}]},{w:1,txt:`🌿 一团水草，泡得发烂。`,effects:[{op:`res`,res:`herb`,n:1},{op:`log`,text:`{res:herb} ×1`,cls:`info`}]},{w:2,txt:`🧴 空瓶子，瓶塞还带着霉味。`,effects:[]}];function Ne(e){let t=u();return String(e).replace(/\{res:([A-Za-z_][A-Za-z0-9_]*)\}/g,(e,n)=>t[n]??e)}function A(e,t,n={}){let r=n.random??Math.random,i=n.combat??[],a=n.achievements??[],o=n.rnd??((e,t)=>Math.floor(r()*(t-e+1))+e),s=[],c,l=(e,t=void 0)=>String(e).replace(/\{res:([A-Za-z_][A-Za-z0-9_]*)\}/g,(e,t)=>u()[t]??t).replace(/\{n\}/g,String(t??``)),d=e=>e&&typeof e==`object`&&Array.isArray(e.rnd)?o(e.rnd[0],e.rnd[1]):Number(e)||0;for(let f of t){switch(f.op){case`res`:{let t=String(f.res);c=d(f.n),T(e,t,c);break}case`gold`:c=d(f.n),e.gold=Math.max(0,(e.gold||0)+c);break;case`learnRecipe`:{let t=Object.keys(y).filter(t=>!e.items[t]);if(t.length){let n=t[Math.floor(r()*t.length)];e.items[n]=!0;let i=f.log||`你学会了 {name} 的制作方法！`;s.push({text:String(i).replace(`{name}`,y[n].name),cls:`good`})}else s.push({text:f.failText||`图纸已经看不清了。`,cls:`warn`});break}case`set`:e[String(f.field)]=f.value;break;case`delta`:{let t=String(f.field),n=(Number(e[t])||0)+(Number(f.n)||0);f.min!==void 0&&(n=Math.max(f.min,n)),f.max!==void 0&&(n=Math.min(f.max,n)),e[t]=n;break}case`steal`:{let[t,n]=f.n2??[3,8],i=Object.keys(e.res).filter(t=>e.res[t]>0&&t!==`luck`);if(i.length){let a=i[Math.floor(r()*i.length)],c=Math.min(e.res[a],o(t,n));e.res[a]-=c,s.push({text:`💥 你的 ${u()[a]??a} 丢了 ×${c}！`,cls:`bad`})}else s.push({text:`💥 好像什么都没发生……`,cls:`bad`});break}case`random`:{let t=f.branches||[],i=[];for(let e of t)for(let t=0;t<(e.w||1);t++)i.push(e);let a=i[Math.floor(r()*i.length)];a&&s.push(...A(e,a.effects||[],n));break}case`branch`:{let t=f.if||{},r=Number(e[String(t.field)])||0,i=!0;t.gte!==void 0&&(i&&=r>=t.gte),t.lte!==void 0&&(i&&=r<=t.lte),s.push(...A(e,(i?f.then:f.else)||[],n));break}case`combat`:i.push({night:!!f.night,forceBeasts:!!f.beasts});break;case`achievement`:a.push(String(f.id));break;case`log`:s.push({text:l(String(f.text)),cls:f.cls||`sys`});break;default:throw Error(`未知的效果指令: ${f.op}`)}f.log&&f.op!==`learnRecipe`&&s.push({text:l(f.log,c),cls:f.cls||`sys`})}return s}function Pe(e,t){let n=v[t];if(!n||e.dead)return{ok:!1,reason:``,stopAuto:!1};let r=(e,t=!0)=>({ok:!1,reason:e,stopAuto:t});return t===`hunt`&&!e.items.knife&&!e.items.iron&&!e.items.steel&&!e.items.huntKing?r(`需要先制作石刀/铁刀/钢刀`):t===`fish`&&!e.items.rod?r(`需要先制作鱼竿`):t===`smelt`&&!e.items.forge||t===`smeltOre`&&!e.items.forge?r(`需要先制作铁匠炉`):(t===`cook`||t===`boil`)&&(!e.items.fire||e.offToday.fire)?r(e.offToday.fire?`火堆今天停摆了，需要木材维护`:`需要先制作火堆`):t===`cook`&&(e.res.food||0)<=0?r(`没有生食可以烹饪`):t===`boil`&&(e.res.water||0)<=0?r(`没有生水可以烧`):t===`smelt`&&(e.res.metal||0)<=0?r(`没有金属可以熔炼`):t===`smelt`&&(e.res.stone||0)<2?r(`石头不够熔炼（至少需要 2）`):t===`smeltOre`&&!e.res.goldOre&&!e.res.silverOre&&!e.res.copperOre?r(`没有矿石可冶炼（采矿可得铜/银/金矿石）`):t===`heal`&&e.hp>=100?{ok:!1,reason:`生命值已满，无需治疗`,stopAuto:!1}:t===`heal`&&(e.res.herb||0)<=0?{ok:!1,reason:`没有草药`,stopAuto:!1}:n.stam>0&&e.stam<n.stam?r(`精力不足，先睡一觉吧`):n.time>0&&e.hour+n.time>24&&(e.food<12||e.water<15)?r(`天色已晚且你饥渴难耐，先吃饭喝水`):{ok:!0}}function Fe(e,t,n={}){let r=v[t];!r||r.stam<=0||n.adrenaline||(e.stam=Math.max(0,Math.min(100,e.stam-r.stam)))}function Ie(e){let t=v[e];return t?!t.auto&&e!==`eat`&&e!==`drink`:!1}function j(e={}){let t=e.random??Math.random;return{random:t,rnd:e.rnd??((e,n)=>Math.floor(t()*(n-e+1))+e)}}function Le(e,t){let{random:n,rnd:r}=j(t),i=[];if(e.food>=100)return{logs:i,refused:`你已经吃饱了`};let a=0,o=``,s=0;if(e.res.cooked>0?(a=Math.min(e.res.cooked,r(1,2)),e.res.cooked-=a,o=`熟食`):e.res.food>0&&(a=Math.min(e.res.food,r(1,2)),e.res.food-=a,o=`生食`,s=.15),a<=0)return{logs:i,refused:`没有食物可吃`};let c=o===`熟食`?16*a:9*a;return e.food=Math.max(0,Math.min(100,e.food+c)),i.push({text:`你吃下 ${o} ×${a}，饱食 +${c}。`,cls:`good`}),s&&n()<s&&(e.ill=!0,i.push({text:`生食让你闹肚子……感染了疾病！`,cls:`bad`})),{logs:i}}function Re(e,t){let{random:n,rnd:r}=j(t),i=[];if(e.water>=100)return{logs:i,refused:`你已经喝足了`};let a=0,o=``,s=0;if(e.res.clean>0?(a=Math.min(e.res.clean,r(1,2)),e.res.clean-=a,o=`净水`):e.res.water>0&&(a=Math.min(e.res.water,r(1,2)),e.res.water-=a,o=`生水`,s=.18),a<=0)return{logs:i,refused:`没有水可喝`};let c=o===`净水`?14*a:8*a;return e.water=Math.max(0,Math.min(100,e.water+c)),i.push({text:`你喝下 ${o} ×${a}，水分 +${c}。`,cls:`good`}),s&&n()<s&&(e.ill=!0,i.push({text:`生水让你腹痛如绞……感染了疾病！`,cls:`bad`})),{logs:i}}function ze(e){let t=[],n=!0,r=!0;e.res.cooked>0?(--e.res.cooked,t.push({text:`你吃了点熟食垫肚子。`,cls:`good`})):e.res.food>0?(e.res.food-=2,t.push({text:`你啃了点生食。`,cls:`warn`})):n=!1,e.res.clean>0?(--e.res.clean,t.push({text:`你喝了口水。`,cls:`good`})):e.res.water>0?(e.res.water-=2,t.push({text:`你灌了点生水。`,cls:`warn`})):r=!1,!n||!r?(t.push({text:`你饿着肚子/口干舌燥，睡不安稳……`,cls:`warn`}),e.stam=Math.max(0,Math.min(100,e.stam+60))):e.stam=100;let i=e.items.bed?10:5;return e.hp=Math.max(0,Math.min(100,e.hp+i)),t.push({text:`你睡了 8 小时，精力恢复，生命 +${i}。`,cls:`good`}),e.items.bed&&t.push({text:`床铺让你睡得更安稳。`,cls:`good`}),{logs:t}}function Be(e,t,n=e=>e){let{rnd:r}=j(t),i=[];if(e.hp>=100)return{logs:i,refused:`生命值已满，无需治疗`};let a=Math.min(e.res.herb||0,r(2,4));if(a<=0)return{logs:i,refused:`没有草药`};e.res.herb-=a;let o=e.items.kit?2:1,s=8*a*o;return e.hp=Math.max(0,Math.min(100,e.hp+s)),e.ill&&(e.ill=!1,i.push({text:`你服下草药，病痛渐渐消退。`,cls:`good`})),e.heavyWound?(e.heavyWound=!1,e.lightWound=!0,i.push({text:`重伤转为轻伤。`,cls:`good`})):e.lightWound&&(e.lightWound=!1,i.push({text:`伤口愈合了。`,cls:`good`})),i.push({text:`用${n(`herb`)} ×${a} 治疗，生命 +${s}。`,cls:`good`}),{logs:i}}function Ve(e,t,n=e=>e){let{random:r,rnd:i}=j(t),a=[],o=i(5,8);return T(e,`water`,o),a.push({text:`获得${n(`water`)} ×${o}（生水可能让你生病，建议烧开）。`,cls:`good`}),D(e,`puri`)?a.push({text:`净水器自动净化了生水。`,cls:`good`}):r()<.22&&(e.ill=!0,a.push({text:`你喝了生水，腹痛如绞……感染了疾病！`,cls:`bad`})),{logs:a}}function He(e,t,n=e=>e){let{rnd:r}=j(t),i=[],a=O(e,`cook`),o=Math.min(e.res.food||0,r(2,5));if(o<=0)return i.push({text:`没有生食可以烹饪。`,cls:`warn`}),{logs:i};E(e,`food`,o);let s=Math.round(o*1.5*(1+a*.1));return T(e,`cooked`,s),i.push({text:`烹饪完成：${n(`food`)} ×${o} → ${n(`cooked`)} ×${s}（更顶饱）。`,cls:`good`}),e.stats.cook++,{logs:i}}function Ue(e,t,n=e=>e){let{rnd:r}=j(t),i=[],a=Math.min(e.res.water||0,r(3,6));return a<=0?(i.push({text:`没有生水可以烧。`,cls:`warn`}),{logs:i}):(E(e,`water`,a),T(e,`clean`,a),i.push({text:`烧开${n(`water`)} ×${a}，得到${n(`clean`)} ×${a}。`,cls:`good`}),{logs:i})}function We(e,t,n=e=>e){let{rnd:r}=j(t),i=[],a=O(e,`chop`),o=1+(e.upgrades.axe||0)*.1,s=1+(e.enchant&&e.enchant.tool||0)*.08,c=e.items.ironAxe?8:e.items.axe?5:3,l=e.items.ironAxe?6:e.items.axe?4:2,u=Math.round(r(c,c+l)*(1+a*.08)*o*s);return T(e,`wood`,u),i.push({text:`获得${n(`wood`)} ×${u}。`,cls:`good`}),{logs:i}}function Ge(e,t,n=e=>e){let{random:r,rnd:i}=j(t),a=[],o=O(e,`hunt`),s=e.items.iron?1.8:e.items.knife?1.3:.8;if(r()<.55*s*(1+o*.04)){let t=i(6,12);T(e,`food`,t),a.push({text:`狩猎成功！获得${n(`food`)} ×${t}。`,cls:`good`}),e.stats.hunt++}else a.push({text:`猎物跑掉了，白忙一场。`,cls:`warn`}),r()<.3&&(e.hp=Math.max(0,Math.min(100,e.hp-8)),a.push({text:`追赶时扭伤了脚踝。`,cls:`bad`}));return{logs:a}}function Ke(e,t,n=e=>e){let{rnd:r}=j(t),i=[],a=Math.min(e.res.metal||0,r(1,2));if(a<=0)return i.push({text:`没有金属可以熔炼。`,cls:`warn`}),{logs:i};let o=a*2;return(e.res.stone||0)<o?(i.push({text:`石头不够熔炼（需要 ${o}）。`,cls:`warn`}),{logs:i}):(E(e,`metal`,a),E(e,`stone`,o),T(e,`alloy`,a),i.push({text:`铁匠炉熔炼出${n(`alloy`)} ×${a}（${n(`metal`)} ${a} + ${n(`stone`)} ${o}）。`,cls:`good`}),{logs:i})}function qe(e,t,n=e=>e){let{random:r,rnd:i}=j(t),a=[],o=[],s=O(e,`mine`),c=1+(e.enchant&&e.enchant.tool||0)*.08,l=Math.round(i(1,2)*(1+s*.05)*c);T(e,`stone`,l);let u=[`${n(`stone`)} ×${l}`],d=r();return d<.03?(T(e,`goldOre`,1),u.push(`${n(`goldOre`)} ×1`),o.push(`oreGold`)):d<.15?(T(e,`silverOre`,1),u.push(`${n(`silverOre`)} ×1`),o.push(`oreSilver`)):d<.45&&(T(e,`copperOre`,1),u.push(`${n(`copperOre`)} ×1`),o.push(`oreCopper`)),e.stats.ores=(e.stats.ores||0)+1,a.push({text:`⛏ 挖到 ${u.join(`、`)}。`,cls:`good`}),{logs:a,achievements:o}}function Je(e,t=e=>e){let n=[],r=[];if(!e.items.forge)return n.push({text:`需要先制作铁匠炉。`,cls:`warn`}),{logs:n,achievements:r};for(let[i,a]of[[`goldOre`,`gold`],[`silverOre`,`silver`],[`copperOre`,`copper`]])if((e.res[i]||0)>0)return E(e,i,1),T(e,a,1),e.stats.ingots=(e.stats.ingots||0)+1,r.push(`smelt1`),(e.res.gold||0)>=1&&(e.res.silver||0)>=1&&(e.res.copper||0)>=1&&r.push(`ingotAll`),n.push({text:`🔥 ${t(i)} ×1 炼成了 ${t(a)} ×1。`,cls:`good`}),{logs:n,achievements:r};return n.push({text:`没有可冶炼的矿石（采矿可得铜/银/金矿石）。`,cls:`warn`}),{logs:n,achievements:r}}function Ye(e,t={}){let{random:n,rnd:r}=j(t),i=[],a=[],o=[],s=O(e,`fish`),c=e.upgrades.rod||0;if(n()>=.7+s*.012+c*.06)return i.push({text:`水面平静，鱼不咬钩。`,cls:`warn`}),{logs:i,achievements:a,xp:o};let l=e=>{let t=[];return e.forEach(e=>{for(let n=0;n<e.w;n++)t.push(e)}),t[Math.floor(n()*t.length)]};if(n()<.035)return e.stats.fish=(e.stats.fish||0)+1,o.push({skill:`fish`,n:r(8,15)}),i.push({text:`🎣 鱼线猛地绷紧——你钓上来一只张牙舞爪的怪物！`,cls:`bad`}),{logs:i,achievements:a,xp:o,combat:!0};let d=Math.max(.1,.42-s*.003-c*.01),f=Math.min(.32,.13+s*.002+c*.012),p=n();if(p<f){e.stats.fishTreas=(e.stats.fishTreas||0)+1,o.push({skill:`fish`,n:r(10,18)});let t=l(je);i.push({text:t.txt,cls:`good`}),i.push(...A(e,t.effects,{random:n,rnd:r})),t.ach&&a.push(`fish:${t.ach}`),a.push(`fish:treasure`)}else if(p<d+f){let t=l(Me);if(i.push({text:t.txt,cls:`info`}),i.push(...A(e,t.effects,{random:n,rnd:r})),n()<.1){let t=r(1,5);e.gold+=t,i.push({text:`💰 垃圾里翻出 ${t} 枚硬币。`,cls:`good`})}}else{if(e.stats.fish=(e.stats.fish||0)+1,o.push({skill:`fish`,n:r(6,12)}),n()<.12){e.stats.fishBig=(e.stats.fishBig||0)+1,o.push({skill:`fish`,n:r(15,25)});let t=r(12,18);T(e,`food`,t),i.push({text:`🐟 上钩一条罕见的大鱼！${u().food} ×${t}。`,cls:`good`}),a.push(`fish:big`)}else{let t=r(5,11);T(e,`food`,t),i.push({text:`🐟 钓上一条鱼！${u().food} ×${t}。`,cls:`good`})}if(n()<.15){let t=r(1,8);e.gold+=t,i.push({text:`💰 鱼嘴里叼着一枚硬币！金币 +${t}。`,cls:`good`})}a.push(`fish:`)}return{logs:i,achievements:a,xp:o}}function Xe(e,t){let n=v[t];return!n||!n.auto?{ok:!1,logs:[]}:(e.autoAction=t,{ok:!0,logs:[{text:`⏳ 开始自动${n.name}（可随时切换或停止）`,cls:`sys`}]})}function Ze(e,t=!1){let n=[];return e.autoAction&&(e.autoAction=null,t||n.push({text:`⏹ 停止自动行动。`,cls:`sys`})),{logs:n}}function Qe(e,t={}){let n=!!t.blocked;if(e.dead)return Ze(e,!0),{action:null,stopped:!0};if(n||!e.autoAction)return{action:null};let r=v[e.autoAction];return!r||!r.auto?(e.autoAction=null,{action:null,cleared:!0}):{action:e.autoAction}}var M={forest:{name:`🌲森林`,desc:`树木与野物`,res:[[`wood`,3,6],[`herb`,0,3],[`food`,0,3]],danger:.18,color:`#4a6b48`,bg:`#1a2418`,ach:[`for1`,`for10`,`for50`],unlockDay:1},ruins:{name:`🏚废墟`,desc:`旧世界的残骸`,res:[[`metal`,0,3],[`food`,0,2],[`herb`,0,2]],danger:.22,color:`#a07040`,bg:`#2a1e10`,ach:[`rui1`,`rui10`,`rui50`],unlockDay:7},river:{name:`🏞河边`,desc:`水源与鱼群`,res:[[`water`,4,7],[`food`,0,4]],danger:.12,color:`#5a8aaa`,bg:`#0f1f2a`,ach:[`riv1`,`riv10`,`riv50`],unlockDay:3},hills:{name:`⛰山丘`,desc:`石头与野兽`,res:[[`stone`,2,5],[`metal`,0,2]],danger:.26,color:`#9a7ac0`,bg:`#1f1828`,ach:[`hil1`,`hil10`,`hil50`],unlockDay:15},pyramid:{name:`🏜沙漠金字塔`,desc:`法老沉眠之地`,res:[[`stone`,1,4],[`goldOre`,0,2],[`rune`,0,1]],danger:.3,color:`#c8a84a`,bg:`#2a2010`,ach:[`pyr1`,`pyr10`,`pyr50`],unlockDay:25}},$e=[{id:`camp`,w:3,title:`废弃营地`,text:`你在一处被遗弃的营地里翻找。`,opts:[{label:`翻找食物`,d:`获得{res:food} ×4~8`,effects:[{op:`res`,res:`food`,n:{rnd:[4,8]}}]},{label:`搜集金属`,d:`获得{res:metal} ×2~4`,effects:[{op:`res`,res:`metal`,n:{rnd:[2,4]}}]}]},{id:`herbg`,w:3,title:`药草丛`,text:`一片野生药草在风中摇曳。`,opts:[{label:`采集`,d:`获得{res:herb} ×4~7`,effects:[{op:`res`,res:`herb`,n:{rnd:[4,7]}}]}]},{id:`can`,w:3,title:`生锈罐头`,text:`土里埋着半罐还能吃的罐头。`,opts:[{label:`收下`,d:`获得{res:food} ×3`,effects:[{op:`res`,res:`food`,n:3}]}]},{id:`box`,w:3,title:`工具箱`,text:`发现一个旧工具箱。`,opts:[{label:`撬开`,d:`获得{res:metal} ×3~5`,effects:[{op:`res`,res:`metal`,n:{rnd:[3,5]}}]}]},{id:`spring`,w:3,title:`山泉`,text:`一泓清泉从岩缝涌出。`,opts:[{label:`痛饮一顿`,d:`水分 +25`,effects:[{op:`delta`,field:`water`,n:25,max:100}]}]},{id:`lost`,w:3,title:`迷路`,text:`浓雾遮住了来路，你转了许久才找回方向。`,opts:[]},{id:`trap`,w:2,title:`捕兽夹`,text:`杂草丛中藏着一个生锈的捕兽夹！`,opts:[{label:`设法挣脱`,d:`生命 -10`,effects:[{op:`delta`,field:`hp`,n:-10,min:1,max:100},{op:`log`,text:`你被夹伤，流血不止。`,cls:`bad`}]}]},{id:`merchant`,w:2,title:`流浪商人`,kind:`merchant`,text:`一个兜帽人推着破车出现：「换点物资吗？我这有 4 样货，包你满意。」`,opts:[]},{id:`surv`,w:2,title:`落难者`,text:`一个满脸尘土的人向你讨要食物。`,opts:[{label:`分他一些 (生食-3)`,d:`他感激地给了你一卷皮革`,require:{food:3},requireFail:`你拿不出食物。`,effects:[{op:`res`,res:`food`,n:-3},{op:`res`,res:`leather`,n:2},{op:`log`,text:`落难者塞给你一张鞣过的皮革。`,cls:`good`}]},{label:`摇头走开`,d:`他失望地离开了`,effects:[]}]},{id:`tomb`,zone:`pyramid`,w:2,title:`法老墓室`,text:`你推开一扇尘封的石门，一具石棺静立在昏暗的墓室中央。`,opts:[{label:`开棺！`,d:`宝藏/木乃伊/诅咒`,run:`tombOpen`,effects:[]},{label:`合上石门离开`,d:`不打扰沉眠者`,effects:[]}]},{id:`carrion`,zone:`pyramid`,w:2,title:`食尸虫群`,text:`沙地里突然涌出一群黑压压的食尸虫，沙沙作响地爬向你！`,opts:[{label:`迎战！`,d:`与虫群战斗`,effects:[{op:`combat`}]},{label:`快跑！`,d:`精力 -10，有风险`,effects:[{op:`branch`,if:{field:`stam`,gte:10},then:[{op:`delta`,field:`stam`,n:-10,min:0,max:100},{op:`log`,text:`你连滚带爬逃出了虫群的包围。`,cls:`info`}],else:[{op:`delta`,field:`hp`,n:-10,min:0,max:100},{op:`log`,text:`你精疲力尽，被虫群啃了几口！`,cls:`bad`}]}]}]},{id:`sandstorm`,zone:`pyramid`,w:2,title:`沙暴`,text:`金字塔周围刮起漫天沙暴，黄沙遮天蔽日。`,opts:[{label:`就地躲避`,d:`精力 -15`,effects:[{op:`delta`,field:`stam`,n:-15,min:0,max:100},{op:`log`,text:`沙暴过后你灰头土脸，精力 -15。`,cls:`info`}]},{label:`顶着风走`,d:`可能捡到金矿`,effects:[{op:`random`,branches:[{w:1,effects:[{op:`res`,res:`goldOre`,n:{rnd:[1,3]},log:`风沙过后，脚边竟躺着几块{res:goldOre} ×{n}！`,cls:`good`}]},{w:1,effects:[{op:`delta`,field:`hp`,n:-8,min:0,max:100},{op:`log`,text:`沙粒打得你生疼，生命 -8。`,cls:`bad`}]}]}]}]},{id:`goldroom`,zone:`pyramid`,w:1,title:`黄金密室`,text:`你在金字塔深处发现一间堆满黄金饰品的密室，金光照亮了你的脸。`,opts:[{label:`搜刮！`,d:`金矿石+金币`,run:`goldroomLoot`,effects:[]},{label:`只取一点就走`,d:`安全但少拿`,effects:[{op:`achievement`,id:`goldroom1`},{op:`res`,res:`goldOre`,n:{rnd:[1,2]},log:`你谨慎地取走{res:goldOre} ×{n}。`,cls:`info`}]}]},{id:`mummycurse`,zone:`pyramid`,w:1,title:`法老的诅咒`,text:`墙上刻着一行古文字：「打扰法老者，永受诅咒。」`,opts:[{label:`无视它`,d:`可能遭报应`,effects:[{op:`random`,branches:[{w:1,effects:[{op:`set`,field:`ill`,value:!0},{op:`log`,text:`☠️ 当晚你噩梦连连，染上了怪病！`,cls:`bad`}]},{w:1,effects:[{op:`log`,text:`什么都没有发生。`,cls:`info`}]}]}]},{label:`献上祭品 (生食-3)`,d:`求得庇佑`,require:{food:3},requireFail:`你拿不出祭品。`,effects:[{op:`res`,res:`food`,n:-3},{op:`log`,text:`你献上食物，感觉墓室的阴气淡了几分。`,cls:`good`}]}]},{id:`mushroom`,zone:`forest`,w:3,title:`蘑菇圈`,text:`一圈肥美的蘑菇在腐木上长成，看起来能吃。`,opts:[{label:`小心采摘`,d:`获得{res:food} ×6~10`,effects:[{op:`res`,res:`food`,n:{rnd:[6,10]}}]},{label:`连草药一起采`,d:`获得{res:herb} ×2~4`,effects:[{op:`res`,res:`herb`,n:{rnd:[2,4]}}]}]},{id:`beehive`,zone:`forest`,w:2,title:`野蜂巢`,text:`树杈上挂着一个嗡嗡作响的野蜂巢，蜂蜜香甜诱人。`,opts:[{label:`冒险掏蜂蜜`,d:`生命 -6 · 获得熟食 ×5~8`,effects:[{op:`delta`,field:`hp`,n:-6,min:1,max:100},{op:`res`,res:`cooked`,n:{rnd:[5,8]}},{op:`log`,text:`你被蛰得满脸包，但蜂蜜到手了！`,cls:`good`}]},{label:`绕开`,d:`还是别惹它们`,effects:[]}]},{id:`deer`,zone:`forest`,w:2,title:`林间鹿群`,text:`一群野鹿在溪边饮水，警觉地竖着耳朵。`,opts:[{label:`伏击狩猎`,d:`成功：食物×10~16 / 失败：白跑`,run:`deerHunt`},{label:`静静离开`,d:`不打扰它们`,effects:[]}]},{id:`granny`,zone:`forest`,w:1,title:`外婆的小屋`,text:`森林深处，一个白发老太太朝你招手：「好孩子，快来外婆家喝口热汤吧。」你总觉得她的眼神有点怪……`,opts:[{label:`接过热汤`,d:`50% 真外婆送礼 / 50% 大灰狼扑来！`,effects:[{op:`random`,branches:[{w:1,effects:[{op:`res`,res:`food`,n:{rnd:[8,12]}},{op:`res`,res:`herb`,n:{rnd:[2,4]}},{op:`log`,text:`🥣 外婆熬的野菜汤温暖了你的胃。（生食+8~12 草药+2~4）`,cls:`good`}]},{w:1,effects:[{op:`log`,text:`❗ 老太太忽然咧嘴一笑——露出的是一口獠牙！「大灰狼」撕下伪装扑向你！`,cls:`bad`},{op:`combat`,beasts:!0}]}]}]},{label:`试探：「外婆，你耳朵怎么这么大？」`,d:`50% 识破狼外婆 / 50% 真外婆给礼物`,effects:[{op:`random`,branches:[{w:1,effects:[{op:`log`,text:`👵 她温柔一笑：「是为了听清你的脚步声呀。」（真外婆，获得礼物）`,cls:`good`},{op:`res`,res:`cooked`,n:{rnd:[3,5]}},{op:`res`,res:`clean`,n:{rnd:[3,5]}}]},{w:1,effects:[{op:`log`,text:`🐺 她眼神一冷：「是为了……吃掉你啊！」大灰狼撕下伪装扑向你！`,cls:`bad`},{op:`combat`,beasts:!0}]}]}]},{label:`婉拒离开`,d:`安全离开`,effects:[{op:`log`,text:`你礼貌地告辞，身后传来老太太幽幽的叹息……`,cls:`info`}]}]},{id:`dora`,zone:`ruins`,w:2,title:`破旧的猫耳机器人`,kind:`dora`,text:`废墟角落蜷着一只破旧的蓝色人形猫耳机器人，眼睛半亮，看到你后拍了拍鼓鼓的口袋。`,opts:[]},{id:`vending`,zone:`ruins`,w:2,title:`废弃自动售货机`,text:`一台半塌的自动售货机还亮着微弱的灯。`,opts:[{label:`投币试试 (10💰)`,d:`随机出货`,require:{gold:10},requireFail:`你翻遍口袋也凑不出 10 金币。`,effects:[{op:`gold`,n:-10},{op:`random`,branches:[{w:50,effects:[{op:`res`,res:`food`,n:{rnd:[5,9]},log:`叮！掉出{res:food} ×{n}。`,cls:`good`}]},{w:30,effects:[{op:`res`,res:`clean`,n:{rnd:[3,6]},log:`叮！掉出{res:clean} ×{n}。`,cls:`good`}]},{w:12,effects:[{op:`res`,res:`cooked`,n:{rnd:[2,4]},log:`叮！掉出{res:cooked} ×{n}！`,cls:`good`}]},{w:8,effects:[{op:`res`,res:`rune`,n:{rnd:[1,2]},log:`叮！竟然掉出{res:rune} ×{n}！！`,cls:`good`}]}]}]},{label:`砸开玻璃`,d:`获得金属 ×2，但可能惊动什么`,effects:[{op:`res`,res:`metal`,n:2},{op:`log`,text:`你砸开玻璃，抓出里面的罐头。`,cls:`good`}]}]},{id:`library`,zone:`ruins`,w:1,title:`倒塌的图书馆`,text:`断裂的书架下压着几本还算完整的旧书。`,opts:[{label:`翻找知识`,d:`随机学会一个新配方`,effects:[{op:`learnRecipe`,log:`你在书中找到了「{name}」的制作方法！`,failText:`书都烧成了灰，你已经没什么可学的了。`}]},{label:`收集纸页`,d:`获得木材 ×5`,effects:[{op:`res`,res:`wood`,n:5}]}]},{id:`radzone`,zone:`ruins`,w:2,title:`辐射泄漏区`,text:`地上画着褪色的警示标志，空气里弥漫着金属焦味。`,opts:[{label:`冒险深入`,d:`生命 -15 · 金属×8~12 合金×2~4`,effects:[{op:`delta`,field:`hp`,n:-15,min:1,max:100},{op:`res`,res:`metal`,n:{rnd:[8,12]}},{op:`res`,res:`alloy`,n:{rnd:[2,4]}},{op:`log`,text:`你咬牙冲进辐射区拖出一批金属，代价是皮肤灼痛。`,cls:`bad`}]},{label:`在边缘捡点`,d:`金属 ×3~5`,effects:[{op:`res`,res:`metal`,n:{rnd:[3,5]}}]}]},{id:`driftbox`,zone:`river`,w:2,title:`漂来的木箱`,text:`河面上漂来一个捆得结实的防水木箱。`,opts:[{label:`捞上来看看`,d:`随机物资`,effects:[{op:`random`,branches:[{w:40,effects:[{op:`res`,res:`wood`,n:{rnd:[4,8]},log:`木箱里是干燥的{res:wood} ×{n}。`,cls:`good`}]},{w:30,effects:[{op:`res`,res:`food`,n:{rnd:[3,6]},log:`密封的食物罐！{res:food} ×{n}。`,cls:`good`}]},{w:20,effects:[{op:`res`,res:`leather`,n:{rnd:[1,3]},log:`几块油布包着的{res:leather} ×{n}。`,cls:`good`}]},{w:10,effects:[{op:`res`,res:`luck`,n:1},{op:`log`,text:`一个漂流的幸运方块！`,cls:`good`}]}]}]},{label:`任它漂走`,d:`无缘无份`,effects:[]}]},{id:`fishschool`,zone:`river`,w:3,title:`浅滩鱼群`,text:`清澈的浅滩里黑压压一片鱼群！`,opts:[{label:`徒手捞鱼`,d:`获得{res:food} ×10~16`,effects:[{op:`res`,res:`food`,n:{rnd:[10,16]}},{op:`log`,text:`你捞得满手是鱼！`,cls:`good`}]},{label:`放长线钓大鱼`,d:`获得{res:food} ×18~26（需鱼竿）`,require:{item:`rod`},requireFail:`没有鱼竿，只能看着鱼群游走。`,effects:[{op:`res`,res:`food`,n:{rnd:[18,26]}},{op:`log`,text:`你钓上了整整一桶鱼！`,cls:`good`}]}]},{id:`otter`,zone:`river`,w:2,title:`河岸水獭`,text:`一只圆滚滚的水獭叼着鱼趴在石头上晒太阳。`,opts:[{label:`捡它掉落的鱼`,d:`获得{res:food} ×4~8`,effects:[{op:`res`,res:`food`,n:{rnd:[4,8]}}]},{label:`尝试捕捉`,d:`成功：皮革×3 / 失败：白跑`,effects:[{op:`random`,branches:[{w:4,effects:[{op:`res`,res:`leather`,n:3},{op:`log`,text:`水獭滑不溜手，但你还是拽下一撮皮毛。`,cls:`good`}]},{w:6,effects:[{op:`log`,text:`水獭一个猛子扎进水里不见了。`,cls:`warn`}]}]}]}]},{id:`orevein`,zone:`hills`,w:3,title:`露天矿脉`,text:`一道裸露的矿脉在阳光下闪着微光。`,opts:[{label:`开采`,d:`获得{res:metal} ×4~8 · {res:stone} ×3~5`,effects:[{op:`res`,res:`metal`,n:{rnd:[4,8]}},{op:`res`,res:`stone`,n:{rnd:[3,5]}}]},{label:`仔细敲打`,d:`金属 ×6~10（需铁斧）`,require:{item:`ironAxe`},requireFail:`石头太硬，你的工具啃不动。`,effects:[{op:`res`,res:`metal`,n:{rnd:[6,10]}},{op:`log`,text:`铁斧敲开矿脉，露出大块矿石！`,cls:`good`}]}]},{id:`rockfall`,zone:`hills`,w:2,title:`落石`,text:`山顶传来轰隆声——碎石正往下滚！`,opts:[{label:`抱头躲避`,d:`生命 -12 · 侥幸捡到石头×3~6`,effects:[{op:`delta`,field:`hp`,n:-12,min:1,max:100},{op:`res`,res:`stone`,n:{rnd:[3,6]}},{op:`log`,text:`你被碎石擦伤，但捡到一些可用的石头。`,cls:`bad`}]},{label:`飞快跑开`,d:`毫发无伤`,effects:[{op:`log`,text:`你险之又险地躲开了落石。`,cls:`info`}]}]},{id:`eaglenest`,zone:`hills`,w:2,title:`鹰巢`,text:`峭壁上的鹰巢旁散落着动物的残骸。`,opts:[{label:`搜刮残骸`,d:`获得{res:food} ×5~9`,effects:[{op:`res`,res:`food`,n:{rnd:[5,9]}}]},{label:`冒险掏巢`,d:`生命 -8 · 皮革×3~5`,effects:[{op:`delta`,field:`hp`,n:-8,min:1,max:100},{op:`res`,res:`leather`,n:{rnd:[3,5]}},{op:`log`,text:`老鹰俯冲啄你，你抱着皮革滚下山坡。`,cls:`bad`}]}]}],N={none:{name:`✊徒手`,atk:6,mult:1},knife:{name:`🔪石刀`,atk:10,mult:1.5},iron:{name:`🗡️铁刀`,atk:18,mult:2.2},steel:{name:`⚔️钢刀`,atk:28,mult:2.8},huntKing:{name:`🔱猎王刀`,atk:40,mult:3.2},runeBlade:{name:`🔮符刃`,atk:60,mult:4}},et=[{name:`野狗`,hp:20,atk:8,food:5,leather:2},{name:`灰狼`,hp:30,atk:12,food:8,leather:3},{name:`野猪`,hp:40,atk:14,food:12,leather:4},{name:`黑熊`,hp:60,atk:20,food:18,leather:6}],tt=[{name:`🤖锈蚀哨兵`,hp:25,atk:10,food:0,leather:0,metal:3,alloy:0},{name:`⚙️巡逻机甲`,hp:45,atk:18,food:0,leather:0,metal:6,alloy:2},{name:`🛠装配线守卫`,hp:70,atk:24,food:0,leather:0,metal:10,alloy:4}],P={forest:[{name:`🌲野人`,hp:35,atk:14,food:10,leather:4,metal:0}],ruins:tt,river:[{name:`🐊沼泽鳄鱼`,hp:50,atk:18,food:12,leather:6,metal:0}],hills:[{name:`🦅山岩巨鹰`,hp:40,atk:16,food:8,leather:5,metal:2}],pyramid:[{name:`🪳食尸虫`,hp:25,atk:11,food:3,leather:0,metal:0,rune:0},{name:`🧟木乃伊`,hp:55,atk:20,food:0,leather:2,metal:0,rune:1},{name:`🐍沙漠眼镜蛇`,hp:45,atk:18,food:2,leather:3,metal:1,rune:0}]},nt={dog:{name:`🌕嗜血凶犬`,hp:35,atk:15,food:8,leather:3,metal:1},wolf:{name:`🌕月狼`,hp:55,atk:22,food:12,leather:4,metal:2}};function rt(e){let t=e.items.runeBlade?N.runeBlade:e.items.huntKing?N.huntKing:e.items.steel?N.steel:e.items.iron?N.iron:e.items.knife?N.knife:N.none,n=e.enchant&&e.enchant.weapon||0;return{name:t.name,atk:Math.round(t.atk*(1+n*.1)),baseAtk:t.atk,mult:t.mult,sharp:n}}var it={luck:1,rune:1};function at(e){let t=e.stats.bossKills||0;return{name:t===0?`废土兽王`:t===1?`废土兽王·狂暴`:`废土兽王·灭世`,hp:90+t*60,atk:22+t*8,food:30+t*12,leather:12+t*5,metal:8+t*4}}function ot(e){let t=e.stats.pharaohKills||0;return{name:t===0?`👑阿努比斯之仆`:t===1?`💀死亡执政官`:`👁永恒法老`,hp:220+t*100,atk:32+t*12,food:40+t*15,leather:8+t*3,metal:15+t*5,alloy:8+t*4,rune:2+t,gold:120+t*80}}function st(e){return e%15==0}function ct(e,t={}){let n=t.random??Math.random,r=t.zone,i=t.tierScale??1,a=!!t.forceBeasts,o=r?P[r]:null,s=!a&&o&&n()<.45?o:et,c;c=i===1?Math.min(s.length-1,n()<.5?0:1):i===.5?Math.min(s.length-1,n()<.6?0:1):Math.min(s.length-1,Math.floor(n()*s.length));let l=s[c],u=st(e.day);u&&l.name===`野狗`?l=Object.assign({},l,nt.dog):u&&l.name===`灰狼`&&(l=Object.assign({},l,nt.wolf));let d;return d=s===et?`beasts`:s===tt?`robots`:s===P.forest?`forest`:s===P.river?`river`:s===P.hills?`hills`:s===P.pyramid?`pyramid`:`beasts`,{monster:l,pool:d,idx:c,moon:u}}function lt(e){let t=[];e.pool===`beasts`?t.push(`beast`+e.idx):e.pool===`robots`?t.push(`rob`+e.idx):e.pool===`forest`?t.push(`zone-forest`):e.pool===`river`?t.push(`zone-river`):e.pool===`hills`?t.push(`zone-hills`):e.pool===`pyramid`&&t.push(`pyr`+e.idx);let n=e.monster.name||``;return n.includes(`凶犬`)?t.push(`moon-dog`):n.includes(`月狼`)&&t.push(`moon-wolf`),t}function ut(e,t,n={}){let r=n.random??Math.random,i=n.rnd??((e,t)=>Math.floor(r()*(t-e+1))+e),a=[],o=[],s=u(),c=rt(e),l=O(e,`combat`),d=Object.assign({},t),f=Math.round(c.atk*(1+(e.upgrades.weapon||0)*.1)*(1+l*.05)*(.8+r()*.4)),p=Math.round(d.atk*(.6+r()*.6)),m=Math.max(1,Math.round(p*xe(e)));d.hp-=f,e.hp=Math.max(0,Math.min(100,e.hp-m));let h=[{skill:`combat`,n:i(10,16)}];a.push({text:`⚔️ 你挥出${c.name}造成 ${f} 点伤害，被反击 ${m} 点。`,cls:`ev`});let g=!1;if(d.hp<=0){g=!0,e.stats.kills++;let t=[];for(let n of[`food`,`leather`,`metal`,`alloy`,`rune`]){let r=d[n];r>0&&(T(e,n,r),t.push(`${s[n]} ×${r}`))}a.push({text:`🏆 你击败了${d.name}！获得 ${t.join(`、`)}`,cls:`good`}),o.push(`kill1`,`stage`),d.name&&d.name.includes(`木乃伊`)&&o.push(`mummy1`)}else a.push({text:`${d.name}还在挣扎，你趁机撤退了。`,cls:`warn`}),e.hp=Math.max(0,Math.min(100,e.hp-6)),e.hp<40&&!e.heavyWound&&(e.heavyWound=!0,a.push({text:`你受了重伤，行动力大减。`,cls:`bad`}));return{logs:a,xp:h,achievements:o,killed:g}}function dt(e,t,n={}){let r=n.random??Math.random,i=n.rnd??((e,t)=>Math.floor(r()*(t-e+1))+e),a=[],o=[],s=u(),c=!!t.isPharaoh,l=Object.assign({},t.monster),d=rt(e),f=O(e,`combat`),p=0;for(;l.hp>0&&e.hp>0;){p++;let t=Math.round(d.atk*(1+(e.upgrades.weapon||0)*.1)*(1+f*.05)*(.8+r()*.4)),n=Math.round(l.atk*(.6+r()*.6)),i=Math.max(1,Math.round(n*xe(e)));l.hp-=t,e.hp=Math.max(0,Math.min(100,e.hp-i)),a.push({text:`⚔️ 第${p}回合：你造成 ${t} 点伤害，兽王反击 ${i} 点。`,cls:`ev`})}let m=[{skill:`combat`,n:i(30,45)}],h=l.hp<=0;if(h){if(e.stats.kills++,c){let t=ot(e);e.gold+=t.gold,T(e,`food`,t.food),T(e,`leather`,t.leather),T(e,`metal`,t.metal),T(e,`alloy`,t.alloy),T(e,`rune`,t.rune),T(e,`luck`,1),T(e,`goldOre`,i(2,4));let n=``;r()<.5&&(T(e,`totem`,1),n+=`、🪬不死图腾 ×1`),r()<.5&&(T(e,`adrenaline`,1),n+=`、💉肾上腺素 ×1`),a.push({text:`🏆 ${t.name}轰然倒地！沙金碎了一地！你获得了${s.food} ×${t.food}、${s.leather} ×${t.leather}、${s.metal} ×${t.metal}、${s.alloy} ×${t.alloy}、${s.rune} ×${t.rune}、${s.goldOre} ×2~4、💰${t.gold}${n}！`,cls:`good`}),e.stats.pharaohKills=(e.stats.pharaohKills||0)+1,e.stats.pharaohFirstAt||(e.stats.pharaohFirstAt=e.day),o.push(`pharaoh1`),e.stats.pharaohKills>=2&&o.push(`pharaoh2`),e.stats.pharaohKills>=3&&o.push(`pharaoh3`)}else{let t=at(e);T(e,`food`,t.food),T(e,`leather`,t.leather),T(e,`metal`,t.metal);for(let t in it)T(e,t,it[t]);let n=``;r()<.4&&(T(e,`totem`,1),n=`、🪬不死图腾 ×1`),r()<.3&&(T(e,`adrenaline`,1),n+=`、💉肾上腺素 ×1`),a.push({text:`🏆 ${t.name}轰然倒地！你获得了${s.food} ×${t.food}、${s.leather} ×${t.leather}、${s.metal} ×${t.metal}`+Object.keys(it).map(e=>`、${s[e]} ×${it[e]}`).join(``)+`${n}！`,cls:`good`}),e.stats.bossKills=(e.stats.bossKills||0)+1,e.stats.bossFirstAt||(e.stats.bossFirstAt=e.day),o.push(`boss`),e.stats.bossKills>=2&&o.push(`boss2`),e.stats.bossKills>=3&&o.push(`boss3`)}a.push({text:`🩸 你已击败兽王 ${e.stats.bossKills} 次，它的躯体会再次凝聚……`,cls:`info`})}else a.push({text:`你倒在了兽王的利爪下……`,cls:`bad`});return{logs:a,xp:m,achievements:o,victory:h}}function ft(e,t,n={}){let r=n.random??Math.random,i=[],a=r()<.55;return e.stam=Math.max(0,Math.min(100,e.stam-12)),a?i.push({text:`你连滚带爬逃出了追击。`,cls:`sys`}):(e.hp=Math.max(0,Math.min(100,e.hp-t.atk)),i.push({text:`你没能甩掉${t.name}，被抓伤！`,cls:`bad`})),{logs:i}}function pt(e,t={}){let n=t.random??Math.random,r=[];return e.stam=Math.max(0,Math.min(100,e.stam-15)),n()<.8?r.push({text:`你屏息凝神，趁兽王转身时悄悄退走了。`,cls:`sys`}):(e.hp=Math.max(0,Math.min(100,e.hp-22)),r.push({text:`兽王发现了你，一爪拍来！你重伤倒地，侥幸逃脱。`,cls:`bad`}),e.heavyWound=!0),{logs:r}}function mt(e,t,n={}){let r=n.random??Math.random,i=[];return E(e,`food`,2)?r()<.7?(i.push({text:`你把食物丢出去，趁它进食时溜走了。`,cls:`good`}),{logs:i,ok:!0}):(e.hp=Math.max(0,Math.min(100,e.hp-t.atk)),i.push({text:`${t.name}吃完了食物却还是追上来咬了你！`,cls:`bad`}),{logs:i,ok:!1}):{logs:i,ok:!1}}function ht(e,t=Math.random){let n=[];for(let t of $e)if(!(t.zone&&t.zone!==e))for(let e=0;e<(t.w||1);e++)n.push(t);return n.length?n[Math.floor(t()*n.length)]:null}function gt(e,t){if(!t||t.disabled)return!1;let n=t.require;if(!n)return!0;for(let t in n)if(t===`gold`){if((e.gold||0)<n.gold)return!1}else if(t===`item`){if(!D(e,n.item))return!1}else if((e.res[t]||0)<n[t])return!1;return!0}function _t(e,t){let n=rt(e),r=O(e,`hunt`);if(n.name!==`徒手`&&t.random()<.55+r*.02){let n=t.rnd(10,16);return T(e,`food`,n),e.stats.kills++,{logs:[{text:`你猎到一头鹿！${u().food} ×${n}`,cls:`good`}]}}return{logs:[{text:`鹿群惊散了，一无所获。`,cls:`warn`}]}}function vt(e,t){if((e.gold||0)<100)return{logs:[{text:`💰 你掏了掏口袋，凑不出 100 金币。`,cls:`warn`}]};if(e.gold-=100,t.random()<.5){let n=[[`food`,t.rnd(3,6)],[`clean`,t.rnd(2,4)],[`leather`,t.rnd(1,2)],[`metal`,t.rnd(1,3)]],r=n[Math.floor(t.random()*n.length)];return T(e,r[0],r[1]),{logs:[{text:`🪙 硬币正面！你抄了条隐蔽捷径，还在路边发现 ${u()[r[0]]} ×${r[1]}。`,cls:`good`}]}}return e.stam=Math.max(0,e.stam-10),{logs:[{text:`🪙 硬币反面……你自信地走岔了路，绕了个大圈。`,cls:`bad`}]}}function yt(e,t){let n=[{text:``,cls:`good`}];n.length=0;let r=[`tomb1`],i=t.random();if(i<.35){let i=t.rnd(25,60),a=t.rnd(1,2);return e.gold+=i,T(e,`rune`,a),n.push({text:`💎 石棺里堆满陪葬财宝！💰金币 +${i}、${u().rune} ×${a}！`,cls:`good`}),{logs:n,achievements:r,combat:[]}}return i<.65?(n.push({text:`🧟 石棺中的木乃伊突然睁开了眼——它活了！`,cls:`bad`}),{logs:n,achievements:r,combat:[{night:!1,forceBeasts:!1}]}):i<.85?(e.ill=!0,e.hp=Math.max(0,Math.min(100,e.hp-15)),n.push({text:`☠️ 你触发了法老的诅咒，染上重病！`,cls:`bad`}),{logs:n,achievements:r,combat:[]}):(n.push({text:`石棺空空如也，只有千年积灰。`,cls:`warn`}),{logs:n,achievements:r,combat:[]})}function bt(e,t){let n=t.rnd(2,4),r=t.rnd(20,40);return T(e,`goldOre`,n),e.gold+=r,{logs:[{text:`你搜刮到${u().goldOre} ×${n}、💰金币 +${r}！`,cls:`good`}],achievements:[`goldroom1`],combat:[]}}var xt={deerHunt:_t,lostCoin:vt,tombOpen:yt,goldroomLoot:bt};function St(e){return[{label:`继续前进`,d:`精力 -10，一无所获`,effects:[{op:`delta`,field:`stam`,n:-10,min:0,max:100}]},{label:`🪙 丢硬币选路`,d:(e.gold||0)>=100?`花费 💰100 · 正面：走对路精力不扣+小发现 / 反面：精力-10`:`❌ 金币不够（${e.gold||0}/100）`,disabled:(e.gold||0)<100,run:`lostCoin`,effects:[]},{label:`🧭 闭眼转圈`,d:`转 3 圈停下指向路口：东(好)/南(顺)/西(荆棘)/北(迷路)`,effects:[{op:`random`,branches:[{w:1,effects:[{op:`delta`,field:`stam`,n:-5,min:0,max:100},{op:`res`,res:`food`,n:{rnd:[2,4]}},{op:`log`,text:`🧭 你指向东——竟是一条正确小路！还捡到几份吃的。`,cls:`good`}]},{w:1,effects:[{op:`delta`,field:`stam`,n:-5,min:0,max:100},{op:`log`,text:`🧭 南边意外顺畅，你很快找回了方向。`,cls:`info`}]},{w:1,effects:[{op:`delta`,field:`stam`,n:-10,min:0,max:100},{op:`delta`,field:`hp`,n:-5,min:1,max:100},{op:`log`,text:`🧭 西边是荆棘丛！你被刮得满身是伤。`,cls:`bad`}]},{w:1,effects:[{op:`delta`,field:`stam`,n:-15,min:0,max:100},{op:`log`,text:`🧭 北边越走越深，你彻底绕晕了。`,cls:`bad`}]}]}]}]}function Ct(e,t,n,r={}){let i=r.random??Math.random,a=r.rnd??((e,t)=>Math.floor(i()*(t-e+1))+e),o=[],s=[],c=[],l=t&&t.opts?t.opts[n]:null;if(!l)return{logs:o,achievements:s,combat:c};if(l.disabled)return{logs:o,achievements:s,combat:c,refused:`❌ 库存不足，无法交易（不消耗机会）。`};if(!gt(e,l))return{logs:[{text:l.requireFail||`条件不足。`,cls:`warn`}],achievements:s,combat:c};if(l.run){let t=xt[l.run];if(!t)throw Error(`未知的事件选项 handler: ${l.run}`);let n=t(e,{random:i,rnd:a});return o.push(...n.logs||[]),n.achievements&&s.push(...n.achievements),n.combat&&c.push(...n.combat),{logs:o,achievements:s,combat:c}}return o.push(...A(e,l.effects||[],{random:i,rnd:a,combat:c,achievements:s})),{logs:o,achievements:s,combat:c}}function wt(e={}){let t=e.random??Math.random;return{random:t,rnd:e.rnd??((e,n)=>Math.floor(t()*(n-e+1))+e)}}function Tt(e,t){let{zone:n}=t,{random:r,rnd:i}=wt(t.ctx),a=M[n],o=u(),s=[];if(!a)return{logs:s};let c=O(e,`explore`),l=[],d=e.items.axe?3:2;for(let t=0;t<d;t++)if(r()<.75){let t=a.res[Math.floor(r()*a.res.length)],n=Math.round(i(t[1],t[2])*(1+c*.08));D(e,`tower`)&&(n=Math.round(n*1.5)),D(e,`forge`)&&t[0]===`metal`&&(n=Math.round(n*1.5)),D(e,`forgeMast`)&&t[0]===`metal`&&(n=Math.round(n*1.5)),n>0&&(T(e,t[0],n),l.push(`${o[t[0]]||t[0]} ×${n}`))}return l.length?s.push({text:`在${a.name}搜刮到：${l.join(`、`)}。`,cls:`good`}):s.push({text:`在${a.name}转了一圈，一无所获。`,cls:`warn`}),e.weather===4?(s.push({text:`暴风雪让探索异常艰难，精力额外消耗。`,cls:`bad`}),e.stam=Math.max(0,Math.min(100,e.stam-10))):e.weather===3&&e.hour<18&&(s.push({text:`暴雨中你浑身湿透，行动迟缓。`,cls:`warn`}),e.stam=Math.max(0,Math.min(100,e.stam-6))),r()<.55&&t.onEvent?.(),r()<.03&&(T(e,`luck`,1),s.push({text:`🎁 探索中发现了一个幸运方块！`,cls:`good`})),(n===`ruins`||n===`hills`)&&r()<.05&&(T(e,`rune`,1),s.push({text:`🔮 你发现了一颗稀有的符石！`,cls:`good`})),{logs:s}}function Et(e,t,n={}){let{random:r}=wt(n.ctx),i=M[t];if(!i)return{kind:`none`};let a=e.stats.bossKills||0;if(e.day>=30&&r()<(a>0?.04:.06)&&(a===0||e.day>=45+e.stats.bossFirstAt))return{kind:`boss`};if(t===`pyramid`&&e.day>=25){let t=e.stats.pharaohKills||0,n=t>0&&e.stats.pharaohFirstAt?e.stats.pharaohFirstAt+30:0;if(t<3&&r()<.05&&(t===0||e.day>=n))return{kind:`pharaoh`}}if(r()<i.danger)return{kind:`combat`};let o=ht(t,r);return o?{kind:`event`,event:o}:{kind:`none`}}var Dt={3:`生存 3 天`,7:`生存 7 天`,15:`生存 15 天`,30:`生存 30 天`,60:`生存 60 天（废土元老）`,100:`生存 100 天（永夜守护者）`,180:`生存 180 天（传奇幸存者）`,craft1:`制作第一件物品`,kill1:`第一次击败野兽`,allcraft:`制作全部设施（全副武装）`,boss:`击败废土兽王`,up1:`第一次强化装备`,kill10:`击杀 10 只野兽（猎人）`,kill50:`击杀 50 只野兽（屠夫）`,craft10:`制作 10 件物品`,explore10:`探索 10 次`,explore50:`探索 50 次（废土行者）`,cook10:`烹饪 10 次`,up5:`强化 5 次`,up10:`强化 10 次（锻造大师）`,boss2:`二度击败兽王（兽王猎人）`,boss3:`三度击败兽王（兽王终结者）`,totem1:`在死亡边缘蹦迪（不死图腾复活 1 次）`,totem3:`与死神共舞（复活 3 次）`,totem10:`死神都怕你（复活 10 次）`,armor1:`穿上第一件护甲`,setLeather:`集齐🦺皮套装`,setCopper:`集齐🥉铜套装`,setIron:`集齐🛡铁套装`,setSilver:`集齐🥈银套装`,setGold:`集齐🥇金套装`,setSteel:`钢套装加身（最强防御）`,setsAll:`集齐全部 6 套材质套装（套装收藏家）`,armorIron:`集齐铁套装`,armorSteel:`钢套装加身`,armorAll:`集齐全部套装`,oreCopper:`首次挖到铜矿石`,oreSilver:`首次挖到银矿石`,oreGold:`首次挖到金矿石（欧皇）`,smelt1:`首次炼出锭`,ingotAll:`炼齐金/银/铜锭（冶金大师）`,for1:`首次探索森林`,for10:`探索森林 10 次`,for50:`探索森林 50 次（林间熟客）`,rui1:`首次探索废墟`,rui10:`探索废墟 10 次`,rui50:`探索废墟 50 次（废墟拾荒者）`,riv1:`首次探索河边`,riv10:`探索河边 10 次`,riv50:`探索河边 50 次（河岸常客）`,hil1:`首次探索山丘`,hil10:`探索山丘 10 次`,hil50:`探索山丘 50 次（山岭行者）`,pyr1:`首次探索金字塔（沙漠来客）`,pyr10:`探索金字塔 10 次（沙海行者）`,pyr50:`探索金字塔 50 次（法老的邻居）`,mummy1:`首次击败木乃伊（木乃伊杀手）`,tomb1:`第一次开棺盗墓（盗墓贼！）`,goldroom1:`发现黄金密室（寻宝者）`,pharaoh1:`首次击败阿努比斯之仆（法老终结者）`,pharaoh2:`二度击败死亡执政官`,pharaoh3:`三度击败永恒法老（王者归来）`,robbed1:`破财消灾（被小偷偷光还活得好好的）`,goldEater:`钱包吞噬者（金币被 NaN 吞噬过）`,dora6:`口袋里的朋友（猫耳机器人好感度满级）`,fish1:`首次钓到鱼`,fish10:`钓鱼 10 次（新手渔夫）`,fish50:`钓鱼 50 次（渔场老手）`,fish100:`钓鱼 100 次（钓鱼大师）`,fishBig:`钓到罕见大鱼`,fishTreas:`钓到第一件宝藏`,fishRune:`钓到符石！`,fishBlueprint:`钓到神秘图纸`,fishLv10:`渔猎等级 10`,fishLv25:`渔猎等级 25`,fishLv50:`渔猎等级 50（渔神）`},Ot={3:{},7:{gold:30},15:{gold:60},30:{gold:100,food:30,water:30},60:{gold:200,food:80,water:80},100:{gold:500,food:200,water:200,metal:30,leather:20},180:{gold:1500,food:500,water:500,alloy:20}},kt=`craft1.kill1.allcraft.boss.up1.fish1.fish10.fish50.fish100.fishBig.fishTreas.fishRune.fishBlueprint.fishLv10.fishLv25.fishLv50.kill10.kill50.craft10.explore10.explore50.cook10.up5.up10.boss2.boss3.totem1.totem3.totem10.armor1.armorIron.armorSteel.armorAll.oreCopper.oreSilver.oreGold.smelt1.ingotAll.setLeather.setCopper.setIron.setSilver.setGold.setSteel.setsAll.for1.for10.for50.rui1.rui10.rui50.riv1.riv10.riv50.hil1.hil10.hil50.pyr1.pyr10.pyr50.mummy1.tomb1.goldroom1.pharaoh1.pharaoh2.pharaoh3.robbed1.goldEater.dora6`.split(`.`);function F(e,t){let n=[];return e.milestones||={},typeof t==`number`?([60,100,180].forEach(t=>{if(e.day>=t&&!e.milestones[`d`+t]){e.milestones[`d`+t]=1,n.push({text:`🏆 里程碑：${Dt[t]}！`,cls:`good`});let r=Ot[t];if(r){let t=u(),i=[];for(let n in r)n===`gold`?(e.gold+=r[n],r[n]&&i.push(`💰${r[n]}`)):(T(e,n,r[n]),i.push(`${t[n]||n} ×${r[n]}`));n.push({text:`🎁 大事件奖励：${i.join(`、`)}`,cls:`info`})}}}),[3,7,15,30].forEach(t=>{e.day>=t&&!e.milestones[`d`+t]&&(e.milestones[`d`+t]=1,n.push({text:`🏆 里程碑：${Dt[t]}！`,cls:`good`}))}),{logs:n}):(kt.includes(t)&&(e.milestones[t]||(e.milestones[t]=1,n.push({text:`🏆 里程碑：${Dt[t]}！`,cls:`good`}))),{logs:n})}function At(e){let t=[],n=e.stats;n.kills>=10&&t.push(...F(e,`kill10`).logs),n.kills>=50&&t.push(...F(e,`kill50`).logs),n.craft>=10&&t.push(...F(e,`craft10`).logs),n.explore>=10&&t.push(...F(e,`explore10`).logs),n.explore>=50&&t.push(...F(e,`explore50`).logs),n.cook>=10&&t.push(...F(e,`cook10`).logs);let r=Object.values(e.upgrades).reduce((e,t)=>e+t,0);return r>=5&&t.push(...F(e,`up5`).logs),r>=10&&t.push(...F(e,`up10`).logs),{logs:t}}function jt(e){let t=[];e.stats.setsWorn||(e.stats.setsWorn=[]);let n=t=>e.items[`armor`+t[0].toUpperCase()+t.slice(1)]||`none`;for(let r of x)Object.keys(C).every(e=>n(e)===r)&&(t.push(...F(e,`set`+r[0].toUpperCase()+r.slice(1)).logs),r===`iron`&&t.push(...F(e,`armorIron`).logs),r===`steel`&&t.push(...F(e,`armorSteel`).logs),e.stats.setsWorn.includes(r)||e.stats.setsWorn.push(r));return e.stats.setsWorn.length>=6&&(t.push(...F(e,`setsAll`).logs),t.push(...F(e,`armorAll`).logs)),{logs:t}}var Mt=(e,t,n)=>Math.max(t,Math.min(n,e));function Nt(e,t){let n=[],r=[],i=Math.min((Number(t)||0)/36e5,8);if(!(i>=.15))return{hours:0,gains:r,logs:n,settled:!1};let a=Math.floor(i*2)/2,o=u(),s=Math.floor(a*1.2*!!D(e,`trap`)+a*.5*!!D(e,`farm`)),c=D(e,`puri`)?Math.floor(a*.6):0,l=e.items.axe||e.items.ironAxe?Math.floor(a*1.5):0;return s>0&&(T(e,`food`,s),r.push(`${o.food} ×${s}`)),c>0&&(T(e,`clean`,c),r.push(`${o.clean} ×${c}`)),l>0&&(T(e,`wood`,l),r.push(`${o.wood} ×${l}`)),e.season===3&&!D(e,`fire`)&&!e.dead&&(e.hp=Math.max(20,e.hp-Math.floor(a*.6)),n.push({text:`⛄ 你离线时正值寒冬且没有火堆，生命降至 ${e.hp}。`,cls:`bad`})),e.food=Mt(e.food-Math.floor(a*2),0,100),e.water=Mt(e.water-Math.floor(a*2.5),0,100),e.stam=Mt(e.stam+Math.floor(a*15),0,100),e.day+=Math.floor(a/24),n.push({text:`⏳ 你离开了 ${Math.round(a*10)/10} 小时，期间${r.length?`获得了：`+r.join(`、`):`平安无事`}。`,cls:`info`}),{hours:a,gains:r,logs:n,settled:!0}}function Pt(e){let t=String(e?.message??``),n=String(e?.filename??``),r=!!e?.error;return!!(/^script error\.?$/i.test(t.trim())&&!n&&!r||/ResizeObserver loop/i.test(t))}var Ft=[{lvl:1,name:`陌生`,need:0},{lvl:2,name:`眼熟`,need:20},{lvl:3,name:`信赖`,need:50},{lvl:4,name:`好友`,need:100},{lvl:5,name:`挚友`,need:180},{lvl:6,name:`家人`,need:300}],It=[{lvl:1,name:`用 5 生食换 3 净水`,cost:0,give:{food:5},get:{clean:3},blurb:`「前辈说过，水比什么都金贵。」`},{lvl:1,name:`用 3 石头换 2 木材`,cost:0,give:{stone:3},get:{wood:2},blurb:`「口袋里有几根干木头。」`},{lvl:2,name:`🎰 抽奖券 ×1`,cost:500,give:{alloy:5},get:{luckyDraw:1},blurb:`「跟前辈学的，试试手气！」`},{lvl:2,name:`🧪 生命药剂 ×1`,cost:300,give:{},get:{lifePotion:1},blurb:`「绿瓶子的药水，能救命。」`},{lvl:3,name:`🪬 不死图腾 ×1`,cost:800,give:{alloy:8,rune:2},get:{totem:1},blurb:`「前辈的宝贝……可别弄丢啊。」`},{lvl:3,name:`💉 肾上腺素 ×1`,cost:600,give:{alloy:5},get:{adrenaline:1},blurb:`「打一针精神百倍。」`},{lvl:4,name:`🔮 符石 ×3（好友价）`,cost:900,give:{alloy:10},get:{rune:3},blurb:`「老朋友了，给你便宜点。」`},{lvl:4,name:`🥇 金锭 ×2（好友价）`,cost:800,give:{},get:{gold:2},blurb:`「好货当然留给自己人。」`},{lvl:5,name:`🔮 符刃图纸（未学则教）`,cost:1500,give:{alloy:20,rune:10},get:{},blurb:`「前辈的绝活，教你也无妨！」`,key:`runeBladeRecipe`},{lvl:5,name:`🎰🎰 抽奖券 ×3（挚友特供）`,cost:1800,give:{alloy:10},get:{luckyDraw:3},blurb:`「多抽几把，说不定中大奖。」`}],Lt=[{label:`🤝 送 🔩金属×5`,need:{metal:5},fav:8,blurb:`它接过金属零件，眼睛亮了一下`},{label:`🤝 送 ⚙️合金×2`,need:{alloy:2},fav:15,blurb:`它爱不释手地摆弄着合金`},{label:`🤝 送 🔮符石×1`,need:{rune:1},fav:25,blurb:`它小心翼翼地收进口袋最深处`},{label:`🤝 送 🍖食物×10`,need:{food:10},fav:5,blurb:`它说这味道让它想起前辈的铜锣烧`}],Rt=[{tag:`公平`,label:`用 3 木材换 4 生食`,give:{wood:3},get:{food:4},blurb:`「生食都是刚打到的，新鲜！」`},{tag:`公平`,label:`用 2 金属换 3 草药`,give:{metal:2},get:{herb:3},blurb:`「草药能治百病，老顾客都爱买。」`},{tag:`公平`,label:`用 1 皮革换 2 净水`,give:{leather:1},get:{clean:2},blurb:`「皮革是硬通货，净水嘛……」`},{tag:`公平`,label:`用 4 石头换 3 木材`,give:{stone:4},get:{wood:3},blurb:`「修城墙用得着。」`},{tag:`公平`,label:`用 5 木材换 2 石头`,give:{wood:5},get:{stone:2},blurb:`「伐木场换采石场，各取所需。」`},{tag:`稀有`,label:`用 10 金属换 1 符石`,give:{metal:10},get:{rune:1},blurb:`「符石啊，废墟里挖出来的。」`},{tag:`稀有`,label:`用 30 食物换 1 符石`,give:{food:30},get:{rune:1},blurb:`「食物过剩的旅行者最爱这个。」`},{tag:`稀有`,label:`用 50 金币买 1 符石`,give:{},get:{rune:1},cost:50,blurb:`「现金也行，爽快。」`},{tag:`稀有`,label:`用 5 皮革+3 金属换 1 符石`,give:{leather:5,metal:3},get:{rune:1},blurb:`「两样都要，这价才公道。」`},{tag:`神秘`,label:`用 5 合金换 1 随机图纸`,give:{alloy:5},get:{},blurb:`「能学一项新制作，赌一把！」`,hideWhenAllLearned:!0,key:`randomRecipe`},{tag:`神秘`,label:`用 20 金属换 1 幸运方块`,give:{metal:20},get:{luck:1},blurb:`「好运或厄运，开出来才知道。」`},{tag:`神秘`,label:`用 3 皮革+2 草药换 1 符文碎片`,give:{leather:3,herb:2},get:{rune:1},blurb:`「炼金术士会要的。」`},{tag:`神秘`,label:`用 8 合金+3 符文换 1 肾上腺素`,give:{alloy:8,rune:3},get:{adrenaline:1},blurb:`「禁药……6 小时内你不会感到任何饥饿与疲惫。」`},{tag:`现金`,label:`花 50 金币买 20 食物`,give:{},get:{food:20},cost:50,blurb:`「囤点粮心里踏实。」`},{tag:`现金`,label:`花 30 金币买 10 净水`,give:{},get:{clean:10},cost:30,blurb:`「干净水比黄金贵。」`},{tag:`现金`,label:`花 100 金币买 5 合金`,give:{},get:{alloy:5},cost:100,blurb:`「工业原料，童叟无欺。」`},{tag:`现金`,label:`花 500 金币买 1 金锭`,give:{},get:{gold:1},cost:500,blurb:`「银行家才买得起。」`},{tag:`现金`,label:`花 300 金币买 1 经验药水`,give:{},get:{expPotion:1},cost:300,blurb:`「一口气让所有技能 +1。」`},{tag:`现金`,label:`花 800 金币买 1 抽奖券`,give:{},get:{luckyDraw:1},cost:800,blurb:`「试试手气？」`},{tag:`现金`,label:`花 200 金币买 1 生命药剂`,give:{},get:{lifePotion:1},cost:200,blurb:`「回血 100 + 清除伤病。」`},{tag:`现金`,label:`花 500 金币买 1 不死图腾`,give:{},get:{totem:1},cost:500,blurb:`「保命必备。」`},{tag:`现金`,label:`花 1500 金币买 5 抽奖券`,give:{},get:{luckyDraw:5},cost:1500,blurb:`「批量更划算，试试手气？」`},{tag:`黑心`,label:`用 5 符文碎片换 1 高级图纸`,give:{rune:5},get:{},blurb:`「买十张低级图纸才能炼出一张这个。」`,hideWhenAllLearned:!0,key:`advancedRecipe`}];function zt(e){e.npcDora||={fav:0};let t=e.npcDora.fav||0,n=Ft[0];for(let e of Ft)t>=e.need&&(n=e);let r=Ft.find(e=>e.lvl===n.lvl+1)||null;return{fav:t,lvl:n.lvl,name:n.name,nextNeed:r?r.need-t:0,max:!r}}function Bt(e,t){e.npcDora||={fav:0};let n=zt(e);e.npcDora.fav=(e.npcDora.fav||0)+t;let r=zt(e),i=[],a=[];return r.lvl>n.lvl&&(i.push({text:`🤖 猫耳机器人的眼睛亮了亮：「好感度提升！我们现在是「${r.name}」啦！」`,cls:`good`}),r.lvl>=6&&a.push(`dora6`)),{logs:i,achievements:a}}function Vt(e){let t=zt(e).lvl;return It.filter(e=>e.lvl<=t)}function Ht(e,t){let n=Lt[t];return n?Object.keys(n.need).every(t=>(e.res[t]||0)>=n.need[t]):!1}function Ut(e,t){let n=Lt[t];if(!n)return{logs:[],achievements:[]};if(!Ht(e,t))return{logs:[],achievements:[],refused:`材料不足`};for(let t in n.need)E(e,t,n.need[t]);let r=Bt(e,n.fav);return{logs:[...r.logs,{text:`🤖 猫耳机器人收下了礼物，好感度 +${n.fav}。`,cls:`good`}],achievements:r.achievements}}function Wt(e,t){if(!t)return!1;let n=t.cost===0||(e.gold||0)>=t.cost,r=Object.keys(t.give||{}).every(n=>(e.res[n]||0)>=t.give[n]);return n&&r}function Gt(e,t){let n=[],r=[],i=u();if(!t)return{logs:n,achievements:r};if(!Wt(e,t))return{logs:n,achievements:r,refused:`金币或材料不足`};t.cost>0&&(e.gold-=t.cost);for(let n in t.give||{})E(e,n,t.give[n]);if(t.key===`runeBladeRecipe`)e.items.runeBlade?(T(e,`rune`,5),T(e,`luckyDraw`,1),n.push({text:`🔮 你已经会符刃了……送你 5 符石 + 1 抽奖券。`,cls:`good`})):(e.items.runeBlade=!0,n.push({text:`🔮 你学会了符刃的制作方法！（终极武器）`,cls:`good`}));else if(t.get){let r=Object.keys(t.get).map(e=>`${i[e]}×${t.get[e]}`).join(`+`);for(let n in t.get)T(e,n,t.get[n]);n.push({text:`🤖 猫耳机器人从口袋里掏出：${r}！`,cls:`good`})}let a=Bt(e,1);return n.push(...a.logs),r.push(...a.achievements),{logs:n,achievements:r}}function Kt(e){let t=Object.keys(y).filter(t=>!e.items[t]).length===0;return Rt.filter(e=>!(e.hideWhenAllLearned&&t))}function qt(e,t,n=Math.random){let r=Kt(e).slice();for(let e=r.length-1;e>0;e--){let t=Math.floor(n()*(e+1));[r[e],r[t]]=[r[t],r[e]]}return r.slice(0,Math.min(t,r.length))}function Jt(e,t){return!t||t.cost&&(e.gold||0)<t.cost?!1:Object.keys(t.give||{}).every(n=>(e.res[n]||0)>=t.give[n])}function Yt(e,t){if(!Jt(e,t))return!1;t.cost&&(e.gold-=t.cost);for(let n in t.give||{})E(e,n,t.give[n]);for(let n in t.get||{})T(e,n,t.get[n]);return!0}function Xt(e,t,n={}){let r=n.random??Math.random,i=[],a=u();if(!t)return{logs:i};if(t.key===`randomRecipe`){let n=Object.keys(y).filter(t=>!e.items[t]);if(!n.length)return{logs:[{text:`📜 商人翻了翻图纸集：「你都学完了……算我白跑。」`,cls:`warn`}]};if(!Yt(e,t))return{logs:i,refused:`金币或材料不足`};let a=n[Math.floor(r()*n.length)];return e.items[a]=!0,i.push({text:`📜 商人递过一张羊皮纸：「恭喜，你学会了 ${y[a].name} 的制作方法！」`,cls:`good`}),{logs:i}}if(t.key===`advancedRecipe`){if(!Yt(e,t))return{logs:i,refused:`金币或材料不足`};let n=[`runeBlade`,`runeArmor`,`forgeMast`,`vault`].filter(t=>!e.items[t]),a=n.length?n[Math.floor(r()*n.length)]:Object.keys(y).filter(t=>!e.items[t])[0]||null;return a?(e.items[a]=!0,i.push({text:`📜 高级图纸到手：${y[a].name}（终极制作已解锁）`,cls:`good`}),{logs:i}):{logs:[{text:`📜 商人：「你啥都会了……罢了。」`,cls:`warn`}]}}if(!Yt(e,t))return{logs:i,refused:`金币或材料不足`};let o=Object.keys(t.get||{}).map(e=>`${a[e]}×${t.get[e]}`).join(`+`);return i.push({text:`🧙 交易完成：${o}`,cls:`good`}),{logs:i}}var Zt=(()=>{let e=[];return et.forEach((t,n)=>e.push(`beast`+n)),[`forest`,`river`,`hills`].forEach(t=>e.push(`zone-`+t)),(P.pyramid||[]).forEach((t,n)=>e.push(`pyr`+n)),tt.forEach((t,n)=>e.push(`rob`+n)),Object.keys(nt).forEach(t=>e.push(`moon-`+t)),[0,1,2].forEach(t=>e.push(`boss`+t)),[0,1,2].forEach(t=>e.push(`pharaoh`+t)),e})();function Qt(e,t){e.bestiary||={},e.bestiary[t]=(e.bestiary[t]||0)+1}function $t(e,t){return!!(e.bestiary&&e.bestiary[t])}function en(e,t){let n=lt(t);for(let t of n)Qt(e,t);return n}function tn(e){return{unlocked:Zt.filter(t=>$t(e,t)).length,total:Zt.length}}function I(e,t){let n=u();return t.filter(t=>(e[t]||0)>0).map(t=>`${n[t]||t}×${e[t]}`).join(`、`)}function nn(e){let t=u(),n=[],r=(t,r,i,a)=>{n.push({id:t,head:r,tag:i,lines:a,seen:$t(e,t)})},i=[`常见`,`常见`,`少见`,`罕见`];et.forEach((e,t)=>{r(`beast`+t,`👹 ${e.name}`,i[t]||``,[`❤️ 生命 <b>${e.hp}</b> · ⚔️ 攻击 <b>${e.atk}</b>`,`🎁 掉落：${I(e,[`food`,`leather`])}`,`📍 探索 / 夜间随机遭遇`])});let a={forest:`森林·45%`,river:`河边·45%`,hills:`山丘·45%`};for(let e of[`forest`,`river`,`hills`]){let t=(P[e]||[])[0];t&&r(`zone-`+e,t.name,`区域生物 · ${a[e]}`,[`❤️ 生命 <b>${t.hp}</b> · ⚔️ 攻击 <b>${t.atk}</b>`,`🎁 掉落：${I(t,[`food`,`leather`,`metal`])}`,`📍 仅${M[e].name}区域遭遇`])}let o=[`常见`,`少见`,`罕见`];(P.pyramid||[]).forEach((e,t)=>{r(`pyr`+t,e.name,`金字塔 · ${o[t]||``}`,[`❤️ 生命 <b>${e.hp}</b> · ⚔️ 攻击 <b>${e.atk}</b>`,`🎁 掉落：${I(e,[`food`,`leather`,`metal`,`rune`])}`,`📍 仅🏜沙漠金字塔区域遭遇（45% 概率）`])});let s=[`常见`,`少见`,`罕见`];tt.forEach((e,t)=>{r(`rob`+t,e.name,`废墟科技 · ${s[t]||``}`,[`❤️ 生命 <b>${e.hp}</b> · ⚔️ 攻击 <b>${e.atk}</b>`,`🎁 掉落：${I(e,[`metal`,`alloy`])}`,`📍 仅🏚废墟区域遭遇（45% 概率）`])});for(let[e,t]of Object.entries(nt))r(`moon-`+e,t.name,`月圆进化`,[`❤️ 生命 <b>${t.hp}</b> · ⚔️ 攻击 <b>${t.atk}</b>`,`🎁 掉落：${I(t,[`food`,`leather`,`metal`])}`,`📍 每 15 天月圆夜，野狗 / 灰狼进化`]);let c=[`首杀`,`二阶段`,`三阶段`];for(let e=0;e<3;e++){let n=at({stats:{bossKills:e}});r(`boss`+e,`🐲 ${n.name}`,c[e],[`❤️ 生命 <b>${n.hp}</b> · ⚔️ 攻击 <b>${n.atk}</b>`,`🎁 掉落：${I(n,[`food`,`leather`,`metal`])}${Object.keys(it).map(e=>`、${t[e]}×${it[e]}`).join(``)}`,`📍 第 30 天起探索 / 夜间遭遇 · 击败后 45 天以更强形态回归`])}let l=[`首杀`,`二阶段`,`三阶段`];for(let e=0;e<3;e++){let t=ot({stats:{pharaohKills:e}});r(`pharaoh`+e,t.name,l[e],[`❤️ 生命 <b>${t.hp}</b> · ⚔️ 攻击 <b>${t.atk}</b>`,`🎁 掉落：${I(t,[`food`,`leather`,`metal`,`alloy`,`rune`])}、💰×${t.gold}`,`📍 第 25 天起 🏜金字塔 探索 5% 遭遇 · 击败后 30 天以更强形态回归`])}return n}function rn(){let e=u(),t=f(),n=Object.keys(t).map(n=>({id:n,head:e[n]||n,tag:``,lines:[t[n]]})),r=Object.keys(w).map(t=>{let n=w[t],r=Object.keys(n.base).map(t=>`${e[t]||t}×${n.base[t]}`).join(` `);return`${n.name} · ${n.desc} · 起价 ${r}`});return n.push({id:`enchant`,head:`🔮 附魔系统`,tag:`需附魔台`,lines:r}),n}var an={herb:{name:`🌿草药 ×3`,cost:12,effects:[{op:`res`,res:`herb`,n:3}]},metal:{name:`🔩金属 ×2`,cost:16,effects:[{op:`res`,res:`metal`,n:2}]},leather:{name:`👜皮革 ×2`,cost:22,effects:[{op:`res`,res:`leather`,n:2}]},med:{name:`急救包（治伤病）`,cost:30,effects:[{op:`set`,field:`ill`,value:!1},{op:`set`,field:`heavyWound`,value:!1},{op:`set`,field:`lightWound`,value:!1}]},luck:{name:`🎲幸运方块 ×1`,cost:60,effects:[{op:`res`,res:`luck`,n:1}]},rune:{name:`🔮符石 ×1（符文工艺的基石）`,cost:200,effects:[{op:`res`,res:`rune`,n:1}]},alloy:{name:`⚙️合金 ×5（高级制作材料）`,cost:300,effects:[{op:`res`,res:`alloy`,n:5}]},goldIngot:{name:`🥇金锭 ×1（炼锭产物）`,cost:500,effects:[{op:`res`,res:`gold`,n:1}]},lifePotion:{name:`🧪生命药剂 ×1（hp 拉满 + 清伤病）`,cost:200,effects:[{op:`res`,res:`lifePotion`,n:1}]},expPotion:{name:`📜经验药水 ×1（所有技能 +1）`,cost:300,effects:[{op:`res`,res:`expPotion`,n:1}]},totem:{name:`🪬不死图腾 ×1（免死一次）`,cost:500,effects:[{op:`res`,res:`totem`,n:1}]},adren:{name:`💉肾上腺素 ×1（6 小时状态不掉）`,cost:800,effects:[{op:`res`,res:`adrenaline`,n:1}]},lucky1:{name:`🎰抽奖券 ×1（试试手气）`,cost:800,effects:[{op:`res`,res:`luckyDraw`,n:1}]},lucky5:{name:`🎰🎰抽奖券 ×5（批量更划算）`,cost:3500,effects:[{op:`res`,res:`luckyDraw`,n:5}]}},on=[{title:`⚒ 基础物资`,ids:[`herb`,`metal`,`leather`,`med`,`luck`]},{title:`💎 高级道具`,ids:[`rune`,`alloy`,`goldIngot`,`lifePotion`,`expPotion`,`totem`,`adren`,`lucky1`,`lucky5`]}],sn=an;function cn(e){return sn[e]??null}function ln(e,t){let n=cn(t);return n?(e.gold||0)<n.cost?{ok:!1,reason:`金币不足，先卖点资源吧`}:{ok:!0}:{ok:!1,reason:`没有这件商品`}}function un(e){return Object.keys(an).some(t=>ln(e,t).ok)}function dn(e,t){let n=cn(t);if(!n)return{logs:[],refused:`没有这件商品`,spent:0};let r=ln(e,t);if(!r.ok)return{logs:[],refused:r.reason,spent:0};e.gold=(e.gold||0)-n.cost;let i=A(e,n.effects??[]);return i.push({text:`💰 在黑市购买了 ${n.name}。`,cls:`good`}),{logs:i,spent:n.cost}}function fn(e){return fe.map(t=>{let n=e.skills&&e.skills[t]||{lvl:1,xp:0},r=Number(n.lvl)||1,i=Number(n.xp)||0,a=he(r);return{key:t,name:pe[t]||t,desc:me[t]||``,lvl:r,xp:i,need:a,pct:Math.min(100,Math.round(i/a*100))}})}var pn=[7,15,30,60,100],mn=[{id:`d3`,label:`生存 3 天`},{id:`d7`,label:`生存 7 天`},{id:`d15`,label:`生存 15 天`},{id:`d30`,label:`生存 30 天`},{id:`craft1`,label:`第一件制作`},{id:`kill1`,label:`首次击败野兽`},{id:`allcraft`,label:`全副武装`},{id:`boss`,label:`击败兽王`},{id:`up1`,label:`首次强化`},{id:`fish1`,label:`首次钓到鱼`},{id:`fish10`,label:`钓鱼 10 次`},{id:`fish50`,label:`钓鱼 50 次`},{id:`fish100`,label:`钓鱼 100 次`},{id:`fishBig`,label:`钓到罕见大鱼`},{id:`fishTreas`,label:`钓到宝藏`},{id:`fishRune`,label:`钓到符石`},{id:`fishBlueprint`,label:`钓到图纸`},{id:`fishLv25`,label:`渔猎 25 级`},{id:`totem1`,label:`在死亡边缘蹦迪`},{id:`totem3`,label:`与死神共舞`},{id:`totem10`,label:`死神都怕你`},{id:`armor1`,label:`第一件护甲`},{id:`armorIron`,label:`铁甲`},{id:`armorSteel`,label:`钢甲加身`},{id:`armorAll`,label:`护甲收藏家`},{id:`oreCopper`,label:`挖到铜矿`},{id:`oreSilver`,label:`挖到银矿`},{id:`oreGold`,label:`挖到金矿`},{id:`smelt1`,label:`首次炼锭`},{id:`ingotAll`,label:`冶金大师`},{id:`for1`,label:`森林首次`},{id:`for10`,label:`森林 10 次`},{id:`for50`,label:`森林 50 次`},{id:`rui1`,label:`废墟首次`},{id:`rui10`,label:`废墟 10 次`},{id:`rui50`,label:`废墟 50 次`},{id:`riv1`,label:`河边首次`},{id:`riv10`,label:`河边 10 次`},{id:`riv50`,label:`河边 50 次`},{id:`hil1`,label:`山丘首次`},{id:`hil10`,label:`山丘 10 次`},{id:`hil50`,label:`山丘 50 次`},{id:`pyr1`,label:`金字塔首次`},{id:`pyr10`,label:`金字塔 10 次`},{id:`pyr50`,label:`金字塔 50 次`},{id:`mummy1`,label:`木乃伊杀手`},{id:`tomb1`,label:`盗墓贼`},{id:`goldroom1`,label:`寻宝者`},{id:`pharaoh1`,label:`法老终结者`},{id:`pharaoh2`,label:`死亡执政官`},{id:`pharaoh3`,label:`永恒法老`},{id:`robbed1`,label:`破财消灾`},{id:`goldEater`,label:`钱包吞噬者`},{id:`dora6`,label:`口袋里的朋友`}];function hn(e,t){return!t||t<=0?0:Math.max(0,Math.min(100,Math.round(e/t*100)))}function gn(e){let t=Number(e.day)||1,n=pn[pn.length-1],r=e.milestones||{},i=pn.find(e=>e>t&&!r[`d`+e])??null;return{cur:t,max:n,pct:hn(t,n),next:i,left:i?i-t:0,done:!i}}function _n(e,t){let n=y[t];if(!n)return``;let r=u();return Object.keys(n.cost).map(t=>{let i=n.cost[t],a=e.res&&e.res[t]||0;return`${r[t]||t} ${i}${a<i?`（缺 ${i-a}）`:``}`}).join(` `)}function vn(e){let t=Object.keys(y),n=t.filter(t=>e.items&&e.items[t]).length,r=t.find(t=>!(e.items&&e.items[t]))??null;return{made:n,total:t.length,pct:hn(n,t.length),next:r,nextName:r?y[r].name:null,missing:r?_n(e,r):``}}function yn(e){let t=Object.keys(b).map(t=>{let n=b[t];return{key:t,name:n.name,lvl:e.upgrades&&e.upgrades[t]||0,max:n.max||15}}),n=t.reduce((e,t)=>e+t.lvl,0),r=t.reduce((e,t)=>e+t.max,0);return{perKey:t,total:n,max:r,pct:hn(n,r)}}function bn(e){let t=fn(e),n=t.reduce((e,t)=>e+t.lvl,0),r=t.length*50;return{rows:t,total:n,max:r,maxLv:50,pct:hn(n,r)}}function xn(e){return{route:Object.keys(N).map(t=>({key:t,name:N[t].name,owned:t===`none`||!!(e.items&&e.items[t])})),current:rt(e)}}function Sn(e){let t=e.stats&&e.stats.bossKills||0;return{kills:t,stage:Math.min(t,3)}}function Cn(e){let t=e.stats&&e.stats.pharaohKills||0;return{kills:t,stage:Math.min(t,3)}}function wn(e){let t=zt(e),n=Ft[t.lvl]||null;return{...t,nextName:n?n.name:null}}function Tn(e){let t=e.milestones||{},n=[],r=[];for(let e of mn)(t[e.id]?n:r).push(e);return{done:n,left:r,doneCount:n.length,total:mn.length,pct:hn(n.length,mn.length)}}var En=`# 末日余烬 · 更新日志

> 完整版本历史，共 **86 个版本 / 258 条更新**，时间跨度 2026-08-09 → 2026-10-27。
> 本文件是**唯一源**，**最新版本在最前**；游戏内「菜单 → 更新日志」在运行时直接读取本文件（不生成副本）。

| 统计 | 值 |
|---|---|
| 版本总数 | 86 |
| 更新条目 | 258 条 |
| 最新版本 | v3.0.10（2026-10-28） |
| 首个版本 | v1.0.0（2026-08-09） |
| 2.x 版本 | 1 个 |
| 3.x 版本 | 11 个 |

---

## v3.0.10 · 2026-10-28

**📐 修掉状态栏下的多余留白**

- 状态栏的 \`padding\` 简写里把顶部安全区又加到了**底部**（\`calc(4px + safe-area-inset-top)\`），等于在生命栏和日志之间白垫了一截；现在底部只留 3px
- 顶部：状态栏上内边距 4→3px、日期行高收紧、菜单按钮 34→30px、状态条行距 2→1px
- 日志区上内边距 6→3px

## v3.0.9 · 2026-10-28

**📐 主界面纵向更紧凑（对齐 2.0）**

- 状态栏上下内边距 6→4px、状态条行距收紧，顶部不再有一截空白
- 日志行高 1.65→1.5、日志区内边距 10→6px，同样的屏幕能多看几行
- 底部不再无条件垫 44px：只在真机存在 Home 指示条时保留安全区，Android 上底部的大块空白消失
- 页签 / 区域栏 / 行动按钮间距各减 1–2px，按钮最小高度 46→42px

## v3.0.8 · 2026-10-28

**🧹 不再被无意义的报错刷屏**

- 手机内置浏览器切换全屏时会抛出跨域脱敏错误 \`Script error.\`，它没有文件名/行号，跟游戏无关；现在只写控制台，不再显示在游戏日志里
- ResizeObserver 的良性循环告警同样不再进日志
- 真正属于游戏的报错（带文件名与行号）照常记录，不会被误吞

## v3.0.7 · 2026-10-28

**🖱 弹窗更好用：点暗处关闭 + 更紧凑**

- 所有菜单类弹窗（菜单 / 商店 / 技能 / 进度 / 图鉴 / 日志 / 导出导入）都可以点**外部暗处**关闭，不用滚到底找「关闭」
- 弹窗更紧凑：按钮内边距与间距缩小、卡片内边距缩小，一屏能多放 2–3 项
- 事件 / 战斗弹窗仍然**不能**点暗处关闭（防止误触跳过剧情与战斗）

## v3.0.6 · 2026-10-28

**📷 二维码拆成多张，解决「太密扫不动」**

- 大存档的二维码不再是一张 165×165 的“雪花屏”：按 520 字符拆分，每张约 90 模块，手机能对焦
- 导出面板变成轮播：显示「第 1/4 张」，每 4 秒自动切换，也可以手动点「上一张 / 下一张」
- 扫码端逐张收集，每收到一张提示「已扫到第 2/4 张」，集齐后自动拼回并导入；重复扫同一张不会重复提示
- 单帧二维码 ≤ 100 模块有单测把关（编码 → 栅格化 → jsQR 解码）

## v3.0.5 · 2026-10-27

**📷 修复扫码「对着二维码没反应」**

- 二维码画得更大了：每模块至少 3 像素（大存档 165 模块时画布从 173px 提到 519px），显示上限也从 250px 提到 320px
- 扫码端改为全分辨率取帧（长边最多 1280px），不再把画面压到一半——压缩会把密集二维码降到 1 像素/模块，摄像头根本解不出
- 扫码层不再「静默无反应」：8 秒还没识别到会提示「靠近一点 / 调亮屏幕 / 换角度，或改用粘贴导入」
- 新增二维码链路单测（编码 → 栅格化 → jsQR 解码），大存档也能还原原文

## v3.0.4 · 2026-10-27

**⏳ 离线收益回归 + 启动守卫**

- 离线结算回来了：关掉游戏再打开，按离开时长补发自动设施产出（最多 8 小时、半小时粒度），并结算离线期间的消耗与冬季受冻
- 新增启动守卫：启动到一半崩掉时，下次打开会出降级页，可以「重新加载 / 清缓存重载 / 仍然进入」，并直接显示上次的脚本错误，不再白屏
- e2e 增加离线结算断言（把 \`lastSeen\` 拨回 3 小时后刷新，日志应出现「你离开了 3 小时」）

## v3.0.3 · 2026-10-27

**🎛 底部操作区三处体验修正**

- 「▾」现在真的能收起 / 展开：收起时隐藏操作区与区域栏，日志区变大；再点「▴」恢复（旧版行为）
- 区域栏只在「行动」页显示，切到「制作 / 背包」不再占一行
- 背包页「进食 / 饮水」合并成一行两列，省一屏空间

## v3.0.2 · 2026-10-27

**🔧 修复：小写前缀的存档码 + 事件选项里的资源名占位**

- 存档码前缀改为大小写不敏感：\`ember:\` / \`Ember:\` 也能导入（部分输入法/聊天工具会把开头字母转小写）
- 探索事件选项的描述里 \`{res:metal}\` 未被替换成「🔩金属」的问题已修（物品名统一走资源表，未知键保留占位符以便暴露数据错误）

## v3.0.1 · 2026-10-27

**🔧 修复：导入旧存档提示「存档代码无效」**

- 存档码解析改为容错：自动去掉 UTF-8 BOM、允许前缀前带说明文字、忽略 base64 折行/空白，兼容 \`- _\` 变体和缺失的 padding
- 仍支持 \`EMBER:\` / \`EMBER1:\` / \`EMQR1:\` / 裸 JSON 四种形态；前缀在但内容损坏时回退尝试 JSON
- 导入失败时在日志里给出长度与开头字符，便于判断是格式不对还是代码被截断

## v3.0.0 · 2026-10-27

**🏗 架构重构：分层源码 + 构建链 + 多文件 PWA**

- 🧱 源码正式搬进 \`src/\`：\`core/\` 纯逻辑（20 个模块 + 18 个数据文件）、\`app.mjs\` 表现层、\`pwa.mjs\` 能力层，全部过 TypeScript strict 检查
- 📦 构建产物换成多文件 PWA（\`dist/\`），部署到独立 \`gh-pages\` 分支；可安装到桌面、断网可玩
- 🏪 新增黑市商店：14 件商品分两组，实时金币与按钮状态
- 🏅 新增技能一览：7 项技能的等级、经验进度与加成说明
- 📈 新增进度总览：天数 / 制作 / 强化 / 技能 / 武器路线 / 兽王 / 法老 / 机器猫 / 成就 9 个区块
- 📜 新增更新日志面板：直接读取本文件，不再内嵌第二份副本
- 📷 导出支持二维码，导入支持摄像头扫码（\`EMQR1\` 压缩格式，压缩后容量足够塞进二维码）
- 🔢 版本号旁显示 git hash，线上问题可以直接对应到提交
- 🩹 旧版遗留问题随新架构一并修复：Boss 击杀后奖励与成就不发、离线收益时间戳被截断导致每次白拿 8 小时、新档重复发放补偿
- 🔁 存档格式不变（\`SAVE_FMT 11\`）：老存档可直接导入，导出码兼容 \`EMBER\` / \`EMBER1\` / \`EMQR1\`

## v2.0.0 · 2026-10-18

**📲 PWA 化：可安装到桌面 + 离线游玩**

- 📲 变成标准 PWA：安卓/桌面 Chrome 可「安装到桌面」，iOS 可「添加到主屏幕」，之后独立窗口全屏运行、无地址栏
- 📴 离线可玩：Service Worker 预缓存全部资源，断网/飞行模式照常打开继续玩（缓存优先，冷启动不再白屏等网络）
- 🔥 更新提示：新版本下载完成或发现新版本时，底部提示条一键刷新生效，不打断你正在进行的操作
- 🗂 应用图标全套：192/512 标准图标 + 安卓自适应（maskable）+ iOS 主屏图标 + 浏览器标签图标，另附 6 尺寸 iOS 启动图
- 🛡 存档更安全：申请浏览器持久化存储，降低长期不玩被系统清理存档的概率
- 🧭 全部相对路径，根目录/子目录部署都正常；file:// 双击本地打开仍可单文件游玩（不注册 SW）

## v1.30.2 · 2026-08-11

**🧭 迷路事件新增两个选项**

- 🪙 丢硬币选路（花费 💰100）：正面走对路精力不扣+随机小发现（生食/净水/皮革/金属），反面精力-10；金币不足时选项灰显禁用
- 🧭 闭眼转圈：随机转到东(好路+食物)/南(顺畅)/西(荆棘伤血)/北(彻底迷路) 四个路口，结果各异

## v1.30.1 · 2026-08-11

**⚒ 制作面板：未达等级先显示等级要求**

- 🔒 带等级门槛的配方（石斧/净水器/捕兽夹/床铺/药箱/铁刀等 9 个）未达等级时，按钮只显示「需要 X Lv.N（当前 Lv.M）」，不再显示材料成本
- 🎚 等级达标后自动切换为显示材料成本（缺少的材料仍红色高亮）；未达等级按钮呈灰暗禁用样式

## v1.30.0 · 2026-08-11

**📖 怪物图鉴解锁（遭遇才显示属性）**

- 🔒 百科「怪物图鉴」全部怪物：生命/攻击/掉落默认显示「？？？」，遭遇一次（出现战斗界面）即解锁
- 👁 未解锁条目保留名字与出处，带「🔒 未遭遇」标记；已解锁可正常查看属性与掉落
- 📥 老存档按历史战绩自动补解锁：总击杀数解锁野兽、区域探索次数解锁区域怪/机器人/金字塔怪、Boss 击杀数解锁兽王/法老各阶段
- 🧹 顺手清理：删除百科中从未使用的旧版渲染死代码；废墟机器人图鉴不再重复显示两次

## v1.29.9 · 2026-08-11

**📑 百科分类按钮互斥高亮**

- 🐛 修复：wikiTab 之前只清 opacity 不清 background，导致多次切分类后多个按钮同时高亮
- ✨ 高亮改用明显色（半透明金色 + 黄色文字 + accent 边框），与默认深灰对比清晰

## v1.29.8 · 2026-08-11

**🎨 沙漠区域按钮选中态修复**

- 🐛 修复：沙漠金字塔按钮缺少 .on 选中态样式（v1.13.0 加沙漠时遗漏）
- ✨ 加深沙金背景 + 金色 box-shadow 发光，与其他 4 区域选中态风格统一

## v1.29.7 · 2026-08-11

**🤖 机器猫二级菜单**

- 📑 拆 3 级菜单：主菜单（送礼/口袋/闲聊/离开）→ 子菜单（具体选项）→ 返回上级
- 📏 原本 8+ 项直接堆放导致弹窗太长，现在分级清晰

## v1.29.6 · 2026-08-11

**🤖 机器猫「亚空间厨具」**

- 🎛 亚空间烤炉：生食 >500 时遇到猫耳机器人 15% 概率自动把全部生食烤成熟食（1.5x）
- 💧 次世代净水机：生水 >500 时 15% 概率自动把全部生水净化成净水（1:1）

## v1.29.5 · 2026-08-11

**📜 更新日志加标题**

- 📋 66 个历史版本（v1.0.0 ~ v1.29.4）全部加 title 字段
- 🎨 渲染：标题加粗大黄字显示在版本号下方，notes 小字列表
- 📏 标题规则：取 notes[0] 冒号前的主题短语（自动生成）

## v1.29.4 · 2026-08-11

**🐛 修复「材料不足仍扣精力/时间」**

- 🐛 修复「材料不足仍扣精力/时间」：烹饪/烧水/熔炼/炼锭/治疗 5 个行动改为前置检查，材料不足直接提示且不扣精力
- ⏹ 自动循环中遇到材料不足会自动停止（不再空转）

## v1.29.3 · 2026-08-10

**🐛 修复死锁**

- 🐛 修复死锁：石刀 needLv 3→1、鱼竿 needLv 3→1（避免「无武器无法练对应技能」的循环依赖）

## v1.29.2 · 2026-08-10

**🔧 基础制作扩展到 25-30 天完成**

- 🔧 基础制作扩展到 25-30 天完成：9 个基础配方加 needLv 门（Lv.1/3/5）+ 材料成本提升 + 砍柴/采石/狩猎产出降低 15%

## v1.29.1 · 2026-08-10

**🐛 新玩家不再自动获取 v1.17.1 金币 b…**

- 🐛 新玩家不再自动获取 v1.17.1 金币 bug 补偿 100 幸运方块（仅 newGame 标记跳过，老存档保留原 100）
- 🎣 钓鱼宝藏中「幸运方块」权重 2→1：实际获取概率从 1.8% 降到 0.9%

## v1.29.0 · 2026-08-10

**🤖 废墟新 NPC「破旧蓝猫耳机器人」**

- 🤖 废墟新 NPC「破旧蓝猫耳机器人」（参考哆啦A梦）：废墟探索约 10% 概率遇到
- ❤ 好感度 6 级：陌生→眼熟→信赖→好友→挚友→家人（送礼：金属/合金/符石/食物）
- 🎒 万能口袋按好感度解锁：基础交换 → 抽奖券/生命药剂 → 不死图腾/肾上腺素 → 符石/金锭好友价 → 符刃图纸 → 全部开放
- 🏆 好感度满级成就「口袋里的朋友」，进度总览显示好感度进度

## v1.28.1 · 2026-08-10

**⏱ 自动行动解锁等级**

- ⏱ 自动行动解锁等级：砍柴/取水 Lv.3、狩猎/捕鱼/采矿/烹饪/烧水 Lv.5、熔炼/炼锭 Lv.8
- 🔒 未达标时点击行动只执行一次（手动模式），按钮显示「🔒 Lv.X 解锁自动」提示

## v1.28.0 · 2026-08-10

**🧭 制作面板过滤**

- 🧭 制作面板过滤：未解锁配方需拥有/获取过任一种材料类型才显示（已解锁永远显示）
- 🎒 背包物品默认隐藏：首次获取后永久显示（记录 ownedRes 获取图鉴）
- 🗺 区域陆续解锁：森林（第1天默认）→ 河边（3天）→ 废墟（7天）→ 山丘（15天）→ 金字塔（25天），未解锁显示 🔒 锁定按钮

## v1.27.7 · 2026-08-10

**🏆 新彩蛋成就「钱包吞噬者」**

- 🏆 新彩蛋成就「钱包吞噬者」：金币出现 NaN 时自动获取
- 🧹 进度总览成就区改版：只显示已达成成就，顶部显示「已达成 X/N · 剩余 Z 个未解锁」，点击可展开剩余成就

## v1.27.6 · 2026-08-10

**🐛 修复金币 NaN 真正根因**

- 🐛 修复金币 NaN 真正根因：流浪商人箭头函数参数 g 遮蔽外层商品 g，触发 G.gold -= undefined
- 🔧 修复：箭头函数参数改为 _g（闭包访问外层商品 cost/get）
- 🎁 补偿受影响玩家：🎰抽奖券 +1（下次加载自动到账）

## v1.27.5 · 2026-08-10

**🧹 移除加载存档时「v1.17.1 幸运方块补偿…**

- 🧹 移除加载存档时「v1.17.1 幸运方块补偿」的重复提示（补偿标记保留，不再每次刷屏）

## v1.27.4 · 2026-08-10

**🐛 修复金币 NaN bug**

- 🐛 修复金币 NaN bug：renderAll 加全局护甲（isFinite 检查 + 自动归 0），不再显示 NaN
- 🎁 一次性补偿受影响玩家：🪬不死图腾 ×1 + 🎰抽奖券 ×1（下次加载自动生效）
- 🛡️ 同步加固 hp/food/water/stam 字段运行时保护

## v1.27.3 · 2026-08-10

**🌙 金币小偷平衡调整**

- 🌙 金币小偷平衡调整：取消永恒仓库免疫，余额 >1 万时睡觉 10% 概率被偷光（人人平等）

## v1.27.2 · 2026-08-10

**🌙 金币小偷事件**

- 🌙 金币小偷事件：余额 >1 万时睡觉 10% 概率被偷光，小偷「看你可怜」留 1 元
- 🏆 新成就「破财消灾」：首次被偷光触发

## v1.27.1 · 2026-08-10

**🏪 黑市商店新增 9 个高级道具**

- 🏪 黑市商店新增 9 个高级道具：符石/合金/金锭/生命药剂/经验药水/不死图腾/肾上腺素/抽奖券×1/×5
- 📂 分两组显示：「⚒ 基础物资」+「💎 高级道具」，花金币有了明确去处

## v1.27.0 · 2026-08-10

**🏜 金字塔 Boss 法老王**

- 🏜 金字塔 Boss 法老王：第 25 天起 🏜金字塔 探索 5% 概率遭遇
- 👑 法老三阶段：阿努比斯之仆（HP220）→ 死亡执政官（HP320）→ 永恒法老（HP420），击败 30 天后更强形态回归
- 💰 法老奖励：🍖×40 🔩×15 ⚙️×8 🔮×2~4 🥇×2~4 💰×120+，50% 掉不死图腾 + 50% 掉肾上腺素
- 🏆 新增 3 个法老成就：法老终结者 / 死亡执政官 / 永恒法老（王者归来）
- ⬆ 强化上限 10→15：武器伤害 10%→12%，Lv.11 起需要符石+合金（参考 Minecraft 附魔等级）
- 💊 3 个新消耗品：📜经验药水（300金，所有技能+1）/ 🎰抽奖券（800/1500金，随机暴富）/ 🧪生命药剂（200金，回满+清伤病）
- 🏪 商人新增 6 个高价值现金商品（金锭/经验药水/抽奖券/生命药剂/不死图腾/批量抽奖券）

## v1.26.1 · 2026-08-10

**🏆 区域成就系统**

- 🏆 区域成就系统：5 个探索区域各有「探索 1/10/50 次」三档成就（森林/废墟/河边/山丘/金字塔）
- 🧟 金字塔特殊成就：木乃伊杀手（击败木乃伊）/ 盗墓贼（开棺）/ 寻宝者（黄金密室）
- ⚙️ 通用机制：ZONES.ach 配置区域成就，未来新增区域自动获得探索成就（探索次数统计 zoneCnt）

## v1.26.0 · 2026-08-10

**🏜 新增第 5 探索区域「沙漠金字塔」**

- 🏜 新增第 5 探索区域「沙漠金字塔」（危险度 30% 全区最高，沙金色主题）
- 🧟 金字塔专属生物：🪳食尸虫（弱 hp25）/ 🧟木乃伊（中 hp55 掉符石）/ 🐍沙漠眼镜蛇（中强 hp45）
- 📜 新增 5 个金字塔专属事件：法老墓室（开棺：宝藏/木乃伊/诅咒）/ 食尸虫群 / 沙暴 / 黄金密室 / 法老诅咒
- 📖 百科图鉴更新：3 条金字塔怪物条目 + 金矿石/符石获取方式加 🏜金字塔

## v1.25.0 · 2026-08-10

**💉 新消耗品「肾上腺素」**

- 💉 新消耗品「肾上腺素」：注射后 6 小时内生命/精力/水分/饥饿全部不下降
- 👹 获取：兽王 30% 掉落 · 🎲 幸运方块稀有 · 🛒 流浪商人神秘商品（8合金+3符文）
- 📊 状态栏显示 💉剩余小时倒计时，背包页一键注射
- 💾 存档格式升级 v10（旧档自动补肾上腺素字段）

## v1.24.1 · 2026-08-10

**🐛 修复无装备点提示"当前X**

- 🐛 修复无装备点提示"当前X：X"冗余 toast：装备状态按钮改为只读标签，显示材质名+减伤%（不再无意义点击）

## v1.24.0 · 2026-08-10

**🛡 装备区移到制作页前面**

- 🛡 装备区移到制作页前面：紧跟基础分组，强化之前（不再埋在最后）
- 🧭 制作页顶部加快捷导航：[制作/装备/强化/附魔] 一键跳到对应区块

## v1.23.3 · 2026-08-10

**🐛 修复护甲显示不清**

- 🐛 修复护甲显示不清：emoji 渲染失败时材质名看不清，改为 [皮头] 方括号格式，emoji 缺失仍可读
- 📊 减伤来源拆分显示：装备/符甲/保护附魔各贡献多少（不再笼统 67%）

## v1.23.2 · 2026-08-10

**🐛 修复制作材料过长仍被截断**

- 🐛 修复制作材料过长仍被截断：sub 强制 white-space:normal + word-break:break-word + max-height:3 行

## v1.23.1 · 2026-08-10

**🛡 装备改版**

- 🛡 装备改版：4 部位（头盔/胸甲/裤子/靴子）× 6 材质，升级链需低级成品（皮→铜→铁→银→金→钢）
- 🏆 套装成就：集齐 🦺皮/🥉铜/🛡铁/🥈银/🥇金/⚙️钢 6 套，全齐解锁「套装收藏家」
- ⛏ 行动合并：采石并入采矿（采矿产石头+矿石）
- 🐛 修复制作页面缩放问题：grid overflow + min-width:0 + sub 自动换行
- 💾 存档格式升级 v9（旧护甲自动迁移为胸甲）

## v1.23.0 · 2026-08-10

**🛡 装备系统（参考 Minecraft 护甲）**

- 🛡 装备系统（参考 Minecraft 护甲）：皮革→铜→铁→银→金→钢 6 级，制作自动穿上
- ⛏ 新增矿石：铜/银/金矿石（采矿 45%/15%/3% 掉落），炼锭：矿石→锭（铁匠炉）
- 🏆 装备+矿石成就：首件护甲/全套护甲/各矿石首挖/首次炼锭/全锭达成
- 💾 存档格式升级 v8（旧档自动补装备与矿石字段）

## v1.22.0 · 2026-08-10

**🔮 附魔系统（参考 Minecraft 附魔台）**

- 🔮 附魔系统（参考 Minecraft 附魔台）：制作附魔台（金属15+皮革8+符石4）解锁
- 🗡 锋利：武器伤害 +10%/级 · 🛡 保护：受击 -8%/级 · ⚒ 效率：采集产量 +8%/级
- 📈 附魔台可升 5 级，附魔上限 = 附魔台等级（Minecraft 式限制）
- 💾 存档格式升级 v7（旧档自动补附魔字段）

## v1.21.1 · 2026-08-10

**👵 新增森林 NPC「外婆的小屋」**

- 👵 新增森林 NPC「外婆的小屋」（参考小红帽与狼外婆故事）：可能是大灰狼伪装的！
- 🥣 接过热汤：50% 真外婆送礼 / 50% 大灰狼袭击（触发战斗）
- 👂 试探「耳朵怎么这么大」：经典台词识破伪装或拿到礼物

## v1.21.0 · 2026-08-10

**🗺 四大探索区域新增专属生物**

- 🗺 四大探索区域新增专属生物（45% 概率替代通用野兽）
- 🌲 森林：野人（HP35）· 🏚 废墟：机械蜘蛛/巡逻机甲等机器人（原有）
- 🏞 河边：沼泽鳄鱼（HP50）· ⛰ 山丘：山岩巨鹰（HP40）
- 📖 百科图鉴新增「区域生物」条目

## v1.20.1 · 2026-08-10

**🏆 新增不死图腾成就**

- 🏆 新增不死图腾成就：在死亡边缘蹦迪（复活 1 次）/ 与死神共舞（3 次）/ 死神都怕你（10 次）

## v1.20.0 · 2026-08-10

**🪬 新增消耗性道具「不死图腾」**

- 🪬 新增消耗性道具「不死图腾」（参考 Minecraft）：死亡时自动消耗，满血复活一次
- 🎲 获取途径：幸运方块稀有掉落 + 废土兽王 40% 掉率（仅此两种）
- ✨ 复活效果：HP 回满 + 食物/水/精力恢复 + 清除疾病/伤口
- 🎒 背包显示「🪬 不死图腾 ×N」不可出售，死亡结算页前自动触发

## v1.19.3 · 2026-08-10

**🐛 修复批量出售输入数字框显示错误**

- 🐛 修复批量出售输入数字框显示错误：type=number 改 text（避免大数字科学计数法如 1.084e+3）
- 🐛 修复清空输入后强制显示"0" bug：updateSellPreview 不再写回 inp.value
- 🛡️ 输入过滤：自动移除非数字字符（防"abc"导致 NaN），maxlength=6 限 6 位

## v1.19.2 · 2026-08-10

**🛒 流浪商人改进**

- 🛒 流浪商人改进：每个选项显示所需库存对比（X/Y），不够时直接禁用（不再浪费交易机会）
- ✅ 可交易时显示「✅ 可交易」，库存不够时红字标「❌ 库存不够（🔩金属 0/20）」

## v1.19.1 · 2026-08-10

**🐛 修复探索对话误触遮罩跳过 bug**

- 🐛 修复探索对话误触遮罩跳过 bug：事件/战斗弹窗点外部不再关闭（必须主动选择）
- 🎯 菜单等普通弹窗仍支持点外部关闭

## v1.19.0 · 2026-08-10

**🌕 月圆之夜系统**

- 🌕 月圆之夜系统：每 15 天一次满月，夜间 70% 触发专属事件
- 🐺 怪物进化：月圆日野狗→嗜血凶犬（HP35）、灰狼→月狼（HP55），更强也掉金属
- ⚔️ 月圆夜三选一：躲进营地 / 主动出击迎战狼群 / 扔食物安抚
- 📖 百科图鉴新增「月圆进化」条目

## v1.18.0 · 2026-08-10

**🤖 废墟新增废土科技怪物**

- 🤖 废墟新增废土科技怪物：锈蚀哨兵 / 巡逻机甲 / 装配线守卫（45% 概率）
- 🔩 机器人掉金属/合金（不再只有食物/皮革），废墟成为金属主要来源之一
- 📖 百科图鉴新增机器人条目 + 金属获取方式更新

## v1.17.1 · 2026-08-10

**🐛 修复金币变 NaN bug**

- 🐛 修复金币变 NaN bug：normalizeState 加 isFinite 硬保护（彻底杜绝显示 NaN）
- 🐛 修复钓上钱袋时金币数值不一致 bug（双 rnd() 改为单 rnd 缓存）
- 🎁 补偿 v1.17.x 受影响玩家：🎲幸运方块 ×100（一次性，下次加载生效）

## v1.17.0 · 2026-08-10

**📖 新增「百科图鉴」**

- 📖 新增「百科图鉴」：怪物属性（4 野兽 + 兽王三阶段 HP/攻击/掉落）
- 📦 材料百科：12 种资源获取方式一目了然（实时生成，随版本自动更新）
- ☀️ 天气系统接入设施：太阳能烧水壶晴 100% → 暴风雪 0%
- 🌾 温室（暴雨减产）/ 捕兽夹（恶劣天气降捕获）/ 净水器（小雨多产）

## v1.16.1 · 2026-08-10

**🎣 钓鱼新增**

- 🎣 钓鱼新增：3.5% 概率钓到怪物（触发战斗，渔猎经验 +8~15）
- 📈 钓鱼经验加强：普通鱼 +6~12、大鱼 +15~25、宝藏 +10~18 渔猎经验
- 💰 钓鱼掉钱：15% 概率鱼嘴叼硬币（+1~8），10% 概率垃圾里翻出零钱（+1~5）

## v1.16.0 · 2026-08-10

**⚡ 新增 Tier 5「自动化」分组**

- ⚡ 新增 Tier 5「自动化」分组：2 台自动生产设备（条件苛刻）
- 🍲 自动厨房：金属×25+合金×12+符石×4，每日自动烹 10 生食→15 熟食
- ☀️ 太阳能烧水壶：金属×18+合金×10+石头×15+符石×3，每日自动烧 12 生水→12 净水
- 💾 存档格式升级 v6（自动补全新设施字段，旧档无缝迁移）

## v1.15.1 · 2026-08-10

**🐛 修复批量出售输入框无法清空**

- 🐛 修复批量出售输入框无法清空：min=1 → min=0（避免 iOS Safari 拒绝清空）
- 🔄 新增清除按钮 ×：一键清空数量，重新输入
- ⚡ 快捷数量按钮新增 10 / 100 / 半（库存一半）
- 🎯 聚焦输入框时自动 select() 全选，方便覆盖

## v1.15.0 · 2026-08-10

**👹 废土兽王三阶段**

- 👹 废土兽王三阶段：狂暴（HP150）/ 灭世（HP210），击败后可再次遭遇（45 天 CD）
- 🏆 新增 10 个进阶成就：击杀 10/50、制作 10、探索 10/50、烹饪 10、强化 5/10、兽王二杀/三杀
- 🗺 探索区域差异化：森林/废墟/河边/山丘 各新增 3 个专属事件（共 12 个）
- 🌲 森林：蘑菇圈 / 野蜂巢 / 林间鹿群 · 🏚 废墟：售货机 / 旧图书馆 / 辐射区
- 🏞 河边：漂流水箱 / 浅滩鱼群 / 河岸水獭 · ⛰ 山丘：露天矿脉 / 落石 / 鹰巢
- 📈 探索事件按当前区域过滤，区域玩法体验明显不同

## v1.14.0 · 2026-08-10

**🐟 钓鱼成就系统**

- 🐟 钓鱼成就系统：首次/10/50/100 次钓鱼、罕见大鱼、宝藏、符石、图纸、渔猎 10/25/50 级
- 💚 治疗增加满血判定：生命值已满时不再消耗草药
- 📦 行动页库存显示：烹饪🍖 / 烧水💧 / 治疗🌿 按钮显示当前库存数量
- 📊 死亡结算页新增「钓鱼次数 / 钓到宝藏」统计

## v1.13.1 · 2026-08-10

**🎨 四大区域视觉区分**

- 🎨 四大区域视觉区分：🌲森林（绿）/ 🏚废墟（橙）/ 🏞河边（蓝）/ ⛰山丘（紫）
- 🏷 Lv 等级徽章从右上角改右下角，加浅背景：不再溢出按钮边框

## v1.13.0 · 2026-08-10

**🐟 钓鱼重做（参考 Minecraft）**

- 🐟 钓鱼重做（参考 Minecraft）：鱼 / 垃圾 / 宝藏 三档战利品表
- 🎁 宝藏：钱袋、铁箱、幸运方块、符石、密封水壶、湿透的图纸（解锁配方）
- 🗑 垃圾：破皮靴、河卵石、浮木、鱼骨、锈铁钩、空瓶子
- 🐠 鱼类：普通鱼 5~11 / 12% 概率罕见大鱼 12~18
- 📈 渔猎等级/强化提升宝藏率、降低垃圾率；修复 luck 资源缺少默认值

## v1.12.2 · 2026-08-10

**📱 制作/行动页小屏 1 列 → 2 列**

- 📱 制作/行动页小屏 1 列 → 2 列：日志区从 213px 增到 333px（+56%）
- 🎯 平衡点：2 列让行动按钮仍能完整显示标题+副标，日志区也能看 6-7 行

## v1.12.1 · 2026-08-10

**🐛 流浪商人「随机图纸 / 高级图纸」在所有配方…**

- 🐛 流浪商人「随机图纸 / 高级图纸」在所有配方都制作完后自动隐藏
- 🍖 进食/饮水：饱食/水分已满时提示「吃饱/喝足」并直接 return，避免资源浪费
- 📱 制作页面小屏单列优化：<480px 屏幕改为 1 列布局，按钮横排（标题+副标）
- 🛠 新增 release.sh 一键发布：自动跑测试 + commit + tag + 打 zip 备份包

## v1.12.0 · 2026-08-10

**⚒️ 制作页新增「🔮 终极」分组**

- ⚒️ 制作页新增「🔮 终极」分组：符刃/符甲/大师炉/永恒仓库 现在可点开制作
- 🛒 流浪商人重做：从 2 件商品 → 16 件商品池（公平/稀有/神秘/现金/黑心 5 类）
- 🎲 每次遭遇随机展示 4 件商品，色块标识风险等级（🟢🟣🔵🟡🔴）
- 📜 新增 2 种神秘商品：随机图纸 / 高级图纸（终极制作直通车）
- 💰 新增「现金购物」：金币直接买食物/净水/合金/符石
- 🔧 新增 trade() 助手函数：资源不足时整体取消并友好提示

## v1.11.2 · 2026-08-10

**🐛 修复背包「幸运方块」图标重复**

- 🐛 修复背包「幸运方块」图标重复（🎲🎲 → 🎲）
- ⚔️ 武器行增加 atk 伤害数值显示（如：🔮符刃 atk 60）
- 📦 设施/装备标题不再被挤压成竖排（启用 flex-wrap + 内容换行）
- 🆕 背包设施列表改为动态遍历 RECIPES，新增 4 项 Tier 4 终极制作自动入列

## v1.11.1 · 2026-08-10

**🐛 修复 v1.11.0 启动崩溃**

- 🐛 修复 v1.11.0 启动崩溃（weaponAtk 嵌套三元括号不匹配 → 整页白屏）
- 🛡 新增「防崩溃回退」机制：启动哨兵 + localStorage 备份 + 降级页
- ↩️ 检测到崩溃时显示降级页，提供「加载上次能玩的版本」+「先导出当前存档」
- ⏮ 备份机制：每次成功启动时把当前 HTML 异步备份到 localStorage，下次崩溃可一键回退

## v1.11.0 · 2026-08-10

**🔮 新资源「符石」**

- 🔮 新资源「符石」：废墟/山丘探索 5% 掉率，Boss 战利品
- ⚒️ Tier 4 终极制作 4 项：🔮符刃/🛡符甲/🔥大师炉/🏛永恒仓库（满足后期长线目标）
- 🏆 扩展天数里程碑 60/100/180 天，触发大事件奖励（金币+食物+金属+合金）
- ⏳ 100 天后解锁废土元老（60）/ 永夜守护者（100）/ 传奇幸存者（180）

## v1.10.0 · 2026-08-10

**📈 新增「进度总览」**

- 📈 新增「进度总览」：生存/制作/强化/技能/武器路线/兽王/成就 7 大区块进度条
- ⏭ 自动提示下一个大事件（还差几天/缺什么材料），方便观察进度速度

## v1.9.2 · 2026-08-10

**🐛 修复探索事件弹窗 5 处日志未解析 \${RE…**

- 🐛 修复探索事件弹窗 5 处日志未解析 \${RES_NAMES.x}（单引号改为反引号模板字符串）

## v1.9.1 · 2026-08-10

**🐛 修复幸运方块 6 处日志未解析 \${RES_…**

- 🐛 修复幸运方块 6 处日志未解析 \${RES_NAMES.x}（单引号改为反引号模板字符串）

## v1.9.0 · 2026-08-10

**🎨 日志与物品栏物品全部加上 emoji 图标**

- 🎨 日志与物品栏物品全部加上 emoji 图标（资源/设施/武器/材料）
- 🏷 版本号增加 build code 构建号，方便版本追溯

## v1.8.1 · 2026-08-10

**🐛 修复背包页被 iOS Safari URL …**

- 🐛 修复背包页被 iOS Safari URL 栏遮挡（#actions max-height+overflow 滚动 + 底部 padding 兼容）

## v1.8.0 · 2026-08-10

**🎲 新道具「幸运方块」**

- 🎲 新道具「幸运方块」：17 种随机效果（金属/皮革/食物/金币/合金…或陷阱/疾病/爆炸），黑市 60💰 购入，探索/Boss 战利品低概率掉落
- 🐛 修复连续点击按钮触发 iOS 双击放大页面（CSS touch-action: manipulation 强制禁止）
- 🛡 导入的存档自动打标记，刷新页面跳过离线结算（防止更新游戏后掉饥饿坏档）

## v1.7.1 · 2026-08-10

**🐛 修复批量出售后弹窗无法退出**

- 🐛 修复批量出售后弹窗无法退出（关闭时强制失焦收起键盘 + 锁定背景滚动）
- 🐛 修复商店购买后余额不刷新（实时更新 + 金币不足自动禁用购买按钮）

## v1.7.0 · 2026-08-10

**💸 背包出售升级**

- 💸 背包出售升级：自定义数量 + 一键全部 + 实时金币预览 + 确认对话框

## v1.6.0 · 2026-08-10

**📷 导出存档生成二维码，另一台设备扫码即可获取存…**

- 📷 导出存档生成二维码，另一台设备扫码即可获取存档文本
- 🔍 导入支持摄像头实时扫码（需授权相机，不支持时自动提示粘贴）
- 💾 存档新增压缩格式 EMQR1（LZ 压缩），扫码/粘贴均可识别

## v1.5.0 · 2026-08-09

**⚒️ 强化系统**

- ⚒️ 强化系统：武器/斧头/鱼竿/捕兽夹各可强化 10 级，材料随等级递增，后期永远有目标
- 🔩 合金合成链：铁匠炉「熔炼」金属+石头 → 合金，用于传说武器
- 🗡 三阶传说武器「猎王刀」：钢刀+合金+皮革
- 🏷 制作页按 基础/进阶/传说 分组显示

## v1.4.1 · 2026-08-09

**🐛 修复设施停摆日志括号为空**

- 🐛 修复设施停摆日志括号为空（捕兽夹缺金属时显示「缺少材料（）」）
- 现在显示真正缺少的材料，如「缺少材料（金属×1）」

## v1.4.0 · 2026-08-09

**⚒️ 二阶制作链**

- ⚒️ 二阶制作链：铁斧/钢刀/温室/瞭望塔，材料消耗大幅提升，制作完一阶还有新目标
- 🔧 设施每日维护：火堆/净水器/捕兽夹每天消耗材料，缺料停摆一天
- 👹 第 30 天起可遭遇「废土兽王」Boss，击败获得大量战利品
- 😴 睡觉消耗食物与水，饿着肚子睡不着好觉
- 📈 第 30 天起生存消耗 +15%，后期不再轻松躺赢

## v1.3.1 · 2026-08-09

**🐛 修复废墟探索偶现「undefined ×1」…**

- 🐛 修复废墟探索偶现「undefined ×1」文本（缺失 med 资源名映射，已改为 herb）
- 🛡 探索/出售文本增加兜底防御：未注册的资源 key 显示自身名而非 undefined

## v1.3.0 · 2026-08-09

**🔴 制作材料不足时**

- 🔴 制作材料不足时：需求数字变红并显示库存（如 石5(3)）
- 📜 新增游戏内更新日志

## v1.2.0 · 2026-08-09

**🎮 参考 Melvor Idle 重构**

- 🎮 参考 Melvor Idle 重构：放置自动循环、技能等级+XP、离线收益结算、金币与黑市商店、即时进食/饮水
- 📦 存档格式升级至 v2，旧档自动迁移防坏档
- 🖥 底部面板压缩 + 折叠按钮，日志区扩大

## v1.1.0 · 2026-08-09

**🏷 版本号展示（开局/菜单/结算页）**

- 🏷 版本号展示（开局/菜单/结算页）
- 🔁 旧版存档导入自动升级，杜绝坏档
- 🐛 修复里程碑 undefined 显示

## v1.0.0 · 2026-08-09

**🔥 末日余烬首发**

- 🔥 末日余烬首发：末日生存文字冒险
- 🎲 探索随机事件 / 战斗 / 季节天气 / 制作 / 里程碑
- 💾 localStorage 本地存档 + 导出/导入存档

`,Dn=[[`MAJOR · 主版本`,`不兼容的重大重构（运行形态 / 工程结构）或存档不兼容`,`如 3.0.0`],[`MINOR · 次版本`,`新增功能（向后兼容）`,`如 1.4.0`],[`PATCH · 修订号`,`缺陷修复（向后兼容）`,`如 1.3.1`]];function On(e){let t=[],n=null;for(let r of String(e).split(`
`)){let e=/^## v([0-9.]+) · (\d{4}-\d{2}-\d{2})/.exec(r);if(e){n={ver:e[1],date:e[2],title:``,notes:[]},t.push(n);continue}if(!n)continue;let i=/^\*\*(.+)\*\*$/.exec(r);if(i){n.title=i[1];continue}let a=/^- (.+)$/.exec(r);a&&n.notes.push(a[1])}return t}function kn(e){return{versions:e.length,notes:e.reduce((e,t)=>e+t.notes.length,0),latest:e[0]??null}}var An=On(En);function jn(e,t,n){let r=[`v${e}`];return t!=null&&String(t)!==``&&r.push(`build ${t}`),n&&r.push(String(n)),r.join(` · `)}var Mn=`pwa_tip_install`,Nn=`pwa_tip_ios`,Pn=`pwaBanner`,L={deferredPrompt:null,swReg:null,standalone:!1,versionAsked:``};function Fn(e){try{return localStorage.getItem(e)}catch{return null}}function In(e,t){try{localStorage.setItem(e,t)}catch{}}function Ln(e=globalThis){return!!(e.matchMedia&&e.matchMedia(`(display-mode: standalone)`))?.matches||e.navigator?.standalone===!0}function Rn(e=globalThis.navigator){let t=String(e?.userAgent||``);return/iPad|iPhone|iPod/.test(t)||e?.platform===`MacIntel`&&Number(e?.maxTouchPoints)>1}function zn(e){return e.standalone?!1:e.hasPrompt||e.ios}function Bn(){return zn({standalone:Ln(),hasPrompt:!!L.deferredPrompt,ios:Rn()})}function R(e,t,n){let r=document.getElementById(Pn);r||(r=document.createElement(`div`),r.id=Pn,document.body.appendChild(r)),r.innerHTML=e+(n?`<span class="pwa-x">✕</span>`:``),r.onclick=e=>{e.target?.className===`pwa-x`?z():t&&t()},r.style.display=`block`}function z(){let e=document.getElementById(Pn);e&&(e.style.display=`none`)}function Vn(){if(L.deferredPrompt){let e=L.deferredPrompt;L.deferredPrompt=null;try{e.prompt()}catch{}e.userChoice&&e.userChoice.then(()=>z()).catch(()=>{}),In(Mn,`1`)}else Rn()&&R(`📲 iOS 安装：点底部「分享」→「添加到主屏幕」，之后可全屏离线玩`,()=>z(),!0)}async function Hn(e){if(/^https?:$/.test(location.protocol))try{let t=await fetch(`./version.json`,{cache:`no-store`});if(!t.ok)return;let n=await t.json();n&&n.ver&&n.ver!==e&&L.versionAsked!==n.ver&&(L.versionAsked=n.ver,R(`🔥 发现新版本 v`+n.ver+`，点此刷新`,()=>location.reload()))}catch{}}function Un(e){let t=e.version,n=e.toast??(()=>{});L.standalone=Ln(),window.addEventListener(`offline`,()=>{R(`🌐✕ 当前离线：已缓存的版本仍可正常游玩`)}),window.addEventListener(`online`,()=>{z(),n(`🌐 网络已恢复`)}),navigator.onLine||setTimeout(()=>R(`🌐✕ 当前离线：已缓存的版本仍可正常游玩`),1200),window.addEventListener(`beforeinstallprompt`,e=>{e.preventDefault(),L.deferredPrompt=e,Fn(Mn)||R(`📲 可安装到桌面，点此一键安装`,()=>Vn())}),window.addEventListener(`appinstalled`,()=>{L.deferredPrompt=null,In(Mn,`1`),z(),n(`✅ 已安装到桌面`)}),Rn()&&!L.standalone&&setTimeout(()=>{Fn(Nn)||R(`📲 点「分享」→「添加到主屏幕」，可全屏离线玩 <span style="opacity:.7">（点此关闭）</span>`,()=>{In(Nn,`1`),z()})},3500);try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch{}if(!(`serviceWorker`in navigator&&(/^https:$/.test(location.protocol)||/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))))return;let r=!!navigator.serviceWorker.controller;navigator.serviceWorker.register(`sw.js`,{updateViaCache:`none`}).then(e=>{L.swReg=e,e.addEventListener(`updatefound`,()=>{let t=e.installing;t&&t.addEventListener(`statechange`,()=>{t.state===`installed`&&navigator.serviceWorker.controller&&R(`🔥 新版本已下载，点此刷新生效`,()=>location.reload())})})}).catch(()=>{}),navigator.serviceWorker.addEventListener(`controllerchange`,()=>{r&&R(`🔥 已更新到新版本，点此刷新`,()=>location.reload())}),document.addEventListener(`visibilitychange`,()=>{document.hidden||(L.swReg&&L.swReg.update&&L.swReg.update().catch(()=>{}),Hn(t))}),setTimeout(()=>Hn(t),8e3)}var Wn=c(o(((e,t)=>{var n=(function(){var e=String.fromCharCode,t=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=`,n=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$`,r={};function i(e,t){if(!r[e]){r[e]={};for(var n=0;n<e.length;n++)r[e][e.charAt(n)]=n}return r[e][t]}var a={compressToBase64:function(e){if(e==null)return``;var n=a._compress(e,6,function(e){return t.charAt(e)});switch(n.length%4){default:case 0:return n;case 1:return n+`===`;case 2:return n+`==`;case 3:return n+`=`}},decompressFromBase64:function(e){return e==null?``:e==``?null:a._decompress(e.length,32,function(n){return i(t,e.charAt(n))})},compressToUTF16:function(t){return t==null?``:a._compress(t,15,function(t){return e(t+32)})+` `},decompressFromUTF16:function(e){return e==null?``:e==``?null:a._decompress(e.length,16384,function(t){return e.charCodeAt(t)-32})},compressToUint8Array:function(e){for(var t=a.compress(e),n=new Uint8Array(t.length*2),r=0,i=t.length;r<i;r++){var o=t.charCodeAt(r);n[r*2]=o>>>8,n[r*2+1]=o%256}return n},decompressFromUint8Array:function(t){if(t==null)return a.decompress(t);for(var n=Array(t.length/2),r=0,i=n.length;r<i;r++)n[r]=t[r*2]*256+t[r*2+1];var o=[];return n.forEach(function(t){o.push(e(t))}),a.decompress(o.join(``))},compressToEncodedURIComponent:function(e){return e==null?``:a._compress(e,6,function(e){return n.charAt(e)})},decompressFromEncodedURIComponent:function(e){return e==null?``:e==``?null:(e=e.replace(/ /g,`+`),a._decompress(e.length,32,function(t){return i(n,e.charAt(t))}))},compress:function(t){return a._compress(t,16,function(t){return e(t)})},_compress:function(e,t,n){if(e==null)return``;for(var r,i,a={},o={},s=``,c=``,l=``,u=2,d=3,f=2,p=[],m=0,h=0,g=0;g<e.length;g+=1)if(s=e.charAt(g),Object.prototype.hasOwnProperty.call(a,s)||(a[s]=d++,o[s]=!0),c=l+s,Object.prototype.hasOwnProperty.call(a,c))l=c;else{if(Object.prototype.hasOwnProperty.call(o,l)){if(l.charCodeAt(0)<256){for(r=0;r<f;r++)m<<=1,h==t-1?(h=0,p.push(n(m)),m=0):h++;for(i=l.charCodeAt(0),r=0;r<8;r++)m=m<<1|i&1,h==t-1?(h=0,p.push(n(m)),m=0):h++,i>>=1}else{for(i=1,r=0;r<f;r++)m=m<<1|i,h==t-1?(h=0,p.push(n(m)),m=0):h++,i=0;for(i=l.charCodeAt(0),r=0;r<16;r++)m=m<<1|i&1,h==t-1?(h=0,p.push(n(m)),m=0):h++,i>>=1}u--,u==0&&(u=2**f,f++),delete o[l]}else for(i=a[l],r=0;r<f;r++)m=m<<1|i&1,h==t-1?(h=0,p.push(n(m)),m=0):h++,i>>=1;u--,u==0&&(u=2**f,f++),a[c]=d++,l=String(s)}if(l!==``){if(Object.prototype.hasOwnProperty.call(o,l)){if(l.charCodeAt(0)<256){for(r=0;r<f;r++)m<<=1,h==t-1?(h=0,p.push(n(m)),m=0):h++;for(i=l.charCodeAt(0),r=0;r<8;r++)m=m<<1|i&1,h==t-1?(h=0,p.push(n(m)),m=0):h++,i>>=1}else{for(i=1,r=0;r<f;r++)m=m<<1|i,h==t-1?(h=0,p.push(n(m)),m=0):h++,i=0;for(i=l.charCodeAt(0),r=0;r<16;r++)m=m<<1|i&1,h==t-1?(h=0,p.push(n(m)),m=0):h++,i>>=1}u--,u==0&&(u=2**f,f++),delete o[l]}else for(i=a[l],r=0;r<f;r++)m=m<<1|i&1,h==t-1?(h=0,p.push(n(m)),m=0):h++,i>>=1;u--,u==0&&(u=2**f,f++)}for(i=2,r=0;r<f;r++)m=m<<1|i&1,h==t-1?(h=0,p.push(n(m)),m=0):h++,i>>=1;for(;;){if(m<<=1,h==t-1){p.push(n(m));break}h++}return p.join(``)},decompress:function(e){return e==null?``:e==``?null:a._decompress(e.length,32768,function(t){return e.charCodeAt(t)})},_decompress:function(t,n,r){var i=[],a=4,o=4,s=3,c=``,l=[],u,d,f,p,m,h,g,_={val:r(0),position:n,index:1};for(u=0;u<3;u+=1)i[u]=u;for(f=0,m=4,h=1;h!=m;)p=_.val&_.position,_.position>>=1,_.position==0&&(_.position=n,_.val=r(_.index++)),f|=+(p>0)*h,h<<=1;switch(f){case 0:for(f=0,m=256,h=1;h!=m;)p=_.val&_.position,_.position>>=1,_.position==0&&(_.position=n,_.val=r(_.index++)),f|=+(p>0)*h,h<<=1;g=e(f);break;case 1:for(f=0,m=2**16,h=1;h!=m;)p=_.val&_.position,_.position>>=1,_.position==0&&(_.position=n,_.val=r(_.index++)),f|=+(p>0)*h,h<<=1;g=e(f);break;case 2:return``}for(i[3]=g,d=g,l.push(g);;){if(_.index>t)return``;for(f=0,m=2**s,h=1;h!=m;)p=_.val&_.position,_.position>>=1,_.position==0&&(_.position=n,_.val=r(_.index++)),f|=+(p>0)*h,h<<=1;switch(g=f){case 0:for(f=0,m=256,h=1;h!=m;)p=_.val&_.position,_.position>>=1,_.position==0&&(_.position=n,_.val=r(_.index++)),f|=+(p>0)*h,h<<=1;i[o++]=e(f),g=o-1,a--;break;case 1:for(f=0,m=2**16,h=1;h!=m;)p=_.val&_.position,_.position>>=1,_.position==0&&(_.position=n,_.val=r(_.index++)),f|=+(p>0)*h,h<<=1;i[o++]=e(f),g=o-1,a--;break;case 2:return l.join(``)}if(a==0&&(a=2**s,s++),i[g])c=i[g];else if(g===o)c=d+d.charAt(0);else return null;l.push(c),i[o++]=d+c.charAt(0),a--,d=c,a==0&&(a=2**s,s++)}}};return a})();typeof define==`function`&&define.amd?define(function(){return n}):t!==void 0&&t!=null?t.exports=n:typeof angular<`u`&&angular!=null&&angular.module(`LZString`,[]).factory(`LZString`,function(){return n})}))(),1),Gn=m,Kn=`EMBER1`,qn=`EMQR1`;function Jn(e){return btoa(unescape(encodeURIComponent(e)))}function Yn(e){let t=String(e).replace(/\s+/g,``).replace(/-/g,`+`).replace(/_/g,`/`);for(;t.length%4;)t+=`=`;return decodeURIComponent(escape(atob(t)))}function Xn(e,t){return`${Gn}:${Jn(re(e,t))}`}function Zn(e,t){return`${qn}:${Wn.default.compressToBase64(re(e,t))}`}function Qn(e,t=Date.now()){let n=String(e??``).replace(/^\uFEFF/,``).trim();if(!n)return null;let r=(e,n)=>{let r=ie(e,t);if(!r)return null;let i=e.fmt|0||1;return{state:r,isOld:n||i<11}},i=[{tag:qn,kind:`qr`},{tag:Kn,kind:`legacy`},{tag:Gn,kind:`code`}],a=n.toLowerCase(),o=null;for(let e of i){let t=a.indexOf(e.tag.toLowerCase()+`:`);t>=0&&(!o||t<o.at)&&(o={...e,at:t})}if(o)try{let e=n.slice(o.at+o.tag.length+1);if(o.kind===`qr`){let t=Wn.default.decompressFromBase64(e.replace(/\s+/g,``));if(t)return r(JSON.parse(t),!1)}else return r(JSON.parse(Yn(e)),o.kind===`legacy`)}catch{}try{let e=n.indexOf(`{`),t=n.lastIndexOf(`}`);return e<0||t<=e?null:r(JSON.parse(n.slice(e,t+1)),!1)}catch{return null}}var $n=`EMQ2`;function er(e){let t=5381;for(let n=0;n<e.length;n++)t=(t<<5)+t+e.charCodeAt(n)|0;return(t>>>0).toString(36).padStart(6,`0`).slice(-6)}function tr(e,t=520){let n=String(e),r=Math.max(120,Math.floor(t));if(n.length<=r)return{id:``,total:1,frames:[n]};let i=er(n),a=[];for(let e=0;e<n.length;e+=r)a.push(n.slice(e,e+r));let o=a.length;return{id:i,total:o,frames:a.map((e,t)=>`${$n}|${i}|${t+1}/${o}|${e}`)}}function nr(e){let t=String(e??``).trim();if(!t.startsWith(`EMQ2|`))return null;let n=/^EMQ2\|([a-z0-9]+)\|(\d+)\/(\d+)\|([\s\S]+)$/.exec(t);if(!n)return null;let r=Number(n[2]),i=Number(n[3]);return!r||!i||r>i||i>99?null:{id:n[1],seq:r,total:i,part:n[4]}}var rr=class{constructor(){this.cur=null}add(e){this.cur&&this.cur.id===e.id&&this.cur.total===e.total||(this.cur={id:e.id,total:e.total,parts:new Map}),this.cur.parts.set(e.seq,e.part);let t=this.cur.parts.size;if(t<this.cur.total)return{text:null,got:t,total:this.cur.total};let n=``;for(let e=1;e<=this.cur.total;e++){let r=this.cur.parts.get(e);if(r===void 0)return{text:null,got:t,total:this.cur.total};n+=r}return this.cur=null,{text:n,got:t,total:0}}has(e){return!!this.cur&&this.cur.id===e.id&&this.cur.parts.has(e.seq)}reset(){this.cur=null}},ir=`modulepreload`,ar=function(e,t){return new URL(e,t).href},or={},sr=function(e){return e.pathname.endsWith(`.css`)},cr=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},lr=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=ar(t,n);let r=s(t),i=sr(r);return cr(or,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:ir,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{t.addEventListener(`load`,e),t.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${r}`)))})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},ur=`3.0.10`,dr=jn(ur,`113`,`0b534ee`),fr=`ember_save_v1`,pr=u(),mr=1600,B=null,V=[],hr=null,H=`forest`,gr=`act`,_r=!1,vr=null,yr=[],br=null,U=e=>document.getElementById(e),W=e=>pr[e]||e,xr=(e,t,n)=>Math.max(t,Math.min(n,e)),G=(e,t)=>{let n=e;return n&&typeof n.closest==`function`?n.closest(t):null};function Sr(){try{let e=localStorage.getItem(fr);return e?ie(JSON.parse(e)):null}catch{return null}}function K(){try{B.lastSeen=Date.now(),localStorage.setItem(fr,re(B,ur))}catch{}}function q(e,t=`sys`){V.push({text:e,cls:t}),V.length>300&&V.shift(),wr()}var Cr;function J(e){let t=U(`toast`);t.textContent=e,t.classList.add(`show`),clearTimeout(Cr),Cr=setTimeout(()=>t.classList.remove(`show`),1600)}function wr(){let e=U(`logwrap`);e&&(e.innerHTML=V.map(e=>`<div class="logline ${e.cls}">${e.text}</div>`).join(``),e.scrollTop=e.scrollHeight)}function Tr(e,t){let n=U(`f-`+e),r=U(`v-`+e);n&&(n.style.width=xr(t,0,100)+`%`),r&&(r.textContent=String(t))}function Er(){U(`v-day`).textContent=String(B.day),U(`v-phase`).textContent=B.hour>=6&&B.hour<18?`白天`:`夜晚`,U(`v-season`).textContent=ae[B.season]+`季`,U(`v-weather`).textContent=oe[B.weather],U(`goldinfo`).textContent=`💰`+B.gold,Tr(`hp`,B.hp),Tr(`food`,B.food),Tr(`water`,B.water),Tr(`stam`,B.stam)}function Dr(){let e=U(`actions`);if(!e)return;e.classList.remove(`bag-mode`);let t=[];for(let e in v){if(e===`eat`||e===`drink`)continue;let n=v[e],r=B.autoAction===e;t.push(`<button class="actbtn${r?` on`:``}" data-kind="${e}"><span class="n">${n.name}${r?` ·进行中`:``}</span><span class="sub">${n.sub||``}</span></button>`)}e.innerHTML=t.join(``)}function Or(){let e=U(`activebar`);e&&(B.autoAction&&v[B.autoAction]?(e.classList.add(`show`),U(`activeName`).textContent=v[B.autoAction].name):e.classList.remove(`show`))}function Y(){Er(),Ur(),jr(),Or(),kr()}function kr(){let e=U(`zonebar`),t=U(`actions`),n=U(`btnFold`);e&&(e.style.display=gr===`act`&&!_r?`flex`:`none`),t&&(t.style.display=_r?`none`:``),n&&(n.textContent=_r?`▴`:`▾`)}function Ar(){_r=!_r,kr();let e=U(`logwrap`);e&&(e.scrollTop=e.scrollHeight)}function jr(){let e=U(`actions`);e&&(e.classList.remove(`bag-mode`,`craft-mode`),gr===`bag`?Vr():gr===`craft`?zr():Dr())}function Mr(e){for(let t of e||[])if(t===`stage`)for(let e of At(B).logs)q(e.text,e.cls);else if(t===`armorSet`)for(let e of jt(B).logs)q(e.text,e.cls);else for(let e of F(B,t).logs)q(e.text,e.cls)}function Nr(e){return Object.keys(e).map(t=>{let n=B.res[t]||0,r=e[t];return`<span style="color:${n>=r?`var(--txt-dim)`:`var(--bad)`}">${W(t)} ${n}/${r}</span>`}).join(` · `)}function Pr(e){if(e.refused)return J(e.refused);for(let t of e.logs||[])q(t.text,t.cls);Mr(e.achievements),e.time&&Gr(e.time),Y(),K()}function Fr(e){let t=U(`actions`),n=U(e);t&&n&&t.scrollTo({top:Math.max(0,n.offsetTop-t.offsetTop-4),behavior:`smooth`})}function Ir(e){let t=xe(B),n=Math.round((1-t)*100);e.push(`<div class="armor-sum"><span>🛡 当前总减伤 <b>${n}%</b></span><span class="mult">受伤倍率 ${t.toFixed(2)}</span></div>`),e.push(`<div class="craft-sep" id="craftArmor">🛡 装备（材质链：皮→铜→铁→银→金→钢，需先装备低级）</div>`);for(let t in C){let n=C[t].name,r=be(B,t),i=S[r]||null,a=we(B,t),o,s=``;if(!a)o=`<div class="mat" style="color:var(--ok)">已是最强（${i.name}）</div>`;else if(!Te(B,a))o=`<div class="mat" style="color:var(--txt-faint)">收集材料后可制作</div>`;else{let e=S[a];o=`<div class="mat">`+Nr(e.cost)+`</div>`,k(B,e.cost)&&(s=`<button class="make" data-armor="${t}:${a}">${r===`none`?`制作并穿上`:`升级到`}${e.name}${n}（减伤 ${Math.round((1-e.dmg)*100)}%）</button>`)}let c=i?`${i.name}${n}（减伤 ${Math.round((1-i.dmg)*100)}%）`:`空`;e.push(`<div class="craft-item">
      <div class="name">${n}<span class="desc">当前：${c}</span></div>
      ${o}${s}
    </div>`)}}function Lr(e){e.push(`<div class="craft-sep" id="craftUp">⬆ 强化（材料随等级递增 · Lv.11 起需符石+合金）</div>`);for(let t in b){let n=b[t],r=B.upgrades[t]||0,i=n.max||10,a=r>=10?`<span class="tag">⭐ 高级</span>`:``,o,s=``;if(n.need&&!B.items[n.need])o=`<div class="mat" style="color:var(--warn)">需要先制作 ${y[n.need].name}</div>`;else if(r>=i)o=`<div class="mat" style="color:var(--ok)">已满级</div>`;else{let e=ge(t,r);o=`<div class="mat">Lv.${r}/${i} · ${Nr(e)}</div>`,k(B,e)&&(s=`<button class="make" data-upgrade="${t}">强化到 Lv.${r+1}</button>`)}e.push(`<div class="craft-item">
      <div class="name">${n.name}${a}<span class="desc">${n.desc}</span></div>
      ${o}${s}
    </div>`)}}function Rr(e){if(e.push(`<div class="craft-sep" id="craftEn">🔮 附魔（需附魔台 · 附魔台等级 = 附魔上限）</div>`),!B.items.enchantTbl){let t=y.enchantTbl;e.push(`<div class="craft-item">
      <div class="name">🔮附魔台<span class="desc">${t.desc}</span></div>
      <div class="mat" style="color:var(--warn)">需要先制作 🔮附魔台 · ${Nr(t.cost)}</div>
    </div>`);return}let t=B.enchant.tblLv||0,n,r=``;if(t>=5)n=`<div class="mat" style="color:var(--ok)">已满级 · 可附魔至 5 级</div>`;else{let e=ye(t);n=`<div class="mat">Lv.${t}/5 · ${Nr(e)}</div>`,k(B,e)&&(r=`<button class="make" data-enchtbl="1">升级附魔台到 Lv.${t+1}</button>`)}e.push(`<div class="craft-item">
    <div class="name">🔮附魔台<span class="desc">升级解锁更高级附魔</span></div>
    ${n}${r}
  </div>`);for(let n in w){let r=w[n],i=B.enchant[n]||0,a,o=``;if(i>=5)a=`<div class="mat" style="color:var(--ok)">Lv.${i} 已满级</div>`;else if(i>=t)a=`<div class="mat" style="color:var(--warn)">Lv.${i}/${t} · 需先把附魔台升到 Lv.${i+1}</div>`;else{let e=ve(n,i);a=`<div class="mat">Lv.${i}/${t} · ${Nr(e)}</div>`,k(B,e)&&(o=`<button class="make" data-enchant="${n}">附魔到 Lv.${i+1}</button>`)}e.push(`<div class="craft-item">
      <div class="name">${r.name}<span class="desc">${r.desc}</span></div>
      ${a}${o}
    </div>`)}}function zr(){let e=U(`actions`);if(!e)return;e.classList.add(`craft-mode`);let t=[`<div class="craftnav"><button class="cnav" data-cnav="craft0">⚒ 制作</button><button class="cnav" data-cnav="craftArmor">🛡 装备</button><button class="cnav" data-cnav="craftUp">⬆ 强化</button><button class="cnav" data-cnav="craftEn">🔮 附魔</button></div>`],n={};for(let e in y){let t=y[e];Ce(B,e)&&(n[t.tier]=n[t.tier]||[]).push([e,t])}let r=[];for(let e of Object.keys(n).sort()){r.push(`<div class="craft-tier">第 ${e} 阶</div>`);for(let[t,i]of n[e]){let e=!!B.items[t],n=!i.needLv||i.skill&&(B.skills[i.skill]?.lvl||1)>=i.needLv,a=!i.need||!!B.items[i.need],o=k(B,i.cost),s=!e&&n&&a&&o,c=``;if(e)c=`<div class="mat" style="color:var(--ok)">✅ 已制作</div>`;else if(!a)c=`<div class="mat" style="color:var(--warn)">需要先制作 ${y[i.need].name}</div>`;else if(n)c=`<div class="mat">`+Nr(i.cost)+`</div>`;else{let e=B.skills[i.skill]?.lvl||1;c=`<div class="mat" style="color:var(--warn)">需要 ${pe[i.skill]||i.skill} Lv.${i.needLv}（当前 Lv.${e}）</div>`}r.push(`<div class="craft-item">
        <div class="name">${i.name}<span class="desc">${i.desc}</span></div>
        ${c}
        ${s?`<button class="make" data-craft="${t}">制作（${i.time} 小时）</button>`:``}
      </div>`)}}t.push(`<div id="craft0">${r.join(``)}</div>`),Ir(t),Lr(t),Rr(t),e.innerHTML=t.join(``)}function Br(e){Pr(Ee(B,e))}function Vr(){let e=U(`actions`);if(!e)return;e.classList.add(`bag-mode`);let t=d(),n=[];n.push(`<div class="bag-eatdrink"><button class="actbtn" data-bag-act="eat"><span>🍽 进食</span><span class="sub">饱食 ${B.food}/100</span></button><button class="actbtn" data-bag-act="drink"><span>💧 饮水</span><span class="sub">水分 ${B.water}/100</span></button></div>`);for(let e of l){let r=B.res[e.id]||0,i=t[e.id],a=!!i&&r>0;n.push(`<div class="bagrow"><span>${e.name} <span class="cnt">×${r}</span></span><span style="display:flex;align-items:center;gap:6px"><span style="font-size:11px;color:var(--txt-faint)">${i?i+`💰/个`:`不可出售`}</span><button class="sell" data-sell="${e.id}" ${a?``:`disabled style="opacity:.35"`}>出售</button></span></div>`)}e.innerHTML=n.join(``)}function Hr(e){let t=d()[e];if(!t)return J(`这个不能卖`);if((B.res[e]||0)<=0)return J(`没有可卖的`);B.res[e]--,B.gold+=t,q(`💰 卖出${W(e)} ×1，获得 ${t} 金币。`,`good`),Y(),K()}function Ur(){let e=U(`zonebar`);if(!e)return;let t=[];for(let e in M){let n=M[e],r=n.unlockDay||1;if(B.day<r){t.push(`<button class="zonebtn" style="opacity:.4" data-locked="${n.name} 需存活至第 ${r} 天解锁">🔒${n.name}</button>`);continue}let i=H===e?` on`:``;t.push(`<button class="zonebtn zone-${e}${i}" data-zone="${e}">${n.name}</button>`)}e.innerHTML=t.join(``)}function Wr(){B.day++,B.stats.days=B.day,B.season=se(B.day),B.weather=ce(B.season,Math.random);let e=le({weather:B.weather,day:B.day,hasVault:!!B.items.vault,adrenaline:(B.adrenalineLeft||0)>0});B.food=xr(B.food-e.food,0,100),B.water=xr(B.water-e.water,0,100),q(`—— 第 ${B.day} 天 · ${ae[B.season]}季 · ${oe[B.weather]} ——`,`tit`)}function Gr(e){let t=ue(B,e);for(let e=0;e<t;e++)Wr();for(let e of de(B))q(e.text,e.cls);Kr()}function Kr(){if(B.dead)return;let e=null;B.hp<=0?e=`你倒在了荒芜的大地上，再也没有起来。`:B.food<=0&&B.hp<30&&(e=`饥饿夺走了你最后的力气。`),e&&((B.res.totem||0)>0?(B.res.totem--,B.hp=100,B.food=Math.max(B.food,60),B.water=Math.max(B.water,60),B.ill=!1,B.lightWound=!1,B.heavyWound=!1,B.stam=Math.max(B.stam,60),B.stats.totemSave=(B.stats.totemSave||0)+1,q(`🪬 不死图腾在你手中碎裂！金光笼罩全身——你从死亡边缘被拉了回来！`,`good`),Y(),K()):(B.dead=!0,B.deathReason=e,B.stats.days=B.day,q(`💀 ${e}`,`bad`),q(`点击「菜单 → 重开」开始新的一世。`,`sys`),Y(),K()))}var qr={chop:e=>We(e,{},W),hunt:e=>Ge(e,{},W),fish:e=>Ye(e,{}),smelt:e=>Ke(e,{},W),mineOre:e=>qe(e,{},W),smeltOre:e=>Je(e,W),fetch:e=>Ve(e,{},W),cook:e=>He(e,{},W),boil:e=>Ue(e,{},W),eat:e=>Le(e,{}),drink:e=>Re(e,{}),sleep:e=>ze(e),heal:e=>Be(e,{},W)};function Jr(e){if(!B||B.dead)return;let t=v[e];if(!t)return;Ie(e)&&Ze(B,!0);let n=Pe(B,e);if(!n.ok){n.reason&&J(n.reason),n.stopAuto&&Ze(B);return}if(Fe(B,e,{adrenaline:(B.adrenalineLeft||0)>0}),e===`explore`){Qr(),t.time>0&&Gr(t.time),Y(),K();return}let r=qr[e],i=r?r(B):null;if(i&&i.refused)J(i.refused);else{if(i&&i.logs)for(let e of i.logs)q(e.text,e.cls);t.time>0&&Gr(t.time),Y(),K()}}function Yr(){hr||=setInterval(()=>{if(!B||B.dead)return;let e=Qe(B,{blocked:!1});e.action&&Jr(e.action),Or()},mr)}function Xr(e){if(B.autoAction===e)Ze(B),q(`⏹ 停止自动行动。`,`sys`);else{let t=Xe(B,e);if(!t.ok){J(`这个行动不能自动进行`);return}for(let e of t.logs)q(e.text,e.cls);Jr(e)}Y(),K()}function Zr(){Ze(B,!0),Y(),K()}function Qr(){let e=Tt(B,{zone:H,onEvent:()=>{let e=Et(B,H);if(e.kind===`combat`){let e=ct(B,{zone:H,tierScale:1});en(B,e),oi(e.monster)}else e.kind===`boss`?si(!1):e.kind===`pharaoh`?si(!0):e.kind===`event`&&e.event&&ei(e.event)}});for(let t of e.logs)q(t.text,t.cls)}function X(){U(`evmask`).classList.remove(`show`),U(`evwrap`).innerHTML=``,vr=null,br=null,yr=[]}function $r(e,t,n){yr=n;let r=n.map((e,t)=>`<button class="evbtn" data-idx="${t}" ${e.disabled?`disabled style="opacity:.45;cursor:not-allowed"`:``}>${Ne(e.label)}<span class="d">${Ne(e.d||``)}</span></button>`).join(``);U(`evwrap`).innerHTML=`<h4>⚡ ${Ne(e)}</h4><div class="evbox"><div class="evt">${Ne(t)}</div>${r}</div>`,U(`evmask`).classList.add(`show`)}function ei(e){vr={...e},B.stats.events++,e.id===`lost`?($r(e.title,e.text,St(B)),K()):e.kind===`merchant`?(ti(),K()):e.kind===`dora`?ni():($r(e.title,e.text,e.opts),K())}function ti(){let e=qt(B,4).map(e=>({label:e.label,d:`${e.blurb}（${Jt(B,e)?`可交易`:`材料/金币不足`}）`,disabled:!Jt(B,e),_good:e}));e.push({label:`不换了`,d:`挥手告别`,effects:[]}),$r(`流浪商人`,`一个兜帽人推着破车出现：「换点物资吗？我这有 4 样货，包你满意。」`,e)}function ni(){let e=zt(B);U(`evwrap`).innerHTML=`
    <h4>🤖 猫耳机器人</h4>
    <div class="evbox">
      <div class="evt">好感度：${e.name}（${e.fav}${e.nextNeed>0?` / 下一级还需 ${e.nextNeed}`:` / 已满级`}）</div>
      <button class="evbtn" data-dora="gift">🤝 送礼<span class="d">选个礼物提升好感度</span></button>
      <button class="evbtn" data-dora="pocket">🎒 万能口袋<span class="d">按好感度解锁</span></button>
      <button class="evbtn" data-dora="chat">💬 闲聊<span class="d">听它讲蓝胖子前辈的故事（好感 +1）</span></button>
      <button class="evbtn" data-dora="leave">👋 离开<span class="d">下次再来找它</span></button>
    </div>`,U(`evmask`).classList.add(`show`),K()}function ri(){let e=Lt.map((e,t)=>({label:e.label,d:`${e.blurb} · 好感 +${e.fav}`,disabled:!Ht(B,t),_gift:t}));e.push({label:`⬆ 返回`,d:`回到主菜单`,_back:!0}),$r(`送礼`,`选个礼物送给猫耳机器人：`,e)}function ii(){let e=Vt(B).map(e=>{let t=[e.cost>0?`💰${e.cost}`:``,...Object.keys(e.give||{}).map(t=>`${W(t)}×${e.give[t]}`)].filter(Boolean).join(` + `),n=Object.keys(e.get||{}).map(t=>`${W(t)}×${e.get[t]}`).join(`+`);return{label:e.name,d:`${e.blurb}${t?`（${t}${n?` → `+n:``}）`:``}`,disabled:!Wt(B,e),_doraGood:e}});e.length||e.push({label:`（暂无商品）`,d:`好感度不足`,disabled:!0}),e.push({label:`⬆ 返回`,d:`回到主菜单`,_back:!0}),$r(`万能口袋`,zt(B).max?`它把整个口袋翻给你看！`:`当前好感度可购买的物品：`,e)}function ai(e){let t=yr[e];if(!t)return;if(t._back){X(),ni();return}if(t._gift!==void 0){X();let e=Ut(B,t._gift);for(let t of e.logs)q(t.text,t.cls);Mr(e.achievements),Y(),K(),Kr();return}if(t._doraGood){X();let e=Gt(B,t._doraGood);e.refused&&q(e.refused,`warn`);for(let t of e.logs)q(t.text,t.cls);Mr(e.achievements),Y(),K(),Kr();return}if(t._good){X();let e=Xt(B,t._good);e.refused&&q(e.refused,`warn`);for(let t of e.logs)q(t.text,t.cls);Y(),K(),Kr();return}let n=vr,r=yr;X();let i=Ct(B,{...n||{},opts:r},e);i.refused&&q(i.refused,`warn`);for(let e of i.logs)q(e.text,e.cls);if(Mr(i.achievements),i.combat&&i.combat.length){let e=i.combat[0]||{},t=ct(B,{zone:H,tierScale:1,forceBeasts:!!e.forceBeasts});en(B,t),oi(t.monster)}Y(),K(),Kr()}function oi(e){br={monster:e,boss:!1,isPharaoh:!1},U(`evwrap`).innerHTML=`
    <h4>⚔️ 遭遇 ${e.name}！</h4>
    <div class="evbox">
      <div class="evt">${e.name}盯上了你。（❤️${e.hp} ⚔️${e.atk}）</div>
      <button class="evbtn" data-combat="fight">迎战<span class="d">拼一把</span></button>
      <button class="evbtn" data-combat="flee">逃跑<span class="d">消耗精力 · 有风险</span></button>
      ${B.res.food>0?`<button class="evbtn" data-combat="bait">扔食物引开<span class="d">生食 -2</span></button>`:``}
    </div>`,U(`evmask`).classList.add(`show`)}function si(e){let t=e?ot(B):at(B);br={monster:{...t},boss:!0,isPharaoh:e},U(`evwrap`).innerHTML=`
    <h4>🐲 ${t.name}</h4>
    <div class="evbox">
      <div class="evt">空气凝滞了——${t.name}挡在面前！（❤️${t.hp} ⚔️${t.atk}）</div>
      <button class="evbtn" data-combat="fight">迎战<span class="d">多回合对拼，直到一方倒下</span></button>
      <button class="evbtn" data-combat="flee">悄悄退走<span class="d">精力 -15 · 80% 脱身</span></button>
    </div>`,U(`evmask`).classList.add(`show`)}function ci(e){let t=br;if(X(),!t)return;let n=null;if(t.boss?e===`fight`?n=dt(B,{monster:t.monster,isPharaoh:t.isPharaoh}):e===`flee`&&(n=pt(B)):e===`fight`?n=ut(B,t.monster):e===`flee`?n=ft(B,t.monster):e===`bait`&&(n=mt(B,t.monster)),n){for(let e of n.logs)q(e.text,e.cls);Mr(n.achievements),Y(),K(),Kr()}}var li=null,ui=`monster`,Z=null,di=new rr;function fi(){U(`modal`).classList.add(`show`),document.body.style.overflow=`hidden`}function Q(){Ai(),U(`modal`).classList.remove(`show`),U(`evmask`).classList.remove(`show`),document.body.style.overflow=``;let e=document.activeElement;e&&typeof e.blur==`function`&&e.blur()}function $(e){U(`modalcard`).innerHTML=e,fi()}function pi(e,t,n,r){li=r,$(`
    <h3>${e}</h3>
    <div class="msub">${t}</div>
    <button class="mbtn danger" data-confirm-ok="1">${n}</button>
    <button class="mbtn" data-close="1">取消</button>`)}function mi(){let e=B.dead?`已死亡`:`生存中`;$(`
    <h3>☰ 菜单</h3>
    <div class="msub">末日余烬 ${dr} · 第 ${B.day} 天 · ${e}</div>
    <button class="mbtn" data-menu="shop">🏪 黑市商店（💰${B.gold}）</button>
    <button class="mbtn" data-menu="skills">🏅 技能一览</button>
    <button class="mbtn" data-menu="progress">📈 进度总览</button>
    <button class="mbtn" data-menu="wiki">📖 百科图鉴</button>
    <button class="mbtn" data-menu="changelog">📜 更新日志</button>
    ${Bn()?`<button class="mbtn" data-menu="install">📲 安装到桌面（可离线全屏玩）</button>`:``}
    <button class="mbtn" data-menu="export">📤 导出存档</button>
    <button class="mbtn" data-menu="import">📥 导入存档</button>
    <button class="mbtn" data-menu="save">💾 手动保存</button>
    <button class="mbtn" data-menu="newgame">🔄 新游戏</button>
    <button class="mbtn danger" data-menu="clear">🗑 清除本地存档</button>
    <button class="mbtn" data-close="1">关闭</button>`)}function hi(e){if(e===`shop`)return gi();if(e===`skills`)return bi();if(e===`progress`)return Si();if(e===`wiki`)return wi();if(e===`changelog`)return Ci();if(e===`install`)Q(),Vn();else{if(e===`export`)return Oi();if(e===`import`)return Pi();if(e===`save`)K(),Q(),J(`已保存`);else{if(e===`newgame`)return pi(`🔄 新游戏`,`当前进度会被覆盖，且不可恢复。`,`确定开始新游戏`,Ri);if(e===`clear`)return pi(`🗑 清除本地存档`,`本地存档会被删除，游戏回到第 1 天。`,`确定清除`,zi)}}}function gi(){let e=on.map(e=>{let t=e.ids.map(_i).join(``);return`<div class="craft-sep">${e.title}</div>${t}`}).join(``);$(`
    <h3>🏪 黑市商店</h3>
    <div class="msub">当前金币：<b id="shopGold" style="color:var(--yellow)">💰${B.gold}</b> · 金币购物随时可用</div>
    ${e}
    <button class="mbtn" data-close="1">关闭</button>`)}function _i(e){let t=cn(e);if(!t)return``;let n=ln(B,e).ok;return`<button class="mbtn" id="shopBtn_${e}" data-shop="${e}"${n?``:` disabled style="opacity:.45"`}><span style="display:flex;justify-content:space-between;align-items:center"><span>${t.name}</span><span class="shop-price" style="color:${n?`var(--yellow)`:`var(--txt-faint)`}">${t.cost} 💰</span></span></button>`}function vi(){let e=U(`shopGold`);e&&(e.textContent=`💰`+B.gold);for(let e of Object.keys(an)){let t=document.getElementById(`shopBtn_`+e);if(!t)continue;let n=ln(B,e).ok;t.disabled=!n,t.style.opacity=n?``:`.45`;let r=t.querySelector(`.shop-price`);r&&(r.style.color=n?`var(--yellow)`:`var(--txt-faint)`)}}function yi(e){let t=dn(B,e);if(t.refused)J(t.refused);else{for(let e of t.logs)q(e.text,e.cls);Y(),K(),vi(),un(B)||J(`金币已不足以再购买`)}}function bi(){$(`
    <h3>🏅 技能</h3>
    <div class="msub">等级越高效率越高 · 行动会自动获得经验</div>
    ${fn(B).map(e=>`
    <div class="skillrow">
      <div style="display:flex;justify-content:space-between"><b>${e.name} Lv.${e.lvl}</b><span style="color:var(--txt-faint)">${e.xp}/${e.need} XP</span></div>
      <div style="height:6px;margin-top:4px;background:#0e0b08;border:1px solid #2a231b;border-radius:4px"><div style="width:${e.pct}%;height:100%;background:var(--accent);border-radius:4px;transition:width .3s"></div></div>
      <div style="font-size:11px;color:var(--txt-faint);margin-top:3px">${e.desc}</div>
    </div>`).join(``)}
    <button class="mbtn" data-close="1">关闭</button>`)}function xi(e,t,n){return`<div class="pbar"><div class="pfill" style="width:${n}%"></div></div><div class="pnum">${Math.round(e)}/${t}（${n}%）</div>`}function Si(){let e=gn(B),t=vn(B),n=yn(B),r=bn(B),i=xn(B),a=Sn(B),o=Cn(B),s=wn(B),c=Tn(B),l=e.done?`🏆 已达成全部天数目标！`:`⏭ 下一个大事件：生存 ${e.next} 天（还差 ${e.left} 天）`,u=t.next?`⏭ 下一个：${t.nextName}（${t.missing}）`:`🏆 全部设施制作完成！`,d=n.perKey.map(e=>`${e.name.replace(`强化`,``)} ${e.lvl}/${e.max}`).join(` · `),f=r.rows.map(e=>`${e.name} Lv.${e.lvl}`).join(` · `),p=i.route.map(e=>`<span class="wpn${e.owned?` owned`:``}">${e.name}</span>`).join(`<span class="warrow">→</span>`),m=[`⏭ 第 30 天起探索/夜间有概率遭遇，击败奖励 🍖×30 👜×12 🔩×8 🎲×1`,`✅ 首杀完成！兽王 45 天后以「狂暴」形态回归（HP 150+）`,`🏆 二次讨伐完成！「灭世」形态蓄势待发（HP 210+）`,`👑 兽王终结者：三形态尽数讨伐，废土再无对手！`],h=[`⏭ 第 25 天起在 🏜金字塔 探索有概率遭遇（HP 220 atk 32），击败奖励 🍖×40 ⚙️×8 🔮×2 💰×120`,`✅ 首杀！法老 30 天后以「死亡执政官」回归（HP 320 atk 44）`,`🏆 二度讨伐！「永恒法老」终极形态蓄势待发（HP 420 atk 56）`,`👁 王者归来：三形态尽数讨伐，金字塔归于沉寂！`],g=s.max?`❤ 已是家人！它的万能口袋为你敞开。`:`🔧 废墟探索有概率遇到，送礼提升好感 · 下一级「${s.nextName}」还需 ${s.nextNeed}`,_=c.done.length?c.done.map(e=>`<span class="ach on">✅ ${e.label}</span>`).join(``):`<span class="ach">暂无达成成就，快去冒险吧！</span>`,ee=c.left.map(e=>`<span class="ach">⬜ ${e.label}</span>`).join(``),te=[`<div class="prow"><div class="ptitle">🌄 生存天数 <span class="ptag">${e.cur}/${e.max} 天</span></div>`+xi(e.cur,e.max,e.pct)+`<div class="pnote">${l}</div></div>`,`<div class="prow"><div class="ptitle">⚒️ 制作进度 <span class="ptag">${t.made}/${t.total}</span></div>`+xi(t.made,t.total,t.pct)+`<div class="pnote">${u}</div></div>`,`<div class="prow"><div class="ptitle">⬆️ 强化进度 <span class="ptag">${n.total}/${n.max}</span></div>`+xi(n.total,n.max,n.pct)+`<div class="pnote">${d}</div></div>`,`<div class="prow"><div class="ptitle">🏅 技能等级 <span class="ptag">${r.total}/${r.max}</span></div>`+xi(r.total,r.max,r.pct)+`<div class="pnote">${f}</div></div>`,`<div class="prow"><div class="ptitle">🗡️ 武器路线 <span class="ptag">${i.current.name}</span></div><div class="wpnrow">${p}</div></div>`,`<div class="prow"><div class="ptitle">👹 废土兽王 <span class="ptag">${a.kills?`已击败 `+a.kills+` 次`:`未击败`}</span></div><div class="pnote">${m[a.stage]}</div></div>`,`<div class="prow"><div class="ptitle">🏜 法老王 <span class="ptag">${o.kills?`已击败 `+o.kills+` 次`:`未击败`}</span></div><div class="pnote">${h[o.stage]}</div></div>`,`<div class="prow"><div class="ptitle">🤖 猫耳机器人 <span class="ptag">${s.name}（${s.fav}）</span></div><div class="pnote">${g}</div></div>`,`<div class="prow"><div class="ptitle">🏆 成就 <span class="ptag">${c.doneCount}/${c.total}</span></div>`+xi(c.doneCount,c.total,c.pct)+`<div class="pnote" style="display:flex;align-items:center;gap:8px">✅ 已达成 <b>${c.doneCount}</b> 个 · `+(c.left.length?`<span style="cursor:pointer;color:var(--accent)" data-ach-toggle="1">查看剩余 ${c.left.length} 个未解锁 ▾</span>`:`🎉 全部达成！`)+`</div><div class="achlist">${_}</div>`+(c.left.length?`<div id="leftAchList" class="achlist" style="display:none">${ee}</div>`:``)+`</div>`];$(`
    <h3>📈 进度总览</h3>
    <div class="msub">第 ${B.day} 天 · 看看离大事件还差多远</div>
    ${te.join(``)}
    <button class="mbtn" data-close="1">关闭</button>`)}function Ci(){let e=kn(An),t=Dn.map(e=>`· <b>${e[0]}</b>：${e[1]} → <span style="color:var(--accent)">${e[2]}</span>`).join(`<br>`),n=An.map(e=>`
    <div class="skillrow">
      <div style="display:flex;justify-content:space-between"><b>v${e.ver}</b><span style="color:var(--txt-faint)">${e.date}</span></div>
      ${e.title?`<div style="font-size:13px;font-weight:700;color:var(--yellow);margin-top:4px">${e.title}</div>`:``}
      <ul style="margin:6px 0 0 18px;font-size:12px;color:var(--txt-dim);line-height:1.75;padding:0">${e.notes.map(e=>`<li>${e}</li>`).join(``)}</ul>
    </div>`).join(``);$(`
    <h3>📜 更新日志</h3>
    <div class="msub">共 ${e.versions} 个版本 / ${e.notes} 条更新</div>
    <div class="skillrow" style="border-color:var(--accent2)">
      <div style="display:flex;justify-content:space-between"><b>📏 版本规则（SemVer）</b><span style="color:var(--txt-faint)">当前 ${dr}</span></div>
      <div style="font-size:11.5px;color:var(--txt-dim);line-height:1.7;margin-top:4px">
        ${t}
        <br>· 参考：<span style="color:var(--txt-faint)">semver.org/lang/zh-CN</span>
      </div>
    </div>
    ${n}
    <button class="mbtn" data-close="1">关闭</button>`)}function wi(){Ti()}function Ti(){let e=ui===`monster`,t=e?nn(B):rn(),n=tn(B),r=e?`已解锁 ${n.unlocked}/${n.total} · 遭遇过才会显示数值`:`${t.length-1} 种资源 + 附魔系统 · 全部可见`,i=`flex:1;background:rgba(255,200,80,.18);border-color:var(--accent);color:var(--yellow)`,a=`flex:1`,o=t.map(t=>Ei(t,!e)).join(``);$(`
    <h3>📖 百科图鉴</h3>
    <div class="msub">${r}</div>
    <div style="display:flex;gap:6px;margin:10px 0">
      <button class="mbtn" style="${e?i:a}" data-wiki-tab="monster">👹 怪物图鉴</button>
      <button class="mbtn" style="${e?a:i}" data-wiki-tab="mats">📦 材料百科</button>
    </div>
    <div style="max-height:46vh;overflow-y:auto">${o}</div>
    <button class="mbtn" data-close="1">关闭</button>`)}function Ei(e,t){let n=t||!!e.seen,r=n?e.lines.map(e=>`<div class="wiki-line">${e}</div>`).join(``):`<div class="wiki-line">❤️ ？？？ · ⚔️ ？？？</div><div class="wiki-line">🎁 ？？？</div><div class="wiki-line faint">🤫 属性未知 · 遭遇后解锁</div>`,i=e.tag?` <span class="wiki-tag">${e.tag}</span>`:``,a=n?``:` <span class="wiki-tag">🔒 未遭遇</span>`;return`<div class="wiki-row${n?` done`:``}">
    <div class="wiki-head">${e.head}${i}${a}</div>
    ${r}
  </div>`}function Di(e){let t={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`};return String(e).replace(/[&<>"']/g,e=>t[e]||e)}async function Oi(){$(`
    <h3>📤 导出存档</h3>
    <div class="msub">方式一 · 扫码（跨设备推荐）</div>
    <div id="qrbox"><div id="qrCanvasBox"><div class="qhint">正在生成二维码…</div></div>
      <div id="qrHint" class="qhint">用另一台手机的相机 / 微信 / 扫码 App 扫一扫<br>扫出的文本就是存档，粘贴到新设备的导入框即可</div>
    </div>
    <div class="msub">方式二 · 复制 / 下载代码</div>
    <textarea id="exportArea" readonly>${Di(Xn(B,ur))}</textarea>
    <button class="mbtn primary" data-export-copy="1">📋 复制到剪贴板</button>
    <button class="mbtn" data-export-download="1">⬇️ 下载为 .txt 文件</button>
    <button class="mbtn" data-close="1">关闭</button>`);let e=document.getElementById(`qrCanvasBox`),t=document.getElementById(`qrHint`);try{let{makeQrCanvas:n}=await lr(async()=>{let{makeQrCanvas:e}=await import(`./qr-bOni7-sO.js`);return{makeQrCanvas:e}},[],import.meta.url);if(!e)return;let{frames:r}=tr(Zn(B,ur));if(r.length===1){e.innerHTML=``,e.appendChild(n(r[0],320));return}e.insertAdjacentHTML(`afterend`,`<div class="qrnav"><button data-qr-prev>‹ 上一张</button><span id="qrStep"></span><button data-qr-next>下一张 ›</button></div>`),t&&(t.innerHTML=`这张只包含一部分存档：另一台手机逐张扫，收满后自动导入<br><span style="opacity:.75">也可以点「下一张」手动切换</span>`),Z={frames:r,idx:0,timer:setInterval(()=>ki((Z?Z.idx+1:0)%r.length),4e3),makeQrCanvas:n},ki(0)}catch{e&&(e.innerHTML=`<div class="qhint">二维码加载失败，请改用复制 / 下载</div>`)}}function ki(e){if(!Z)return;let{frames:t,makeQrCanvas:n}=Z;Z.idx=e;let r=document.getElementById(`qrCanvasBox`),i=document.getElementById(`qrStep`);r&&(r.innerHTML=``,r.appendChild(n(t[e],320))),i&&(i.textContent=`${e+1}/${t.length}`)}function Ai(){Z&&clearInterval(Z.timer),Z=null}function ji(){let e=U(`exportArea`);if(!e)return;e.select();let t=()=>J(`已复制，请妥善保存`);navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(e.value).then(t,()=>Mi(t)):Mi(t)}function Mi(e){try{document.execCommand(`copy`),e()}catch{J(`复制失败，请手动长按复制`)}}function Ni(){let e=Xn(B,ur),t=new Blob([e],{type:`text/plain;charset=utf-8`}),n=document.createElement(`a`);n.href=URL.createObjectURL(t),n.download=`ember_save_${B.day}d.txt`,n.click(),setTimeout(()=>URL.revokeObjectURL(n.href),3e3),J(`已下载存档文件`)}function Pi(){$(`
    <h3>📥 导入存档</h3>
    <div class="msub">方式一 · 扫码（跨设备）</div>
    <button class="mbtn primary" data-import-scan="1">📷 扫码导入</button>
    <div class="msub">方式二 · 粘贴存档代码（兼容 EMBER / EMBER1 / EMQR1 / 扫码文本）</div>
    <textarea id="importArea" placeholder="粘贴存档代码…"></textarea>
    <button class="mbtn primary" data-import-do="1">导入并覆盖当前进度</button>
    <button class="mbtn" data-close="1">取消</button>`)}function Fi(e,t,n){B=e,V.length=0,Q(),q(`📥 ${n}成功${t?`（旧版存档已自动升级）`:``}！`,`good`),Y(),K(),J(`${n}成功`)}function Ii(){let e=U(`importArea`),t=e?e.value:``,n=Qn(t);if(n)Fi(n.state,n.isOld,`存档导入`);else{let e=t.trim().slice(0,12);q(`导入失败：无法识别（长度 ${t.trim().length}，开头「${e}」）`,`warn`),J(`导入失败：应为 EMBER: / EMBER1: / EMQR1: 开头的存档码，或存档 JSON`)}}async function Li(){Q(),di.reset();try{let{startScanner:e}=await lr(async()=>{let{startScanner:e}=await import(`./qr-bOni7-sO.js`);return{startScanner:e}},[],import.meta.url);e({onText:e=>{let t=nr(e);if(t){let e=di.has(t),n=di.add(t);if(n.text){let e=Qn(n.text);return e?(Fi(e.state,e.isOld,`扫码导入`),!1):(J(`扫到的存档无法解析`),!1)}return e||J(`已扫到第 ${t.seq}/${n.total} 张，继续对准下一张`),!0}let n=Qn(e);return n?(Fi(n.state,n.isOld,`扫码导入`),!1):(J(`扫到的内容不是有效存档（应为 EMBER: / EMQR1: 开头）`),!1)},onError:e=>J(e)})}catch{J(`扫码组件加载失败，请改用粘贴导入`)}}function Ri(){B=_(),V.length=0,q(`末日余烬 ${dr} · 新的一世`,`info`),q(`点击下方按钮开始行动；可以长按「自动」类行动进入放置模式。`,`sys`),Q(),Y(),K(),J(`新游戏开始`)}function zi(){try{localStorage.removeItem(fr)}catch{}Ri(),q(`🗑 本地存档已清除。`,`sys`)}function Bi(){window.addEventListener(`error`,e=>{Pt(e)?console.warn(`[忽略] 跨域脚本错误：`,e.message):q(`💥 脚本错误：${e.message}（${e.filename||`?`}:${e.lineno||0}）`,`bad`)}),window.addEventListener(`unhandledrejection`,e=>{let t=e.reason;Pt({message:String(t&&t.message||t),error:t})?console.warn(`[忽略] 未处理的跨域异常：`,t):q(`💥 未处理的异常：${t&&t.message||t}`,`bad`)})}function Vi(){Bi(),B=Sr()||_(),V.length=0;let e=Date.now()-(Number(B.lastSeen)||Date.now()),t=Nt(B,e);for(let e of t.logs)q(e.text,e.cls);q(`末日余烬 ${dr} · 文字生存冒险`,`info`),q(`点击下方按钮开始行动；可以长按「自动」类行动进入放置模式。`,`sys`),U(`actions`)?.addEventListener(`click`,e=>{let t=G(e.target,`[data-sell]`);if(t&&!t.disabled){Hr(String(t.dataset.sell));return}let n=G(e.target,`[data-craft]`);if(n){Br(String(n.dataset.craft));return}let r=G(e.target,`[data-cnav]`);if(r){Fr(String(r.dataset.cnav));return}let i=G(e.target,`[data-armor]`);if(i){let[e,t]=String(i.dataset.armor).split(`:`);Pr(Oe(B,e,t));return}let a=G(e.target,`[data-upgrade]`);if(a){Pr(De(B,String(a.dataset.upgrade)));return}let o=G(e.target,`[data-enchant]`);if(o){Pr(ke(B,String(o.dataset.enchant)));return}if(G(e.target,`[data-enchtbl]`)){Pr(Ae(B));return}let s=G(e.target,`[data-bag-act]`);if(s){s.dataset.bagAct===`eat`?Jr(`eat`):s.dataset.bagAct===`drink`&&Jr(`drink`);return}let c=G(e.target,`.actbtn`);if(!c)return;let l=c.dataset.kind;l&&(v[l]&&v[l].auto?Xr(l):Jr(l))}),U(`tabs`)?.addEventListener(`click`,e=>{let t=G(e.target,`.tab`);if(t&&t.dataset.tab){gr=t.dataset.tab;for(let e of document.querySelectorAll(`#tabs .tab`))e.classList.toggle(`on`,e===t);Y()}}),U(`zonebar`)?.addEventListener(`click`,e=>{let t=G(e.target,`.zonebtn`);t&&(t.dataset.locked?J(`🔒 `+t.dataset.locked):t.dataset.zone&&(H=t.dataset.zone,q(`📍 前往${M[H].name}。`,`sys`),Y()))}),U(`evwrap`)?.addEventListener(`click`,e=>{let t=G(e.target,`[data-combat]`);if(t){ci(String(t.dataset.combat));return}let n=G(e.target,`[data-dora]`);if(n){let e=n.dataset.dora;if(e===`gift`)ri();else if(e===`pocket`)ii();else if(e===`chat`){X();let e=Bt(B,1);for(let t of e.logs)q(t.text,t.cls);q(`🤖 「前辈的百宝袋……我可差远了。」`,`info`),Mr(e.achievements),Y(),K()}else X();return}let r=G(e.target,`[data-idx]`);r&&ai(Number(r.dataset.idx))}),U(`activeStop`)?.addEventListener(`click`,Zr),U(`btnFold`)?.addEventListener(`click`,Ar),U(`btnMenu`)?.addEventListener(`click`,mi),U(`scanStop`)?.addEventListener(`click`,async()=>{try{let{stopScanner:e}=await lr(async()=>{let{stopScanner:e}=await import(`./qr-bOni7-sO.js`);return{stopScanner:e}},[],import.meta.url);e()}catch{}J(`已取消扫码`)}),U(`modal`)?.addEventListener(`click`,e=>{if(e.target===U(`modal`)||G(e.target,`[data-close]`)){Q();return}if(G(e.target,`[data-confirm-ok]`)){let e=li;li=null,Q(),e&&e();return}let t=G(e.target,`[data-menu]`);if(t){hi(String(t.dataset.menu));return}let n=G(e.target,`[data-shop]`);if(n){n.disabled||yi(String(n.dataset.shop));return}if(G(e.target,`[data-ach-toggle]`)){let e=document.getElementById(`leftAchList`);e&&(e.style.display=e.style.display===`none`?`flex`:`none`);return}let r=G(e.target,`[data-wiki-tab]`);r?(ui=String(r.dataset.wikiTab),Ti()):G(e.target,`[data-qr-prev]`)&&Z?ki((Z.idx-1+Z.frames.length)%Z.frames.length):G(e.target,`[data-qr-next]`)&&Z?ki((Z.idx+1)%Z.frames.length):G(e.target,`[data-export-copy]`)?ji():G(e.target,`[data-export-download]`)?Ni():G(e.target,`[data-import-scan]`)?Li():G(e.target,`[data-import-do]`)&&Ii()}),Y(),Yr(),K()}var Hi=`ember_boot_sentinel`,Ui=`ember_last_error`,Wi=36e5;function Gi(e=localStorage,t=Date.now()){let n=null,r=null;try{n=JSON.parse(e.getItem(Hi)||`null`)}catch{}try{r=e.getItem(Ui)}catch{}let i=Number(n&&n.ts);return{recovered:!!(Number.isFinite(i)&&i>0&&t>=i&&t-i<Wi),lastError:r||null}}function Ki(e=localStorage,t=Date.now()){let n=Gi(e,t);try{e.setItem(Hi,JSON.stringify({ts:t}))}catch{}return n}function qi(e=localStorage){try{e.removeItem(Hi),e.removeItem(Ui)}catch{}}function Ji(e,t=localStorage){let n=e&&e.message?e.message:String(e);try{t.setItem(Ui,n.slice(0,300))}catch{}}async function Yi(){try{let e=await caches.keys();await Promise.all(e.map(e=>caches.delete(e)))}catch{}try{let e=await navigator.serviceWorker?.getRegistrations?.()??[];await Promise.all(e.map(e=>e.unregister()))}catch{}location.reload()}function Xi(e){let t=document.getElementById(`recovery`);t&&t.remove();let n=document.createElement(`div`);n.id=`recovery`,n.innerHTML=`
    <div class="rc-card">
      <h3>⚠️ 上次启动没有走完</h3>
      <p>可能是更新到一半、缓存损坏，或脚本出错。存档还在本地，没有丢。</p>
      ${e.lastError?`<pre class="rc-err">${Zi(e.lastError)}</pre>`:``}
      <button class="mbtn primary" data-rc="retry">重新加载</button>
      <button class="mbtn" data-rc="clear">清缓存并重新加载</button>
      ${e.onContinue?`<button class="mbtn" data-rc="continue">仍然进入（存档不动）</button>`:``}
    </div>`,document.body.appendChild(n),n.addEventListener(`click`,t=>{let n=t.target.closest(`[data-rc]`);if(!n)return;let r=n.dataset.rc;r===`retry`?e.onRetry():r===`clear`?e.onClear():r===`continue`&&e.onContinue&&e.onContinue()})}function Zi(e){return String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]||e)}var Qi=Ki();function $i(){try{Vi(),Un({version:`3.0.10`,toast:J}),qi(),document.getElementById(`recovery`)?.remove()}catch(e){throw Ji(e),Xi({lastError:String(e?.message??e),onRetry:()=>location.reload(),onClear:Yi,onContinue:null}),e}}window.addEventListener(`error`,e=>Ji(e.error??e.message)),window.addEventListener(`unhandledrejection`,e=>Ji(e.reason)),Qi.recovered?Xi({lastError:Qi.lastError,onRetry:()=>location.reload(),onClear:Yi,onContinue:$i}):$i();export{c as n,o as t};