/**
 * 符箓表：key = 笔法类型，qi = 施放消耗。
 * 伤害/效果倍率写死在 combat/battle.js：
 *   line ×1.0 | curve ×0.55+控制 | circle 护盾 | zigzag ×1.15+破甲 | spiral ×1.25 | cloud 治疗 | scribble ×1.0
 *
 * 定价基准（精度 0.7、无职业加成时的每点灵气伤害，A = 攻击）：
 *   line 0.115A > zigzag 0.096A(+破甲叠层) ≈ spiral 0.094A > scribble 0.098A > curve 0.064A(+控制)
 * 余墨从 4 → 9：4 灵气时点几下废笔的每灵气伤害是直线的近两倍，纯刷余墨反而最优；
 * 9 灵气后它回到「兜底弱攻击」定位，仅妖修（scribble 加成）能把它用出正经收益。
 */
export const TALISMANS = {
  line: { id: "pierce", name: "穿云剑", qi: 13, tags: ["pierce"] },
  curve: { id: "bind", name: "缚灵丝", qi: 14, tags: ["control"] },
  circle: { id: "ward", name: "护体罡", qi: 16, tags: ["shield"] },
  zigzag: { id: "rupture", name: "破军刺", qi: 18, tags: ["shred"] },
  spiral: { id: "array", name: "五行阵", qi: 20, tags: ["aoe"] },
  cloud: { id: "spring", name: "回春笔", qi: 15, tags: ["heal"] },
  scribble: { id: "ink", name: "余墨", qi: 9, tags: ["basic"] },
};
