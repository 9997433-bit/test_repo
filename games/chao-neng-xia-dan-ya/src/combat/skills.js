/**
 * 技能注册表。
 *
 * 铁律：技能只产出效果指令（effects），绝不直接改物理世界、蛋数组或敌人血量。
 * 想让蛋变大、分裂、追加发射、生成冰面，一律走 `egg_patch` / `spawn_egg` / `field`
 * 指令，由 src/physics 自行决定怎么落地。战斗层因此可以在无浏览器环境下单测。
 *
 * 技能 id 解析顺序：显式传入 → `src/data` 英雄表的 `skill` 字段 → 英雄 id 别名。
 */

import * as DATA from "../data/index.js";
import { ELEMENT, ELEMENTS, STATUS } from "./constants.js";
import {
  buffEffect,
  chainEffect,
  comboEffect,
  eggPatchEffect,
  energyEffect,
  explosionEffect,
  feedbackEffect,
  fieldEffect,
  healEffect,
  shieldEffect,
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
 * 技能定义。
 * `cast(p)` 接收 { caster, primaryTarget, targets, allies, now, mods, ctx, combo, launcher }，
 * 返回效果指令数组。
 */
export const SKILLS = {
  /* ---------------- 连击流 ---------------- */
  shuriken_eggs: {
    id: "shuriken_eggs",
    name: "手里剑蛋",
    school: "combo",
    cost: 80,
    desc: "主蛋命中后追加 2 枚小手里剑蛋",
    cast: ({ caster, launcher, now }) => [
      spawnEggEffect({
        count: 2,
        spread: 0.28,
        inherit: 0.7,
        origin: posOf(launcher, { x: 240, y: 60 }),
        template: { power: atkOf(caster) * 0.45, radius: 7, tags: ["shuriken"], bouncePriority: "enemy" },
        source: caster?.id ?? null,
      }),
      feedbackEffect({ kind: "sfx", tone: "shuriken", intensity: 0.7, at: posOf(launcher, { x: 240, y: 60 }), duration: 0, text: null }),
    ],
  },
  fallen_slash: {
    id: "fallen_slash",
    name: "堕羽斩",
    school: "combo",
    cost: 100,
    desc: "连击 ≥8 时对当前目标斩击",
    requires: ({ combo = 0 }) => (combo >= 8 ? null : "连击不足 8 层"),
    cast: ({ caster, primaryTarget, combo = 0 }) =>
      primaryTarget
        ? [
            strike({ target: primaryTarget, damage: atkOf(caster) * (2.6 + combo * 0.08), sourceId: caster?.id ?? null, kind: "fallen_slash" }),
            feedbackEffect({ kind: "hitstop", duration: 0.09, intensity: 0.9, at: posOf(primaryTarget) }),
            feedbackEffect({ kind: "floater", text: "堕羽斩", tone: "combo", at: posOf(primaryTarget) }),
          ]
        : [],
  },
  dash_crit: {
    id: "dash_crit",
    name: "冲刺暴击",
    school: "combo",
    cost: 70,
    desc: "发射瞬移短冲刺，首撞必定暴击",
    cast: ({ caster, launcher }) => [
      eggPatchEffect({
        scope: "next",
        duration: 0,
        patch: { forceCrit: true, critMult: 2.1, speedMult: 1.35, tags: ["dash"] },
        source: caster?.id ?? null,
      }),
      feedbackEffect({ kind: "trail", tone: "dash", intensity: 1, duration: 0.3, at: posOf(launcher, { x: 240, y: 60 }) }),
    ],
  },
  energy_share: {
    id: "energy_share",
    name: "小帅光环",
    school: "combo",
    cost: 100,
    desc: "为其他英雄回复 30% 能量",
    cast: ({ caster }) => [
      energyEffect({ scope: "others", ratio: 0.3, source: caster?.id ?? null }),
      feedbackEffect({ kind: "flash", tone: "support", intensity: 0.6, duration: 0.25 }),
    ],
  },
  combo_hold: {
    id: "combo_hold",
    name: "云端悬停",
    school: "combo",
    cost: 90,
    desc: "4 秒内连击不衰减",
    cast: ({ caster }) => [
      buffEffect({ id: "combo_hold", scope: "team", duration: 4, mods: { comboDecayMult: 0 }, source: caster?.id ?? null }),
      comboEffect({ op: "hold", duration: 4, source: caster?.id ?? null }),
    ],
  },

  /* ---------------- 直殴流 ---------------- */
  solar_burn: {
    id: "solar_burn",
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
        feedbackEffect({ kind: "shake", intensity: 0.8, duration: 0.22, at }),
      ];
    },
  },
  heavy_pierce: {
    id: "heavy_pierce",
    name: "齿轮增重",
    school: "brute",
    cost: 90,
    desc: "蛋变重，击碎砖块额外穿透",
    cast: ({ caster }) => [
      eggPatchEffect({ scope: "active", duration: 8, patch: { massMult: 1.6, radiusDelta: 3, pierce: 1, restitutionMult: 0.9 }, source: caster?.id ?? null }),
      buffEffect({ id: "heavy_pierce", scope: "team", duration: 8, mods: { pierce: 1, knockback: 1 }, source: caster?.id ?? null }),
    ],
  },
  war_drum: {
    id: "war_drum",
    name: "战鼓光环",
    school: "brute",
    cost: 110,
    desc: "全队攻击 +12%",
    cast: ({ caster }) => [
      buffEffect({ id: "war_drum", scope: "team", duration: 12, mods: { atkMult: 1.12 }, source: caster?.id ?? null }),
      feedbackEffect({ kind: "sfx", tone: "drum", intensity: 0.8 }),
    ],
  },
  grudge_stack: {
    id: "grudge_stack",
    name: "倒霉反弹",
    school: "brute",
    cost: 80,
    desc: "按本回合砖块反弹次数提升伤害",
    cast: ({ caster, ctx = {} }) => {
      const stacks = Math.min(10, Math.max(1, Math.floor(ctx.bounces ?? ctx.brickBounces ?? 1)));
      return [
        buffEffect({ id: "grudge_stack", scope: "team", duration: 10, stacks, mods: { damageMult: 1.08 }, source: caster?.id ?? null }),
        feedbackEffect({ kind: "floater", text: `倒霉 ×${stacks}`, tone: "brute" }),
      ];
    },
  },
  extra_egg: {
    id: "extra_egg",
    name: "元气加蛋",
    school: "brute",
    cost: 60,
    desc: "额外发射 1 枚主蛋",
    cast: ({ caster, launcher }) => [
      spawnEggEffect({ count: 1, inherit: 1, spread: 0.12, origin: posOf(launcher, { x: 240, y: 60 }), template: { tags: ["extra"] }, source: caster?.id ?? null }),
    ],
  },

  /* ---------------- 属性流 ---------------- */
  shock_bounce: {
    id: "shock_bounce",
    name: "感电弹跳",
    school: "elemental",
    element: ELEMENT.THUNDER,
    cost: 90,
    desc: "主蛋带雷，弹跳优先敌人",
    cast: ({ caster, primaryTarget }) => {
      const effects = [
        eggPatchEffect({ scope: "active", duration: 6, patch: { element: ELEMENT.THUNDER, bouncePriority: "enemy", homing: 0.25 }, source: caster?.id ?? null }),
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
  shock_spread: {
    id: "shock_spread",
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
        feedbackEffect({ kind: "floater", text: "扩散", tone: "thunder", at }),
      ];
    },
  },
  sky_thunder: {
    id: "sky_thunder",
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
        return explosionEffect({ x: at.x, y: at.y, radius: 70, damage: atkOf(caster) * 1.6, element: ELEMENT.THUNDER, falloff: 0.3, kind: "sky_thunder", sourceId: caster?.id ?? null });
      });
    },
  },
  blizzard: {
    id: "blizzard",
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
        feedbackEffect({ kind: "flash", tone: "ice", intensity: 0.9, duration: 0.3, at }),
      ];
    },
  },
  deep_freeze: {
    id: "deep_freeze",
    name: "极寒领域",
    school: "elemental",
    element: ELEMENT.ICE,
    cost: 100,
    desc: "延长冻结并生成冰面",
    cast: ({ caster, launcher }) => [
      buffEffect({ id: "deep_freeze", scope: "team", duration: 10, mods: { statusDurationMult: 1.5, elementPowerMult: 1.15 }, source: caster?.id ?? null }),
      fieldEffect({ kind: "ice", x: posOf(launcher, { x: 240, y: 700 }).x, y: 760, w: 480, h: 24, duration: 10, params: { friction: 0.02 }, source: caster?.id ?? null }),
    ],
  },

  /* ---------------- 碰撞流 / 辅助 ---------------- */
  growing_fang: {
    id: "growing_fang",
    name: "鲨齿增生",
    school: "collide",
    cost: 90,
    desc: "每次碰撞蛋半径 +1",
    cast: ({ caster }) => [
      eggPatchEffect({ scope: "active", duration: 10, patch: { radiusPerCollision: 1, maxRadius: 22 }, source: caster?.id ?? null }),
      buffEffect({ id: "growing_fang", scope: "team", duration: 10, mods: { radiusPerCollision: 1, collisionDamageMult: 1.1 }, source: caster?.id ?? null }),
    ],
  },
  antler_split: {
    id: "antler_split",
    name: "鹿角分裂",
    school: "collide",
    cost: 100,
    desc: "碰撞时分裂出小蛋",
    cast: ({ caster }) => [
      eggPatchEffect({ scope: "active", duration: 8, patch: { splitOnCollide: true, splitCount: 2, splitInherit: 0.7 }, source: caster?.id ?? null }),
      buffEffect({ id: "antler_split", scope: "team", duration: 8, mods: { splitChance: 0.2 }, source: caster?.id ?? null }),
    ],
  },
  yolk_heal: {
    id: "yolk_heal",
    name: "蛋黄治愈",
    school: "support",
    cost: 80,
    desc: "回收蛋时恢复生命",
    cast: ({ caster }) => [
      healEffect({ scope: "party", ratio: 0.04, source: caster?.id ?? null }),
      feedbackEffect({ kind: "floater", text: "回复", tone: "heal" }),
    ],
  },
  shell_guard: {
    id: "shell_guard",
    name: "蛋壳护盾",
    school: "support",
    cost: 90,
    desc: "抵挡一次漏怪伤害",
    cast: ({ caster, mods = {} }) => [
      shieldEffect({ scope: "party", amount: atkOf(caster) * 3 * modOf(mods, "shieldMult"), duration: 20, blocks: 1, source: caster?.id ?? null }),
      feedbackEffect({ kind: "flash", tone: "shield", intensity: 0.5, duration: 0.2 }),
    ],
  },
  grace_slow: {
    id: "grace_slow",
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

/** 英雄 id → 技能 id 的兜底别名，数据表尚未填齐时也能拿到技能。 */
export const SKILL_BY_HERO = {
  ninja_goose: "shuriken_eggs",
  fallen_crow: "fallen_slash",
  dash_duck: "dash_crit",
  dandy_pigeon: "energy_share",
  lark: "combo_hold",
  sun_bird: "solar_burn",
  mech_goose: "heavy_pierce",
  drum_chick: "war_drum",
  unlucky_duck: "grudge_stack",
  pep_chick: "extra_egg",
  thunder_chick: "shock_bounce",
  hiphop_duck: "shock_spread",
  bird_of_paradise: "sky_thunder",
  ice_phoenix: "blizzard",
  emperor_penguin: "deep_freeze",
  shark_eagle: "growing_fang",
  deer_chick: "antler_split",
  heal_duck: "yolk_heal",
  guard_duck: "shell_guard",
  grace_goose: "grace_slow",
};

/** 解析出技能 id。 */
export function skillIdFor(hero) {
  if (!hero) return null;
  if (typeof hero === "string") {
    if (SKILLS[hero]) return hero;
    const fromData = (DATA.HEROES ?? {})[hero]?.skill;
    if (fromData && SKILLS[fromData]) return fromData;
    return SKILL_BY_HERO[hero] ?? null;
  }
  if (hero.skill && SKILLS[hero.skill]) return hero.skill;
  if (hero.skillId && SKILLS[hero.skillId]) return hero.skillId;
  return skillIdFor(hero.id ?? null);
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
    effects: effects.filter(Boolean),
    events: [skillCastEvent({ heroId: casterId, skill: skill.id, name: skill.name, cost })],
    reason: null,
  };
}
