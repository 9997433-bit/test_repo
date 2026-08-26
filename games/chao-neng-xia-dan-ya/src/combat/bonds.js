/**
 * 羁绊结算。
 *
 * GDD：同流派 2 人激活小羁绊，3 人激活大羁绊，4 人以上激活「禽王光环」。
 * 种族另有一层弱羁绊，同样按 2 / 3 / 4 分档。
 *
 * 流派数值以 `src/data` 的 `SYNERGIES` 为准（Fable-3 负责平衡），
 * 兼容历史契约 `BONDS` / `BOND_TABLE`，两者都缺时回退到本文件的默认表，
 * 保证战斗层可脱离数据层独立运行与单测。种族羁绊数据层暂无对应表
 * （`RACE_TECH` 是图鉴收集向的账号科技，不是上场人数羁绊），仍用默认表。
 *
 * 数据表的 mod 用的是设计语汇（teamAtkPct / eggBurstMult / stacksToProc…），
 * 战斗管线只认 `MOD_SPEC` 的扁平修正键，所以中间有一层显式翻译：
 * - 能落到战斗管线的键 → 翻成 MOD_SPEC 键，进 `mods`
 * - 物理 / 经济域的键（弹性、钉生蛋、回收返能…）→ 原样进 `raw`，由对应层自取
 * - 布尔开关 → 进 `flags`
 */

import * as DATA from "../data/index.js";
import { HEROES, SCHOOLS, SYNERGIES } from "../data/index.js";
import { ELEMENTS, RACE, RACE_ALIAS, SCHOOL } from "./constants.js";
import { mergeMods, neutralMods } from "./modifiers.js";

/** 激活档位：0 未激活 / 1 小羁绊 / 2 大羁绊 / 3 禽王光环。 */
export const BOND_TIER = { NONE: 0, MINOR: 1, MAJOR: 2, CROWN: 3 };

/** 触发每一档所需的人数。 */
export const BOND_THRESHOLDS = [2, 3, 4];

/** 4 人档共通的「禽王光环」，任意流派满 4 人即额外生效一次。 */
export const CROWN_AURA = {
  id: "crown_aura",
  name: "禽王光环",
  desc: "全队伤害 +10%，能量回复 +15%",
  mods: { damageMult: 1.1, energyMult: 1.15 },
};

/** 默认流派羁绊表。索引 0/1/2 对应 2/3/4 人档。 */
export const DEFAULT_SCHOOL_BONDS = {
  [SCHOOL.COMBO]: {
    name: "连击",
    tiers: [
      { name: "连击共鸣", desc: "暴伤 +10%，连击衰减 -15%", mods: { critDmg: 0.1, comboDecayMult: 0.85 } },
      { name: "疾风连打", desc: "暴伤 +24%，每次命中多叠 1 层", mods: { critDmg: 0.24, comboDecayMult: 0.7, comboGain: 1 } },
      { name: "无尽连锁", desc: "暴伤 +40%，爆蛋时刻提前 4 层，爆发伤害 +20%", mods: { critDmg: 0.4, comboDecayMult: 0.55, comboGain: 1, burstThresholdDelta: -4, burstDamageMult: 1.2 } },
    ],
  },
  [SCHOOL.BRUTE]: {
    name: "直殴",
    tiers: [
      { name: "蛮力破壳", desc: "攻击 +8%", mods: { atkMult: 1.08, knockback: 1 } },
      { name: "碎壳重击", desc: "攻击 +18%，穿透 +1", mods: { atkMult: 1.18, knockback: 2, pierce: 1 } },
      { name: "破阵重锤", desc: "攻击 +32%，穿透 +2，破甲 +15%", mods: { atkMult: 1.32, knockback: 3, pierce: 2, armorShred: 0.15 } },
    ],
  },
  [SCHOOL.ELEMENTAL]: {
    name: "属性",
    tiers: [
      { name: "元素共振", desc: "元素附着强度 +15%", mods: { elementPowerMult: 1.15 } },
      { name: "反应过载", desc: "元素强度 +32%，反应伤害 +15%，状态时长 +20%", mods: { elementPowerMult: 1.32, reactionMult: 1.15, statusDurationMult: 1.2 } },
      { name: "元素风暴", desc: "元素强度 +55%，反应伤害 +32%，每次附着多叠 1 层", mods: { elementPowerMult: 1.55, reactionMult: 1.32, statusDurationMult: 1.35, elementStackBonus: 1 } },
    ],
  },
  [SCHOOL.COLLIDE]: {
    name: "碰撞",
    tiers: [
      { name: "弹跳共振", desc: "碰撞加成 +15%", mods: { collisionDamageMult: 1.15 } },
      { name: "撞击共振", desc: "碰撞加成 +32%，分裂概率 +10%", mods: { collisionDamageMult: 1.32, splitChance: 0.1 } },
      { name: "碰撞风暴", desc: "碰撞加成 +55%，分裂概率 +25%，每次碰撞蛋半径 +1", mods: { collisionDamageMult: 1.55, splitChance: 0.25, radiusPerCollision: 1 } },
    ],
  },
  [SCHOOL.SUPPORT]: {
    name: "辅助",
    tiers: [
      { name: "后勤班组", desc: "治疗 +15%", mods: { healMult: 1.15 } },
      { name: "守护协奏", desc: "治疗 +30%，护盾 +30%", mods: { healMult: 1.3, shieldMult: 1.3 } },
      { name: "圣光禽群", desc: "治疗 +50%，护盾 +50%，能量 +30%", mods: { healMult: 1.5, shieldMult: 1.5, energyMult: 1.3 } },
    ],
  },
};

