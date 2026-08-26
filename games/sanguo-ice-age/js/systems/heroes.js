/**
 * 武将系统 — 招募 / 养成 / 编队 / 驻防 / 阵营加成。
 *
 * 纯逻辑，无 DOM，可被 Node ESM 直接 import。
 * 数据文件（js/data/heroes.js）若尚未就绪，使用内置 FALLBACK_HEROES。
 */
import { QUALITY_RANK, clamp } from "../config.js";

export const MAX_DEPLOY = 5;
export const HERO_MAX_LEVEL = 60;
export const HERO_MAX_STARS = 5;
export const RECRUIT_TICKET_COST = 1;
export const DEFAULT_TICKETS = 3;

/** 品质对基础属性的乘区：blue 1.00 / purple 1.16 / orange 1.32 / red 1.48 */
export const QUALITY_MULTIPLIER = 0.16;

/** 招募池按品质的权重（rng 抽取时使用）。 */
export const RECRUIT_WEIGHTS = { blue: 60, purple: 26, orange: 11, red: 3 };

/** 同阵营人数 → 加成基数。 */
export const FACTION_TEAM_BONUS = { 3: 0.08, 4: 0.14, 5: 0.22 };

export const SKILL_TYPES = ["damage", "guard", "heal", "buff", "control"];

/** data/heroes.js 的 def 不带 growth，按基础值的固定比例推导每级成长。 */
export const DEFAULT_GROWTH_RATE = 0.08;

/**
 * data/heroes.js 的技能只有 value 没有 chance，按类型给默认发动率。
 * control 例外：其 value（0.22~0.35）本身就当作发动率。
 */
export const DEFAULT_SKILL_CHANCE = { damage: 0.45, guard: 0.5, heal: 0.45, buff: 0.5, control: 0.25 };

/**
 * 8 名保底武将。字段结构与量级刻意对齐 data/heroes.js（base 含 intel、
 * 技能只给 type+value、不写 growth），这样两个数据源走完全相同的归一化路径。
 */
export const FALLBACK_HEROES = [
  {
    id: "caocao",
    name: "曹操",
    title: "乱世奸雄",
    faction: "wei",
    quality: "red",
    troop: "infantry",
    base: { atk: 96, def: 84, hp: 1280, intel: 152 },
    skill: { id: "sk_caocao", name: "奸雄令", type: "buff", value: 0.25, desc: "全军攻击提升 25%，持续到战斗结束。" },
  },
  {
    id: "xuchu",
    name: "许褚",
    title: "虎痴",
    faction: "wei",
    quality: "purple",
    troop: "infantry",
    base: { atk: 88, def: 96, hp: 1360, intel: 62 },
    skill: { id: "sk_xuchu", name: "裸衣酣战", type: "guard", value: 0.32, desc: "我方受到的伤害降低 32%。" },
  },
  {
    id: "liubei",
    name: "刘备",
    title: "仁德之主",
    faction: "shu",
    quality: "orange",
    troop: "infantry",
    base: { atk: 78, def: 88, hp: 1300, intel: 124 },
    skill: { id: "sk_liubei", name: "抚恤三军", type: "heal", value: 0.32, desc: "按智力 32% 恢复我方部队。" },
  },
  {
    id: "guanyu",
    name: "关羽",
    title: "武圣",
    faction: "shu",
    quality: "red",
    troop: "cavalry",
    base: { atk: 142, def: 78, hp: 1180, intel: 88 },
    skill: { id: "sk_guanyu", name: "拖刀斩将", type: "damage", value: 2.2, desc: "对敌军造成 220% 攻击的伤害。" },
  },
  {
    id: "zhangfei",
    name: "张飞",
    title: "万人敌",
    faction: "shu",
    quality: "orange",
    troop: "infantry",
    base: { atk: 126, def: 92, hp: 1320, intel: 58 },
    skill: { id: "sk_zhangfei", name: "长坂怒吼", type: "control", value: 0.3, desc: "一声吼令敌军乱阵，行动降低 30%。" },
  },
  {
    id: "sunquan",
    name: "孙权",
    title: "碧眼儿",
    faction: "wu",
    quality: "orange",
    troop: "archer",
    base: { atk: 92, def: 74, hp: 1150, intel: 132 },
    skill: { id: "sk_sunquan", name: "制衡", type: "buff", value: 0.18, desc: "全军攻击提升 18%，持续到战斗结束。" },
  },
  {
    id: "zhouyu",
    name: "周瑜",
    title: "美周郎",
    faction: "wu",
    quality: "red",
    troop: "archer",
    base: { atk: 150, def: 62, hp: 1020, intel: 158 },
    skill: { id: "sk_zhouyu", name: "纵火焚营", type: "damage", value: 2.0, desc: "按智力 200% 对敌军造成谋略伤害。" },
  },
  {
    id: "lvbu",
    name: "吕布",
    title: "飞将",
    faction: "qun",
    quality: "red",
    troop: "cavalry",
    base: { atk: 165, def: 76, hp: 1200, intel: 46 },
    skill: { id: "sk_lvbu", name: "无双", type: "damage", value: 2.4, desc: "对敌军造成 240% 攻击的毁灭一击。" },
  },
];

