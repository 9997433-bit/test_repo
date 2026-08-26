import { heroById, factionAdvantage } from "../data/heroes.js";
import { realmPower } from "../data/realms.js";
import { combatBuildingBonus } from "../mansion/production.js";
import { applyTriggers, artifactLoadout } from "./artifacts.js";

const TICK_SECONDS = 0.25;
const MAX_TICKS = 240;
const DEF_SCALE = 0.35;
const CRIT_MUL = 1.5;
const SKILL_ATK_MUL = 1.55;
const FOE_CRIT = 0.06;
const FOE_ULT_SECONDS = 7;
const SUPPORT_ULT_SECONDS = 4;
const ULT_SECONDS = 6;

/**
 * 仙友技能表：每条与 data/heroes.js 的 skill / skillDesc 一一对应。
 * 战斗循环只读这张表，不再按 id 散落 if 判断。
 */
const KITS = {
  "mc-mortal": { basicHealPct: 0.08 },
  cihang: { skill: "teamHeal", healPct: 0.55 },
  houyi: { targeting: "back", backBonus: 1.35 },
  tongtian: { skill: "aoe", aoeMul: 0.7 },
  jiangziya: { skill: "shred", shredMul: 0.82, shredSeconds: 6 },
  "mc-divine": { openingTeamAtk: 1.1 },
  yangjian: { chaseMul: 0.4 },
  nezha: { counterMul: 0.5 },
  zhenwu: { openingShieldPct: 0.2 },
  xuannv: { teamUltHaste: 0.2 },
  nvwa: { critDmgBonus: 0.4 },
  "mc-demon": { rageMax: 0.28 },
  wukong: { openingHaste: 0.4, openingSeconds: 6 },
  bajie: { skill: "taunt", tauntSeconds: 3 },
  shen: { skill: "aoe", aoeMul: 0.7, aoeTargets: 3, aoeRandom: true },
  yumian: { skill: "blind", blindPct: 0.12, blindSeconds: 6 },
};
const NO_KIT = {};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ticksFor(seconds) {
  return Math.max(1, Math.round(seconds / TICK_SECONDS));
}

function makeUnit(spec) {
  const ultTicks = ticksFor(spec.ultSeconds);
  return {
    ...spec,
    maxHp: spec.hp,
    shield: 0,
    attackTimer: 1,
    ultTicks,
    ultTimer: ultTicks,
    stunTicks: 0,
    tauntBy: null,
    tauntTicks: 0,
    defMul: 1,
    defTicks: 0,
    blind: 0,
    blindTicks: 0,
    lastAttacker: null,
    alive: true,
    revived: false,
    revivesLeft: 0,
  };
}

function unitFromHero(heroId, state, side) {
  const hero = heroById(heroId);
  if (!hero) return null;
  const rp = realmPower(state.realm?.index ?? 0, state.realm?.layer ?? 1);
  const bonus = combatBuildingBonus(state.buildings);
  return makeUnit({
    id: heroId,
    name: hero.name,
    faction: hero.faction,
    role: hero.role,
    side,
    atk: hero.atk + rp.atk + bonus.atk,
    def: hero.def + rp.def,
    hp: hero.hp + rp.hp,
    ultSeconds: hero.role === "heal" || hero.role === "support" ? SUPPORT_ULT_SECONDS : ULT_SECONDS,
    kit: KITS[heroId] ?? NO_KIT,
    boss: false,
  });
}

function unitFromFoe(foe, side) {
  return makeUnit({
    id: foe.id,
    name: foe.name,
    faction: foe.faction,
    role: foe.role,
    side,
    atk: foe.atk,
    def: foe.def,
    hp: foe.hp,
    ultSeconds: FOE_ULT_SECONDS,
    kit: NO_KIT,
    boss: Boolean(foe.boss),
  });
}

function living(units, side) {
  return units.filter((u) => u.side === side && u.alive);
}

function foeSide(u) {
  return u.side === "a" ? "b" : "a";
}

function lowestHp(pool) {
  let best = null;
  for (const u of pool) {
    if (!best || u.hp / u.maxHp < best.hp / best.maxHp) best = u;
  }
  return best;
}

function strongest(pool) {
  let best = null;
  for (const u of pool) {
    if (!best || u.atk > best.atk) best = u;
  }
  return best;
}

