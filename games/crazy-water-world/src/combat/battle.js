import { HEROES, RARITY_MULT } from "../data/heroes.js";
import { hashSeed, mulberry32 } from "../core/rng.js";
import {
  DEF_FACTOR,
  DMG_FLOOR,
  effectiveDr,
  planFor,
  rawDamage,
  WITHER_STEP,
} from "./skills.js";
import { actionOrder, anyAlive, living, pickTarget, weakestAlly } from "./ai.js";

export const MAX_ROUNDS = 24;
export const MAX_SIDE = 5;
export const STAR_GROWTH = 0.18;

function round1(n) {
  return Math.round(n * 10) / 10;
}

function fixed1(n) {
  return n.toFixed(1);
}

function starMult(rarity, star) {
  return (RARITY_MULT[rarity] || 1) * (1 + (star - 1) * STAR_GROWTH);
}

function baseUnit(shape) {
  const plan = planFor(shape.skill, shape.star);
  return {
    slot: 0,
    id: shape.id,
    key: shape.key,
    name: shape.name,
    side: shape.side,
    lane: shape.lane === "back" ? "back" : "front",
    homeLane: shape.lane === "back" ? "back" : "front",
    hp: shape.hp,
    maxHp: shape.hp,
    atk: shape.atk,
    def: shape.def,
    spd: shape.spd,
    star: shape.star,
    skill: shape.skill || null,
    plan,
    // 技能运行时状态
    tauntOn: false,
    tauntDr: 0,
    shield: 0,
    wither: 0,
    buffStacks: 0,
    buffAtkPerStack: plan && plan.kind === "buff" ? plan.atkPerStack : 0,
    buffDrPerStack: plan && plan.kind === "buff" ? plan.drPerStack : 0,
    buffMaxDr: plan && plan.kind === "buff" ? plan.maxDr : 0,
    // 统计
    dealt: 0,
    healed: 0,
    down: false,
  };
}

function allyShape(unit) {
  const def = unit && unit.heroKey ? HEROES[unit.heroKey] : null;
  if (def) {
    const star = Math.max(1, Math.min(5, Number.isFinite(unit.star) ? unit.star : 1));
    const m = starMult(def.rarity, star);
    return {
      id: unit.id || `h-${def.key}`,
      key: def.key,
      name: def.name,
      side: "ally",
      lane: def.lane,
      hp: def.base.hp * m,
      atk: def.base.atk * m,
      def: def.base.def * m,
      spd: def.base.spd,
      star,
      skill: def.skill,
    };
  }
  // 允许测试直接内联一份联盟侧数值块（契约 §8 的 BattleUnit 联合类型）。
  if (unit && Number.isFinite(unit.hp) && Number.isFinite(unit.atk)) {
    return {
      id: unit.id || `${unit.key || "ally"}-${unit.name || "无名"}`,
      key: unit.key || "ally",
      name: unit.name || "无名",
      side: "ally",
      lane: unit.lane,
      hp: unit.hp,
      atk: unit.atk,
      def: Number.isFinite(unit.def) ? unit.def : 0,
      spd: Number.isFinite(unit.spd) ? unit.spd : 100,
      star: Number.isFinite(unit.star) ? unit.star : 1,
      skill: unit.skill || null,
    };
  }
  return null;
}

function enemyShape(unit) {
  if (!unit || !Number.isFinite(unit.hp) || !Number.isFinite(unit.atk)) return null;
  return {
    id: unit.id || null,
    key: unit.key || "foe",
    name: unit.name || "不明来客",
    side: "enemy",
    lane: unit.lane,
    hp: unit.hp,
    atk: unit.atk,
    def: Number.isFinite(unit.def) ? unit.def : 0,
    spd: Number.isFinite(unit.spd) ? unit.spd : 100,
    star: Number.isFinite(unit.star) ? unit.star : 1,
    skill: unit.skill || null,
  };
}

