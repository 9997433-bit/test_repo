/**
 * 技能注册表。
 *
 * 铁律：技能只产出效果指令（effects），绝不直接改物理世界、蛋数组或敌人血量。
 * 想让蛋变大、分裂、追加发射、生成冰面，一律走 `egg_patch` / `spawn_egg` / `field`
 * 指令，由 src/physics 自行决定怎么落地。战斗层因此可以在无浏览器环境下单测。
 *
 * ## 口径
 *
 * 技能 id 以 `src/data/heroes.js` 的 `skill` 字段为唯一权威，本表的键与之一一对应：
 * 18 个在役英雄 = 18 个技能，一个不多一个不少。`src/data` 的 `RESERVED_HERO_IDS`
 * （云朵雀 lark / 倒霉鸭 unlucky_duck）是基线 GDD 的预留位，本版本不上场，
 * 因此这里没有、也不允许有对应的技能条目——`SKILL_BY_HERO` 直接从英雄表派生，
 * 结构上杜绝了旧的 20 英雄口径回流。
 *
 * 历史上战斗层与 `src/heroes/skills.js` 各自起过一套 id，统一由 `SKILL_ALIAS` 归一，
 * 老调用方传 `fallen_slash` / `shock_spread` 这类旧名仍然解析得到。
 *
 * 技能 id 解析顺序：显式 id / 别名 → 英雄表的 `skill` 字段 → 英雄 id。
 */

import * as DATA from "../data/index.js";
import { ELEMENT, ELEMENTS, STATUS } from "./constants.js";
import {
  EGG_SCOPE,
  FEEDBACK,
  PARTY_SCOPE,
  buffEffect,
  chainEffect,
  eggPatchEffect,
  energyEffect,
  explosionEffect,
  feedbackEffect,
  fieldEffect,
  healEffect,
  shieldEffect,
  sortEffects,
  spawnEggEffect,
  statusEffect,
} from "./effects.js";
import { skillCastEvent, skillFailedEvent } from "./events.js";
import { modOf } from "./modifiers.js";
import { readStatuses } from "./status.js";

const DEFAULT_COST = 100;

function atkOf(caster = {}) {
  return caster.atk ?? caster.power ?? 12;
}

function posOf(entity, fallback = { x: 240, y: 400 }) {
  if (entity && typeof entity.x === "number") return { x: entity.x, y: entity.y ?? fallback.y };
  return fallback;
}

/** 单体技能伤害用一个极小半径的爆炸表达，好处是复用统一的减伤 / 抗性结算。 */
function strike({ target, damage, element = ELEMENT.PHYSICAL, sourceId, kind = "skill" }) {
  const at = posOf(target);
  return explosionEffect({ x: at.x, y: at.y, radius: 24, falloff: 0, damage, element, kind, sourceId });
}

function withinRadius(targets = [], at, radius) {
  return targets.filter((t) => t && Math.hypot((t.x ?? 0) - at.x, (t.y ?? 0) - at.y) <= radius);
}

/**
 * 技能行为表：战斗层只拥有 `cast()` / `requires()`，展示信息与能耗以 `src/data` 为准。
 * `cast(p)` 接收 { caster, primaryTarget, targets, allies, now, mods, ctx, combo, launcher }，
 * 返回效果指令数组。`hero` 字段声明归属，供 `SKILL_BY_HERO` 反查。
 */
