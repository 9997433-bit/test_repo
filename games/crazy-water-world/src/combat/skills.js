// 技能层：七种 kind 统一走「星级门槛 + skill.value」，引擎不硬编码任何单个英雄的数值。
// 未达 skill.star 的技能一律返回 null（完全不生效），这是契约 §8.6 的门槛要求。

export const SKILL_KINDS = ["taunt", "multishot", "heal", "aoe", "burst", "buff", "hook"];

// 全域伤害常量：契约 §8.6 冻结公式 max(4, atk - def*0.45)。
export const DMG_FLOOR = 4;
export const DEF_FACTOR = 0.45;
// 盐雾类减益每层削攻，封顶避免把敌人打成纸片。
export const WITHER_STEP = 0.1;
export const WITHER_CAP = 0.45;
export const DR_CAP = 0.5;

function clampInt(n, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/**
 * 把 HeroDef.skill + 实例星级翻译成本场战斗用的效果参数表。
 * @returns {null | { kind: string, name: string, [k: string]: unknown }}
 */
export function planFor(skill, star) {
  if (!skill || typeof skill.kind !== "string") return null;
  if (!SKILL_KINDS.includes(skill.kind)) return null;
  const gate = Number.isFinite(skill.star) ? skill.star : 1;
  const lv = Number.isFinite(star) ? star : 1;
  if (lv < gate) return null;
  const v = Number.isFinite(skill.value) ? skill.value : 0;
  const name = typeof skill.name === "string" && skill.name ? skill.name : "绝活";

  switch (skill.kind) {
    // 嘲讽：强制吸引仇恨，同时按星级换来减伤，前排才站得住。
    case "taunt":
      return { kind: "taunt", name, reduction: Math.min(0.35, 0.06 * lv * v) };
    // 连珠：value 段起跳，每两星多一段；后续段伤害衰减，避免线性碾压。
    case "multishot":
      return { kind: "multishot", name, volleys: clampInt(v + (lv - 1) / 2, 2, 4), falloff: 0.62 };
    // 治疗：奶血最低的队友并附带护盾，护盾先于血量吃伤害。
    case "heal": {
      const amount = v * (1 + (lv - 1) * 0.35);
      return { kind: "heal", name, every: 3, amount, shield: amount * 0.3 };
    }
    // 群体：周期性溅射全体敌人并叠加削攻减益。
    case "aoe":
      return { kind: "aoe", name, every: 3, ratio: v * (1 + (lv - 1) * 0.15), maxWither: 3 };
    // 爆发：周期倍伤 + 破甲；四星起冷却缩短。
    case "burst":
      return { kind: "burst", name, every: lv >= 4 ? 3 : 4, mult: v, pierce: 0.2 };
    // 酒劲：每次行动叠层，层数换攻击与减伤，越打越猛。
    case "buff":
      return {
        kind: "buff",
        name,
        maxStacks: 2 + lv,
        atkPerStack: v / 3,
        drPerStack: v / 12,
        maxDr: 0.3,
      };
    // 铁钩：首回合把后排拽到前排，附带一次倍伤与减速。
    case "hook":
      return { kind: "hook", name, round: 1, mult: 1 + 0.15 * lv, slow: v * 10 };
    default:
      return null;
  }
}

// 有效攻击 = 基础攻击 × (1 + 酒劲层数加成) × (1 - 减益)
export function effectiveAtk(unit) {
  const gain = unit.buffStacks * unit.buffAtkPerStack;
  const loss = Math.min(WITHER_CAP, unit.wither * WITHER_STEP);
  return unit.atk * (1 + gain) * (1 - loss);
}

// 有效减伤 = 嘲讽减伤 + 酒劲减伤，统一封顶。
export function effectiveDr(unit) {
  const drunk = Math.min(unit.buffMaxDr, unit.buffStacks * unit.buffDrPerStack);
  return Math.min(DR_CAP, unit.tauntDr + drunk);
}

export function rawDamage(attacker, target, pierce = 0) {
  const armor = target.def * (1 - pierce);
  return Math.max(DMG_FLOOR, effectiveAtk(attacker) - armor * DEF_FACTOR);
}