/* ------------------------------------------------------------------ */
/* state 归一化                                                        */
/* ------------------------------------------------------------------ */

/** 保证 state.heroes 结构存在并返回它。其它系统也可复用。 */
export function ensureHeroesState(state) {
  if (!state || typeof state !== "object") throw new TypeError("heroes: state required");
  const h = state.heroes && typeof state.heroes === "object" ? state.heroes : (state.heroes = {});
  if (!Array.isArray(h.roster)) h.roster = [];
  if (!Array.isArray(h.deployed)) h.deployed = [];
  if (typeof h.tickets !== "number" || !Number.isFinite(h.tickets)) h.tickets = DEFAULT_TICKETS;
  if (typeof h.recruitCount !== "number" || !Number.isFinite(h.recruitCount)) h.recruitCount = 0;
  if (!h.shards || typeof h.shards !== "object") h.shards = {};
  return h;
}

function makeEntry(id) {
  return { id, level: 1, stars: 1, xp: 0, garrisonBuildingId: null };
}

/** 取 roster 项；不存在返回 null。 */
export function getHero(state, heroId) {
  const h = ensureHeroesState(state);
  return h.roster.find((e) => e && e.id === heroId) || null;
}

/** 按 id 查 def，优先用传入 catalog，其次 FALLBACK_HEROES。 */
export function findHeroDef(heroId, catalog) {
  const list = Array.isArray(catalog) && catalog.length ? catalog : FALLBACK_HEROES;
  return list.find((d) => d && d.id === heroId) || null;
}

/* ------------------------------------------------------------------ */
/* 属性 / 战力                                                         */
/* ------------------------------------------------------------------ */

function qualityMul(quality) {
  const rank = QUALITY_RANK[quality] || 1;
  return 1 + QUALITY_MULTIPLIER * (rank - 1);
}

function normInst(inst) {
  const level = clamp(Math.floor(Number(inst?.level) || 1), 1, HERO_MAX_LEVEL);
  const stars = clamp(Math.floor(Number(inst?.stars) || 1), 1, HERO_MAX_STARS);
  return { level, stars };
}

/**
 * 单将四围： (base + growth * (level-1)) * 品质乘区 * 星级乘区
 * heroDef 未提供 growth 时，每级成长按 base * DEFAULT_GROWTH_RATE 推导；
 * 星级乘区 = 1 + 0.12 * (stars - 1)。
 */
