/**
 * 效果指令（Effect Instruction）。
 *
 * 战斗层永远不直接改物理世界、不直接扣敌人血、不碰 DOM。
 * 技能与结算只产出「指令」这种纯数据，由物理层 / 模式层 / UI 层各自认领执行：
 *
 * - `spawn_egg` / `egg_patch` / `field` → 物理层（src/physics）执行
 * - `explosion` / `chain` / `damage`   → 模式层用当前敌人列表结算
 * - `status` / `clear_status` / `aura` / `buff` / `energy` / `combo` → combat/state.js
 * - `heal` / `shield`                  → 英雄养成层（src/heroes、src/progression）
 * - `feedback`                         → UI / 音频层（震屏、顿帧、飘字）
 *
 * 所有工厂函数返回全新的普通对象，不引用入参内部结构。
 */

export const EFFECT = {
  DAMAGE: "damage",
  EXPLOSION: "explosion",
  CHAIN: "chain",
  STATUS: "status",
  CLEAR_STATUS: "clear_status",
  AURA: "aura",
  BUFF: "buff",
  HEAL: "heal",
  SHIELD: "shield",
  ENERGY: "energy",
  COMBO: "combo",
  SPAWN_EGG: "spawn_egg",
  EGG_PATCH: "egg_patch",
  FIELD: "field",
  FEEDBACK: "feedback",
};

/** 指令归属的执行域，便于各层过滤自己关心的指令。 */
export const EFFECT_DOMAIN = {
  [EFFECT.DAMAGE]: "combat",
  [EFFECT.EXPLOSION]: "combat",
  [EFFECT.CHAIN]: "combat",
  [EFFECT.STATUS]: "combat",
  [EFFECT.CLEAR_STATUS]: "combat",
  [EFFECT.AURA]: "combat",
  [EFFECT.BUFF]: "combat",
  [EFFECT.COMBO]: "combat",
  [EFFECT.HEAL]: "party",
  [EFFECT.SHIELD]: "party",
  [EFFECT.ENERGY]: "party",
  [EFFECT.SPAWN_EGG]: "physics",
  [EFFECT.EGG_PATCH]: "physics",
  [EFFECT.FIELD]: "physics",
  [EFFECT.FEEDBACK]: "presentation",
};

function effect(type, payload) {
  return { type, domain: EFFECT_DOMAIN[type] ?? "combat", ...payload };
}

/** 直接伤害指令（已结算好的数值，执行方只需扣血）。 */
export function damageEffect({ targetId, amount, element = "physical", kind = "direct", source = null }) {
  return effect(EFFECT.DAMAGE, { targetId, amount, element, kind, source });
}

/** 范围爆炸请求。执行方用自己的敌人列表做半径判定。 */
export function explosionEffect({ x = 0, y = 0, radius, damage, element = "physical", falloff = 0.5, kind = "explosion", sourceId = null, excludeIds = [] }) {
  return effect(EFFECT.EXPLOSION, { x, y, radius, damage, element, falloff, kind, sourceId, excludeIds: [...excludeIds] });
}

/** 链式弹跳请求（雷 3 层 / 感电扩散）。 */
export function chainEffect({ fromId, x = 0, y = 0, hops, damage, element = "thunder", falloff = 0.55, radius, excludeIds = [] }) {
  return effect(EFFECT.CHAIN, { fromId, x, y, hops, damage, element, falloff, radius, excludeIds: [...excludeIds] });
}

/** 施加状态（灼烧 / 冻结 / 感电 / 破甲 / 减速）。 */
export function statusEffect({ targetId, status, duration, potency = 1, stacks = 1, interval = 0, source = null, meta = null }) {
  return effect(EFFECT.STATUS, { targetId, status, duration, potency, stacks, interval, source, meta });
}

/** 移除状态（蒸发移除冻结）。 */
export function clearStatusEffect({ targetId, status, reason = null }) {
  return effect(EFFECT.CLEAR_STATUS, { targetId, status, reason });
}

/** 元素附着写入 / 清除。stacks 为 0 表示清除。 */
export function auraEffect({ targetId, element, stacks, power = 1, expiresAt = null }) {
  return effect(EFFECT.AURA, { targetId, element, stacks, power, expiresAt });
}

/** 限时增益（爆蛋时刻窗口、光环、钓鱼 BUFF）。 */
export function buffEffect({ id, scope = "team", targetId = null, duration, mods = {}, stacks = 1, source = null }) {
  return effect(EFFECT.BUFF, { id, scope, targetId, duration, mods: { ...mods }, stacks, source });
}

export function healEffect({ targetId = null, scope = "self", amount = 0, ratio = 0, source = null }) {
  return effect(EFFECT.HEAL, { targetId, scope, amount, ratio, source });
}

export function shieldEffect({ targetId = null, scope = "self", amount, duration, blocks = 0, source = null }) {
  return effect(EFFECT.SHIELD, { targetId, scope, amount, duration, blocks, source });
}

export function energyEffect({ targetId = null, scope = "self", amount = 0, ratio = 0, source = null }) {
  return effect(EFFECT.ENERGY, { targetId, scope, amount, ratio, source });
}

/** 连击指令：burst = 爆蛋时刻，add/set/reset 供技能改连击。 */
export function comboEffect({ op, value = 0, duration = 0, source = null }) {
  return effect(EFFECT.COMBO, { op, value, duration, source });
}

/** 请求物理层追加发射蛋，战斗层不碰积分器。 */
export function spawnEggEffect({ count = 1, template = {}, spread = 0, inherit = 0, origin = null, source = null }) {
  return effect(EFFECT.SPAWN_EGG, { count, template: { ...template }, spread, inherit, origin, source });
}

/** 请求物理层修改某枚蛋的属性（半径 / 弹性 / 穿透 / 附魔）。 */
export function eggPatchEffect({ eggId = null, scope = "active", patch = {}, duration = 0, source = null }) {
  return effect(EFFECT.EGG_PATCH, { eggId, scope, patch: { ...patch }, duration, source });
}

/** 请求物理层生成场（冰面、风扇、减速域）。 */
export function fieldEffect({ kind, x = 0, y = 0, w = 0, h = 0, radius = 0, duration = 0, params = {}, source = null }) {
  return effect(EFFECT.FIELD, { kind, x, y, w, h, radius, duration, params: { ...params }, source });
}

/** 表现层提示：震屏、顿帧、飘字、音效 key。 */
export function feedbackEffect({ kind, intensity = 1, duration = 0, text = null, tone = null, at = null }) {
  return effect(EFFECT.FEEDBACK, { kind, intensity, duration, text, tone, at });
}

/** 按执行域过滤指令。 */
export function effectsForDomain(effects, domain) {
  return (effects ?? []).filter((fx) => (fx?.domain ?? EFFECT_DOMAIN[fx?.type]) === domain);
}

/** 按类型过滤指令。 */
export function effectsOfType(effects, type) {
  return (effects ?? []).filter((fx) => fx?.type === type);
}
