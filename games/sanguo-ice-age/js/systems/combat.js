/**
 * 自动战斗 — 纯函数，给定 rng 完全确定。
 *
 * 无 DOM、无计时器、无全局状态：resolveBattle 只读入参，applyBattleResult 才写 state。
 */
import { FACTION_BEATS, TROOP_BEATS, clamp } from "../config.js";
import { FALLBACK_HEROES, factionBonus, heroSkill, heroStats } from "./heroes.js";

export const MAX_ROUNDS = 12;
export const TROOP_TYPES = ["infantry", "cavalry", "archer"];

/** 单兵三围：步兵肉、骑兵均衡、弓兵脆皮高输出。 */
export const TROOP_STATS = {
  infantry: { atk: 1.0, def: 1.5, hp: 14 },
  cavalry: { atk: 1.6, def: 1.0, hp: 11 },
  archer: { atk: 1.9, def: 0.7, hp: 9 },
};

/** 克制乘区。 */
export const COUNTER = { strong: 1.25, weak: 0.8, neutral: 1 };
export const FACTION_COUNTER = { strong: 1.15, weak: 0.87, neutral: 1 };

/**
 * 武将三围 → 军队乘区的换算分母。
 * 标定：满编 5 将 1 级约 +25% 战力，30 级 5 星约 +130%，60 级 5 星约 +230%。
 * 分母过小会让武将完全盖过兵力，军队规模失去意义。
 */
export const HERO_SCALE = { atk: 3700, def: 3600, hp: 34000 };

/** 全局伤害系数：让势均力敌的战斗大致 5~9 回合分胜负。 */
export const DAMAGE_SCALE = 1.8;
/** 防御减伤： 1 / (1 + defRating * DEF_K)。 */
export const DEF_K = 0.35;
/**
 * 每回合伤害随机浮动。多回合会把噪声平均掉（有效波动 ≈ VARIANCE/√3/√回合数），
 * 取 0.32 才能让实力接近（约 ±15% 兵力差）的两军真正打得有来有回。
 */
export const VARIANCE = 0.32;
/** 伤亡中转为伤兵（可治疗）的比例。 */
export const WOUND_RATE = { win: 0.6, lose: 0.3 };
/** buff / guard 的上限。 */
export const BUFF_CAP = 1.8;
export const GUARD_CAP = 0.6;
/** 治疗量 = skill.power * 该将智力 * 本系数（标定为单次回复全军血量的 5~10%）。 */
export const HEAL_INTEL_SCALE = 5;

const EMPTY_TROOPS = Object.freeze({ infantry: 0, cavalry: 0, archer: 0 });

/* ------------------------------------------------------------------ */
/* 小工具                                                              */
/* ------------------------------------------------------------------ */

