/**
 * 修正量（Modifier Bundle）。
 *
 * 羁绊、光环、爆蛋窗口、钓鱼 BUFF、神器都折叠成同一张扁平的修正表，
 * 结算管线只读这一张表，避免每个来源各写一套分支。
 *
 * 合并语义由 MOD_SPEC 决定：`mul` 连乘、`add` 相加、`max` 取最大。
 * `max` 键的中性值是 0，所以「倍率型」的 max 键（mainEggMult 等）读出 0 表示未设定，
 * 消费方自行 `Math.max(1, …)`。
 */

export const MOD_SPEC = {
  /** 攻击与伤害 */
  atkMult: "mul",
  damageMult: "mul",
  flatDamage: "add",
  critChance: "add",
  critDmg: "add",
  /** 主蛋（egg.isMain）专属倍率，按数据表约定取最高档而不叠乘 */
  mainEggMult: "max",
  /** 连击 */
  comboGain: "add",
  comboGainMult: "mul",
  comboDecayMult: "mul",
  comboDamageMult: "mul",
  comboWindowBonus: "add",
  comboCritDmgPerStack: "add",
  critChanceAt10: "add",
  burstThresholdDelta: "add",
  burstDamageMult: "mul",
  burstKeepStacksPct: "max",
  /** 元素 */
  elementPowerMult: "mul",
  elementDamageMult: "mul",
  elementStackBonus: "add",
  elementThresholdDelta: "add",
  reactionMult: "mul",
  energyOnReaction: "add",
  statusDurationMult: "mul",
  armorShred: "add",
  /** 碰撞 */
  collisionDamageMult: "mul",
  collisionDamageBonus: "add",
  collisionDamageCap: "max",
  splitChance: "add",
  radiusPerCollision: "add",
  /** 通用 */
  pierce: "add",
  knockback: "add",
  healMult: "mul",
  shieldMult: "mul",
  energyMult: "mul",
  slowPower: "max",
};

const MUL_DEFAULT = 1;
const ADD_DEFAULT = 0;

/** 全中性修正表。 */
export function neutralMods() {
  const out = {};
  for (const [key, kind] of Object.entries(MOD_SPEC)) {
    out[key] = kind === "mul" ? MUL_DEFAULT : ADD_DEFAULT;
  }
  return out;
}

/** 读取单个修正值，缺省按语义兜底。 */
export function modOf(mods, key) {
  const kind = MOD_SPEC[key] ?? "add";
  const fallback = kind === "mul" ? MUL_DEFAULT : ADD_DEFAULT;
  const value = mods?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** 合并任意多个修正表（忽略 null / undefined），返回新对象。 */
export function mergeMods(...sources) {
  const out = neutralMods();
  for (const src of sources) {
    if (!src) continue;
    for (const [key, value] of Object.entries(src)) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      const kind = MOD_SPEC[key] ?? "add";
      if (kind === "mul") out[key] *= value;
      else if (kind === "max") out[key] = Math.max(out[key], value);
      else out[key] += value;
    }
  }
  return out;
}

/** 把生效中的 buff 列表折叠成修正表。now 之后过期的 buff 会被忽略。 */
export function modsFromBuffs(buffs = [], now = 0) {
  const active = [];
  for (const buff of buffs) {
    if (!buff) continue;
    if (typeof buff.expiresAt === "number" && buff.expiresAt <= now) continue;
    const stacks = Math.max(1, Math.round(buff.stacks ?? 1));
    for (let i = 0; i < stacks; i += 1) active.push(buff.mods ?? buff);
  }
  return mergeMods(...active);
}
