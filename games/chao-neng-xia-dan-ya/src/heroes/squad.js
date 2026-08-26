/**
 * 上场小队（Opus-3 所有权）。
 *
 * 固定 5 个上场位；实例化分两遍：
 *   第一遍只解析技能与光环（光环只依赖英雄 id 与星级），
 *   第二遍带着队伍光环与羁绊重算属性，避免「光环影响自己又被自己影响」的循环。
 *
 * 冒险队从账号存档构建，肉鸽临时队从 run 构建，两条入口互不共享状态。
 */
import * as DATA from "../data/index.js";
import { heroDef, heroList } from "../progression/catalog.js";
import { buildAdventureContext, buildRogueContext } from "../progression/context.js";
import { ensureProgression, isHeroOwned } from "../progression/save.js";
import { FIELD_SIZE } from "./constants.js";
import { createHeroInstance, refreshStats } from "./runtime.js";
import { auraOf, mergeTraitMods, resolveSkill } from "./skills.js";

/**
 * 羁绊：同流派 2 人小羁绊 / 3 人大羁绊 / 4 人以上禽王光环。
 * `teamAtkMul` 三档取 0.08 / 0.18 / 0.32，与 `core/catalog.BOND_TIERS` 一致，
 * 各流派再叠一层自己的风味加成。
 */
export const BOND_TIER_ATK = { 2: 0.08, 3: 0.18, 4: 0.32 };

/**
 * 英雄层能消费的羁绊乘区，按「流派 → 人数档」登记。
 * 流派清单、档位人数与档位名一律来自 `src/data`（`BONDS.schools`，回退 `SYNERGIES`），
 * 这里只补一份英雄层自己的 mods 词汇——数据表的 `mods` 是战斗层词汇，两者互不覆盖。
 * 数据表里有、但英雄层还没写风味加成的流派（如预留的 support）仍会拿到档位攻击加成。
 */
const BOND_MODS = {
  combo: {
    2: { comboDamage: 0.06 },
    3: { comboDamage: 0.12, teamCritBonus: 0.03 },
    4: { comboDamage: 0.2, teamCritBonus: 0.06, comboDecayPause: 2 },
  },
  brute: {
    2: {},
    3: { brickDamage: 0.12 },
    4: { brickDamage: 0.25 },
  },
  elemental: {
    2: { elementDamage: 0.1 },
    3: { elementDamage: 0.18, statusDuration: 0.2 },
    4: { elementDamage: 0.28, statusDuration: 0.35 },
  },
  collide: {
    2: { eggRadius: 1 },
    3: { eggRadius: 2, splitChance: 0.1 },
    4: { eggRadius: 2, splitChance: 0.22 },
  },
};

const TIER_LABELS = { 2: "小羁绊", 3: "大羁绊", 4: "禽王光环" };

/** 羁绊结构的数据源：F3 声明 `BONDS` 为羁绊事实源，缺失时回退到 `SYNERGIES`。 */
function schoolTable() {
  const bonds = DATA.BONDS?.schools ?? DATA.BOND_TABLE?.schools;
  if (bonds && typeof bonds === "object") return bonds;
  return DATA.SYNERGIES ?? {};
}

function buildBonds() {
  const bonds = {};
  for (const [school, entry] of Object.entries(schoolTable())) {
    const mods = BOND_MODS[school] ?? {};
    const tiers = (entry?.tiers ?? [])
      .map((tier) => ({
        count: tier.count,
        label: TIER_LABELS[tier.count] ?? tier.name ?? `${tier.count} 人`,
        name: tier.name,
        desc: tier.desc,
        mods: mods[tier.count] ?? {},
      }))
      .sort((a, b) => a.count - b.count);
    if (!tiers.length) continue;
    bonds[school] = { name: entry?.name ?? DATA.SCHOOLS?.[school]?.name ?? school, tiers };
  }
  return bonds;
}

export const BONDS = buildBonds();

/** 名册里真实存在的流派清单（数据表口径）。 */
export const SCHOOLS = Object.keys(BONDS);

const AURA_KEYS = [
  "teamAtkMul",
  "teamCritBonus",
  "teamEnergyMul",
  "enemySlow",
  "iceDamageMul",
  "freezeDurationMul",
  "extraEggs",
  "comboDamage",
  "elementDamage",
  "statusDuration",
  "eggRadius",
  "splitChance",
  "brickDamage",
  "comboDecayPause",
];

/**
 * 校验并裁剪上场名单：过滤未知英雄、去重、截到 5 人。
 *
 * 名单项可以是英雄 id，也可以直接是 def 对象——后者只在本次组队内生效，
 * 让主循环在 `src/data` 扩表前也能用自己的名册开局，同时不污染全局名册。
 *
 * @returns {{ids: string[], defs: object[], warnings: Array<{code: string, id?: string}>}}
 */