const BEHAVIORS = {
  /* ---------------- 连击流 combo（4） ---------------- */
  shuriken_split: {
    id: "shuriken_split",
    hero: "ninja_goose",
    name: "手里剑分蛋",
    school: "combo",
    cost: 80,
    desc: "主蛋命中后追加 2 枚小手里剑蛋",
    cast: ({ caster, launcher }) => {
      const origin = posOf(launcher, { x: 240, y: 60 });
      return [
        spawnEggEffect({
          count: 2,
          spread: 0.28,
          inherit: 0.7,
          origin,
          template: { power: atkOf(caster) * 0.45, radius: 7, tags: ["shuriken"], bouncePriority: "enemy" },
          source: caster?.id ?? null,
        }),
        feedbackEffect({ kind: FEEDBACK.SFX, tone: "shuriken", intensity: 0.7, at: origin }),
      ];
    },
  },
  dusk_slash: {
    id: "dusk_slash",
    hero: "fallen_crow",
    name: "堕羽斩",
    school: "combo",
    cost: 100,
    desc: "连击 ≥8 时对当前目标斩击",
    requires: ({ combo = 0 }) => (combo >= 8 ? null : "连击不足 8 层"),
    cast: ({ caster, primaryTarget, combo = 0 }) =>
      primaryTarget
        ? [
            strike({ target: primaryTarget, damage: atkOf(caster) * (2.6 + combo * 0.08), sourceId: caster?.id ?? null, kind: "dusk_slash" }),
            feedbackEffect({ kind: FEEDBACK.HITSTOP, duration: 0.09, intensity: 0.9, at: posOf(primaryTarget), targetId: primaryTarget.id ?? null }),
            feedbackEffect({ kind: FEEDBACK.FLOATER, text: "堕羽斩", tone: "combo", at: posOf(primaryTarget), targetId: primaryTarget.id ?? null }),
          ]
        : [],
  },
  dash_crit: {
    id: "dash_crit",
    hero: "dash_duck",
    name: "冲刺暴击",
    school: "combo",
    cost: 70,
    desc: "发射瞬移短冲刺，首撞必定暴击",
    cast: ({ caster, launcher }) => [
      eggPatchEffect({
        scope: EGG_SCOPE.NEXT,
        duration: 0,
        patch: { forceCrit: true, critMult: 2.1, speedMult: 1.35, tags: ["dash"] },
        source: caster?.id ?? null,
      }),
      feedbackEffect({ kind: FEEDBACK.TRAIL, tone: "dash", intensity: 1, duration: 0.3, at: posOf(launcher, { x: 240, y: 60 }) }),
    ],
  },
  encore_wing: {
    id: "encore_wing",
    hero: "dandy_pigeon",
    name: "小帅光环",
    school: "combo",
    cost: 100,
    desc: "为其他英雄回复 30% 能量",
    cast: ({ caster }) => [
      energyEffect({ scope: PARTY_SCOPE.OTHERS, ratio: 0.3, source: caster?.id ?? null }),
      feedbackEffect({ kind: FEEDBACK.FLASH, tone: "support", intensity: 0.6, duration: 0.25 }),
    ],
  },

  /* ---------------- 直殴流 brute（4） ---------------- */
  solar_burn: {
    id: "solar_burn",
    hero: "sun_bird",
    name: "日轮灼烧",
    school: "brute",
    element: ELEMENT.FIRE,
    cost: 100,
    desc: "高伤火爆并留下灼烧",
    cast: ({ caster, primaryTarget, mods = {} }) => {
      if (!primaryTarget) return [];
      const at = posOf(primaryTarget);
      const dmg = atkOf(caster) * 2.2;
      return [
        explosionEffect({ x: at.x, y: at.y, radius: 130, damage: dmg, element: ELEMENT.FIRE, falloff: 0.45, kind: "solar_burn", sourceId: caster?.id ?? null }),
        statusEffect({
          targetId: primaryTarget.id,
          status: STATUS.BURN,
          duration: ELEMENTS.BURN.duration * modOf(mods, "statusDurationMult"),
          interval: ELEMENTS.BURN.interval,
          potency: Math.max(1, dmg * ELEMENTS.BURN.ratio),
          source: caster?.id ?? null,
          meta: { element: ELEMENT.FIRE },
        }),
        feedbackEffect({ kind: FEEDBACK.SHAKE, intensity: 0.8, duration: 0.22, at, targetId: primaryTarget.id ?? null }),
      ];
    },
  },
  gear_egg: {
    id: "gear_egg",
    hero: "mech_goose",
    name: "齿轮增重",
    school: "brute",
    cost: 90,
    desc: "蛋变重，击碎砖块额外穿透",
    cast: ({ caster }) => [
      eggPatchEffect({ scope: EGG_SCOPE.ACTIVE, duration: 8, patch: { massMult: 1.6, radiusDelta: 3, pierce: 1, restitutionMult: 0.9 }, source: caster?.id ?? null }),
      buffEffect({ id: "gear_egg", scope: PARTY_SCOPE.TEAM, duration: 8, mods: { pierce: 1, knockback: 1 }, source: caster?.id ?? null }),
    ],
  },
  war_drum: {
    id: "war_drum",
    hero: "drum_chick",
    name: "战鼓光环",
    school: "brute",
    cost: 110,
    desc: "全队攻击 +12%",
    cast: ({ caster }) => [
      buffEffect({ id: "war_drum", scope: PARTY_SCOPE.TEAM, duration: 12, mods: { atkMult: 1.12 }, source: caster?.id ?? null }),
      feedbackEffect({ kind: FEEDBACK.SFX, tone: "drum", intensity: 0.8 }),
    ],
  },
  pep_start: {
    id: "pep_start",
    hero: "pep_chick",
    name: "元气加蛋",
    school: "brute",
    cost: 60,
    desc: "额外发射 1 枚主蛋",
    cast: ({ caster, launcher }) => [
      spawnEggEffect({ count: 1, inherit: 1, spread: 0.12, origin: posOf(launcher, { x: 240, y: 60 }), template: { tags: ["extra"] }, source: caster?.id ?? null }),
    ],
  },

  /* ---------------- 属性流 elemental（5） ---------------- */
  shock_bounce: {
    id: "shock_bounce",
    hero: "thunder_chick",
    name: "感电弹跳",
    school: "elemental",
    element: ELEMENT.THUNDER,
    cost: 90,
    desc: "主蛋带雷，弹跳优先敌人",
    cast: ({ caster, primaryTarget }) => {
      const effects = [
        eggPatchEffect({ scope: EGG_SCOPE.ACTIVE, duration: 6, patch: { element: ELEMENT.THUNDER, bouncePriority: "enemy", homing: 0.25 }, source: caster?.id ?? null }),
      ];
      if (primaryTarget) {
        const at = posOf(primaryTarget);
        effects.push(
          chainEffect({
            fromId: primaryTarget.id,
            x: at.x,
            y: at.y,
            hops: ELEMENTS.SHOCK.hops,
            damage: atkOf(caster) * 1.1,
            element: ELEMENT.THUNDER,
            falloff: ELEMENTS.SHOCK.falloff,
            radius: ELEMENTS.SHOCK.radius,
          }),
        );
      }
      return effects;
    },
  },
  chain_groove: {
    id: "chain_groove",
    hero: "hiphop_duck",
    name: "嘻哈扩散",
    school: "elemental",
    element: ELEMENT.THUNDER,
    cost: 100,
    desc: "感电扩散到邻近 2 个目标",
    cast: ({ caster, primaryTarget, mods = {} }) => {
      if (!primaryTarget) return [];
      const at = posOf(primaryTarget);
      return [
        statusEffect({ targetId: primaryTarget.id, status: STATUS.SHOCK, duration: ELEMENTS.SHOCK.duration * modOf(mods, "statusDurationMult"), source: caster?.id ?? null, meta: { element: ELEMENT.THUNDER } }),
        chainEffect({ fromId: primaryTarget.id, x: at.x, y: at.y, hops: 2, damage: atkOf(caster) * 1.4, element: ELEMENT.THUNDER, falloff: 0.7, radius: 190 }),
        feedbackEffect({ kind: FEEDBACK.FLOATER, text: "扩散", tone: "thunder", at, targetId: primaryTarget.id ?? null }),
      ];
    },
  },
  afterglow_bolt: {
    id: "afterglow_bolt",
    hero: "bird_of_paradise",
    name: "天堂落雷",
    school: "elemental",
    element: ELEMENT.THUNDER,
    cost: 120,
    desc: "对所有带电敌人补一道雷",
    cast: ({ caster, targets = [], ctx = {}, now = 0 }) => {
      const charged = targets.filter((t) => readStatuses(t, ctx, now)[STATUS.SHOCK]);
      const list = charged.length ? charged : targets.slice(0, 1);
      return list.map((t) => {
        const at = posOf(t);
        return explosionEffect({ x: at.x, y: at.y, radius: 70, damage: atkOf(caster) * 1.6, element: ELEMENT.THUNDER, falloff: 0.3, kind: "afterglow_bolt", sourceId: caster?.id ?? null });
      });
    },
  },
  blizzard: {
    id: "blizzard",
    hero: "ice_phoenix",
    name: "暴风雪",
    school: "elemental",
    element: ELEMENT.ICE,
    cost: 130,
    desc: "大范围冰爆并冻结",
    cast: ({ caster, targets = [], launcher, primaryTarget, mods = {} }) => {
      const at = posOf(primaryTarget ?? launcher, { x: 240, y: 420 });
      const radius = 210;
      const frozen = withinRadius(targets, at, radius);
      return [
        explosionEffect({ x: at.x, y: at.y, radius, damage: atkOf(caster) * 1.8, element: ELEMENT.ICE, falloff: 0.35, kind: "blizzard", sourceId: caster?.id ?? null }),
        ...frozen.map((t) =>
          statusEffect({ targetId: t.id, status: STATUS.FREEZE, duration: ELEMENTS.FREEZE.duration * modOf(mods, "statusDurationMult"), potency: ELEMENTS.FREEZE.damageTakenMult, source: caster?.id ?? null, meta: { element: ELEMENT.ICE } }),
        ),
        feedbackEffect({ kind: FEEDBACK.FLASH, tone: "ice", intensity: 0.9, duration: 0.3, at }),
      ];
    },
  },
  glacier_march: {
    id: "glacier_march",
    hero: "emperor_penguin",
    name: "极寒领域",
    school: "elemental",
    element: ELEMENT.ICE,
    cost: 100,
    desc: "延长冻结并生成冰面",
    cast: ({ caster, launcher }) => [
      buffEffect({ id: "glacier_march", scope: PARTY_SCOPE.TEAM, duration: 10, mods: { statusDurationMult: 1.5, elementPowerMult: 1.15 }, source: caster?.id ?? null }),
      fieldEffect({ kind: "ice", x: posOf(launcher, { x: 240, y: 700 }).x, y: 760, w: 480, h: 24, duration: 10, params: { friction: 0.02 }, source: caster?.id ?? null }),
    ],
  },

  /* ---------------- 碰撞流 collide（2） ---------------- */
  feeding_frenzy: {
    id: "feeding_frenzy",
    hero: "shark_eagle",
    name: "鲨齿增生",
    school: "collide",
    cost: 90,
    desc: "每次碰撞蛋半径 +1",
    cast: ({ caster }) => [
      eggPatchEffect({ scope: EGG_SCOPE.ACTIVE, duration: 10, patch: { radiusPerCollision: 1, maxRadius: 22 }, source: caster?.id ?? null }),
      buffEffect({ id: "feeding_frenzy", scope: PARTY_SCOPE.TEAM, duration: 10, mods: { radiusPerCollision: 1, collisionDamageMult: 1.1 }, source: caster?.id ?? null }),
    ],
  },
  antler_split: {
    id: "antler_split",
    hero: "deer_chick",
    name: "鹿角分裂",
    school: "collide",
    cost: 100,
    desc: "碰撞时分裂出小蛋",
    cast: ({ caster }) => [
      eggPatchEffect({ scope: EGG_SCOPE.ACTIVE, duration: 8, patch: { splitOnCollide: true, splitCount: 2, splitInherit: 0.7 }, source: caster?.id ?? null }),
      buffEffect({ id: "antler_split", scope: PARTY_SCOPE.TEAM, duration: 8, mods: { splitChance: 0.2 }, source: caster?.id ?? null }),
    ],
  },

  /* ---------------- 辅助 support（3） ---------------- */
  yolk_heal: {
    id: "yolk_heal",
    hero: "heal_duck",
    name: "蛋黄治愈",
    school: "support",
    cost: 80,
    desc: "回收蛋时恢复生命",
    cast: ({ caster }) => [
      healEffect({ scope: PARTY_SCOPE.PARTY, ratio: 0.04, source: caster?.id ?? null }),
      feedbackEffect({ kind: FEEDBACK.FLOATER, text: "回复", tone: "heal" }),
    ],
  },
  shell_guard: {
    id: "shell_guard",
    hero: "guard_duck",
    name: "蛋壳护盾",
    school: "support",
    cost: 90,
    desc: "抵挡一次漏怪伤害",
    cast: ({ caster, mods = {} }) => [
      shieldEffect({ scope: PARTY_SCOPE.PARTY, amount: atkOf(caster) * 3 * modOf(mods, "shieldMult"), duration: 20, blocks: 1, source: caster?.id ?? null }),
      feedbackEffect({ kind: FEEDBACK.FLASH, tone: "shield", intensity: 0.5, duration: 0.2 }),
    ],
  },
  grace_waltz: {
    id: "grace_waltz",
    hero: "grace_goose",
    name: "优雅领域",
    school: "support",
    cost: 90,
    desc: "减速敌人，配合冰系",
    cast: ({ caster, targets = [], mods = {} }) => [
      ...targets.map((t) =>
        statusEffect({ targetId: t.id, status: STATUS.SLOW, duration: 6 * modOf(mods, "statusDurationMult"), potency: 0.35, source: caster?.id ?? null }),
      ),
      fieldEffect({ kind: "slow", x: 240, y: 400, radius: 240, duration: 6, params: { factor: 0.65 }, source: caster?.id ?? null }),
    ],
  },
};