/** 可选的确定性 rng（mulberry32），测试可用 makeRng(seed)。 */
export function makeRng(seed = 1) {
  let a = (Number(seed) || 0) >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function asRng(rng) {
  return typeof rng === "function" ? rng : Math.random;
}

/**
 * 接受两种编成写法：
 *   { infantry: 100, cavalry: 50 }
 *   [{ type: "infantry", count: 100 }, { troopType: "cavalry", count: 50 }]
 */
function normTroops(troops) {
  const out = { infantry: 0, cavalry: 0, archer: 0 };
  if (!troops || typeof troops !== "object") return out;
  if (Array.isArray(troops)) {
    for (const stack of troops) {
      const type = stack?.type ?? stack?.troopType ?? stack?.id;
      if (!TROOP_TYPES.includes(type)) continue;
      const n = Math.floor(Number(stack?.count ?? stack?.n ?? stack?.amount ?? 0) || 0);
      if (n > 0) out[type] += n;
    }
    return out;
  }
  for (const t of TROOP_TYPES) {
    const n = Math.floor(Number(troops[t]) || 0);
    out[t] = n > 0 ? n : 0;
  }
  return out;
}

function totalTroops(troops) {
  return troops.infantry + troops.cavalry + troops.archer;
}

function pairAdvantage(a, b) {
  if (!TROOP_STATS[a] || !TROOP_STATS[b]) return COUNTER.neutral;
  if (TROOP_BEATS[a] === b) return COUNTER.strong;
  if (TROOP_BEATS[b] === a) return COUNTER.weak;
  return COUNTER.neutral;
}

/**
 * 兵种克制：步克骑、骑克弓、弓克步。
 * 参数可以是兵种名，也可以是 {infantry,cavalry,archer} 编成（按占比加权）。
 */
export function troopAdvantage(a, b) {
  if (typeof a === "string" && typeof b === "string") return pairAdvantage(a, b);
  const A = typeof a === "string" ? { ...EMPTY_TROOPS, [a]: 1 } : normTroops(a);
  const B = typeof b === "string" ? { ...EMPTY_TROOPS, [b]: 1 } : normTroops(b);
  const ta = totalTroops(A);
  const tb = totalTroops(B);
  if (ta <= 0 || tb <= 0) return COUNTER.neutral;
  let sum = 0;
  for (const i of TROOP_TYPES) {
    if (A[i] <= 0) continue;
    for (const j of TROOP_TYPES) {
      if (B[j] <= 0) continue;
      sum += (A[i] / ta) * (B[j] / tb) * pairAdvantage(i, j);
    }
  }
  return sum;
}

/** 阵营克制：吴克蜀、蜀克魏、魏克吴；群雄中立。 */
export function factionAdvantage(a, b) {
  if (!a || !b) return FACTION_COUNTER.neutral;
  if (FACTION_BEATS[a] === b) return FACTION_COUNTER.strong;
  if (FACTION_BEATS[b] === a) return FACTION_COUNTER.weak;
  return FACTION_COUNTER.neutral;
}

function normHeroes(heroes) {
  if (!Array.isArray(heroes)) return [];
  const out = [];
  for (const raw of heroes) {
    if (!raw) continue;
    const def = raw.def || (raw.base || raw.faction ? raw : null);
    if (!def) continue;
    const inst = raw.inst || { level: raw.level || 1, stars: raw.stars || 1 };
    out.push({ def, inst, stats: heroStats(def, inst), skill: heroSkill(def, inst) });
  }
  return out;
}

function dominantFaction(side, heroes) {
  if (side?.faction) return side.faction;
  const counts = new Map();
  for (const h of heroes) {
    const f = h.def?.faction;
    if (!f) continue;
    counts.set(f, (counts.get(f) || 0) + 1);
  }
  let best = null;
  let bestCount = 0;
  for (const [f, c] of counts) {
    if (c > bestCount) {
      best = f;
      bestCount = c;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* 战斗                                                                */
/* ------------------------------------------------------------------ */

function prepSide(side, label) {
  const troops = normTroops(side?.troops);
  const count = totalTroops(troops);
  const heroes = normHeroes(side?.heroes);
  const bonus = factionBonus(heroes.map((h) => h.def));

  let atk = 0;
  let def = 0;
  let hp = 0;
  for (const t of TROOP_TYPES) {
    atk += troops[t] * TROOP_STATS[t].atk;
    def += troops[t] * TROOP_STATS[t].def;
    hp += troops[t] * TROOP_STATS[t].hp;
  }
  let heroAtk = 0;
  let heroDef = 0;
  let heroHp = 0;
  for (const h of heroes) {
    heroAtk += h.stats.atk;
    heroDef += h.stats.def;
    heroHp += h.stats.hp;
  }
  const heroAtkMul = 1 + heroAtk / HERO_SCALE.atk;
  const heroDefMul = 1 + heroDef / HERO_SCALE.def;
  const heroHpMul = 1 + heroHp / HERO_SCALE.hp;

  const maxHp = hp * heroHpMul * bonus.hpMul;
  return {
    label,
    troops,
    count,
    heroes,
    bonus,
    faction: dominantFaction(side, heroes),
    atk: atk * heroAtkMul * bonus.atkMul,
    defRating: count > 0 ? (def / count) * heroDefMul * bonus.defMul : 0,
    maxHp,
    hp: maxHp,
    buffMul: 1,
  };
}

function rollSkills(side, rng, round, events) {
  const mods = { damageMul: 1, guard: 0, heal: 0, stunOpponent: false };
  for (const h of side.heroes) {
    const skill = h.skill;
    if (!skill || skill.chance <= 0) continue;
    if (rng() >= skill.chance) continue;
    switch (skill.type) {
      case "damage":
        mods.damageMul += skill.power;
        break;
      case "guard":
        mods.guard = clamp(mods.guard + skill.power, 0, GUARD_CAP);
        break;
      case "heal":
        // 策划描述为"按智力 value 恢复部队"，故按该将智力而非全军血量结算。
        mods.heal += skill.power * h.stats.intel * HEAL_INTEL_SCALE;
        break;
      case "buff":
        side.buffMul = Math.min(BUFF_CAP, side.buffMul + skill.power);
        break;
      case "control":
        mods.stunOpponent = true;
        break;
      default:
        continue;
    }
    events.push({ round, side: side.label, hero: h.def.id, skill: skill.id, type: skill.type });
  }
  return mods;
}

function strike(attacker, defender, mods, defMods, rng) {
  const variance = 1 - VARIANCE + 2 * VARIANCE * rng();
  const raw =
    attacker.atk *
    attacker.buffMul *
    troopAdvantage(attacker.troops, defender.troops) *
    factionAdvantage(attacker.faction, defender.faction) *
    mods.damageMul *
    variance;
  const mitigation = 1 / (1 + defender.defRating * DEF_K);
  const dealt = raw * DAMAGE_SCALE * mitigation * (1 - defMods.guard);
  return dealt > 0 ? dealt : 0;
}

function casualties(side, win) {
  const ratio = side.maxHp > 0 ? clamp((side.maxHp - Math.max(side.hp, 0)) / side.maxHp, 0, 1) : 0;
  const wipe = side.hp <= 0;
  const losses = { infantry: 0, cavalry: 0, archer: 0 };
  const wounded = { infantry: 0, cavalry: 0, archer: 0 };
  const rate = win ? WOUND_RATE.win : WOUND_RATE.lose;
  let lossesTotal = 0;
  let woundedTotal = 0;
  for (const t of TROOP_TYPES) {
    const lost = wipe ? side.troops[t] : Math.min(side.troops[t], Math.round(side.troops[t] * ratio));
    losses[t] = lost;
    lossesTotal += lost;
    const w = Math.floor(lost * rate);
    wounded[t] = w;
    woundedTotal += w;
  }
  return { losses, wounded, lossesTotal, woundedTotal, ratio };
}

function scaleRewards(rewards, factor) {
  if (!rewards || typeof rewards !== "object") return null;
  const out = {};
  for (const key of Object.keys(rewards)) {
    const v = rewards[key];
    if (typeof v === "number") {
      out[key] = Math.max(0, Math.round(v * factor));
    } else if (v && typeof v === "object") {
      const nested = {};
      for (const k2 of Object.keys(v)) nested[k2] = Math.max(0, Math.round((Number(v[k2]) || 0) * factor));
      out[key] = nested;
    }
  }
  return out;
}

/**
 * 结算一场战斗。
 *
 * @param {object} p
 * @param {() => number} p.rng 0..1 随机源，决定确定性
 * @param {{troops:object, heroes:Array, faction?:string}} p.attackers
 * @param {{troops:object, heroes:Array, faction?:string, rewards?:object}} p.defenders
 * @param {object} [p.rewards] 覆盖 defenders.rewards
 * @returns {{win:boolean, rounds:number, log:Array, losses:object, wounded:object,
 *            woundedTotal:number, rewards?:object, attacker:object, defender:object}}
 */
export function resolveBattle({ rng, attackers, defenders, rewards } = {}) {
  const random = asRng(rng);
  const A = prepSide(attackers, "attacker");
  const D = prepSide(defenders, "defender");
  const log = [];

  // 空部队直接败（双方皆空 → 进攻方判负）。
  if (A.count <= 0 || D.count <= 0) {
    const win = A.count > 0 && D.count <= 0;
    const loser = A.count <= 0 ? A : D;
    loser.hp = 0;
    log.push({
      round: 0,
      note: A.count <= 0 ? "attacker-empty" : "defender-empty",
      attackerHp: Math.max(A.hp, 0),
      defenderHp: Math.max(D.hp, 0),
      events: [],
    });
    return finish(A, D, win, 0, log, rewards ?? defenders?.rewards, "empty-army");
  }

  // 进攻方先手：兵力持平时胜率约 78%，这是"选择开战时机"的收益；
  // 守方的补偿是第 12 回合平局判守方胜，城墙加成由城建系统喂进 defenders。
  let round = 0;
  let reason = "timeout";
  for (round = 1; round <= MAX_ROUNDS; round += 1) {
    const events = [];
    const aMods = rollSkills(A, random, round, events);
    const dMods = rollSkills(D, random, round, events);

    let aDamage = 0;
    let dDamage = 0;

    if (dMods.stunOpponent) {
      events.push({ round, side: "defender", type: "control", stunned: "attacker" });
    } else {
      aDamage = strike(A, D, aMods, dMods, random);
      D.hp -= aDamage;
    }

    if (D.hp <= 0) {
      D.hp = 0;
      log.push(entry(round, aDamage, 0, A, D, events));
      reason = "defender-routed";
      break;
    }

    if (aMods.stunOpponent) {
      events.push({ round, side: "attacker", type: "control", stunned: "defender" });
    } else {
      dDamage = strike(D, A, dMods, aMods, random);
      A.hp -= dDamage;
    }

    if (aMods.heal > 0) A.hp = Math.min(A.maxHp, A.hp + aMods.heal);
    if (dMods.heal > 0) D.hp = Math.min(D.maxHp, D.hp + dMods.heal);

    if (A.hp <= 0) {
      A.hp = 0;
      log.push(entry(round, aDamage, dDamage, A, D, events));
      reason = "attacker-routed";
      break;
    }

    log.push(entry(round, aDamage, dDamage, A, D, events));
  }

  const rounds = Math.min(round, MAX_ROUNDS);
  let win;
  if (reason === "defender-routed") win = true;
  else if (reason === "attacker-routed") win = false;
  else {
    const aRatio = A.maxHp > 0 ? A.hp / A.maxHp : 0;
    const dRatio = D.maxHp > 0 ? D.hp / D.maxHp : 0;
    win = aRatio > dRatio + 1e-9; // 平局判守方赢
  }
  return finish(A, D, win, rounds, log, rewards ?? defenders?.rewards, reason);
}

function entry(round, aDamage, dDamage, A, D, events) {
  return {
    round,
    attackerDamage: Math.round(aDamage),
    defenderDamage: Math.round(dDamage),
    attackerHp: Math.round(Math.max(A.hp, 0)),
    defenderHp: Math.round(Math.max(D.hp, 0)),
    events,
  };
}

function finish(A, D, win, rounds, log, rawRewards, reason) {
  const aCas = casualties(A, win);
  const dCas = casualties(D, !win);
  const heroIds = A.heroes.map((h) => h.def.id);
  const result = {
    win,
    winner: win ? "attacker" : "defender",
    rounds,
    reason,
    log,
    losses: aCas.losses,
    wounded: aCas.wounded,
    lossesTotal: aCas.lossesTotal,
    woundedTotal: aCas.woundedTotal,
    attacker: {
      losses: aCas.losses,
      wounded: aCas.wounded,
      lossesTotal: aCas.lossesTotal,
      woundedTotal: aCas.woundedTotal,
      hp: Math.round(Math.max(A.hp, 0)),
      maxHp: Math.round(A.maxHp),
      heroIds,
      faction: A.faction,
      factionBonus: A.bonus,
      power: Math.round(A.atk),
    },
    defender: {
      losses: dCas.losses,
      wounded: dCas.wounded,
      lossesTotal: dCas.lossesTotal,
      woundedTotal: dCas.woundedTotal,
      hp: Math.round(Math.max(D.hp, 0)),
      maxHp: Math.round(D.maxHp),
      heroIds: D.heroes.map((h) => h.def.id),
      faction: D.faction,
      factionBonus: D.bonus,
      power: Math.round(D.atk),
    },
  };
  if (win) {
    const scaled = scaleRewards(rawRewards, 1);
    if (scaled) result.rewards = scaled;
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* 流寇来袭                                                            */
/* ------------------------------------------------------------------ */

const RAID_NAMES = ["黄巾残部", "白波流寇", "山越劫掠", "乌桓游骑", "黑山贼", "西凉散兵", "冻原马匪", "太行响马"];
const RAID_FACTIONS = ["qun", "qun", "wei", "shu", "wu"];

/** 每 3 天一档，共 12 档。 */
export const RAID_DAYS_PER_TIER = 3;
export const RAID_MAX_TIER = 12;
/** 兵力按档位几何增长（线性增长会被城建/兵营的复利产能迅速甩开）。 */
export const RAID_BASE_TROOPS = 40;
export const RAID_TROOP_GROWTH = 1.28;
/** 奖励只按档位线性成长，避免后期经济通胀。 */
export const RAID_REWARD_GROWTH = 0.35;

/** 按天数生成讨伐/防守目标；同 day+rng 下确定。 */
export function makeRaidEncounter(day, rng = Math.random) {
  const random = asRng(rng);
  const d = Math.max(1, Math.floor(Number(day) || 1));
  const tier = clamp(1 + Math.floor(d / RAID_DAYS_PER_TIER), 1, RAID_MAX_TIER);
  const powerScale = Math.pow(RAID_TROOP_GROWTH, tier - 1);
  const scale = 1 + RAID_REWARD_GROWTH * (tier - 1);

  const name = RAID_NAMES[Math.floor(clamp(random(), 0, 0.999999) * RAID_NAMES.length)];
  const faction = RAID_FACTIONS[Math.floor(clamp(random(), 0, 0.999999) * RAID_FACTIONS.length)];

  const total = Math.round(RAID_BASE_TROOPS * powerScale);
  const wInf = 0.5 + 0.5 * random();
  const wCav = 0.3 + 0.5 * random();
  const wArc = 0.3 + 0.5 * random();
  const wSum = wInf + wCav + wArc;
  const troops = {
    infantry: Math.max(1, Math.round((total * wInf) / wSum)),
    cavalry: Math.max(0, Math.round((total * wCav) / wSum)),
    archer: Math.max(0, Math.round((total * wArc) / wSum)),
  };

  const heroes = [];
  if (tier >= 3) {
    const pool = FALLBACK_HEROES.filter((h) => h.faction === faction);
    const list = pool.length ? pool : FALLBACK_HEROES;
    const def = list[Math.floor(clamp(random(), 0, 0.999999) * list.length)];
    heroes.push({ def, inst: { level: clamp(tier * 3, 1, 60), stars: clamp(1 + Math.floor(tier / 4), 1, 5) } });
  }

  const rewards = {
    resources: {
      food: Math.round(60 * scale),
      wood: Math.round(50 * scale),
      coal: Math.round(24 * scale),
      iron: Math.round(16 * scale),
    },
    heroXp: Math.round(30 * scale),
    tickets: tier % 4 === 0 ? 1 : 0,
  };

  const enemyPower =
    troops.infantry * TROOP_STATS.infantry.atk +
    troops.cavalry * TROOP_STATS.cavalry.atk +
    troops.archer * TROOP_STATS.archer.atk;

  return {
    id: `raid-d${d}-t${tier}`,
    name,
    day: d,
    tier,
    faction,
    troops,
    heroes,
    rewards,
    recommendedPower: Math.round(enemyPower * 1.15),
  };
}

/* ------------------------------------------------------------------ */
/* 结算写回                                                            */
/* ------------------------------------------------------------------ */

function ensureArmy(state) {
  if (!state.army || typeof state.army !== "object") {
    state.army = { troops: state.troops && typeof state.troops === "object" ? state.troops : {}, wounded: {} };
  }
  if (!state.army.troops || typeof state.army.troops !== "object") state.army.troops = {};
  if (!state.army.wounded || typeof state.army.wounded !== "object") state.army.wounded = {};
  for (const t of TROOP_TYPES) {
    if (typeof state.army.troops[t] !== "number") state.army.troops[t] = 0;
    if (typeof state.army.wounded[t] !== "number") state.army.wounded[t] = 0;
  }
  return state.army;
}

/**
 * 把战斗结果写回 state：扣兵、记伤兵（等医馆治疗）、发奖励、累计战绩。
 * 伤兵只写字段，治疗由人口/城建系统负责。
 */
export function applyBattleResult(state, result) {
  if (!state || typeof state !== "object") throw new TypeError("combat: state required");
  if (!result || typeof result !== "object") return state;
  const army = ensureArmy(state);
  const losses = result.losses || EMPTY_TROOPS;
  const wounded = result.wounded || EMPTY_TROOPS;

  for (const t of TROOP_TYPES) {
    const lost = Math.max(0, Math.floor(Number(losses[t]) || 0));
    army.troops[t] = Math.max(0, army.troops[t] - lost);
    army.wounded[t] += Math.max(0, Math.floor(Number(wounded[t]) || 0));
  }

  if (!state.stats || typeof state.stats !== "object") state.stats = {};
  const stats = state.stats;
  stats.battles = (stats.battles || 0) + 1;
  if (result.win) stats.battleWins = (stats.battleWins || 0) + 1;
  else stats.battleLosses = (stats.battleLosses || 0) + 1;
  const lostTotal = TROOP_TYPES.reduce((sum, t) => sum + (Math.floor(Number(losses[t])) || 0), 0);
  const woundedTotal = TROOP_TYPES.reduce((sum, t) => sum + (Math.floor(Number(wounded[t])) || 0), 0);
  stats.troopsLost = (stats.troopsLost || 0) + lostTotal;
  stats.troopsWounded = (stats.troopsWounded || 0) + woundedTotal;

  const applied = { resources: {}, tickets: 0, heroXp: 0 };
  const rewards = result.rewards;
  if (result.win && rewards) {
    if (!state.resources || typeof state.resources !== "object") state.resources = {};
    const bag = rewards.resources && typeof rewards.resources === "object" ? rewards.resources : null;
    if (bag) {
      for (const key of Object.keys(bag)) {
        const v = Math.max(0, Math.round(Number(bag[key]) || 0));
        if (!v) continue;
        state.resources[key] = (Number(state.resources[key]) || 0) + v;
        applied.resources[key] = (applied.resources[key] || 0) + v;
      }
    }
    if (rewards.tickets) {
      if (!state.heroes || typeof state.heroes !== "object") state.heroes = {};
      const add = Math.max(0, Math.round(Number(rewards.tickets) || 0));
      state.heroes.tickets = (Number(state.heroes.tickets) || 0) + add;
      applied.tickets = add;
    }
    if (rewards.heroXp) {
      const xp = Math.max(0, Math.round(Number(rewards.heroXp) || 0));
      const ids = result.attacker?.heroIds || [];
      const roster = Array.isArray(state.heroes?.roster) ? state.heroes.roster : [];
      for (const id of ids) {
        const entry = roster.find((e) => e && e.id === id);
        if (entry) entry.xp = (Number(entry.xp) || 0) + xp;
      }
      applied.heroXp = xp;
    }
  }

  if (!state.war || typeof state.war !== "object") state.war = {};
  if (!Array.isArray(state.war.log)) state.war.log = [];
  state.war.log.unshift({
    win: !!result.win,
    rounds: result.rounds || 0,
    reason: result.reason || "",
    lost: lostTotal,
    wounded: woundedTotal,
    day: Number(state.day) || 0,
  });
  if (state.war.log.length > 30) state.war.log.length = 30;

  return { state, applied, troops: { ...army.troops }, wounded: { ...army.wounded }, stats };
}
