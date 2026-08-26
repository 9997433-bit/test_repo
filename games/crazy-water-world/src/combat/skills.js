// 技能层：七种 kind 统一走「星级门槛 + skill.value + skill.period」，
// 引擎不硬编码任何单个英雄的数值。
// 未达 skill.star 的技能一律返回 null（完全不生效），这是契约 §8.6 的门槛要求。

export const SKILL_KINDS = ["taunt", "multishot", "heal", "aoe", "burst", "buff", "hook"];

// 全域伤害常量：契约 §8.6 冻结公式 max(4, atk - def*0.45)。
export const DMG_FLOOR = 4;
export const DEF_FACTOR = 0.45;
// 盐雾类减益每层削攻，封顶避免把敌人打成纸片。
export const WITHER_STEP = 0.1;
export const WITHER_CAP = 0.45;
export const DR_CAP = 0.5;
// 酒劲层数上限。data/heroes.js 只给了 value 与 period 两个字段，层顶写在这里。
export const BUFF_MAX_STACKS = 3;

// skill.period 缺省时按 kind 回落到的周期，等于 Round 1 写死的那批常数。
// 表里给了 period 就一律以表为准（契约 §1.4：引擎不得硬编码表内数值）。
export const DEFAULT_PERIOD = { multishot: 1, heal: 3, aoe: 3, burst: 4, buff: 1, hook: 0 };

function clampInt(n, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/**
 * 读表取周期。null / 缺省 → kind 默认值；其余取整并钳到 ≥0。
 * 0 是「开场技」的写法（铁钩），≥1 是「每 N 回合」。
 */
function periodOf(skill, kind) {
  if (!Number.isFinite(skill.period)) return DEFAULT_PERIOD[kind];
  return Math.max(0, Math.round(skill.period));
}

/** 周期命中判定：every≥1 按回合取模；every=0 仅首回合；非数（被动）永不命中。 */
export function onPeriod(round, every) {
  if (!Number.isFinite(every)) return false;
  if (every <= 0) return round === 1;
  return round % every === 0;
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
      return {
        kind: "multishot",
        name,
        every: periodOf(skill, "multishot"),
        volleys: clampInt(v + (lv - 1) / 2, 2, 4),
        falloff: 0.62,
      };
    // 治疗：奶血最低的队友并附带护盾，护盾先于血量吃伤害。
    case "heal": {
      const amount = v * (1 + (lv - 1) * 0.35);
      return { kind: "heal", name, every: periodOf(skill, "heal"), amount, shield: amount * 0.3 };
    }
    // 群体：周期性溅射全体敌人并叠加削攻减益。
    case "aoe":
      return {
        kind: "aoe",
        name,
        every: periodOf(skill, "aoe"),
        ratio: v * (1 + (lv - 1) * 0.15),
        maxWither: 3,
      };
    // 爆发：表定周期倍伤 + 破甲；四星起冷却缩短一回合（开场技不缩）。
    case "burst": {
      const base = periodOf(skill, "burst");
      return {
        kind: "burst",
        name,
        every: base > 0 && lv >= 4 ? Math.max(1, base - 1) : base,
        mult: v,
        pierce: 0.2,
      };
    }
    // 酒劲：每 period 回合上一层，每层攻击 +value，层数封顶换减伤。
    case "buff":
      return {
        kind: "buff",
        name,
        every: periodOf(skill, "buff"),
        maxStacks: BUFF_MAX_STACKS,
        atkPerStack: v,
        drPerStack: v / 12,
        maxDr: 0.3,
      };
    // 铁钩：表定周期（period=0 即开场）把后排拽到前排，附带倍伤与减速。
    case "hook":
      return {
        kind: "hook",
        name,
        every: periodOf(skill, "hook"),
        mult: 1 + 0.15 * lv,
        slow: v * 10,
      };
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