/**
 * 能量消耗。
 *
 * 数据表声明了 `energyCost` 就照抄；没声明的（被动型技能，战斗层把它做成了可主动释放的形态）
 * 用本表的默认值，但必须夹到英雄自己的能量上限以内——消耗大于上限的技能永远攒不满，
 * 等于没做。战斗层不自行发明数值，只做这一层夹取。
 */
function costOf(behavior) {
  const declared = (DATA.SKILLS ?? {})[behavior.id]?.energyCost;
  if (Number.isFinite(declared)) return declared;
  const cap = (DATA.HEROES ?? {})[behavior.hero]?.energy;
  return Number.isFinite(cap) ? Math.min(behavior.cost ?? DEFAULT_COST, cap) : behavior.cost ?? DEFAULT_COST;
}

/**
 * 技能注册表：行为（本层） + 展示信息与能耗（`src/data`）。
 * 名称 / 描述不在战斗层再抄一份，数据表改名这里自动跟随；数据表缺条目时用本层兜底值。
 */
export const SKILLS = Object.fromEntries(
  Object.entries(BEHAVIORS).map(([id, behavior]) => {
    const meta = (DATA.SKILLS ?? {})[id] ?? null;
    return [id, { ...behavior, name: meta?.name ?? behavior.name, desc: meta?.desc ?? behavior.desc, trigger: meta?.trigger ?? "active", cost: costOf(behavior) }];
  }),
);