export function sanitizeRoster(heroIds, { field = FIELD_SIZE, save = null } = {}) {
  const warnings = [];
  const seen = new Set();
  const ids = [];
  const defs = [];

  for (const raw of Array.isArray(heroIds) ? heroIds : []) {
    const id = typeof raw === "string" ? raw : raw?.id;
    if (!id) {
      warnings.push({ code: "EMPTY_SLOT" });
      continue;
    }
    const inline = typeof raw === "object" ? raw : null;
    const registered = heroDef(id);
    const def = inline && registered ? { ...registered, ...inline } : (inline ?? registered);
    if (!def) {
      warnings.push({ code: "UNKNOWN_HERO", id });
      continue;
    }
    if (seen.has(id)) {
      warnings.push({ code: "DUPLICATE", id });
      continue;
    }
    if (ids.length >= field) {
      warnings.push({ code: "OVERFLOW", id });
      continue;
    }
    if (save && !isHeroOwned(save, id)) warnings.push({ code: "NOT_OWNED", id });
    seen.add(id);
    ids.push(id);
    defs.push(def);
  }

  if (!ids.length) warnings.push({ code: "EMPTY_SQUAD" });
  else if (ids.length < field) warnings.push({ code: "UNDERFILLED", need: field - ids.length });

  return { ids, defs, warnings };
}

function schoolOf(entry) {
  const def = typeof entry === "string" ? heroDef(entry) : entry;
  return def?.school ?? resolveSkill(def)?.school ?? "brute";
}

/** 统计同流派人数并结算羁绊档位。入参可以是英雄 id、def 对象或运行时实例。 */
export function computeBonds(entries) {
  const counts = {};
  for (const entry of entries ?? []) {
    const school = schoolOf(entry);
    counts[school] = (counts[school] ?? 0) + 1;
  }

  const active = [];
  const mods = {};
  for (const [school, count] of Object.entries(counts)) {
    const bond = BONDS[school];
    if (!bond) continue;
    let tier = null;
    for (const candidate of bond.tiers) {
      if (count >= candidate.count) tier = candidate;
    }
    if (!tier) continue;
    const atk = BOND_TIER_ATK[Math.min(4, tier.count)] ?? 0;
    const tierMods = { ...tier.mods, teamAtkMul: (tier.mods.teamAtkMul ?? 0) + atk };
    active.push({ school, name: bond.name, count, label: tier.label, atk, mods: tierMods });
    for (const [key, value] of Object.entries(tierMods)) {
      mods[key] = (mods[key] ?? 0) + value;
    }
  }

  active.sort((a, b) => b.count - a.count);
  return { counts, active, mods, atkBonus: round4(mods.teamAtkMul ?? 0) };
}

/** 合并全队光环 + 羁绊，得到统一的乘区表（1 星口径，组队界面预览用）。 */
export function aggregateAuras(entries, bonds) {
  const totals = {};
  for (const key of AURA_KEYS) totals[key] = 0;

  for (const entry of entries ?? []) {
    const def = typeof entry === "string" ? heroDef(entry) : entry;
    const skill = resolveSkill(def);
    const aura = auraOf(skill, 1);
    if (!aura) continue;
    for (const [key, value] of Object.entries(aura)) {
      if (key in totals) totals[key] += value;
    }
  }

  for (const [key, value] of Object.entries(bonds?.mods ?? {})) {
    if (key in totals) totals[key] += value;
  }

  return totals;
}

/** 星级会加强光环，所以第二遍用真实星级重算一次。 */
function aggregateAurasWithStars(instances, bonds) {
  const totals = {};
  for (const key of AURA_KEYS) totals[key] = 0;

  for (const inst of instances) {
    const aura = auraOf(inst.skill, inst.star);
    if (!aura) continue;
    for (const [key, value] of Object.entries(aura)) {
      if (key in totals) totals[key] += value;
    }
    const mods = mergeTraitMods(inst.skill, inst.star);
    if (mods.teamEnergyMul) totals.teamEnergyMul += mods.teamEnergyMul;
    if (mods.teamCrit) totals.teamCritBonus += mods.teamCrit;
  }

  for (const [key, value] of Object.entries(bonds?.mods ?? {})) {
    if (key in totals) totals[key] += value;
  }

  return totals;
}

function auraStatArgs(totals) {
  return {
    auraAtkMul: 1 + (totals.teamAtkMul ?? 0),
    auraEnergyMul: 1 + (totals.teamEnergyMul ?? 0),
    auraCritBonus: totals.teamCritBonus ?? 0,
    extraEggs: Math.floor(totals.extraEggs ?? 0),
  };
}

