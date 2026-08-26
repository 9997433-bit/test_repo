import { UNIT_TABLE, unitAttack } from "../data/units.js";
import { heroById } from "../data/heroes.js";
import * as waveTable from "../data/waves.js";
import { castSkill } from "./skills.js";
import { applyDamage } from "./damage.js";
import { cellCenter, falloffFor, lanePoint } from "./geometry.js";
import { linkArena, notePressureKill } from "./pressure.js";
import { createTuning, tableFrom } from "./tuning.js";

const { waveSpec, leakCompensation, MAX_WAVE } = waveTable;

/** 路线推进的时间常数：speed(点/秒) / PATH_SCALE = 每秒推进的进度。 */
const PATH_SCALE = 520;
/** 出怪追帧上限：单帧最多补几只，防止大 dt 卡成一坨。 */
const SPAWN_CATCHUP = 8;
const BOSS_DELAY = 0.6;
/** 单侧场上敌人硬上限，避免分裂/施压叠加时无限增长。 */
const MAX_ENEMIES = 120;
/** 冷却最多提前储备这么多秒，空闲不再攒出爆发。 */
const CD_BANK = 0.5;

/**
 * 覆盖补偿：射程改成「一格只守一段路」后，单位的有效输出时间约剩七成，
 * 不补的话整局会比旧版早三四波结束（实测 avgWave 9.1 → 5.8）。
 * 系数默认留在战斗层；波次表导出 `BALANCE` 时以表为准。
 */
const BALANCE_TUNING = createTuning({
  defaults: { towerDamage: 1.35 },
  table: tableFrom(waveTable, ["BALANCE", "COMBAT_BALANCE"]),
  coerce: { towerDamage: (v) => Math.max(0, v) },
});

const BALANCE = BALANCE_TUNING.live;

export function balanceConfig() {
  return BALANCE_TUNING.read();
}

export function configureBalance(patch = {}) {
  return BALANCE_TUNING.patch(patch);
}

/** 回到「默认值 + data 表覆盖」的状态，丢弃运行时改动。 */
export function resetBalance() {
  return BALANCE_TUNING.reset();
}

/**
 * 敌人编号计数器住在 side 上（`side.enemySeq` = 下一个要发的号）。
 *
 * 它以前是模块级变量：重开一局、或从快照续跑，编号都会接着上一局往下数，
 * 同一串输入跑两遍拿到的 id 不同，严格回放与快照比对全都对不上。放进 side 后
 * serialize() 顺手把它带走，load() 原样还回来，回放就稳定了。
 *
 * 编号只在本侧内唯一：两条战线各数各的，事件里一律带着 side 一起用
 * （kill / skill 事件都有 side 字段）。
 *
 * 字段是「首次出兵时才写」而不是建 side 时就写：core/game.js 的 createSide()
 * 不归战斗层改，而 tests/state.test.js 会对刚开局的 side 键序列做快照断言，
 * 提前写字段会把那份契约打破。缺字段时按下面的 resumeSeq() 推。
 */
const SEQ_FIELD = "enemySeq";

/** 兼容没有该字段的旧快照：从现存敌人的最大编号往后续，避免撞号。 */
function resumeSeq(side) {
  let max = 0;
  const list = Array.isArray(side?.enemies) ? side.enemies : [];
  for (const e of list) {
    if (Number.isInteger(e?.id) && e.id > max) max = e.id;
  }
  return max + 1;
}

/** 下一个会发出去的敌人编号（不消耗）。 */
export function enemySeqOf(side) {
  if (!side) return 1;
  const seq = side[SEQ_FIELD];
  return Number.isInteger(seq) && seq >= 1 ? seq : resumeSeq(side);
}

/** 把编号指针挪到 next（重开一局或测试用）。 */
export function resetEnemySeq(side, next = 1) {
  if (!side) return 1;
  const value = Number.isInteger(next) && next >= 1 ? next : 1;
  side[SEQ_FIELD] = value;
  return value;
}

function nextEnemyId(side) {
  const id = enemySeqOf(side);
  side[SEQ_FIELD] = id + 1;
  return id;
}

export function spawnEnemy(side, spec, isBoss, extra = {}) {
  // 先挡上限再取号：被拒的这一只不该白吃一个编号，否则回放里会出现空号。
  if (!side || side.enemies.length >= MAX_ENEMIES) return null;
  const baseHp = isBoss ? spec.boss.hp : spec.hp;
  const hp = Math.max(1, Math.round(baseHp * (extra.hpMul || 1)));
  const enemy = {
    id: nextEnemyId(side),
    t: 0,
    hp,
    maxHp: hp,
    speed: (isBoss ? spec.boss.speed : spec.speed) * (extra.speedMul || 1),
    reward: spec.reward + (isBoss ? 6 : 0),
    boss: !!isBoss,
    skill: isBoss ? spec.boss.skill : null,
    stun: 0,
    slowT: 0,
    slowMul: 1,
    shield: isBoss && spec.boss.skill === "shield" ? Math.floor(hp * 0.25) : 0,
    pressure: !!extra.pressure,
    glyph: isBoss ? "将" : extra.glyph || "兵",
  };
  side.enemies.push(enemy);
  return enemy;
}