/**
 * 历史 id → 当前 id。
 *
 * 左侧收录了战斗层早期的自造名与 `src/heroes/skills.js` 的另一套 id，
 * 让旧存档、旧日志、旧调用方都还能解析。新代码一律直接用右侧的权威 id。
 */
export const SKILL_ALIAS = Object.freeze({
  shuriken_eggs: "shuriken_split",
  fallen_slash: "dusk_slash",
  energy_share: "encore_wing",
  dandy_refresh: "encore_wing",
  heavy_pierce: "gear_egg",
  gear_heavy: "gear_egg",
  extra_egg: "pep_start",
  pep_extra_egg: "pep_start",
  shock_spread: "chain_groove",
  sky_thunder: "afterglow_bolt",
  paradise_bolt: "afterglow_bolt",
  frost_egg: "blizzard",
  deep_freeze: "glacier_march",
  ice_floor: "glacier_march",
  growing_fang: "feeding_frenzy",
  collide_growth: "feeding_frenzy",
  collide_split: "antler_split",
  grace_slow: "grace_waltz",
});

/** 本版本不上场的预留英雄，任何情况下都不该解析出技能。 */
const RESERVED_HEROES = new Set(DATA.RESERVED_HERO_IDS ?? []);

/**
 * 英雄 id → 技能 id。
 *
 * 直接从 `src/data` 英雄表派生而不是手抄：英雄表增删英雄时这里自动跟随，
 * 预留英雄（lark / unlucky_duck）因为不在表里而天然缺席。
 */