export function heroStats(heroDef, inst) {
  if (!heroDef) return { atk: 0, def: 0, hp: 0, intel: 0 };
  const { level, stars } = normInst(inst);
  const base = heroDef.base || {};
  const growth = heroDef.growth || null;
  const q = qualityMul(heroDef.quality);
  const s = 1 + 0.12 * (stars - 1);
  const at = (key) => {
    const b = Number(base[key]) || 0;
    const g = growth ? Number(growth[key]) || 0 : b * DEFAULT_GROWTH_RATE;
    return (b + g * (level - 1)) * q * s;
  };
  return { atk: at("atk"), def: at("def"), hp: at("hp"), intel: at("intel") };
}

/** 战力标量： atk*2 + def*1.5 + intel*1 + hp*0.5 （四舍五入）。 */
export function heroPower(heroDef, inst) {
  const s = heroStats(heroDef, inst);
  return Math.round(s.atk * 2 + s.def * 1.5 + s.intel + s.hp * 0.5);
}

/**
 * 归一化技能，兼容 data/heroes.js 的 { type, value } 写法。
 * value 的语义按策划描述逐类翻译：
 *   damage  "造成 value×攻击的伤害" → 加伤 = value - 1
 *   guard   "我方受到伤害降低 value" → 减伤 = value
 *   buff    "全军攻击提升 value"     → 加攻 = value
 *   heal    "按智力 value 恢复部队"  → 按智力回血系数 = value
 *   control "敌军行动降低 value"     → 直接当作跳回合的发动率
 * power/chance 随星级小幅成长。
 */
export function heroSkill(heroDef, inst) {
  const raw = heroDef?.skill;
  if (!raw || !SKILL_TYPES.includes(raw.type)) return null;
  const { stars } = normInst(inst);
  const growth = 1 + 0.05 * (stars - 1);
  const value = Number(raw.value);
  const hasValue = Number.isFinite(value);

  let power = Number(raw.power);
  if (!Number.isFinite(power)) {
    if (!hasValue) power = 0;
    else if (raw.type === "damage") power = Math.max(0, value - 1);
    else if (raw.type === "control") power = 1;
    else power = value;
  }

  let chance = Number(raw.chance);
  if (!Number.isFinite(chance)) {
    chance = raw.type === "control" && hasValue ? value : DEFAULT_SKILL_CHANCE[raw.type] ?? 0.4;
  }

  return {
    id: raw.id || `${heroDef.id}-skill`,
    name: raw.name || raw.id || "技能",
    desc: raw.desc || "",
    type: raw.type,
    power: power * growth,
    chance: clamp(chance * growth, 0, 0.95),
  };
}

/**
 * 同阵营 3+ 加成。传入出战武将 def 列表（也接受 {def} 包装）。
 * 3 人 +8% / 4 人 +14% / 5 人 +22%（atk 全额、def 75%、hp 50%）。
 */
export function factionBonus(deployedHeroDefs) {
  const none = { faction: null, count: 0, atkMul: 1, defMul: 1, hpMul: 1 };
  if (!Array.isArray(deployedHeroDefs) || deployedHeroDefs.length === 0) return none;
  const counts = new Map();
  for (const raw of deployedHeroDefs) {
    const faction = raw?.faction ?? raw?.def?.faction;
    if (!faction) continue;
    counts.set(faction, (counts.get(faction) || 0) + 1);
  }
  let best = null;
  let bestCount = 0;
  for (const [faction, count] of counts) {
    if (count > bestCount) {
      best = faction;
      bestCount = count;
    }
  }
  const capped = Math.min(bestCount, MAX_DEPLOY);
  const b = FACTION_TEAM_BONUS[capped];
  if (!best || !b) return none;
  return {
    faction: best,
    count: capped,
    atkMul: 1 + b,
    defMul: 1 + b * 0.75,
    hpMul: 1 + b * 0.5,
  };
}

/* ------------------------------------------------------------------ */
/* 招募                                                                */
/* ------------------------------------------------------------------ */