/**
 * 通用小队实例化。
 * @param {string[]} heroIds 上场名单（最多 5）
 * @param {object} ctx 养成上下文
 */
export function createSquad(heroIds, ctx, { field = FIELD_SIZE, strict = false, save = null } = {}) {
  const { ids, defs, warnings } = sanitizeRoster(heroIds, { field, save });
  const fatal = warnings.filter((w) => w.code === "EMPTY_SQUAD" || w.code === "UNKNOWN_HERO");
  if (strict && fatal.length) {
    throw new Error(`上场名单非法：${fatal.map((w) => `${w.code}${w.id ? `(${w.id})` : ""}`).join(", ")}`);
  }

  const bonds = computeBonds(defs);
  const firstPass = defs.map((def, slot) => createHeroInstance(def, ctx, { slot, auras: {} }));
  const auras = aggregateAurasWithStars(firstPass, bonds);
  const statArgs = auraStatArgs(auras);
  const members = firstPass.map((inst) => refreshStats(inst, ctx, statArgs));

  const byId = {};
  const byUid = {};
  for (const inst of members) {
    byId[inst.id] = inst;
    byUid[inst.uid] = inst;
  }

  return {
    mode: ctx.mode ?? "preview",
    source: ctx.source ?? "none",
    field,
    ctx,
    members,
    byId,
    byUid,
    bonds,
    auras,
    warnings,
    active: members.length ? 0 : -1,
    turn: 0,
    fishing: ctx.fishing ?? null,
    dexBonus: ctx.dexBonus ?? 0,
    raceTech: ctx.raceTech ?? { byRace: {}, bonus: {} },
  };
}

/** 冒险 / 爬塔 / 讨伐：吃账号养成、图鉴与钓鱼 BUFF。 */
export function createAdventureSquad(save, { heroIds, includeFishing = true, ...rest } = {}) {
  const target = ensureProgression(save);
  const ctx = buildAdventureContext(target, { includeFishing });
  return createSquad(heroIds ?? target.roster, ctx, { save: target, ...rest });
}

/** 肉鸽临时队：只吃 run 内的临时等级与神器，绝不读账号养成。 */
export function createRogueSquad(run, options = {}) {
  const ctx = buildRogueContext(run);
  return createSquad(options.heroIds ?? run?.squad ?? [], ctx, options);
}

/** 预览用：不依赖存档，给定等级/星级直接看数值。 */
export function previewSquad(heroIds, ctx, options = {}) {
  return createSquad(heroIds, ctx, options);
}

export function activeHero(squad) {
  if (!squad || squad.active < 0) return null;
  return squad.members[squad.active] ?? null;
}

/** 切换当前上场英雄，支持 1–5 数字键与英雄 id。 */
export function setActiveHero(squad, target) {
  if (!squad?.members?.length) return null;
  let index = -1;
  if (typeof target === "number") index = target;
  else index = squad.members.findIndex((m) => m.id === target || m.uid === target);
  if (index < 0 || index >= squad.members.length) return activeHero(squad);
  if (!squad.members[index].alive) return activeHero(squad);
  squad.active = index;
  return squad.members[index];
}

export function nextHero(squad) {
  if (!squad?.members?.length) return null;
  for (let step = 1; step <= squad.members.length; step += 1) {
    const idx = (squad.active + step) % squad.members.length;
    if (squad.members[idx].alive) {
      squad.active = idx;
      return squad.members[idx];
    }
  }
  return activeHero(squad);
}

/** 养成状态变化（升级、升星、钓鱼过期）后刷新全队。 */
export function refreshSquad(squad, ctx = squad?.ctx) {
  if (!squad) return squad;
  squad.ctx = ctx;
  squad.bonds = computeBonds(squad.members);
  squad.auras = aggregateAurasWithStars(squad.members, squad.bonds);
  const statArgs = auraStatArgs(squad.auras);
  for (const inst of squad.members) refreshStats(inst, ctx, statArgs);
  squad.fishing = ctx.fishing ?? null;
  squad.dexBonus = ctx.dexBonus ?? 0;
  squad.raceTech = ctx.raceTech ?? squad.raceTech;
  return squad;
}

export function squadAttackTotal(squad) {
  return Math.round((squad?.members ?? []).reduce((sum, m) => sum + m.stats.atk, 0) * 100) / 100;
}

/** 完整英雄池（组队界面用）。 */
export function allHeroIds() {
  return heroList().map((h) => h.id);
}

function round4(n) {
  return Math.round(n * 1e4) / 1e4;
}