export const SKILL_BY_HERO = Object.freeze(
  Object.fromEntries(
    Object.values(DATA.HEROES ?? {})
      .filter((hero) => hero?.id && !RESERVED_HEROES.has(hero.id))
      .map((hero) => [hero.id, canonicalSkillId(hero.skill) ?? heroOwnedSkill(hero.id)])
      .filter(([, skill]) => Boolean(skill)),
  ),
);

/** 技能表里声明自己属于某英雄的那一条，作为英雄表 `skill` 字段缺失时的兜底。 */
function heroOwnedSkill(heroId) {
  return Object.values(SKILLS).find((skill) => skill.hero === heroId)?.id ?? null;
}

/** 把任意历史写法的技能 id 归一到当前 id，认不出来则返回 null。 */
export function canonicalSkillId(id) {
  if (typeof id !== "string" || !id) return null;
  if (SKILLS[id]) return id;
  const aliased = SKILL_ALIAS[id];
  return aliased && SKILLS[aliased] ? aliased : null;
}

/** 解析出技能 id。入参可以是技能 id、别名、英雄 id 或英雄对象。 */
export function skillIdFor(hero) {
  if (!hero) return null;
  if (typeof hero === "string") {
    if (RESERVED_HEROES.has(hero)) return null;
    return canonicalSkillId(hero) ?? canonicalSkillId((DATA.HEROES ?? {})[hero]?.skill) ?? SKILL_BY_HERO[hero] ?? null;
  }
  return canonicalSkillId(hero.skill) ?? canonicalSkillId(hero.skillId) ?? skillIdFor(hero.id ?? null);
}