function pickWeighted(pool, rng) {
  const roll = typeof rng === "function" ? rng() : Math.random();
  let total = 0;
  for (const def of pool) total += RECRUIT_WEIGHTS[def?.quality] ?? 1;
  if (total <= 0) return pool[0] || null;
  let cursor = clamp(roll, 0, 0.999999) * total;
  for (const def of pool) {
    cursor -= RECRUIT_WEIGHTS[def?.quality] ?? 1;
    if (cursor < 0) return def;
  }
  return pool[pool.length - 1] || null;
}

/**
 * 招募。heroDef 为空时按品质权重从 pool 中抽取（消耗 rng 一次）。
 * opts: { free:boolean, cost:number, pool:HeroDef[] }
 */
export function recruitHero(state, heroDef, rng = Math.random, opts = {}) {
  const h = ensureHeroesState(state);
  const free = opts.free === true;
  const cost = free ? 0 : Math.max(0, Number(opts.cost ?? RECRUIT_TICKET_COST) || 0);
  if (h.tickets < cost) {
    return { ok: false, reason: "no-tickets", cost, tickets: h.tickets };
  }
  const pool = Array.isArray(opts.pool) && opts.pool.length ? opts.pool : FALLBACK_HEROES;
  const def = heroDef || pickWeighted(pool, rng);
  if (!def || !def.id) return { ok: false, reason: "no-hero", cost, tickets: h.tickets };

  h.tickets -= cost;
  h.recruitCount += 1;
  const granted = grantHero(state, def);
  return {
    ok: true,
    free,
    cost,
    tickets: h.tickets,
    heroId: def.id,
    def,
    rolled: !heroDef,
    isNew: granted.isNew,
    duplicate: !granted.isNew,
    entry: granted.entry,
    stars: granted.entry.stars,
    shards: granted.shards,
    recruitCount: h.recruitCount,
  };
}

/** 直接给将（任务/剧情奖励）。重复获得则升星，满星转碎片 + 经验。 */
export function grantHero(state, heroDef) {
  const h = ensureHeroesState(state);
  if (!heroDef || !heroDef.id) return { ok: false, reason: "no-hero", entry: null, isNew: false, shards: 0 };
  const existing = h.roster.find((e) => e && e.id === heroDef.id);
  if (existing) {
    if (existing.stars < HERO_MAX_STARS) {
      existing.stars += 1;
    } else {
      h.shards[heroDef.id] = (h.shards[heroDef.id] || 0) + 1;
      existing.xp += 200;
    }
    return { ok: true, entry: existing, isNew: false, shards: h.shards[heroDef.id] || 0 };
  }
  const entry = makeEntry(heroDef.id);
  h.roster.push(entry);
  return { ok: true, entry, isNew: true, shards: 0 };
}

/* ------------------------------------------------------------------ */
/* 编队 / 驻防                                                         */
/* ------------------------------------------------------------------ */

/** 出战编队：最多 5 人，同 id 不可重复，驻防中的武将需先撤防。 */
export function deployTeam(state, heroIds) {
  const h = ensureHeroesState(state);
  const ids = Array.isArray(heroIds) ? heroIds.slice() : [];
  const fail = (reason, heroId) => ({
    ok: false,
    reason,
    heroId: heroId ?? null,
    max: MAX_DEPLOY,
    deployed: h.deployed.slice(),
  });
  if (ids.length > MAX_DEPLOY) return fail("too-many");
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) return fail("duplicate", id);
    seen.add(id);
    const entry = h.roster.find((e) => e && e.id === id);
    if (!entry) return fail("not-owned", id);
    if (entry.garrisonBuildingId) return fail("garrisoned", id);
  }
  h.deployed = ids;
  return { ok: true, deployed: ids.slice(), max: MAX_DEPLOY };
}

