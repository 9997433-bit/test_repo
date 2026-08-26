import * as waveTable from "../data/waves.js";
import { createTuning, tableFrom } from "./tuning.js";

const { waveSpec } = waveTable;

/**
 * 「对攻压力」：一侧斩杀积累到阈值，就往对岸塞一个弱化的援兵，
 * 把两条各打各的塔防线连成互相施压的对局。
 *
 * ── 不改 game.js 的挂钩方式 ────────────────────────────────
 * tickSideCombat(side, dt, emit) 只拿得到单侧，够不着对手；
 * 但 game.js 每帧还会调用 checkWinner(state) 与 maybeAdvanceWave(state)，
 * 两者都拿得到整个 state。于是 sim.js 在这两个入口调用 linkArena(state)，
 * 把 player ↔ ai 记进模块内的 WeakMap；此后 tickSideCombat 就能用
 * opponentOf(side) 找到对手。WeakMap 不持有强引用，重开一局旧 side 会被 GC，
 * 不会积累（这也是不用 side.opponent 字段的原因：那会让 serialize() 循环引用）。
 *
 * 第一帧结算时链接尚未建立，因此首帧击杀不产生压力 —— 可忽略。
 * Round 2 若要手动施压（例如道具、剧情事件），直接调 sendPressure(side, otherSide)。
 */

const DEFAULTS = {
  enabled: true,
  killsPerPressure: 5, // 普通兵每斩 5 个送一波
  bossCharge: 3, // 斩将折算 3 个
  perWaveCap: 2, // 每波每侧最多接收 2 波压力，防止滚雪球
  count: 1,
  hpMul: 0.55,
  speedMul: 1.1,
  rewardMul: 0.5,
  interval: 0.5, // 一批压力兵之间的出兵间隔（秒）
  glyph: "援",
};

/**
 * 波次表若导出 `PRESSURE`（或 `PRESSURE_TUNING`），这里整表覆盖默认值。
 * 现在 data/waves.js 没有这个导出，于是照常用上面的默认值 —— 加导出即可调参，
 * 不必再改战斗层。
 */
const TUNING = createTuning({
  defaults: DEFAULTS,
  table: tableFrom(waveTable, ["PRESSURE", "PRESSURE_TUNING"]),
  coerce: {
    killsPerPressure: (v) => Math.max(1, v),
    bossCharge: (v) => Math.max(0, v),
    count: (v) => Math.max(1, Math.round(v)),
    hpMul: (v) => Math.max(0.01, v),
    speedMul: (v) => Math.max(0.01, v),
    rewardMul: (v) => Math.max(0, v),
    interval: (v) => Math.max(0.05, v),
  },
});

const CONFIG = TUNING.live;

export function pressureConfig() {
  return TUNING.read();
}

export function configurePressure(patch = {}) {
  return TUNING.patch(patch);
}

/** 回到「默认值 + data 表覆盖」的状态，丢弃运行时改动。 */
export function resetPressure() {
  return TUNING.reset();
}

const opponents = new WeakMap();

/** 把一局的两侧互相登记；幂等，每帧调用开销可忽略。 */
export function linkArena(state) {
  const p = state?.sides?.player;
  const a = state?.sides?.ai;
  if (!p || !a || p === a) return false;
  if (opponents.get(p) === a && opponents.get(a) === p) return true;
  opponents.set(p, a);
  opponents.set(a, p);
  return true;
}

/** 手动登记（测试或未来的多人模式用）。 */
export function linkSides(a, b) {
  if (!a || !b || a === b) return false;
  opponents.set(a, b);
  opponents.set(b, a);
  return true;
}

export function opponentOf(side) {
  return (side && opponents.get(side)) || null;
}

/** 弱化版本的当前波配置：血少、跑快、赏钱低、没有 boss。 */
export function pressureSpec(wave, opts = {}) {
  const base = waveSpec(Math.max(1, wave || 1));
  const hpMul = opts.hpMul ?? CONFIG.hpMul;
  return {
    ...base,
    hp: Math.max(8, Math.round(base.hp * hpMul)),
    speed: base.speed,
    reward: Math.max(1, Math.floor(base.reward * (opts.rewardMul ?? CONFIG.rewardMul))),
    boss: null,
    interval: opts.interval ?? CONFIG.interval,
  };
}

function ledgerOf(side) {
  if (!side.pressure) side.pressure = { wave: 0, received: 0, sent: 0 };
  return side.pressure;
}

/**
 * 给 otherSide 排入一批弱化援兵。
 * @param {object} side      得手的一方（记账用，可为 null）
 * @param {object} otherSide 承压的一方；省略时用 opponentOf(side)
 * @returns {object|null} 施压描述，未触发时为 null
 */
export function sendPressure(side, otherSide, opts = {}) {
  const target = otherSide || opponentOf(side);
  if (!target || !Array.isArray(target.spawnQueue)) return null;
  if (!CONFIG.enabled && !opts.force) return null;

  const wave = Math.max(1, target.wave || side?.wave || 1);
  const ledger = ledgerOf(target);
  if (ledger.wave !== wave) {
    ledger.wave = wave;
    ledger.received = 0;
  }
  const cap = opts.cap ?? CONFIG.perWaveCap;
  if (cap >= 0 && ledger.received >= cap && !opts.force) return null;

  const count = Math.max(1, Math.round(opts.count ?? CONFIG.count));
  const spec = pressureSpec(wave, opts);
  target.spawnQueue.push({
    remain: count,
    acc: spec.interval, // 立刻放出第一个，压力要及时
    spec,
    bossLeft: 0,
    pressure: true,
    extra: {
      pressure: true,
      glyph: opts.glyph ?? CONFIG.glyph,
      speedMul: opts.speedMul ?? CONFIG.speedMul,
    },
  });
  ledger.received += count;
  if (side) ledgerOf(side).sent = (ledgerOf(side).sent || 0) + count;
  return { from: side?.id ?? null, to: target.id, count, wave, hp: spec.hp };
}

/**
 * 击杀回调：攒够斩获就自动施压。
 * 压力兵自身的死亡不再计入，避免两侧无限对送。
 */
export function notePressureKill(side, enemy) {
  if (!CONFIG.enabled || !side || !enemy || enemy.pressure) return null;
  const target = opponentOf(side);
  if (!target) return null;
  side.pressureCharge = (side.pressureCharge || 0) + (enemy.boss ? CONFIG.bossCharge : 1);
  if (side.pressureCharge < CONFIG.killsPerPressure) return null;
  side.pressureCharge -= CONFIG.killsPerPressure;
  return sendPressure(side, target);
}
