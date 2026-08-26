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
/** 出兵间隔下限：0 或负数会让 acc 越减越大，这一批兵永远追不完。 */
const MIN_SPAWN_INTERVAL = 0.05;

/**
 * ── 读档兜底 ────────────────────────────────────────────────
 * game.js 的 load() 只保证 enemies / spawnQueue / cells 是数组，里面装什么全凭
 * 快照：手改的 localStorage、旧版本存档、被截断的回放都会原样进到战斗层。
 * 而 tick 跑在 requestAnimationFrame 里，一个 null 元素或一处 NaN 就能让每帧
 * 都抛异常，表现为整局静止。所以下面的遍历一律「跳过坏数据」而不是相信它。
 */
function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function listOf(side, key) {
  return Array.isArray(side?.[key]) ? side[key] : null;
}

/** 只认表里自有的兵种键：坏档写个 "toString" 也摸不到原型链上的东西。 */
function unitRow(id) {
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(UNIT_TABLE, id)
    ? UNIT_TABLE[id]
    : null;
}

/** 攻击间隔：rate 缺失或非正时退回 1 秒，避免 1/0 = Infinity 把单位永久锁死。 */
function cooldownFor(rate) {
  const r = num(rate, 0);
  return r > 0 ? 1 / r : 1;
}

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
  const list = listOf(side, "enemies") || [];
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
  const list = listOf(side, "enemies");
  // 先挡上限再取号：被拒的这一只不该白吃一个编号，否则回放里会出现空号。
  if (!list || list.length >= MAX_ENEMIES) return null;
  if (!spec || typeof spec !== "object") return null;
  // 只有波次表真给了 boss 才走 boss 分支：缺这块的排队项退化成普通兵，
  // 而不是让 spec.boss.hp 直接抛出来。
  const boss = isBoss && spec.boss && typeof spec.boss === "object" ? spec.boss : null;
  const opts = extra && typeof extra === "object" ? extra : {};
  const hp = Math.max(1, Math.round(num(boss ? boss.hp : spec.hp, 1) * num(opts.hpMul, 1)));
  const enemy = {
    id: nextEnemyId(side),
    t: 0,
    hp,
    maxHp: hp,
    speed: num(boss ? boss.speed : spec.speed, 0) * num(opts.speedMul, 1),
    reward: num(spec.reward, 0) + (boss ? 6 : 0),
    boss: !!boss,
    skill: boss ? (boss.skill ?? null) : null,
    stun: 0,
    slowT: 0,
    slowMul: 1,
    shield: boss && boss.skill === "shield" ? Math.floor(hp * 0.25) : 0,
    pressure: !!opts.pressure,
    glyph: boss ? "将" : opts.glyph || "兵",
  };
  list.push(enemy);
  return enemy;
}

export function enqueueWave(side, wave) {
  const queue = listOf(side, "spawnQueue");
  if (!queue) return;
  const spec = waveSpec(num(wave, 1));
  side.wave = spec.wave;
  queue.push({
    remain: Math.max(0, Math.floor(num(spec.count, 0))),
    acc: 0,
    spec,
    bossLeft: spec.boss ? 1 : 0,
  });
}

export function tickSideCombat(side, dt, emit) {
  if (!side || !Number.isFinite(dt) || dt <= 0) return;
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
  const queue = listOf(side, "spawnQueue");
  if (!queue || !queue.length) return;
  const q = queue[0];
  // 残缺的排队项直接丢掉：留着它既出不了兵，又会让 maybeAdvanceWave 一直认为
  // 这条线还忙着，整局停在同一波。
  if (!q || typeof q !== "object" || !q.spec || typeof q.spec !== "object") {
    queue.shift();
    return;
  }
  const interval = Math.max(MIN_SPAWN_INTERVAL, num(q.spec.interval, MIN_SPAWN_INTERVAL));
  q.acc = num(q.acc, 0) + dt;
  q.remain = Math.max(0, Math.floor(num(q.remain, 0)));
  let guard = 0;
  // acc 用减法而非清零，间隔不会被 dt 抖动吞掉。
  while (q.remain > 0 && q.acc >= interval && guard < SPAWN_CATCHUP) {
    q.acc -= interval;
    q.remain -= 1;
    guard += 1;
    spawnEnemy(side, q.spec, false, q.extra);
  }
  if (q.remain <= 0 && num(q.bossLeft, 0) > 0 && q.acc >= BOSS_DELAY) {
    q.bossLeft = 0;
    spawnEnemy(side, q.spec, true);
  }
  if (q.remain <= 0 && !(num(q.bossLeft, 0) > 0)) queue.shift();
}

