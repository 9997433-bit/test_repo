/**
 * 英雄运行时实例（Opus-3 所有权）。
 *
 * 实例是「数据表条目 + 养成上下文 + 光环」在某一局战斗中的快照，
 * 只持有可变的战斗态（能量、冷却、本回合层数），不回写存档。
 *
 * 实例会平铺数据表条目的展示字段（palette / passive / lore / element 等），
 * 并额外提供 HUD 直接可读的稳定字段：`atk`、`energy` / `energyMax` / `maxEnergy`、
 * `ultCost`、`ultId`、以及归一化成对象的 `ult`（见 `hud.js` 的字段清单）。
 */
import { neutralContext } from "../progression/context.js";
import { computeHeroStats } from "./stats.js";
import { auraOf, mergeTraitMods, resolveSkill, schoolOf, unlockedTraits } from "./skills.js";
import { energyMaxFor, ultEnergyCost, ultSkillDef, ultSkillId } from "./energy.js";

/**
 * 大招的展示形状。名字/文案取 heroes 层登记的招牌大招，
 * 消耗一律是数据表口径，`id` 指回 `data/skills.js`，方便 HUD 与图鉴对同一条大招说话。
 */
function ultView(def, skill, cost) {
  const table = ultSkillDef(def);
  return {
    id: ultSkillId(def) ?? skill?.ult?.id ?? null,
    name: skill?.ult?.name ?? table?.name ?? null,
    desc: skill?.ult?.desc ?? table?.desc ?? "",
    tableName: table?.name ?? null,
    cost,
  };
}

/**
 * @param {object} def 数据表英雄条目
 * @param {object} ctx 养成上下文
 * @param {{slot?: number, auras?: object, startEnergy?: number}} options
 */
export function createHeroInstance(def, ctx = neutralContext(), options = {}) {
  const { slot = 0, auras = {}, startEnergy } = options;
  const skill = resolveSkill(def);
  const level = Math.max(1, Math.floor(ctx.levelOf?.(def?.id) ?? 1));
  const star = Math.max(1, Math.floor(ctx.starOf?.(def?.id) ?? 1));
  const skillMods = mergeTraitMods(skill, star);
  const stats = computeHeroStats(def, ctx, auras);
  const energyMax = energyMaxFor(def, star, { skill, mods: skillMods, fallback: stats.energyMax });
  const ultCost = skill?.ult ? (ultEnergyCost(def, star, { skill, mods: skillMods }) ?? Infinity) : Infinity;

  return {
    ...def,
    uid: `${def.id}#${slot}`,
    id: def.id,
    name: def.name ?? def.id,
    race: def.race ?? "duck",
    school: schoolOf(def, skill),
    slot,
    def,
    mode: ctx.mode ?? "preview",
    level,
    star,
    stats,
    atk: stats.atk,
    baseAtk: def.atk ?? stats.atk,
    skill,
    skillMods,
    traits: unlockedTraits(skill, star),
    aura: auraOf(skill, star),
    energy: clampEnergy(startEnergy ?? skillMods.startEnergy ?? 0, energyMax),
    startEnergy: clampEnergy(startEnergy ?? skillMods.startEnergy ?? 0, energyMax),
    energyMax,
    maxEnergy: energyMax,
    ult: ultView(def, skill, ultCost),
    ultId: ultSkillId(def),
    ultCost,
    cooldown: 0,
    alive: true,
    turn: { fired: {}, stacks: {} },
    log: [],
  };
}

function clampEnergy(value, max) {
  const n = Number(value) || 0;
  return Math.min(max, Math.max(0, n));
}

/** 大招能量消耗：数据表权威，表外英雄才吃词条折扣（见 `energy.js`）。 */
export function ultimateCost(instance) {
  if (!instance?.skill?.ult) return Infinity;
  const cost = ultEnergyCost(instance.def, instance.star, {
    skill: instance.skill,
    mods: instance.skillMods,
  });
  return cost ?? Infinity;
}

export function ultimateReady(instance) {
  return instance?.alive === true && instance.energy >= ultimateCost(instance);
}

export function energyRatio(instance) {
  if (!instance?.energyMax) return 0;
  return Math.min(1, instance.energy / instance.energyMax);
}

/** 增减能量并返回实际变化量。ratio=true 时 amount 按能量上限的比例结算。 */
export function gainEnergy(instance, amount, { ratio = false } = {}) {
  if (!instance) return 0;
  const delta = ratio ? instance.energyMax * Number(amount || 0) : Number(amount || 0);
  const before = instance.energy;
  instance.energy = clampEnergy(before + delta, instance.energyMax);
  return instance.energy - before;
}

export function spendEnergy(instance, amount) {
  if (!instance) return false;
  const cost = Number(amount) || 0;
  if (instance.energy < cost) return false;
  instance.energy -= cost;
  return true;
}

/** 本回合层数（鲨齿雕等 stack 型效果用）。 */
export function addStack(instance, key, max = Infinity) {
  if (!instance) return 0;
  const next = Math.min(max, (instance.turn.stacks[key] ?? 0) + 1);
  instance.turn.stacks[key] = next;
  return next;
}

export function stacksOf(instance, key) {
  return instance?.turn?.stacks?.[key] ?? 0;
}

/**
 * 回合切换：清 oncePerTurn 标记与本回合层数，冷却 -1。
 * `keepStacks` 词条允许倒霉鸭跨回合保留一次层数。
 */
export function tickTurn(instance) {
  if (!instance) return instance;
  instance.turn.fired = {};
  instance.cooldown = Math.max(0, instance.cooldown - 1);
  const keep = instance.skillMods?.keepStacks ?? 0;
  if (keep > 0 && !instance.turn.kept) {
    instance.turn.kept = true;
  } else {
    instance.turn.stacks = {};
    instance.turn.kept = false;
  }
  return instance;
}

/** 重新计算属性（光环变化、钓鱼 BUFF 到期、肉鸽升级后调用）。 */
export function refreshStats(instance, ctx, auras = {}) {
  if (!instance) return instance;
  instance.level = Math.max(1, Math.floor(ctx.levelOf?.(instance.id) ?? instance.level));
  instance.star = Math.max(1, Math.floor(ctx.starOf?.(instance.id) ?? instance.star));
  instance.skillMods = mergeTraitMods(instance.skill, instance.star);
  instance.traits = unlockedTraits(instance.skill, instance.star);
  instance.aura = auraOf(instance.skill, instance.star);
  instance.stats = computeHeroStats(instance.def, ctx, auras);
  instance.atk = instance.stats.atk;
  instance.energyMax = energyMaxFor(instance.def, instance.star, {
    skill: instance.skill,
    mods: instance.skillMods,
    fallback: instance.stats.energyMax,
  });
  instance.maxEnergy = instance.energyMax;
  instance.energy = clampEnergy(instance.energy, instance.energyMax);
  instance.ultCost = ultimateCost(instance);
  instance.ult = ultView(instance.def, instance.skill, instance.ultCost);
  return instance;
}