/** 默认种族羁绊表，数值弱于流派。 */
export const DEFAULT_RACE_BONDS = {
  [RACE.DUCK]: {
    name: "鸭群",
    tiers: [
      { name: "鸭群阵型", desc: "暴击率 +3%", mods: { critChance: 0.03 } },
      { name: "鸭群突进", desc: "暴击率 +6%，攻击 +5%", mods: { critChance: 0.06, atkMult: 1.05 } },
      { name: "万鸭奔腾", desc: "暴击率 +10%，攻击 +10%", mods: { critChance: 0.1, atkMult: 1.1 } },
    ],
  },
  [RACE.CHICK]: {
    name: "鸡群",
    tiers: [
      { name: "鸡群冲锋", desc: "连击获取 +10%", mods: { comboGainMult: 1.1 } },
      { name: "斗鸡战阵", desc: "连击获取 +22%，暴伤 +8%", mods: { comboGainMult: 1.22, critDmg: 0.08 } },
      { name: "金鸡报晓", desc: "连击获取 +35%，暴伤 +16%", mods: { comboGainMult: 1.35, critDmg: 0.16 } },
    ],
  },
  [RACE.GOOSE]: {
    name: "鹅军",
    tiers: [
      { name: "鹅军仪仗", desc: "护盾 +12%", mods: { shieldMult: 1.12 } },
      { name: "铁翼鹅阵", desc: "护盾 +25%，破甲 +5%", mods: { shieldMult: 1.25, armorShred: 0.05 } },
      { name: "天鹅绒军团", desc: "护盾 +40%，破甲 +12%，击退 +1", mods: { shieldMult: 1.4, armorShred: 0.12, knockback: 1 } },
    ],
  },
  [RACE.BIRD]: {
    name: "飞禽",
    tiers: [
      { name: "飞禽编队", desc: "元素强度 +8%", mods: { elementPowerMult: 1.08 } },
      { name: "群鸟蔽日", desc: "元素强度 +18%，能量 +10%", mods: { elementPowerMult: 1.18, energyMult: 1.1 } },
      { name: "百鸟朝凤", desc: "元素强度 +30%，能量 +20%", mods: { elementPowerMult: 1.3, energyMult: 1.2 } },
    ],
  },
};

/**
 * 数据表 mod 键 → 战斗层修正键的翻译表。
 * 键名与 `src/data/synergies.js` 顶部的约定一一对应；未列出的键不进 `mods`。
 */
const SYNERGY_MOD_MAP = {
  teamAtkPct: (v) => ({ atkMult: 1 + v }),
  mainEggMult: (v) => ({ mainEggMult: v }),
  pierce: (v) => ({ pierce: v }),
  comboWindowBonusSec: (v) => ({ comboWindowBonus: v }),
  comboCritDmgPerStack: (v) => ({ comboCritDmgPerStack: v }),
  critChanceAt10: (v) => ({ critChanceAt10: v }),
  eggBurstMult: (v) => ({ burstDamageMult: v }),
  burstKeepStacksPct: (v) => ({ burstKeepStacksPct: v }),
  elementDmgPct: (v) => ({ elementDamageMult: 1 + v }),
  reactionMult: (v) => ({ reactionMult: v }),
  stacksToProc: (v) => ({ elementThresholdDelta: v - ELEMENTS.STACK_MAX }),
  energyOnReaction: (v) => ({ energyOnReaction: v }),
  dmgPerBouncePct: (v) => ({ collisionDamageBonus: v }),
  bounceDmgCapPct: (v) => ({ collisionDamageCap: v }),
};

