/**
 * 元素与反应常量（GDD 元素反应章节的数值落表，结算逻辑在 src/combat）。
 */
export const ELEMENTS = {
  fire: { id: "fire", name: "火", color: "#FF6B35", icon: "flame", attachSec: 6 },
  ice: { id: "ice", name: "冰", color: "#4CC9F0", icon: "snow", attachSec: 6 },
  thunder: { id: "thunder", name: "雷", color: "#FFD60A", icon: "bolt", attachSec: 6 },
};

/** 异元素反应（两种元素附着相遇时触发，消耗双方附着）。 */
export const REACTIONS = {
  vaporize: {
    id: "vaporize", name: "蒸发", pair: ["fire", "ice"],
    dmgMult: 1.4, removesFreeze: true,
    desc: "火+冰：本次伤害 ×1.4，并解除目标冻结。",
  },
  superconduct: {
    id: "superconduct", name: "超导", pair: ["thunder", "ice"],
    armorShredPct: 0.5, durationSec: 8,
    desc: "雷+冰：目标护甲 -50%，持续 8 秒。",
  },
  overload: {
    id: "overload", name: "超载", pair: ["thunder", "fire"],
    aoeRadius: 60, aoeDmgPct: 0.9,
    desc: "雷+火：以目标为中心半径 60 小爆炸，造成 90% 攻击伤害。",
  },
};

/** 同元素叠层（默认 3 层触发，属性流 3 件套降为 2 层）。 */
export const SAME_ELEMENT = {
  stacksToProc: 3,
  fire: { name: "灼烧", burnDpsPct: 0.4, durationSec: 3, desc: "持续灼烧：每秒 40% 攻击火伤 ×3 秒。" },
  ice: { name: "冻结", freezeSec: 1.2, desc: "冻结 1.2 秒：无法移动与释放技能。" },
  thunder: { name: "连锁雷", jumps: 2, jumpDmgPct: 0.7, desc: "雷电弹跳 2 次，每跳 70% 攻击雷伤。" },
};
