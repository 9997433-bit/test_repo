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
 * ## 对外稳定契约（`EFFECT_SCHEMA_VERSION`）
 *
 * 1. **字段齐全**：同一 `type` 的指令永远带同一组键，缺省值由工厂补齐，
 *    消费方不必写 `?? 0` / `?? null`，也不会读到 `undefined` 或 `NaN`。
 * 2. **数值可信**：所有数值字段都是有限数（`chain.radius` 允许 `Infinity` 表示不限距离）；
 *    坐标 `at` / `origin` 要么是 `{ x, y }` 两个有限数，要么是 `null`。
 * 3. **域已标注**：每条指令自带 `domain`，配合 `splitEffects()` 一次分流到四层。
 * 4. **顺序稳定**：`resolveHit()` 交出的数组按 combat → physics → party → presentation
 *    分段（段内保持产出顺序），表现层指令永远在尾部，UI 可以直接 `presentationPlan()`。
 * 5. **纯数据**：工厂返回全新的普通对象，不引用入参内部结构，可安全 `structuredClone` /
 *    `JSON.stringify`（`Infinity` 例外）并跨帧缓存。
 *
 * 增字段视为兼容变更；删字段 / 改语义必须提升 `EFFECT_SCHEMA_VERSION`。
 */

/** 指令契约版本。消费方可据此判断是否需要兼容分支。 */
export const EFFECT_SCHEMA_VERSION = 1;

export const EFFECT = Object.freeze({
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
});

/** 全部合法指令类型，供消费方做穷举校验。 */
export const EFFECT_TYPES = Object.freeze(Object.values(EFFECT));

/** 执行域枚举。 */
export const DOMAIN = Object.freeze({
  COMBAT: "combat",
  PHYSICS: "physics",
  PARTY: "party",
  PRESENTATION: "presentation",
});

/**
 * 指令分发顺序：先结算战斗账本，再交物理，再交队伍，最后才是表现。
 * `sortEffects()` 按这个顺序做稳定排序，UI 因此可以假定表现层指令总在尾部。
 */
export const DOMAIN_ORDER = Object.freeze([DOMAIN.COMBAT, DOMAIN.PHYSICS, DOMAIN.PARTY, DOMAIN.PRESENTATION]);

/** 指令归属的执行域，便于各层过滤自己关心的指令。 */
export const EFFECT_DOMAIN = Object.freeze({
  [EFFECT.DAMAGE]: DOMAIN.COMBAT,
  [EFFECT.EXPLOSION]: DOMAIN.COMBAT,
  [EFFECT.CHAIN]: DOMAIN.COMBAT,
  [EFFECT.STATUS]: DOMAIN.COMBAT,
  [EFFECT.CLEAR_STATUS]: DOMAIN.COMBAT,
  [EFFECT.AURA]: DOMAIN.COMBAT,
  [EFFECT.BUFF]: DOMAIN.COMBAT,
  [EFFECT.COMBO]: DOMAIN.COMBAT,
  [EFFECT.HEAL]: DOMAIN.PARTY,
  [EFFECT.SHIELD]: DOMAIN.PARTY,
  [EFFECT.ENERGY]: DOMAIN.PARTY,
  [EFFECT.SPAWN_EGG]: DOMAIN.PHYSICS,
  [EFFECT.EGG_PATCH]: DOMAIN.PHYSICS,
  [EFFECT.FIELD]: DOMAIN.PHYSICS,
  [EFFECT.FEEDBACK]: DOMAIN.PRESENTATION,
});

/** 表现层指令的 `kind` 全集。UI 只需要认这七种，其余走 `plan.other` 兜底。 */
export const FEEDBACK = Object.freeze({
  /** 顿帧：暂停 `duration` 秒（爆蛋、暴击） */
  HITSTOP: "hitstop",
  /** 震屏：强度 `intensity`，衰减 `duration` 秒 */
  SHAKE: "shake",
  /** 飘字：`text` 必有值 */
  FLOATER: "floater",
  /** 全屏 / 局部闪光 */
  FLASH: "flash",
  /** 拖尾 */
  TRAIL: "trail",
  /** 音效：`tone` 即音效 key */
  SFX: "sfx",
  /** 元素饱和的粒子爆发 */
  ELEMENT_BURST: "element-burst",
});