function advanceEnemies(side, dt) {
  const list = listOf(side, "enemies");
  if (!list) return;
  for (const e of list) {
    if (!e || !(e.hp > 0)) continue;
    if (!Number.isFinite(e.t)) e.t = 0;
    let spd = num(e.speed, 0);
    if (e.skill === "haste") spd *= 1.25;
    if (e.slowT > 0) {
      spd *= num(e.slowMul, 1);
      e.slowT = Math.max(0, e.slowT - dt);
      if (e.slowT === 0) e.slowMul = 1;
    }
    if (e.stun > 0) {
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
  const cells = listOf(side, "cells");
  if (!cells) return;
  const marks = [];
  for (const e of listOf(side, "enemies") || []) {
    if (!e || !(e.hp > 0)) continue;
    const p = lanePoint(e.t);
    marks.push({ e, x: p.x, y: p.y });
  }

  for (const cell of cells) {
    if (!cell || !cell.unlocked) continue;
    const u = cell.unit;
    if (!u || typeof u !== "object") continue;
    if (u.kind === "glyph" || u.kind === "shovel" || u.kind === "token") continue;

    const hero = u.kind === "hero" ? heroById(u.id) : null;
    if (u.kind === "hero" && !hero) continue;

    u.cd = Math.max(-CD_BANK, num(u.cd, 0) - dt * haste);
    // 大招冷却与是否有目标无关：以前没目标时冷却不走，出怪间隙会白白锁招。
    if (hero) u.cooldown = Math.max(-CD_BANK, num(u.cooldown, 0) - dt);
    if (!marks.length) continue;

    const range = hero ? num(hero.range, 2) : num(unitRow(u.id)?.range, 1);
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
        applyDamage(targets[0].e, num(hero.atk, 0) * rally * BALANCE.towerDamage * targets[0].factor);
        u.cd = cooldownFor(hero.rate);
      }
    } else {
      if (u.cd > 0) continue;
      const row = unitRow(u.id);
      if (!row) continue;
      const level = Math.max(1, Math.round(num(u.level, 1)));
      const dmg = num(unitAttack(u.id, level), 0) * rally * BALANCE.towerDamage;
      const pierce = Math.max(0, Math.floor(num(row.pierce, 0)));
      for (const tgt of targets.slice(0, 1 + pierce)) applyDamage(tgt.e, dmg * tgt.factor);
      u.cd = cooldownFor(row.rate);
    }
  }
}

function resolveEnemies(side, notify) {
  const list = listOf(side, "enemies");
  if (!list) return;
  let dead = null;
  let leaked = null;
  side.enemies = list.filter((e) => {
    if (!e || typeof e !== "object") return false;
    // 非有限血量也算阵亡：留在场上就是一只打不死、走不动、还挡着波次的钉子户。
    if (!(e.hp > 0)) {
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
      const reward = num(e.reward, 0);
      side.mantou = num(side.mantou, 0) + reward;
      side.kills = num(side.kills, 0) + 1;
      notify("kill", { side: side.id, reward, boss: e.boss, pressure: e.pressure, id: e.id });
      if (e.skill === "split") {
        const spec = waveSpec(num(side.wave, 1));
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
      side.hearts = Math.max(0, num(side.hearts, 0) - 1);
      side.leaks = num(side.leaks, 0) + 1;
      side.mantou = num(side.mantou, 0) + leakCompensation(num(side.wave, 1));
      notify("leak", { side: side.id, hearts: side.hearts, boss: e.boss });
    }
  }
}

/** 这条线还有多少「未了结」的东西：场上敌人 + 没出完的排队项。 */
function pendingOf(side) {
  return (listOf(side, "enemies")?.length || 0) + (listOf(side, "spawnQueue")?.length || 0);
}

export function maybeAdvanceWave(state, emit) {
  if (!state || state.phase !== "playing") return;
  linkArena(state);
  const notify = typeof emit === "function" ? emit : () => {};
  const player = state.sides?.player;
  const ai = state.sides?.ai;
  if (!player || !ai) return;
  if (pendingOf(player) + pendingOf(ai) > 0) return;
  const wave = num(state.wave, 0);
  if (wave >= MAX_WAVE) {
    finishByHearts(state, notify);
    return;
  }
  state.wave = wave + 1;
  enqueueWave(player, state.wave);
  enqueueWave(ai, state.wave);
  notify("wave", { wave: state.wave });
}

/**
 * 胜负顺序：先看心（0 心即败），同为 0 心才进入平局裁定。
 * 双方同帧破防时不再无条件判给玩家，而是按 斩获 → 漏怪更少 → 存粮 依次比较。
 *
 * 每项都先过 num()：坏档里的 NaN 会让 `!==` 恒成立，于是「两边都没数据」
 * 也会被判成某一方胜出。
 */
function decide(state) {
  const p = state.sides?.player || {};
  const a = state.sides?.ai || {};
  const ph = num(p.hearts, 0);
  const ah = num(a.hearts, 0);
  if (ph !== ah) return { winner: ph > ah ? "player" : "ai", tie: false };
  const pk = num(p.kills, 0);
  const ak = num(a.kills, 0);
  if (pk !== ak) return { winner: pk > ak ? "player" : "ai", tie: false };
  const pl = num(p.leaks, 0);
  const al = num(a.leaks, 0);
  if (pl !== al) return { winner: pl < al ? "player" : "ai", tie: false };
  const pm = num(p.mantou, 0);
  const am = num(a.mantou, 0);
  if (pm !== am) return { winner: pm > am ? "player" : "ai", tie: false };
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
  const player = state.sides?.player;
  const ai = state.sides?.ai;
  if (!player || !ai) return;
  if (num(player.hearts, 0) > 0 && num(ai.hearts, 0) > 0) return;
  gameOver(state, typeof emit === "function" ? emit : () => {}, "hearts");
}

function finishByHearts(state, notify) {
  if (state.phase !== "playing") return;
  gameOver(state, notify, "survived");
}

export { MAX_WAVE };
export { sendPressure, linkArena, opponentOf, notePressureKill } from "./pressure.js";
export { configurePressure, pressureConfig, resetPressure } from "./pressure.js";
