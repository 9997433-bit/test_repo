import { HEROES, RARITY_MULT } from "../data/heroes.js";
import { mulberry32 } from "../core/rng.js";

function stats(unit) {
  if (unit.heroKey) {
    const def = HEROES[unit.heroKey];
    const m = RARITY_MULT[def.rarity] * (1 + (unit.star - 1) * 0.18);
    return {
      id: unit.id,
      name: def.name,
      side: "ally",
      lane: def.lane,
      hp: def.base.hp * m,
      maxHp: def.base.hp * m,
      atk: def.base.atk * m,
      def: def.base.def * m,
      spd: def.base.spd,
      skill: def.skill,
      star: unit.star,
      taunt: false,
    };
  }
  return {
    id: unit.id || `${unit.key}-${unit.name}`,
    name: unit.name,
    side: "enemy",
    lane: unit.lane,
    hp: unit.hp,
    maxHp: unit.hp,
    atk: unit.atk,
    def: unit.def,
    spd: unit.spd,
    skill: unit.skill || null,
    star: 1,
    taunt: false,
  };
}

function living(list, side) {
  return list.filter((u) => u.side === side && u.hp > 0);
}

function targetOf(rng, actor, all) {
  const foes = living(all, actor.side === "ally" ? "enemy" : "ally");
  if (!foes.length) return null;
  const taunt = foes.filter((f) => f.taunt);
  const pool = taunt.length ? taunt : foes;
  const front = pool.filter((f) => f.lane === "front");
  const use = front.length ? front : pool;
  return use[Math.floor(rng() * use.length)];
}

function dmg(atk, def) {
  return Math.max(4, atk - def * 0.45);
}

export function simulateBattle(seed, allies, enemies) {
  const rng = mulberry32(seed >>> 0);
  const all = [
    ...allies.map((a) => stats(a)),
    ...enemies.map((e) => {
      const u = stats(e);
      u.id = `${e.key}-${e.name}-${Math.floor(rng() * 1e6)}`;
      return u;
    }),
  ];
  const log = [];
  let t = 0;
  const order = () => all.filter((u) => u.hp > 0).sort((a, b) => b.spd - a.spd || a.name.localeCompare(b.name));

  for (const u of all) {
    if (u.skill?.kind === "taunt" && u.star >= u.skill.star) {
      u.taunt = true;
      log.push(`${u.name}开启${u.skill.name}`);
    }
  }

  while (t < 24 && living(all, "ally").length && living(all, "enemy").length) {
    t += 1;
    for (const actor of order()) {
      if (actor.hp <= 0) continue;
      const tgt = targetOf(rng, actor, all);
      if (!tgt) break;
      let dealt = dmg(actor.atk, tgt.def);
      if (actor.skill?.kind === "burst" && t % 4 === 0) dealt *= actor.skill.value;
      if (actor.skill?.kind === "multishot") dealt *= 1.15;
      if (actor.skill?.kind === "hook" && t === 1 && tgt.lane === "back") {
        tgt.lane = "front";
        log.push(`${actor.name}钩出${tgt.name}`);
      }
      tgt.hp -= dealt;
      log.push(`${actor.name}→${tgt.name} ${dealt.toFixed(1)}`);
      if (actor.skill?.kind === "heal" && t % 3 === 0) {
        const mates = living(all, actor.side).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        if (mates[0]) {
          mates[0].hp = Math.min(mates[0].maxHp, mates[0].hp + actor.skill.value * actor.star);
          log.push(`${actor.name}治疗${mates[0].name}`);
        }
      }
      if (actor.skill?.kind === "aoe" && t % 5 === 0) {
        for (const f of living(all, actor.side === "ally" ? "enemy" : "ally")) {
          f.hp -= dealt * actor.skill.value;
        }
        log.push(`${actor.name}释放${actor.skill.name}`);
      }
    }
  }

  const winner = living(all, "ally").length ? (living(all, "enemy").length ? "draw" : "ally") : "enemy";
  return {
    seed,
    winner,
    log,
    duration: t,
    leftover: all.map((u) => ({ id: u.id, name: u.name, side: u.side, hp: Math.max(0, u.hp) })),
  };
}