function uniqueId(used, wanted) {
  let id = wanted;
  let n = 2;
  while (used.has(id)) {
    id = `${wanted}#${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

/** 伤害落地：先吃护盾再扣血，返回真实掉血量。 */
function land(target, amount) {
  let rest = amount;
  if (target.shield > 0) {
    const eaten = Math.min(target.shield, rest);
    target.shield -= eaten;
    rest -= eaten;
  }
  target.hp -= rest;
  if (target.hp < 0) target.hp = 0;
  return amount;
}

function noteDeath(log, unit) {
  if (unit.hp > 0 || unit.down) return;
  unit.down = true;
  unit.tauntOn = false;
  log.push(`${unit.name}倒下了。`);
}

function strike(actor, target, mult, pierce, log) {
  const dealt = rawDamage(actor, target, pierce) * mult * (1 - effectiveDr(target));
  land(target, dealt);
  actor.dealt += dealt;
  noteDeath(log, target);
  return dealt;
}

function runTurn(ctx, actor) {
  const { units, log, rng } = ctx;
  const plan = actor.plan;

  // 酒劲先灌一口，本回合就能享受到加成。
  if (plan && plan.kind === "buff" && actor.buffStacks < plan.maxStacks) {
    actor.buffStacks += 1;
    log.push(`${actor.name}的${plan.name}上到第${actor.buffStacks}层，越喝越猛。`);
  }

  const target = pickTarget(rng, actor, units);
  if (!target) return false;

  let mult = 1;
  let pierce = 0;
  let flavor = "";

  // 铁钩：开场把后排拽到前排，顺手减速。
  if (plan && plan.kind === "hook" && ctx.round === plan.round && target.lane === "back") {
    target.lane = "front";
    target.spd = Math.max(1, target.spd - plan.slow);
    mult *= plan.mult;
    flavor = `${plan.name}一把把${target.name}拽到前排，`;
  }
  // 爆发：周期倍伤 + 破甲。
  if (plan && plan.kind === "burst" && ctx.round % plan.every === 0) {
    mult *= plan.mult;
    pierce = plan.pierce;
    flavor = `${plan.name}起手，`;
  }

  const first = strike(actor, target, mult, pierce, log);

  // 连珠：额外段各自重新选目标，伤害按 falloff 衰减。
  if (plan && plan.kind === "multishot") {
    let total = first;
    let hits = 1;
    for (let i = 1; i < plan.volleys; i += 1) {
      if (!anyAlive(units, actor.side === "ally" ? "enemy" : "ally")) break;
      const extra = pickTarget(rng, actor, units);
      if (!extra) break;
      total += strike(actor, extra, mult * plan.falloff, pierce, log);
      hits += 1;
    }
    log.push(`${actor.name}${plan.name}${hits}连射，合计${fixed1(total)}点。`);
  } else {
    log.push(`${flavor}${actor.name}打${target.name}，${fixed1(first)}点。`);
  }

  // 群体：周期性溅射全体敌人并叠削攻减益。
  if (plan && plan.kind === "aoe" && ctx.round % plan.every === 0) {
    const foes = living(units, actor.side === "ally" ? "enemy" : "ally");
    let total = 0;
    for (const foe of foes) {
      const splash = rawDamage(actor, foe, 0) * plan.ratio * (1 - effectiveDr(foe));
      land(foe, splash);
      actor.dealt += splash;
      foe.wither = Math.min(plan.maxWither, foe.wither + 1);
      total += splash;
      noteDeath(log, foe);
    }
    if (foes.length) {
      log.push(`${actor.name}的${plan.name}罩住全场，${fixed1(total)}点并削弱敌方。`);
    }
  }

  // 治疗：奶百分比最低的队友，附带护盾。
  if (plan && plan.kind === "heal" && ctx.round % plan.every === 0) {
    const mate = weakestAlly(units, actor.side);
    if (mate) {
      const before = mate.hp;
      mate.hp = Math.min(mate.maxHp, mate.hp + plan.amount);
      mate.shield += plan.shield;
      actor.healed += mate.hp - before;
      log.push(`${actor.name}的${plan.name}回了${mate.name} ${fixed1(mate.hp - before)}点，附带护盾。`);
    }
  }

  return true;
}

/**
 * 自动海战。相同 (seed, allies, enemies) 必然产出字节相同的 JSON。
 *
 * 随机消费顺序（契约 §8.2，改动即破坏快照）：
 *   1. 按 enemies 数组序，每个敌人掷 1 次 id 后缀；
 *   2. 回合循环内按行动序，每次目标选择掷 1 次（连珠的每一段各算一次）。
 * 除此之外全场无随机：伤害、治疗、减益、层数都是纯算术。
 */
export function simulateBattle(seed, allies, enemies) {
  const s32 = (Number.isFinite(seed) ? seed : 0) >>> 0;
  const rng = mulberry32(s32);

  const rawAllies = Array.isArray(allies) ? allies : [];
  const rawEnemies = Array.isArray(enemies) ? enemies : [];
  const allyShapes = rawAllies.map(allyShape).filter(Boolean);
  const enemyShapes = rawEnemies.map(enemyShape).filter(Boolean);
  const truncated = allyShapes.length > MAX_SIDE || enemyShapes.length > MAX_SIDE;
  const pickedAllies = allyShapes.slice(0, MAX_SIDE);
  const pickedEnemies = enemyShapes.slice(0, MAX_SIDE);

  const used = new Set();
  const units = [];
  for (const shape of pickedAllies) {
    const u = baseUnit(shape);
    u.id = uniqueId(used, shape.id);
    units.push(u);
  }
  for (const shape of pickedEnemies) {
    // 先掷 id 后缀：顺序与 enemies 数组序绑死。
    const suffix = Math.floor(rng() * 1e6);
    const u = baseUnit(shape);
    u.id = uniqueId(used, shape.id || `${shape.key}-${shape.name}-${suffix}`);
    units.push(u);
  }
  units.forEach((u, i) => {
    u.slot = i;
  });

  const log = [];
  // 开场：嘲讽即时生效，减伤也一并挂上。
  for (const u of units) {
    if (u.plan && u.plan.kind === "taunt") {
      u.tauntOn = true;
      u.tauntDr = u.plan.reduction;
      log.push(`${u.name}${u.plan.name}，火力全冲他来。`);
    }
  }

  const ctx = { units, log, rng, round: 0 };
  let t = 0;

  if (!units.length || !anyAlive(units, "ally") || !anyAlive(units, "enemy")) {
    log.push("没人上场，这仗打不起来。");
  }

  while (t < MAX_ROUNDS && anyAlive(units, "ally") && anyAlive(units, "enemy")) {
    t += 1;
    ctx.round = t;
    log.push(`第${t}回合。`);
    for (const actor of actionOrder(units)) {
      if (actor.hp <= 0) continue;
      if (!anyAlive(units, actor.side === "ally" ? "enemy" : "ally")) break;
      runTurn(ctx, actor);
    }
  }

  const allyLeft = living(units, "ally");
  const enemyLeft = living(units, "enemy");
  const winner = allyLeft.length ? (enemyLeft.length ? "draw" : "ally") : "enemy";

  if (winner === "ally") log.push(`打赢了，还剩${allyLeft.length}人站着。`);
  else if (winner === "enemy") log.push("我方全灭，回去修木筏吧。");
  else log.push("二十四回合没分出胜负，各回各家。");

  let mvp = null;
  for (const u of units) {
    if (!mvp || u.dealt > mvp.raw || (u.dealt === mvp.raw && u.slot < mvp.slot)) {
      mvp = { id: u.id, name: u.name, side: u.side, raw: u.dealt, slot: u.slot };
    }
  }

  return {
    // 契约 §8 冻结键序：seed / winner / log / duration / leftover 在前，附加键在后。
    seed: s32,
    winner,
    log,
    duration: t,
    leftover: units.map((u) => ({
      id: u.id,
      name: u.name,
      side: u.side,
      hp: Math.max(0, u.hp),
      maxHp: u.maxHp,
      lane: u.lane,
    })),
    truncated,
    survivors: { ally: allyLeft.length, enemy: enemyLeft.length },
    casualties: {
      ally: units.filter((u) => u.side === "ally" && u.hp <= 0).map((u) => u.id),
      enemy: units.filter((u) => u.side === "enemy" && u.hp <= 0).map((u) => u.id),
    },
    mvp: mvp && mvp.raw > 0 ? { id: mvp.id, name: mvp.name, side: mvp.side, damage: round1(mvp.raw) } : null,
  };
}

/**
 * 关卡战斗 seed：把重试次数掺进来，重打同一关不会永远是同一份战报，
 * 但 (存档 seed, 关卡, 第几次重试) 三元组固定时仍可完美回放。
 */
export function battleSeed(state, stage, attempts) {
  const worldSeed = (state && state.meta && Number.isFinite(state.meta.seed) ? state.meta.seed : 0) >>> 0;
  const tries = Number.isFinite(attempts)
    ? attempts
    : state && state.campaign && Number.isFinite(state.campaign.attempts)
      ? state.campaign.attempts
      : 0;
  const n = Number.isFinite(stage) ? stage : 0;
  return hashSeed(`cww-battle|${worldSeed}|${n}|${tries >>> 0}`);
}

// 供 UI / 测试展示公式的常量出口，避免各处重复硬编码。
export const DAMAGE_CONSTANTS = { floor: DMG_FLOOR, defFactor: DEF_FACTOR, witherStep: WITHER_STEP };