/** 驻防到建筑；一个建筑只能驻一名武将，驻防会自动退出出战队列。 */
export function garrisonHero(state, heroId, buildingId) {
  const h = ensureHeroesState(state);
  if (!buildingId) return { ok: false, reason: "no-building", heroId };
  const entry = h.roster.find((e) => e && e.id === heroId);
  if (!entry) return { ok: false, reason: "not-owned", heroId };
  const occupant = h.roster.find((e) => e && e.garrisonBuildingId === buildingId && e.id !== heroId);
  if (occupant) return { ok: false, reason: "occupied", heroId, buildingId, occupiedBy: occupant.id };
  entry.garrisonBuildingId = buildingId;
  h.deployed = h.deployed.filter((id) => id !== heroId);
  return { ok: true, heroId, buildingId, entry, deployed: h.deployed.slice() };
}

/** 撤防。 */
export function ungarrisonHero(state, heroId) {
  const h = ensureHeroesState(state);
  const entry = h.roster.find((e) => e && e.id === heroId);
  if (!entry) return { ok: false, reason: "not-owned", heroId };
  const buildingId = entry.garrisonBuildingId;
  if (!buildingId) return { ok: false, reason: "not-garrisoned", heroId };
  entry.garrisonBuildingId = null;
  return { ok: true, heroId, buildingId, entry };
}

/** 某建筑当前驻防的武将 id（无则 null）。 */
export function garrisonedHeroAt(state, buildingId) {
  const h = ensureHeroesState(state);
  const entry = h.roster.find((e) => e && e.garrisonBuildingId === buildingId);
  return entry ? entry.id : null;
}

/* ------------------------------------------------------------------ */
/* 升级                                                                */
/* ------------------------------------------------------------------ */

/** 从 level 升到 level+1 所需经验。 */
export function xpForLevel(level) {
  const l = Math.max(1, Math.floor(Number(level) || 1));
  return 40 * l + 10 * l * l;
}

/** 加经验（战斗结算 / 任务奖励调用）。 */
export function addHeroXp(state, heroId, amount) {
  const entry = getHero(state, heroId);
  if (!entry) return { ok: false, reason: "not-owned", heroId };
  const gain = Math.max(0, Math.floor(Number(amount) || 0));
  entry.xp += gain;
  return { ok: true, heroId, xp: entry.xp, gained: gain };
}

/** 消耗经验升 1 级，受 state.heroes.levelCap（默认 HERO_MAX_LEVEL）限制。 */
export function levelUpHero(state, heroId) {
  const h = ensureHeroesState(state);
  const entry = h.roster.find((e) => e && e.id === heroId);
  if (!entry) return { ok: false, reason: "not-owned", heroId };
  const cap = clamp(Math.floor(Number(h.levelCap) || HERO_MAX_LEVEL), 1, HERO_MAX_LEVEL);
  if (entry.level >= cap) return { ok: false, reason: "max-level", heroId, level: entry.level, cap };
  const need = xpForLevel(entry.level);
  if (entry.xp < need) {
    return { ok: false, reason: "no-xp", heroId, level: entry.level, xp: entry.xp, need };
  }
  entry.xp -= need;
  entry.level += 1;
  return { ok: true, heroId, level: entry.level, xp: entry.xp, spent: need };
}

/* ------------------------------------------------------------------ */
/* 战斗桥接                                                            */
/* ------------------------------------------------------------------ */

/** 出战队列 → combat.js 需要的 [{ def, inst }]。 */
export function getDeployedHeroes(state, catalog) {
  const h = ensureHeroesState(state);
  const out = [];
  for (const id of h.deployed) {
    const entry = h.roster.find((e) => e && e.id === id);
    const def = findHeroDef(id, catalog);
    if (entry && def) out.push({ def, inst: { level: entry.level, stars: entry.stars } });
  }
  return out;
}

/** 队伍总战力（含阵营加成）。 */
export function teamPower(state, catalog) {
  const units = getDeployedHeroes(state, catalog);
  const bonus = factionBonus(units.map((u) => u.def));
  const raw = units.reduce((sum, u) => sum + heroPower(u.def, u.inst), 0);
  return Math.round(raw * bonus.atkMul);
}