export function enqueueWave(side, wave) {
  const spec = waveSpec(wave);
  side.wave = spec.wave;
  side.spawnQueue.push({ remain: spec.count, acc: 0, spec, bossLeft: spec.boss ? 1 : 0 });
}

export function tickSideCombat(side, dt, emit) {
  if (!side || !(dt > 0)) return;
  const notify = typeof emit === "function" ? emit : () => {};

  const haste = (side.haste || 0) > 0 ? 1.2 : 1;
  const rally = (side.rally || 0) > 0 ? 1.15 : 1;
  if (side.haste > 0) side.haste = Math.max(0, side.haste - dt);
  if (side.rally > 0) side.rally = Math.max(0, side.rally - dt);

  advanceSpawns(side, dt);
  advanceEnemies(side, dt);
  runBoard(side, dt, haste, rally, notify);
  resolveEnemies(side, notify);
}

function advanceSpawns(side, dt) {
  if (!side.spawnQueue.length) return;
  const q = side.spawnQueue[0];
  q.acc += dt;
  let guard = 0;
  // acc 用减法而非清零，间隔不会被 dt 抖动吞掉。
  while (q.remain > 0 && q.acc >= q.spec.interval && guard < SPAWN_CATCHUP) {
    q.acc -= q.spec.interval;
    q.remain -= 1;
    guard += 1;
    spawnEnemy(side, q.spec, false, q.extra);
  }
  if (q.remain <= 0 && q.bossLeft > 0 && q.acc >= BOSS_DELAY) {
    q.bossLeft = 0;
    spawnEnemy(side, q.spec, true);
  }
  if (q.remain <= 0 && q.bossLeft <= 0) side.spawnQueue.shift();
}

function advanceEnemies(side, dt) {
  for (const e of side.enemies) {
    if (e.hp <= 0) continue;
    let spd = e.speed;
    if (e.skill === "haste") spd *= 1.25;
    if ((e.slowT || 0) > 0) {
      spd *= e.slowMul ?? 1;
      e.slowT = Math.max(0, e.slowT - dt);
      if (e.slowT === 0) e.slowMul = 1;
    }
    if ((e.stun || 0) > 0) {
      e.stun = Math.max(0, e.stun - dt);
      continue;
    }
    e.t += (spd * dt) / PATH_SCALE;
  }
}

/**
 * 射程判定：格心 ↔ 敌人「当前路线坐标」的真实距离。
 * 旧实现只看格子到棋盘边缘的距离（cellDistToPath），既忽略敌人位置，
 * 也忽略路线走向 —— 任何单位都能打全场。现在一格只覆盖它够得着的那几段路，
 * 敌人跑出覆盖区就必须交给别的格子接手。
 */
function runBoard(side, dt, haste, rally, notify) {
  const marks = [];
  for (const e of side.enemies) {
    if (e.hp <= 0) continue;
    const p = lanePoint(e.t);
    marks.push({ e, x: p.x, y: p.y });
  }

  for (const cell of side.cells) {
    const u = cell.unit;
    if (!u || !cell.unlocked) continue;
    if (u.kind === "glyph" || u.kind === "shovel" || u.kind === "token") continue;

    const hero = u.kind === "hero" ? heroById(u.id) : null;
    if (u.kind === "hero" && !hero) continue;

    u.cd = Math.max(-CD_BANK, (u.cd || 0) - dt * haste);
    // 大招冷却与是否有目标无关：以前没目标时冷却不走，出怪间隙会白白锁招。
    if (hero) u.cooldown = Math.max(-CD_BANK, (u.cooldown || 0) - dt);
    if (!marks.length) continue;

    const range = hero ? (hero.range ?? 2) : (UNIT_TABLE[u.id]?.range ?? 1);
    const falloff = falloffFor(range);
    const c = cellCenter(cell.index);
    const targets = [];
    for (const m of marks) {
      if (m.e.hp <= 0) continue;
      const dx = c.x - m.x;
      const dy = c.y - m.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= falloff.outer2) continue;
      targets.push({ e: m.e, factor: falloff.factor(Math.sqrt(d2)) });
    }
    if (!targets.length) continue;
    // 先打罩在核心圈里的领头者：否则一个刚擦到外沿的敌人会把满伤的一发骗走。
    targets.sort((a, b) => (b.factor === 1) - (a.factor === 1) || b.e.t - a.e.t);

    if (hero) {
      if (u.cooldown <= 0) {
        const alive = marks.map((m) => m.e).filter((e) => e.hp > 0);
        const r = castSkill(side, u, alive, { cellIndex: cell.index, reach: falloff.reach });
        notify("skill", {
          side: side.id,
          hero: hero.name,
          skill: r.name,
          fx: r.fx,
          hits: r.hits,
          damage: r.damage,
          kills: r.kills,
          targets: r.targets,
          cooldown: r.cooldown,
          cellIndex: cell.index,
          juice: r.juice,
        });
      }
      if (u.cd <= 0) {
        applyDamage(targets[0].e, hero.atk * rally * BALANCE.towerDamage * targets[0].factor);
        u.cd = 1 / hero.rate;
      }
    } else {
      if (u.cd > 0) continue;
      const row = UNIT_TABLE[u.id];
      if (!row) continue;
      const dmg = unitAttack(u.id, u.level) * rally * BALANCE.towerDamage;
      const pierce = row.pierce || 0;
      for (const tgt of targets.slice(0, 1 + pierce)) applyDamage(tgt.e, dmg * tgt.factor);
      u.cd = 1 / row.rate;
    }
  }
}

