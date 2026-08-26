import { heroById, factionAdvantage } from "../data/heroes.js";
import { realmPower } from "../data/realms.js";
import { combatBuildingBonus } from "../mansion/production.js";
import { collectPassives, hasArtifact } from "./artifacts.js";

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

function unitFromHero(heroId, state, side) {
  const hero = heroById(heroId);
  const rp = realmPower(state.realm?.index ?? 0, state.realm?.layer ?? 1);
  const bns = combatBuildingBonus(state.buildings);
  const hp = hero.hp + rp.hp;
  return {
    id: heroId,
    name: hero.name,
    faction: hero.faction,
    role: hero.role,
    side,
    atk: hero.atk + rp.atk + bns.atk,
    def: hero.def + rp.def,
    maxHp: hp,
    hp,
    shield: 0,
    cd: 0,
    ultCd: hero.role === "heal" || hero.role === "support" ? 4 : 6,
    alive: true,
    revived: false,
    mirrored: false,
    stunned: 0,
    boss: false,
  };
}

function unitFromFoe(foe, side) {
  return {
    id: foe.id,
    name: foe.name,
    faction: foe.faction,
    role: foe.role,
    side,
    atk: foe.atk,
    def: foe.def,
    maxHp: foe.hp,
    hp: foe.hp,
    shield: 0,
    cd: 0,
    ultCd: 7,
    alive: true,
    revived: false,
    mirrored: false,
    stunned: 0,
    boss: Boolean(foe.boss),
  };
}

function living(units, side) {
  return units.filter((u) => u.side === side && u.alive);
}

function pickTarget(units, side, rng, preferBack = false) {
  const foes = living(units, side);
  if (!foes.length) return null;
  if (preferBack && foes.length > 1) return foes[foes.length - 1];
  return foes[Math.floor(rng() * foes.length)];
}

function deal(attacker, target, raw, equipped) {
  let amount = Math.max(1, raw - target.def * 0.35);
  const hpRatio = target.hp / target.maxHp;
  if (hpRatio < 0.3 && hasArtifact(equipped, "qixing") && target.side === "a") {
    amount *= 0.65;
  }
  if (target.shield > 0) {
    const absorb = Math.min(target.shield, amount);
    target.shield -= absorb;
    amount -= absorb;
  }
  target.hp -= amount;
  if (target.hp <= 0) {
    if (target.side === "a" && hasArtifact(equipped, "wanhun") && !target.revived) {
      target.revived = true;
      target.hp = target.maxHp * 0.33;
      target.alive = true;
      return { dmg: amount, killed: false, revived: true };
    }
    target.hp = 0;
    target.alive = false;
    return { dmg: amount, killed: true, revived: false };
  }
  if (hpRatio < 0.1 && hasArtifact(equipped, "yinyang") && target.side === "a" && !target.mirrored) {
    target.mirrored = true;
    target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.22);
  }
  if (hasArtifact(equipped, "zhenyue") && target.boss && target.hp / target.maxHp < 0.12) {
    target.hp = 0;
    target.alive = false;
    return { dmg: amount, killed: true, execute: true };
  }
  return { dmg: amount, killed: false };
}