/** 把一档数据表 mod 拆成 { mods, flags, raw } 三份。 */
export function translateSynergyMod(mod) {
  const mods = {};
  const flags = {};
  const raw = {};
  for (const [key, value] of Object.entries(mod ?? {})) {
    if (typeof value === "boolean") {
      flags[key] = value;
      continue;
    }
    const translate = SYNERGY_MOD_MAP[key];
    if (translate && typeof value === "number" && Number.isFinite(value)) Object.assign(mods, translate(value));
    else raw[key] = value;
  }
  return { mods, flags, raw };
}

/** 把 `SYNERGIES`（按 count 分档）翻成本模块的档位表（按 2/3/4 顺序索引）。 */
export function synergyBondTable(synergies = SYNERGIES) {
  const out = {};
  for (const [key, entry] of Object.entries(synergies ?? {})) {
    const source = Array.isArray(entry?.tiers) ? entry.tiers : [];
    if (!source.length) continue;
    const tiers = BOND_THRESHOLDS.map((count) => {
      const tier = source.find((t) => t?.count === count);
      if (!tier) return null;
      const { mods, flags, raw } = translateSynergyMod(tier.mod);
      return { name: tier.name ?? `${key} ${count}`, desc: tier.desc ?? "", mods, flags, raw };
    });
    out[key] = {
      name: SCHOOLS?.[key]?.name ?? entry.name ?? key,
      // 数据表第 3 档本身就叫「禽王光环·X」，不再额外叠一层通用光环
      crownIncluded: tiers[2] != null,
      tiers,
    };
  }
  return out;
}

/**
 * 历史数据契约：早期约定 src/data 导出 `BONDS` / `BOND_TABLE`。
 * 用计算属性访问命名空间，既保留兼容，又不会让打包器对「不存在的具名导出」报警。
 */
const LEGACY_BOND_KEYS = ["BONDS", "BOND_TABLE"];

function legacyBondTable(kind) {
  for (const key of LEGACY_BOND_KEYS) {
    const bag = DATA[key];
    if (!bag || typeof bag !== "object") continue;
    const table = bag[`${kind}s`] ?? bag[kind];
    if (table && typeof table === "object") return table;
  }
  return null;
}

const DATA_SCHOOL_BONDS = synergyBondTable();

/**
 * 当前生效的流派羁绊表。
 * 默认表打底（保留数据层没有的 support 流派），数据表按流派逐个覆盖。
 */
export function schoolBondTable() {
  const fromData = (Object.keys(DATA_SCHOOL_BONDS).length ? DATA_SCHOOL_BONDS : null) ?? legacyBondTable("school");
  return fromData ? { ...DEFAULT_SCHOOL_BONDS, ...fromData } : DEFAULT_SCHOOL_BONDS;
}

/** 当前生效的种族羁绊表。 */
export function raceBondTable() {
  return legacyBondTable("race") ?? DEFAULT_RACE_BONDS;
}

/** 把英雄 id / 英雄对象统一解析成英雄对象。 */
export function resolveHero(entry, heroes = HEROES ?? {}) {
  if (!entry) return null;
  if (typeof entry === "string") return heroes[entry] ?? { id: entry };
  if (typeof entry === "object") {
    const base = entry.id ? heroes[entry.id] : null;
    return base ? { ...base, ...entry } : entry;
  }
  return null;
}

/** 人数 → 激活档位。 */
export function bondTier(count) {
  let tier = BOND_TIER.NONE;
  for (let i = 0; i < BOND_THRESHOLDS.length; i += 1) {
    if (count >= BOND_THRESHOLDS[i]) tier = i + 1;
  }
  return tier;
}

