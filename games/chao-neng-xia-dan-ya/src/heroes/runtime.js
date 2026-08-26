/**
 * 英雄运行时实例（Opus-3 所有权）。
 *
 * 实例是「数据表条目 + 养成上下文 + 光环」在某一局战斗中的快照，
 * 只持有可变的战斗态（能量、冷却、本回合层数），不回写存档。
 *
 * 实例会平铺数据表条目的展示字段（palette / passive / lore / element / ult 等），
 * 并额外提供 `atk` / `maxEnergy` 别名，直接满足主循环 HUD 现有的读法。
 */
import * as DATA from "../data/index.js";
import { neutralContext } from "../progression/context.js";
import { computeHeroStats } from "./stats.js";
import { auraOf, mergeTraitMods, resolveSkill, unlockedTraits } from "./skills.js";
import { BASE_ENERGY_MAX } from "./constants.js";

/**
 * @param {object} def 数据表英雄条目
 * @param {object} ctx 养成上下文
 * @param {{slot?: number, auras?: object, startEnergy?: number}} options
 */
/**
 * 大招消耗以数据表为权威：F3 的英雄表用 `energy` 表示大招能量上限，
 * `ult` 是指向 `src/data/skills.js` 的字符串 id（其 `energyCost` 与 `energy` 同值）。
 * 老形状 `ult: { cost }` 继续兼容，供注入的英雄使用。
 */
function dataUltCost(def) {
  const ult = def?.ult;
  const fromSkillTable = typeof ult === "string" ? Number(DATA.SKILLS?.[ult]?.energyCost) : Number(ult?.cost);
  if (Number.isFinite(fromSkillTable) && fromSkillTable > 0) return fromSkillTable;
  const fromHeroTable = Number(def?.energy);
  return Number.isFinite(fromHeroTable) && fromHeroTable > 0 ? fromHeroTable : null;
}

/** 能量条上限对齐大招消耗，HUD 的「能量满 = 可放大招」读法才成立。 */
function resolveEnergyMax(def, stats) {
  return dataUltCost(def) ?? stats?.energyMax ?? BASE_ENERGY_MAX;
}

export function createHeroInstance(def, ctx = neutralContext(), options = {}) {
  const { slot = 0, auras = {}, startEnergy } = options;
  const skill = resolveSkill(def);
  const level = Math.max(1, Math.floor(ctx.levelOf?.(def?.id) ?? 1));
  const star = Math.max(1, Math.floor(ctx.starOf?.(def?.id) ?? 1));
  const skillMods = mergeTraitMods(skill, star);
  const stats = computeHeroStats(def, ctx, auras);
  const energyMax = resolveEnergyMax(def, stats);

  return {
    ...def,
    uid: `${def.id}#${slot}`,
    id: def.id,
    name: def.name ?? def.id,
    race: def.race ?? "duck",
    school: def.school ?? skill.school ?? "brute",
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
    energyMax,
    maxEnergy: energyMax,
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

/** 大招能量消耗：数据表优先，词条可以打折。 */
export function ultimateCost(instance) {
  if (!instance?.skill?.ult) return Infinity;
  const base = dataUltCost(instance?.def) ?? instance.skill.ult.cost;
  if (!Number.isFinite(base)) return Infinity;
  return Math.max(10, base + (instance?.skillMods?.cost ?? 0));
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
  instance.energyMax = resolveEnergyMax(instance.def, instance.stats);
  instance.maxEnergy = instance.energyMax;
  instance.energy = clampEnergy(instance.energy, instance.energyMax);
  return instance;
}