function resolveEnemies(side, notify) {
  let dead = null;
  let leaked = null;
  side.enemies = side.enemies.filter((e) => {
    if (e.hp <= 0) {
      (dead ||= []).push(e);
      return false;
    }
    if (e.t >= 1) {
      (leaked ||= []).push(e);
      return false;
    }
    return true;
  });

  if (dead) {
    for (const e of dead) {
      side.mantou += e.reward;
      side.kills += 1;
      notify("kill", { side: side.id, reward: e.reward, boss: e.boss, pressure: e.pressure, id: e.id });
      if (e.skill === "split") {
        const spec = waveSpec(side.wave || 1);
        spawnEnemy(side, spec, false, { speedMul: 1.15, glyph: "卒" });
        spawnEnemy(side, spec, false, { speedMul: 1.15, glyph: "卒" });
      }
      const push = notePressureKill(side, e);
      if (push) notify("pressure", push);
    }
  }

  if (leaked) {
    for (const e of leaked) {
      // 心数夹在 0，胜负比较才有意义（以前会掉成负数，双方同时破防时比大小失真）。
      side.hearts = Math.max(0, side.hearts - 1);
      side.leaks = (side.leaks || 0) + 1;
      side.mantou += leakCompensation(side.wave || 1);
      notify("leak", { side: side.id, hearts: side.hearts, boss: e.boss });
    }
  }
}

export function maybeAdvanceWave(state, emit) {
  if (!state || state.phase !== "playing") return;
  linkArena(state);
  const notify = typeof emit === "function" ? emit : () => {};
  const busy =
    state.sides.player.enemies.length +
    state.sides.ai.enemies.length +
    state.sides.player.spawnQueue.length +
    state.sides.ai.spawnQueue.length;
  if (busy > 0) return;
  if (state.wave >= MAX_WAVE) {
    finishByHearts(state, notify);
    return;
  }
  state.wave += 1;
  enqueueWave(state.sides.player, state.wave);
  enqueueWave(state.sides.ai, state.wave);
  notify("wave", { wave: state.wave });
}

/**
 * 胜负顺序：先看心（0 心即败），同为 0 心才进入平局裁定。
 * 双方同帧破防时不再无条件判给玩家，而是按 斩获 → 漏怪更少 → 存粮 依次比较。
 */
function decide(state) {
  const p = state.sides.player;
  const a = state.sides.ai;
  if (p.hearts !== a.hearts) return { winner: p.hearts > a.hearts ? "player" : "ai", tie: false };
  if (p.kills !== a.kills) return { winner: p.kills > a.kills ? "player" : "ai", tie: false };
  const pl = p.leaks || 0;
  const al = a.leaks || 0;
  if (pl !== al) return { winner: pl < al ? "player" : "ai", tie: false };
  if (p.mantou !== a.mantou) return { winner: p.mantou > a.mantou ? "player" : "ai", tie: false };
  return { winner: "player", tie: true };
}

function gameOver(state, notify, reason) {
  const { winner, tie } = decide(state);
  state.phase = "over";
  state.winner = winner;
  state.tie = tie;
  state.reason = reason;
  notify("game-over", { winner, tie, reason });
}

export function checkWinner(state, emit) {
  if (!state) return;
  linkArena(state);
  if (state.phase !== "playing") return;
  // 重开一局时清掉上一局的结算标记，避免 UI 读到过期的 tie/reason。
  if (state.reason) {
    state.reason = null;
    state.tie = false;
  }
  const p = state.sides.player.hearts;
  const a = state.sides.ai.hearts;
  if (p > 0 && a > 0) return;
  gameOver(state, typeof emit === "function" ? emit : () => {}, "hearts");
}

function finishByHearts(state, notify) {
  if (state.phase !== "playing") return;
  gameOver(state, notify, "survived");
}

export { MAX_WAVE };
export { sendPressure, linkArena, opponentOf, notePressureKill } from "./pressure.js";
export { configurePressure, pressureConfig, resetPressure } from "./pressure.js";