export function simulate(input) {
  const { seed, heroIds, foes, state, equipped = [], maxTicks = 240 } = input;
  const rng = mulberry32(seed >>> 0);
  const passives = collectPassives(equipped);
  const units = [
    ...heroIds.map((id) => unitFromHero(id, state, "a")),
    ...foes.map((f) => unitFromFoe(f, "b")),
  ];

  if (hasArtifact(equipped, "yaoguang")) {
    for (const u of living(units, "a")) u.shield += u.maxHp * 0.18;
  }
  for (const u of living(units, "a")) {
    if (u.id === "mc-divine") {
      for (const a of living(units, "a")) a.atk *= 1.1;
    }
    if (u.id === "zhenwu") u.shield += u.maxHp * 0.2;
  }

  const frames = [];
  let tick = 0;
  let winner = null;

  while (tick < maxTicks && !winner) {
    tick += 1;
    const log = [];
    const tSec = tick * 0.25;

    if (hasArtifact(equipped, "canyang") && tSec >= 6) {
      for (const f of living(units, "b")) {
        const src = living(units, "a")[0];
        if (src) {
          const r = deal(src, f, src.atk * 0.04, equipped);
          log.push({ t: "burn", target: f.id, dmg: r.dmg });
        }
      }
    }

    for (const u of units) {
      if (!u.alive) continue;
      if (u.stunned > 0) {
        u.stunned -= 0.25;
        continue;
      }
      u.cd -= 0.25;
      if (u.cd > 0) continue;
      const haste = u.side === "a" ? 1 + passives.ultHaste : 1;
      u.cd = (u.role === "dps" ? 1.05 : 1.25) / (u.id === "wukong" && tSec < 6 ? 1.4 : 1);

      const enemySide = u.side === "a" ? "b" : "a";
      const back = u.id === "houyi";
      const target = pickTarget(units, enemySide, rng, back);
      if (!target) continue;

      let skill = u.cd % 1 === 0 && tick % Math.round(u.ultCd / haste) === 0;
      // simpler: every 5th attack is skill
      skill = Math.floor(tick / 5) !== Math.floor((tick - 1) / 5) && u.role !== "tank";

      let mul = 1;
      if (u.side === "a") mul *= passives.basicMul;
      if (u.id === "mc-demon") mul *= 1 + (1 - u.hp / u.maxHp) * 0.28;
      mul *= factionAdvantage(u.faction, target.faction);

      const crit = rng() < (u.side === "a" ? passives.crit + (u.id === "nvwa" ? 0.12 : 0) : 0.06);
      if (crit) mul *= u.id === "nvwa" ? 1.9 : 1.5;
      if (u.id === "yangjian" && crit) {
        deal(u, target, u.atk * 0.4 * mul, equipped);
        log.push({ t: "chase", src: u.id, target: target.id });
      }

      if (skill) {
        if (u.side === "a") mul *= passives.skillMul;
        if (hasArtifact(equipped, "zhuque") && u.side === "a") mul *= 1.22;
        if (u.id === "tongtian" || u.id === "shen") {
          for (const f of living(units, enemySide).slice(0, u.id === "shen" ? 3 : 99)) {
            deal(u, f, u.atk * 0.7 * mul, equipped);
          }
          log.push({ t: "aoe", src: u.id });
        } else if (u.id === "cihang") {
          for (const a of living(units, u.side)) a.hp = Math.min(a.maxHp, a.hp + u.atk * 0.55);
          log.push({ t: "heal", src: u.id });
        } else if (u.id === "jiangziya") {
          for (const f of living(units, enemySide)) f.def *= 0.82;
          log.push({ t: "shred", src: u.id });
        } else {
          const r = deal(u, target, u.atk * 1.55 * mul, equipped);
          log.push({ t: "skill", src: u.id, target: target.id, dmg: r.dmg });
        }
        if (hasArtifact(equipped, "qinglong") && u.side === "a" && rng() < 0.3) {
          target.stunned = 1.2;
        }
      } else {
        if (hasArtifact(equipped, "zhumo") && u.side === "a") {
          mul *= rng() < 0.25 ? 2.2 : 0.7;
        }
        const r = deal(u, target, u.atk * mul, equipped);
        log.push({ t: "hit", src: u.id, target: target.id, dmg: r.dmg, crit });
        if (target.alive && u.id !== "nezha") {
          /* retaliate handled on tank */
        }
      }

      if (u.id === "mc-mortal") {
        const lowest = living(units, "a").sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (lowest) lowest.hp = Math.min(lowest.maxHp, lowest.hp + u.atk * 0.08);
      }
    }

    // 哪吒反击：若本帧有人打了哪吒
    for (const ev of log) {
      if (ev.target === "nezha" && ev.t === "hit") {
        const nezha = units.find((u) => u.id === "nezha" && u.alive);
        const src = units.find((u) => u.id === ev.src && u.alive);
        if (nezha && src) deal(nezha, src, nezha.atk * 0.5, equipped);
      }
    }

    if (!living(units, "b").length) winner = "a";
    if (!living(units, "a").length) winner = "b";
    frames.push({
      tick,
      winner,
      log,
      units: units.map((u) => ({
        id: u.id,
        name: u.name,
        side: u.side,
        hp: u.hp,
        maxHp: u.maxHp,
        shield: u.shield,
        alive: u.alive,
        boss: u.boss,
      })),
    });
  }

  if (!winner) winner = living(units, "a").length >= living(units, "b").length ? "a" : "b";
  return { winner, ticks: tick, frames, seed };
}
