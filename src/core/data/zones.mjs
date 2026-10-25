// 探索区域表：5 个区域的产出、危险度、解锁天数、配色、成就组
//
// 与 survival.html 的 ZONES 逐一对应。res 里每项是 [资源 id, 最少, 最多]。

export const ZONES = {
  "forest": {"name":"🌲森林","desc":"树木与野物","res":[["wood",3,6],["herb",0,3],["food",0,3]],"danger":0.18,"color":"#4a6b48","bg":"#1a2418","ach":["for1","for10","for50"],"unlockDay":1},
  "ruins": {"name":"🏚废墟","desc":"旧世界的残骸","res":[["metal",0,3],["food",0,2],["herb",0,2]],"danger":0.22,"color":"#a07040","bg":"#2a1e10","ach":["rui1","rui10","rui50"],"unlockDay":7},
  "river": {"name":"🏞河边","desc":"水源与鱼群","res":[["water",4,7],["food",0,4]],"danger":0.12,"color":"#5a8aaa","bg":"#0f1f2a","ach":["riv1","riv10","riv50"],"unlockDay":3},
  "hills": {"name":"⛰山丘","desc":"石头与野兽","res":[["stone",2,5],["metal",0,2]],"danger":0.26,"color":"#9a7ac0","bg":"#1f1828","ach":["hil1","hil10","hil50"],"unlockDay":15},
  "pyramid": {"name":"🏜沙漠金字塔","desc":"法老沉眠之地","res":[["stone",1,4],["goldOre",0,2],["rune",0,1]],"danger":0.3,"color":"#c8a84a","bg":"#2a2010","ach":["pyr1","pyr10","pyr50"],"unlockDay":25},
};