export const FEEDBACK_KINDS = Object.freeze(Object.values(FEEDBACK));

/** `combo` 指令的合法操作。 */
export const COMBO_OP = Object.freeze({
  BURST: "burst",
  RESET: "reset",
  SET: "set",
  ADD: "add",
  HOLD: "hold",
});

/** `egg_patch` 的作用范围。 */
export const EGG_SCOPE = Object.freeze({ ACTIVE: "active", NEXT: "next", ALL: "all" });

/** 队伍域指令的作用范围。 */
export const PARTY_SCOPE = Object.freeze({ SELF: "self", OTHERS: "others", TEAM: "team", PARTY: "party" });

const FEEDBACK_KIND_SET = new Set(FEEDBACK_KINDS);

/** 表现强度上限：再夸张的技能也不该让 UI 算出离谱的震幅。 */
const MAX_INTENSITY = 4;

function num(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nonNegative(value, fallback = 0) {
  return Math.max(0, num(value, fallback));
}

/** 坐标归一：任意脏输入都收敛成 `{ x, y }` 或 `null`，UI 不用再判空字段。 */
function point(at) {
  if (at == null || typeof at !== "object") return null;
  return { x: num(at.x, 0), y: num(at.y, 0) };
}

function idList(ids) {
  const out = [];
  for (const id of ids ?? []) {
    if (id == null || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

function text(value) {
  return value == null ? null : String(value);
}

function tag(value) {
  return value == null || value === "" ? null : String(value);
}

function effect(type, payload) {
  return { type, domain: EFFECT_DOMAIN[type] ?? DOMAIN.COMBAT, ...payload };
}

/** 直接伤害指令（已结算好的数值，执行方只需扣血）。 */
export function damageEffect({ targetId = null, amount, element = "physical", kind = "direct", source = null }) {
  return effect(EFFECT.DAMAGE, { targetId, amount: nonNegative(amount), element, kind, source });
}

/** 范围爆炸请求。执行方用自己的敌人列表做半径判定。 */
export function explosionEffect({ x = 0, y = 0, radius, damage, element = "physical", falloff = 0.5, kind = "explosion", sourceId = null, excludeIds = [] }) {
  return effect(EFFECT.EXPLOSION, {
    x: num(x),
    y: num(y),
    radius: nonNegative(radius),
    damage: nonNegative(damage),
    element,
    falloff: num(falloff, 0.5),
    kind,
    sourceId,
    excludeIds: idList(excludeIds),
  });
}

/**
 * 链式弹跳请求（雷 3 层 / 感电扩散）。
 * `radius` 是每一跳的最大搜索距离，`Infinity` 表示不限距离。
 */
export function chainEffect({ fromId = null, x = 0, y = 0, hops, damage, element = "thunder", falloff = 0.55, radius = Infinity, excludeIds = [] }) {
  return effect(EFFECT.CHAIN, {
    fromId,
    x: num(x),
    y: num(y),
    hops: Math.max(0, Math.round(num(hops))),
    damage: nonNegative(damage),
    element,
    falloff: num(falloff, 0.55),
    radius: typeof radius === "number" && !Number.isNaN(radius) ? Math.max(0, radius) : Infinity,
    excludeIds: idList(excludeIds),
  });
}

/** 施加状态（灼烧 / 冻结 / 感电 / 破甲 / 减速）。 */
export function statusEffect({ targetId = null, status, duration, potency = 1, stacks = 1, interval = 0, source = null, meta = null }) {
  return effect(EFFECT.STATUS, {
    targetId,
    status,
    duration: nonNegative(duration),
    potency: num(potency, 1),
    stacks: Math.max(1, Math.round(num(stacks, 1))),
    interval: nonNegative(interval),
    source,
    meta: meta ? { ...meta } : null,
  });
}

/** 移除状态（蒸发移除冻结）。 */
export function clearStatusEffect({ targetId = null, status, reason = null }) {
  return effect(EFFECT.CLEAR_STATUS, { targetId, status, reason });
}

/** 元素附着写入 / 清除。stacks 为 0 表示清除。 */
export function auraEffect({ targetId = null, element, stacks, power = 1, expiresAt = null }) {
  return effect(EFFECT.AURA, {
    targetId,
    element: element ?? null,
    stacks: nonNegative(stacks),
    power: num(power, 1),
    expiresAt: typeof expiresAt === "number" && Number.isFinite(expiresAt) ? expiresAt : null,
  });
}

/** 限时增益（爆蛋时刻窗口、光环、钓鱼 BUFF）。duration 为 0 表示不过期。 */
export function buffEffect({ id, scope = PARTY_SCOPE.TEAM, targetId = null, duration, mods = {}, stacks = 1, source = null }) {
  return effect(EFFECT.BUFF, {
    id,
    scope,
    targetId,
    duration: nonNegative(duration),
    mods: { ...mods },
    stacks: Math.max(1, Math.round(num(stacks, 1))),
    source,
  });
}

export function healEffect({ targetId = null, scope = PARTY_SCOPE.SELF, amount = 0, ratio = 0, source = null }) {
  return effect(EFFECT.HEAL, { targetId, scope, amount: nonNegative(amount), ratio: nonNegative(ratio), source });
}

export function shieldEffect({ targetId = null, scope = PARTY_SCOPE.SELF, amount, duration, blocks = 0, source = null }) {
  return effect(EFFECT.SHIELD, {
    targetId,
    scope,
    amount: nonNegative(amount),
    duration: nonNegative(duration),
    blocks: Math.max(0, Math.round(num(blocks))),
    source,
  });
}

export function energyEffect({ targetId = null, scope = PARTY_SCOPE.SELF, amount = 0, ratio = 0, source = null }) {
  return effect(EFFECT.ENERGY, { targetId, scope, amount: num(amount), ratio: num(ratio), source });
}

/** 连击指令：burst = 爆蛋时刻，add/set/reset/hold 供技能改连击。 */
export function comboEffect({ op, value = 0, duration = 0, source = null }) {
  return effect(EFFECT.COMBO, { op, value: num(value), duration: nonNegative(duration), source });
}

/** 请求物理层追加发射蛋，战斗层不碰积分器。 */
export function spawnEggEffect({ count = 1, template = {}, spread = 0, inherit = 0, origin = null, source = null }) {
  return effect(EFFECT.SPAWN_EGG, {
    count: Math.max(0, Math.round(num(count, 1))),
    template: { ...template },
    spread: num(spread),
    inherit: num(inherit),
    origin: point(origin),
    source,
  });
}

/** 请求物理层修改某枚蛋的属性（半径 / 弹性 / 穿透 / 附魔）。duration 为 0 表示永久。 */
export function eggPatchEffect({ eggId = null, scope = EGG_SCOPE.ACTIVE, patch = {}, duration = 0, source = null }) {
  return effect(EFFECT.EGG_PATCH, { eggId, scope, patch: { ...patch }, duration: nonNegative(duration), source });
}

/** 请求物理层生成场（冰面、风扇、减速域）。 */
export function fieldEffect({ kind, x = 0, y = 0, w = 0, h = 0, radius = 0, duration = 0, params = {}, source = null }) {
  return effect(EFFECT.FIELD, {
    kind,
    x: num(x),
    y: num(y),
    w: nonNegative(w),
    h: nonNegative(h),
    radius: nonNegative(radius),
    duration: nonNegative(duration),
    params: { ...params },
    source,
  });
}

/**
 * 表现层提示：震屏、顿帧、飘字、音效 key。
 *
 * UI 契约：`kind` 取自 `FEEDBACK`；`intensity` 落在 [0, 4]；`duration` 单位是秒；
 * `at` 是世界坐标或 `null`（表示全屏 / 无锚点）；`targetId` 给需要跟随实体的飘字用。
 */
export function feedbackEffect({ kind, intensity = 1, duration = 0, text: label = null, tone = null, at = null, targetId = null }) {
  return effect(EFFECT.FEEDBACK, {
    kind,
    intensity: Math.min(MAX_INTENSITY, nonNegative(intensity, 1)),
    duration: nonNegative(duration),
    text: text(label),
    tone: tag(tone),
    at: point(at),
    targetId,
  });
}

/** 是不是一条形状合法的指令。 */
export function isEffect(fx) {
  return Boolean(fx) && typeof fx === "object" && EFFECT_TYPES.includes(fx.type);
}

/** 指令所属执行域，兼容手工构造、没写 domain 的指令。 */
export function domainOf(fx) {
  return fx?.domain ?? EFFECT_DOMAIN[fx?.type] ?? DOMAIN.COMBAT;
}

/** 按执行域过滤指令。 */
export function effectsForDomain(effects, domain) {
  return (effects ?? []).filter((fx) => isEffect(fx) && domainOf(fx) === domain);
}

/** 按类型过滤指令。 */
export function effectsOfType(effects, type) {
  return (effects ?? []).filter((fx) => fx?.type === type);
}

/**
 * 按 `DOMAIN_ORDER` 稳定排序：段间有序，段内保持原有产出顺序。
 * 非法指令一律丢弃，免得下游再写一遍防御分支。
 */
export function sortEffects(effects) {
  const buckets = new Map(DOMAIN_ORDER.map((d) => [d, []]));
  for (const fx of effects ?? []) {
    if (!isEffect(fx)) continue;
    (buckets.get(domainOf(fx)) ?? buckets.get(DOMAIN.COMBAT)).push(fx);
  }
  return DOMAIN_ORDER.flatMap((d) => buckets.get(d));
}

/**
 * 一次性把指令分流到四个执行域。
 *
 * @returns {{ combat:object[], physics:object[], party:object[], presentation:object[] }}
 */
export function splitEffects(effects) {
  const out = { combat: [], physics: [], party: [], presentation: [] };
  for (const fx of effects ?? []) {
    if (!isEffect(fx)) continue;
    switch (domainOf(fx)) {
      case DOMAIN.PHYSICS:
        out.physics.push(fx);
        break;
      case DOMAIN.PARTY:
        out.party.push(fx);
        break;
      case DOMAIN.PRESENTATION:
        out.presentation.push(fx);
        break;
      default:
        out.combat.push(fx);
    }
  }
  return out;
}

/**
 * 把表现层指令折叠成 UI 一帧能直接执行的计划。
 *
 * 顿帧与震屏取本次最强的一条（同一帧叠三次顿帧只会让手感发黏），
 * 其余按产出顺序保留为列表。未知 `kind` 进 `other`，保证加了新表现也不会丢指令。
 *
 * @returns {{
 *   hitstop:number, shake:number, shakeDuration:number,
 *   floaters:object[], flashes:object[], trails:object[], sfx:object[], bursts:object[], other:object[],
 *   count:number
 * }}
 */
export function presentationPlan(effects) {
  const plan = {
    hitstop: 0,
    shake: 0,
    shakeDuration: 0,
    floaters: [],
    flashes: [],
    trails: [],
    sfx: [],
    bursts: [],
    other: [],
    count: 0,
  };

  for (const fx of effects ?? []) {
    if (!isEffect(fx) || fx.type !== EFFECT.FEEDBACK) continue;
    plan.count += 1;
    switch (fx.kind) {
      case FEEDBACK.HITSTOP:
        plan.hitstop = Math.max(plan.hitstop, fx.duration);
        break;
      case FEEDBACK.SHAKE:
        if (fx.intensity >= plan.shake) {
          plan.shake = fx.intensity;
          plan.shakeDuration = Math.max(plan.shakeDuration, fx.duration);
        }
        break;
      case FEEDBACK.FLOATER:
        plan.floaters.push(fx);
        break;
      case FEEDBACK.FLASH:
        plan.flashes.push(fx);
        break;
      case FEEDBACK.TRAIL:
        plan.trails.push(fx);
        break;
      case FEEDBACK.SFX:
        plan.sfx.push(fx);
        break;
      case FEEDBACK.ELEMENT_BURST:
        plan.bursts.push(fx);
        break;
      default:
        plan.other.push(fx);
    }
  }

  return plan;
}

/** `presentationPlan()` 认不认识这个 kind。 */
export function isKnownFeedback(kind) {
  return FEEDBACK_KIND_SET.has(kind);
}
