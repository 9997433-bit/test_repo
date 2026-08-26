import { UNIT_TABLE, unitAttack } from "../data/units.js";
import { heroById } from "../data/heroes.js";
import { cellDistToPath } from "../board/grid.js";
import { waveSpec, leakCompensation, MAX_WAVE } from "../data/waves.js";
import { castSkill } from "./skills.js";

let enemySeq = 1;

export function spawnEnemy(side, spec, isBoss, extra = {}) {
  const hp = isBoss ? spec.boss.hp : spec.hp;
  side.enemies.push({
    id: enemySeq++,
    t: 0,
    hp,
    maxHp: hp,
    speed: (isBoss ? spec.boss.speed : spec.speed) * (extra.speedMul || 1),
    reward: spec.reward + (isBoss ? 6 : 0),
    boss: !!isBoss,
    skill: isBoss ? spec.boss.skill : null,
    stun: 0,
    shield: isBoss && spec.boss.skill === "shield" ? Math.floor(hp * 0.25) : 0,
    glyph: isBoss ? "将" : extra.glyph || "兵",
  });
}

export function enqueueWave(side, wave) {
  const spec = waveSpec(wave);
  side.spawnQueue.push({ remain: spec.count, acc: 0, spec, bossLeft: spec.boss ? 1 : 0 });
}

export function tickSideCombat(side, dt, emit) {
  const haste = side.haste > 0 ? 1.2 : 1;
  if (side.haste > 0) side.haste -= dt;

  if (side.spawnQueue.length) {
    const q = side.spawnQueue[0];
    q.acc += dt;
    if (q.remain > 0 && q.acc >= q.spec.interval) {
      q.acc = 0;
      q.remain -= 1;
      spawnEnemy(side, q.spec, false);
    }
    if (q.remain <= 0 && q.bossLeft > 0 && q.acc >= 0.6) {
      q.bossLeft = 0;
      spawnEnemy(side, q.spec, true);
    }
    if (q.remain <= 0 && q.bossLeft <= 0) side.spawnQueue.shift();
  }

  for (const e of side.enemies) {
    if (e.stun > 0) {
      e.stun -= dt;
      continue;
    }
    let spd = e.speed;
    if (e.skill === "haste") spd *= 1.25;
    e.t += (spd * dt) / 520;
  }

  for (const cell of side.cells) {
    const u = cell.unit;
    if (!u || !cell.unlocked) continue;
    if (u.kind === "glyph" || u.kind === "shovel" || u.kind === "token") continue;
    u.cd = (u.cd || 0) - dt * haste;
    const rangeOk = (enemy) => {
      const edge = cellDistToPath(cell.index);
      const reach = u.kind === "hero" ? heroById(u.id)?.range || 2 : UNIT_TABLE[u.id]?.range || 1;
      return edge <= reach + 0.15;
    };
    const targets = side.enemies.filter((e) => e.hp > 0 && rangeOk(e));
    if (!targets.length) continue;
    targets.sort((a, b) => b.t - a.t);
    if (u.kind === "hero") {
      const hero = heroById(u.id);
      if (!hero) continue;
      if ((u.cooldown || 0) <= 0) {
        const r = castSkill(side, u, side.enemies.filter((e) => e.hp > 0));
        emit("skill", { side: side.id, hero: hero.name, skill: r.name });
      } else {
        u.cooldown -= dt;
      }
      if (u.cd <= 0) {
        const tgt = targets[0];
        harm(tgt, hero.atk);
        u.cd = 1 / hero.rate;
      }
    } else {
      if (u.cd > 0) continue;
      const dmg = unitAttack(u.id, u.level);
      const pierce = UNIT_TABLE[u.id]?.pierce || 0;
      const hit = targets.slice(0, 1 + pierce);
      for (const tgt of hit) harm(tgt, dmg);
      u.cd = 1 / UNIT_TABLE[u.id].rate;
    }
  }

  const dead = [];
  const leaked = [];
  side.enemies = side.enemies.filter((e) => {
    if (e.hp <= 0) {
      dead.push(e);
      return false;
    }
    if (e.t >= 1) {
      leaked.push(e);
      return false;
    }
    return true;
  });

  for (const e of dead) {
    side.mantou += e.reward;
    side.kills += 1;
    emit("kill", { side: side.id, reward: e.reward, boss: e.boss });
    if (e.skill === "split") {
      spawnEnemy(side, waveSpec(side.wave || 1), false, { speedMul: 1.15, glyph: "卒" });
      spawnEnemy(side, waveSpec(side.wave || 1), false, { speedMul: 1.15, glyph: "卒" });
    }
  }
  for (const e of leaked) {
    side.hearts -= 1;
    const wave = side.wave || 1;
    side.mantou += leakCompensation(wave);
    emit("leak", { side: side.id, hearts: side.hearts });
  }
}

function harm(e, dmg) {
  if (e.shield > 0) {
    const use = Math.min(e.shield, dmg);
    e.shield -= use;
    dmg -= use;
  }
  e.hp -= dmg;
}

export function maybeAdvanceWave(state, emit) {
  const busy =
    state.sides.player.enemies.length +
    state.sides.ai.enemies.length +
    state.sides.player.spawnQueue.length +
    state.sides.ai.spawnQueue.length;
  if (busy > 0) return;
  if (state.wave >= MAX_WAVE) {
    finishByHearts(state, emit);
    return;
  }
  state.wave += 1;
  state.sides.player.wave = state.wave;
  state.sides.ai.wave = state.wave;
  enqueueWave(state.sides.player, state.wave);
  enqueueWave(state.sides.ai, state.wave);
  emit("wave", { wave: state.wave });
}

export function checkWinner(state, emit) {
  if (state.phase !== "playing") return;
  const p = state.sides.player.hearts;
  const a = state.sides.ai.hearts;
  if (p <= 0 && a <= 0) {
    state.phase = "over";
    state.winner = state.sides.player.kills >= state.sides.ai.kills ? "player" : "ai";
    emit("game-over", { winner: state.winner });
  } else if (p <= 0) {
    state.phase = "over";
    state.winner = "ai";
    emit("game-over", { winner: "ai" });
  } else if (a <= 0) {
    state.phase = "over";
    state.winner = "player";
    emit("game-over", { winner: "player" });
  }
}

function finishByHearts(state, emit) {
  if (state.phase !== "playing") return;
  state.phase = "over";
  const p = state.sides.player;
  const a = state.sides.ai;
  if (p.hearts !== a.hearts) state.winner = p.hearts > a.hearts ? "player" : "ai";
  else state.winner = p.kills >= a.kills ? "player" : "ai";
  emit("game-over", { winner: state.winner });
}

export { MAX_WAVE };