function sample(pool, count, rng) {
  const rest = [...pool];
  const picks = [];
  while (picks.length < count && rest.length) {
    picks.push(rest.splice(Math.floor(rng() * rest.length), 1)[0]);
  }
  return picks;
}

/**
 * 记一次法器生效。战报按「法器 × 效果」汇总，战后能直接说明是哪几件法器在起作用；
 * 返回首条注记，供调用点把署名写进当帧日志。计数只由战况决定，不掷骰，故不影响确定性。
 */
function fire(ctx, kind, detail) {
  const notes = applyTriggers(ctx, { kind, ...detail });
  for (const note of notes) {
    const key = `${note.id}:${note.kind}`;
    const seen = ctx.fired.get(key);
    if (seen) seen.count += 1;
    else ctx.fired.set(key, { id: note.id, name: note.name, kind: note.kind, count: 1 });
  }
  return notes[0] ?? null;
}

/** 开场结算：主角光环、玄天盾、瑶光护盾、玄女锦囊与太虚金丹鼎的大招加速。 */
function applyOpenings(ctx) {
  const { units, loadout } = ctx;
  const allies = living(units, "a");
  let atkAura = 1;
  let ultHaste = loadout.passives.ultHaste;
  for (const u of allies) {
    if (u.kit.openingTeamAtk) atkAura *= u.kit.openingTeamAtk;
    if (u.kit.teamUltHaste) ultHaste += u.kit.teamUltHaste;
  }
  for (const u of allies) {
    u.atk *= atkAura;
    if (loadout.shield.pct) u.shield += u.maxHp * loadout.shield.pct;
    if (u.kit.openingShieldPct) u.shield += u.maxHp * u.kit.openingShieldPct;
    u.ultTicks = ticksFor(u.ultSeconds / (1 + ultHaste));
    u.ultTimer = u.ultTicks;
    u.revivesLeft = loadout.revive?.charges ?? 0;
  }
  if (allies.length) {
    fire(ctx, "passive");
    if (loadout.shield.pct) fire(ctx, "shield");
    if (loadout.skillMul > 1) fire(ctx, "skillMul");
  }
}

function attackTicks(u, tSec) {
  const base = u.role === "dps" ? 1.05 : 1.25;
  const rush = u.kit.openingHaste && tSec < u.kit.openingSeconds ? 1 + u.kit.openingHaste : 1;
  return ticksFor(base / rush);
}

function tickTimers(u) {
  if (u.tauntTicks > 0 && --u.tauntTicks === 0) u.tauntBy = null;
  if (u.defTicks > 0 && --u.defTicks === 0) u.defMul = 1;
  if (u.blindTicks > 0 && --u.blindTicks === 0) u.blind = 0;
}

function pickTarget(ctx, u) {
  if (u.tauntBy) {
    const taunter = ctx.units.find((x) => x.id === u.tauntBy && x.alive);
    if (taunter) return taunter;
    u.tauntBy = null;
    u.tauntTicks = 0;
  }
  const foes = living(ctx.units, foeSide(u));
  if (!foes.length) return null;
  if (u.kit.targeting === "back" && foes.length > 1) return foes[foes.length - 1];
  return foes[Math.floor(ctx.rng() * foes.length)];
}

/**
 * 唯一的伤害入口。护盾 → 扣血 → 万魂灯复活 → 阴阳镜自救 → 镇岳钟斩杀 → 哪吒反击。
 * opts.trueDamage 跳过防御减免（灼烧），opts.reflected 阻止反击套娃。
 */
