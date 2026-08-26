/**
 * 职业数值表。
 *
 * bonus 平衡方法（详见 docs/GDD.md「职业加成预算」）：
 * 每种笔法的加成价值不同（zigzag 破甲叠层在实战最值钱、curve 一半价值在不吃加成的控制上、
 * circle/cloud 只作用于防御与回复），按权重折算：
 *   zigzag 1.1 / line 1.0 / spiral 0.85 / curve 0.55 / circle 0.6 / cloud 0.6 / scribble 0.35
 * 每个职业的「加权预算」= Σ(bonus × 权重)，全职业统一压在 0.31 ~ 0.35 区间。
 * 调整任何 bonus 前先重算预算，避免再出现旧版剑修(0.40)碾压妖修(0.16)的失衡。
 */
export const CLASSES = [
  {
    id: "jian",
    name: "剑修",
    motto: "以剑入道，一线破妄",
    // 预算 0.24×1.0 + 0.10×1.1 = 0.350
    bonus: { line: 0.24, zigzag: 0.1 },
    element: "metal",
    role: "burst",
  },
  {
    id: "ti",
    name: "体修",
    motto: "肉身成碑，圆盾不破",
    // 预算 0.32×0.6 + 0.12×1.0 = 0.312（盾厚 + 有直线收尾能力）
    bonus: { circle: 0.32, line: 0.12 },
    element: "earth",
    role: "tank",
  },
  {
    id: "fa",
    name: "法修",
    motto: "符阵为骨，螺旋焚天",
    // 预算 0.28×0.85 + 0.14×0.55 = 0.315
    bonus: { spiral: 0.28, curve: 0.14 },
    element: "fire",
    role: "caster",
  },
  {
    id: "dao",
    name: "道修",
    motto: "一笔回春，云篆济世",
    // 预算 0.30×0.6 + 0.10×0.6 + 0.08×1.0 = 0.320（补小额直线，治疗职业不再打不死人）
    bonus: { cloud: 0.3, circle: 0.1, line: 0.08 },
    element: "wood",
    role: "healer",
  },
  {
    id: "yao",
    name: "妖修",
    motto: "画灵为伴，曲线夺魄",
    // 预算 0.30×0.55 + 0.22×0.35 + 0.08×1.1 = 0.330（唯一把「余墨」当武器的职业）
    bonus: { curve: 0.3, scribble: 0.22, zigzag: 0.08 },
    element: "wood",
    role: "summoner",
  },
  {
    id: "qi",
    name: "气修",
    motto: "折线破防，雷走笔锋",
    // 预算 0.24×1.1 + 0.08×0.85 = 0.332
    bonus: { zigzag: 0.24, spiral: 0.08 },
    element: "thunder",
    role: "assassin",
  },
  {
    id: "mo",
    name: "墨客",
    motto: "点墨成境，改写战场",
    // 预算 0.18×0.55 + 0.14×0.85 + 0.12×0.6 + 0.08×0.6 = 0.338（四系全能，单项皆不顶尖）
    bonus: { curve: 0.18, spiral: 0.14, cloud: 0.12, circle: 0.08 },
    element: "water",
    role: "controller",
    hidden: true,
    unlock: "画阁集齐六式笔法（line/curve/circle/zigzag/spiral/cloud）",
  },
];

/**
 * 克制环（COUNTER[a] = a 克制的职业）：
 *   剑 → 妖 → 气 → 法 → 体 → 道 → 墨 → 剑
 * 七职业闭环，每个职业恰好克一个、被克一个。
 * 战斗侧：克制方伤害 ×1.18，被克方伤害 ×0.88（见 combat/battle.js）。
 */
export const COUNTER = {
  jian: "yao",
  yao: "qi",
  qi: "fa",
  fa: "ti",
  ti: "dao",
  dao: "mo",
  mo: "jian",
};

export function classById(id) {
  return CLASSES.find((c) => c.id === id) ?? null;
}