/** 取技能定义。 */
export function getSkill(hero) {
  const id = skillIdFor(hero);
  return id ? SKILLS[id] ?? null : null;
}

/** 技能能量消耗。 */
export function skillCost(hero) {
  return getSkill(hero)?.cost ?? DEFAULT_COST;
}

/**
 * 释放技能，只产出指令。
 *
 * `effects` 与 `resolveHit()` 同一套契约：按 combat → physics → party → presentation
 * 稳定分段，失败时恒为空数组。
 *
 * @param {string|object} hero 英雄 id 或英雄对象
 * @param {object} params { caster, primaryTarget, targets, allies, energy, combo, mods, ctx, now, launcher }
 * @returns {{ ok:boolean, id:string|null, cost:number, effects:object[], events:object[], reason:string|null }}
 */
export function castSkill(hero, params = {}) {
  const skill = getSkill(hero);
  const casterId = params.caster?.id ?? (typeof hero === "string" ? hero : hero?.id) ?? null;

  if (!skill) {
    return { ok: false, id: null, cost: 0, effects: [], events: [skillFailedEvent({ heroId: casterId, reason: "未知技能" })], reason: "未知技能" };
  }

  const cost = skill.cost ?? DEFAULT_COST;
  if (typeof params.energy === "number" && params.energy < cost) {
    const reason = "能量不足";
    return { ok: false, id: skill.id, cost, effects: [], events: [skillFailedEvent({ heroId: casterId, skill: skill.id, reason })], reason };
  }

  const gate = skill.requires?.(params) ?? null;
  if (gate) {
    return { ok: false, id: skill.id, cost, effects: [], events: [skillFailedEvent({ heroId: casterId, skill: skill.id, reason: gate })], reason: gate };
  }

  const caster = params.caster ?? (typeof hero === "object" ? hero : (DATA.HEROES ?? {})[hero] ?? { id: hero });
  const effects = skill.cast({ ...params, caster }) ?? [];

  return {
    ok: true,
    id: skill.id,
    cost,
    effects: sortEffects(effects),
    events: [skillCastEvent({ heroId: casterId, skill: skill.id, name: skill.name, cost })],
    reason: null,
  };
}