function applyDamage(ctx, source, target, raw, opts = {}) {
  const { loadout, log } = ctx;
  let amount = opts.trueDamage ? Math.max(0, raw) : Math.max(1, raw - target.def * target.defMul * DEF_SCALE);

  const guard = loadout.guard;
  if (guard && target.side === "a" && target.hp / target.maxHp < guard.threshold) {
    amount *= guard.mul;
    fire(ctx, "guard", { target: target.id });
  }

  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, amount);
    target.shield -= absorbed;
    amount -= absorbed;
  }
  target.hp -= amount;
  if (source && source.side !== target.side) target.lastAttacker = source.id;

  if (target.hp <= 0) {
    // 万魂灯口径：每名上阵者各有 charges 次复活（data 未给 reviveCharges 时为 1 次），
    // 与「我方上阵者阵亡时各复活一次（每人每场一次）」的文案一致。
    if (loadout.revive && target.side === "a" && target.revivesLeft > 0) {
      target.revivesLeft -= 1;
      target.revived = true;
      target.hp = target.maxHp * loadout.revive.hpPct;
      const note = fire(ctx, "revive", { target: target.id });
      log.push({ t: "revive", target: target.id, by: note?.id });
      return { dmg: amount, killed: false, revived: true };
    }
    target.hp = 0;
    target.alive = false;
    return { dmg: amount, killed: true, revived: false };
  }

  const rescue = loadout.rescue;
  if (rescue && target.side === "a" && !ctx.rescued && target.hp / target.maxHp < rescue.threshold) {
    ctx.rescued = true;
    target.hp = Math.min(target.maxHp, target.hp + target.maxHp * rescue.pct);
    const note = fire(ctx, "rescue", { target: target.id });
    log.push({ t: "rescue", target: target.id, by: note?.id });
  }

  const execute = loadout.execute;
  if (
    execute &&
    target.side === "b" &&
    (!execute.bossOnly || target.boss) &&
    target.hp / target.maxHp < execute.threshold
  ) {
    target.hp = 0;
    target.alive = false;
    const note = fire(ctx, "execute", { target: target.id });
    log.push({ t: "execute", target: target.id, by: note?.id });
    return { dmg: amount, killed: true, execute: true };
  }

  if (!opts.reflected && target.kit.counterMul && source?.alive && source.side !== target.side) {
    const back = applyDamage(ctx, target, source, target.atk * target.kit.counterMul, { reflected: true });
    log.push({ t: "counter", src: target.id, target: source.id, dmg: back.dmg });
  }
  return { dmg: amount, killed: false };
}

/** 残阳妖铠：开场若干秒后每秒灼烧全体敌人，按我方最强攻击计算且无视防御。 */
function burnPhase(ctx, tick, tSec) {
  const burn = ctx.loadout.burn;
  if (!burn || tSec < burn.after || tick % ticksFor(1) !== 0) return;
  const src = strongest(living(ctx.units, "a"));
  if (!src) return;
  fire(ctx, "burn", { at: tSec });
  for (const foe of living(ctx.units, "b")) {
    const r = applyDamage(ctx, src, foe, src.atk * burn.atkPct, { trueDamage: true, reflected: true });
    ctx.log.push({ t: "burn", target: foe.id, dmg: r.dmg });
  }
}

function castSkill(ctx, u, target, mul) {
  const { units, log, rng } = ctx;
  const kit = u.kit;
  const enemies = foeSide(u);
  switch (kit.skill) {
    case "aoe": {
      const pool = living(units, enemies);
      const picks = kit.aoeRandom
        ? sample(pool, kit.aoeTargets ?? pool.length, rng)
        : pool.slice(0, kit.aoeTargets ?? pool.length);
      for (const foe of picks) applyDamage(ctx, u, foe, u.atk * kit.aoeMul * mul);
      log.push({ t: "aoe", src: u.id, hits: picks.map((f) => f.id) });
      break;
    }
    case "teamHeal": {
      for (const ally of living(units, u.side)) ally.hp = Math.min(ally.maxHp, ally.hp + u.atk * kit.healPct);
      log.push({ t: "heal", src: u.id });
      break;
    }
    case "shred": {
      const ticks = ticksFor(kit.shredSeconds);
      for (const foe of living(units, enemies)) {
        foe.defMul = kit.shredMul;
        foe.defTicks = ticks;
      }
      log.push({ t: "shred", src: u.id });
      break;
    }
    case "taunt": {
      const victim = units.find((x) => x.id === u.lastAttacker && x.alive && x.side !== u.side) ?? target;
      victim.tauntBy = u.id;
      victim.tauntTicks = ticksFor(kit.tauntSeconds);
      log.push({ t: "taunt", src: u.id, target: victim.id });
      break;
    }
    case "blind": {
      const ticks = ticksFor(kit.blindSeconds);
      for (const foe of living(units, enemies)) {
        foe.blind = kit.blindPct;
        foe.blindTicks = ticks;
      }
      log.push({ t: "blind", src: u.id });
      break;
    }
    default: {
      const r = applyDamage(ctx, u, target, u.atk * SKILL_ATK_MUL * mul);
      log.push({ t: "skill", src: u.id, target: target.id, dmg: r.dmg });
    }
  }

  const stun = ctx.loadout.stun;
  if (stun && u.side === "a" && rng() < stun.chance && target.alive) {
    target.stunTicks = ticksFor(stun.seconds);
    const note = fire(ctx, "stun", { src: u.id, target: target.id });
    log.push({ t: "stun", src: u.id, target: target.id, by: note?.id });
  }
}

