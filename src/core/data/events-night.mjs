// 夜间事件（4 种，按 w 权重抽取）
//
// 对应 survival.html 的 NIGHT_EVENTS。效果类型用布尔字段表达：
//   fight  → 强制进入战斗
//   cold   → 寒夜掉血（冬季无火堆时）
//   steal  → 随机损失物资
//   heal   → 恢复生命

export const NIGHT_EVENTS = [
  { id: 'raid', w: 3, title: '夜袭！', text: '睡梦中传来粗重的呼吸声——有东西靠近了营地！', fight: true },
  { id: 'cold', w: 3, title: '寒夜', text: '夜风刺骨，你被冻得浑身发抖。', cold: true },
  { id: 'thief', w: 2, title: '小偷', text: '夜色里闪过一个人影，你丢了些物资。', steal: true },
  { id: 'calm', w: 3, title: '宁静', text: '一夜无风无雨，你睡得很好。', heal: 8 },
];