function countBy(heroes, key, alias = null) {
  const counts = new Map();
  for (const hero of heroes) {
    const raw = hero?.[key];
    if (!raw) continue;
    const value = alias?.[raw] ?? raw;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

/**
 * 低档到高档依次生效，同名键由高档覆盖（数据表 `synergies.js` 的约定）。
 * 注意这里是「覆盖」不是「连乘」：同一流派的 ×1.25 / ×1.4 只取 ×1.4，
 * 跨流派 / 跨种族的相乘交给 `mergeMods` 完成。
 */
function stackTiers(entry, tier) {
  const mods = {};
  const flags = {};
  const raw = {};
  const stack = [];
  let top = null;
  for (let i = 0; i < tier; i += 1) {
    const detail = entry.tiers?.[i];
    if (!detail) continue;
    Object.assign(mods, detail.mods);
    Object.assign(flags, detail.flags);
    Object.assign(raw, detail.raw);
    if (detail.name) stack.push(detail.name);
    top = detail;
  }
  return { mods, flags, raw, stack, top };
}

function activate(table, counts, kind) {
  const out = [];
  for (const [key, count] of counts) {
    const tier = bondTier(count);
    if (tier === BOND_TIER.NONE) continue;
    const entry = table[key];
    // 表里没有的流派 / 种族不硬造一个空羁绊，免得 HUD 显示「无效果」的条目
    if (!entry) continue;
    const { mods, flags, raw, stack, top } = stackTiers(entry, tier);
    out.push({
      kind,
      key,
      count,
      tier,
      group: entry.name ?? key,
      name: top?.name ?? `${entry.name ?? key} ${BOND_THRESHOLDS[tier - 1]}`,
      desc: top?.desc ?? "",
      stack,
      mods,
      flags,
      raw,
      crownIncluded: entry.crownIncluded === true,
    });
  }
  return out.sort((a, b) => b.tier - a.tier || b.count - a.count || String(a.key).localeCompare(String(b.key)));
}

/** 布尔开关按「任一激活即生效」合并。 */
function mergeFlags(bonds) {
  const out = {};
  for (const bond of bonds) {
    for (const [key, value] of Object.entries(bond.flags ?? {})) out[key] = out[key] === true || value === true;
  }
  return out;
}

/** 战斗层不消费的数值（物理 / 经济域）按「取最高档」合并，语义与数据表一致。 */
function mergeRaw(bonds) {
  const out = {};
  for (const bond of bonds) {
    for (const [key, value] of Object.entries(bond.raw ?? {})) {
      if (typeof value !== "number" || !Number.isFinite(value)) out[key] = value;
      else out[key] = typeof out[key] === "number" ? Math.max(out[key], value) : value;
    }
  }
  return out;
}

/**
 * 计算队伍羁绊。
 *
 * @param {Array<string|object>} team 英雄 id 或英雄对象数组（上场阵容）
 * @param {object} [options]
 * @param {object} [options.heroes] 覆盖英雄表（默认读 src/data）
 * @param {boolean} [options.races] 是否结算种族羁绊，默认 true
 * @returns {{
 *   active: object[], schools: object[], races: object[], crown: object|null,
 *   counts: object, mods: object, flags: object, raw: object
 * }}
 */
export function computeBonds(team = [], options = {}) {
  const heroes = options.heroes ?? HEROES ?? {};
  const withRaces = options.races !== false;
  const roster = (Array.isArray(team) ? team : []).map((e) => resolveHero(e, heroes)).filter(Boolean);

  const schoolCounts = countBy(roster, "school");
  const raceCounts = withRaces ? countBy(roster, "race", RACE_ALIAS) : new Map();

  const schools = activate(schoolBondTable(), schoolCounts, "school");
  const races = withRaces ? activate(raceBondTable(), raceCounts, "race") : [];

  const atCrown = schools.filter((b) => b.tier >= BOND_TIER.CROWN);
  // 数据表的 4 人档自带「禽王光环·X」，只有内置表才需要额外补一层通用光环
  const crown = atCrown.length && !atCrown.some((b) => b.crownIncluded)
    ? { kind: "aura", key: CROWN_AURA.id, count: 4, tier: BOND_TIER.CROWN, group: CROWN_AURA.name, name: CROWN_AURA.name, desc: CROWN_AURA.desc, stack: [CROWN_AURA.name], mods: { ...CROWN_AURA.mods }, flags: {}, raw: {}, crownIncluded: true }
    : null;

  const active = [...schools, ...races, ...(crown ? [crown] : [])];
  const mods = mergeMods(...active.map((b) => b.mods));

  return {
    active,
    schools,
    races,
    crown,
    counts: {
      schools: Object.fromEntries(schoolCounts),
      races: Object.fromEntries(raceCounts),
      size: roster.length,
    },
    mods,
    flags: mergeFlags(active),
    raw: mergeRaw(active),
  };
}

/** 从 ctx 里取羁绊修正：优先已算好的 ctx.bonds，其次按 ctx.team 现算。 */
export function bondModsFrom(ctx = {}) {
  if (ctx.bonds?.mods) return ctx.bonds.mods;
  if (ctx.bonds && !ctx.bonds.mods && typeof ctx.bonds === "object" && !Array.isArray(ctx.bonds)) return ctx.bonds;
  if (Array.isArray(ctx.team) && ctx.team.length) return computeBonds(ctx.team, { heroes: ctx.heroes }).mods;
  return neutralMods();
}

/** 一句话描述，供 HUD 羁绊条使用。 */
export function describeBonds(bonds) {
  return (bonds?.active ?? []).map((b) => `${b.name}(${b.count})`).join(" · ");
}