function basicAttack(ctx, u, target, mul, crit) {
  const { loadout, log, rng } = ctx;
  let raw = u.atk * mul;
  if (loadout.gamble && u.side === "a") {
    raw *= rng() < loadout.gamble.chance ? loadout.gamble.high : loadout.gamble.low;
    fire(ctx, "gamble", { src: u.id });
  }
  const r = applyDamage(ctx, u, target, raw);
  log.push({ t: "hit", src: u.id, target: target.id, dmg: r.dmg, crit });
  if (u.kit.basicHealPct) {
    const ally = lowestHp(living(ctx.units, u.side));
    if (ally) ally.hp = Math.min(ally.maxHp, ally.hp + u.atk * u.kit.basicHealPct);
  }
}

function act(ctx, u, skill) {
  const { loadout, log, rng } = ctx;
  const target = pickTarget(ctx, u);
  if (!target) return;

  if (u.blind > 0 && rng() < u.blind) {
    log.push({ t: "miss", src: u.id, target: target.id });
    return;
  }

  let mul = factionAdvantage(u.faction, target.faction);
  if (u.kit.rageMax) mul *= 1 + (1 - u.hp / u.maxHp) * u.kit.rageMax;
  if (u.kit.targeting === "back" && target === living(ctx.units, foeSide(u)).at(-1)) mul *= u.kit.backBonus;
  if (u.side === "a") mul *= skill ? loadout.passives.skillMul * loadout.skillMul : loadout.passives.basicMul;

  const plain = mul;
  const crit = rng() < (u.side === "a" ? loadout.passives.crit : FOE_CRIT);
  if (crit) mul *= CRIT_MUL + (u.kit.critDmgBonus ?? 0);

  if (skill) castSkill(ctx, u, target, mul);
  else basicAttack(ctx, u, target, mul, crit);

  if (crit && u.kit.chaseMul && target.alive) {
    const r = applyDamage(ctx, u, target, u.atk * u.kit.chaseMul * plain);
    log.push({ t: "chase", src: u.id, target: target.id, dmg: r.dmg });
  }
}

function snapshot(units) {
  return units.map((u) => ({
    id: u.id,
    name: u.name,
    side: u.side,
    hp: u.hp,
    maxHp: u.maxHp,
    shield: u.shield,
    alive: u.alive,
    revived: u.revived,
    boss: u.boss,
  }));
}

export function simulate(input) {
  const { seed, heroIds = [], foes = [], state = {}, equipped = [], maxTicks = MAX_TICKS } = input;
  const rng = mulberry32(seed >>> 0);
  const loadout = artifactLoadout(equipped);
  const units = [
    ...heroIds.map((id) => unitFromHero(id, state, "a")).filter(Boolean),
    ...foes.map((f) => unitFromFoe(f, "b")),
  ];
  const ctx = {
    units,
    loadout,
    rng,
    log: [],
    rescued: false,
    fired: new Map(),
  };
  applyOpenings(ctx);

  const frames = [];
  let tick = 0;
  let winner = null;

  while (tick < maxTicks && !winner) {
    tick += 1;
    const tSec = tick * TICK_SECONDS;
    ctx.log = [];
    burnPhase(ctx, tick, tSec);

    for (const u of units) {
      if (!u.alive) continue;
      tickTimers(u);
      if (u.stunTicks > 0) {
        u.stunTicks -= 1;
        continue;
      }
      if (u.ultTimer > 0) u.ultTimer -= 1;
      u.attackTimer -= 1;
      // 大招走自己的冷却，到点即放并顶掉这一次普攻，不再被普攻节奏对齐掉。
      const skill = u.ultTimer <= 0;
      if (!skill && u.attackTimer > 0) continue;
      u.attackTimer = attackTicks(u, tSec);
      if (skill) u.ultTimer = u.ultTicks;
      act(ctx, u, skill);
    }

    if (!living(units, "b").length) winner = "a";
    else if (!living(units, "a").length) winner = "b";
    frames.push({ tick, winner, log: ctx.log, units: snapshot(units) });
  }

  if (!winner) winner = living(units, "a").length >= living(units, "b").length ? "a" : "b";
  return { winner, ticks: tick, frames, seed, artifacts: [...ctx.fired.values()] };
}
