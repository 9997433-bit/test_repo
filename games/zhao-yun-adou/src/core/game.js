import { createRng } from "./rng.js";
import { createBus } from "./events.js";
import { clampDt, createStepper, MAX_FRAME_DT } from "./engine.js";
import { createCells } from "../board/grid.js";
import { canMerge, mergeUnits, applyShenbing } from "../board/merge.js";
import { scanAwaken, applyAwaken } from "../board/awaken.js";
import { HAND_LIMIT, START_HEARTS, START_MANTOU, recruitCost } from "../data/units.js";
import { rollRecruit } from "../data/recruit.js";
import { enqueueWave, tickSideCombat, maybeAdvanceWave, checkWinner } from "../combat/sim.js";

export const SIDE_IDS = ["player", "ai"];
const LOG_LIMIT = 200;
const DEFAULT_SEED = 20260623;
/**
 * AI/引擎的内部字段：默认快照不带（契约形状锁在 tests/state.test.js），
 * 只有 `serialize({ replay: true })` 这种「精确续跑档」才写出来。
 * 注意 `enemySeq` 不在此列 —— 那是战斗层的存档字段，两种档都要带走。
 */
const INTERNAL_SIDE_KEYS = ["_acc"];

function createSide(id) {
  return {
    id,
    mantou: START_MANTOU,
    hearts: START_HEARTS,
    recruitCount: 0,
    cells: createCells(),
    hand: [],
    enemies: [],
    spawnQueue: [],
    kills: 0,
    haste: 0,
    wave: 1,
  };
}

function withoutInternals(side) {
  const copy = { ...side };
  for (const key of INTERNAL_SIDE_KEYS) delete copy[key];
  return copy;
}

function deepClone(value) {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      /* 含不可克隆字段时回落到 JSON */
    }
  }
  return JSON.parse(JSON.stringify(value));
}

/** 单元格引用允许传 index 数字，也允许传 cell 对象（契约里的 CellRef）。 */
function refToIndex(ref) {
  if (typeof ref === "number") return Number.isInteger(ref) ? ref : -1;
  if (typeof ref === "string" && ref.trim() !== "") {
    const n = Number(ref);
    return Number.isInteger(n) ? n : -1;
  }
  if (ref && typeof ref === "object" && Number.isInteger(ref.index)) return ref.index;
  return -1;
}

export function createGame(opts = {}) {
  const seed = Number.isFinite(opts.seed) ? opts.seed >>> 0 : DEFAULT_SEED;
  const rng = createRng(seed);
  const bus = createBus();
  const maxDt = Number.isFinite(opts.maxDt) && opts.maxDt > 0 ? opts.maxDt : MAX_FRAME_DT;
  // 默认按帧推进（dt 已 clamp）；传 fixedStep 则切到固定步长，回放/联机更稳。
  const stepper =
    Number.isFinite(opts.fixedStep) && opts.fixedStep > 0
      ? createStepper({ step: opts.fixedStep, maxDt })
      : null;

  const state = {
    phase: "menu",
    winner: null,
    time: 0,
    wave: 1,
    seed: rng.seed,
    rng,
    sides: { player: createSide("player"), ai: createSide("ai") },
    log: [],
    // 结算标记由 combat 层写入；在这里先声明，读档才有稳定的位置回填。
    tie: false,
    reason: null,
  };

  const emit = (type, payload) => {
    state.log.push({ t: state.time, type, payload });
    if (state.log.length > LOG_LIMIT) state.log.shift();
    bus.emit(type, payload);
  };

  /** 只认显式且已存在的阵营 id，原型链上的键（__proto__ 等）一律拒绝。 */
  function getSide(sideId) {
    if (typeof sideId !== "string") return null;
    if (!Object.prototype.hasOwnProperty.call(state.sides, sideId)) return null;
    const side = state.sides[sideId];
    if (!side || typeof side !== "object") return null;
    return Array.isArray(side.cells) && Array.isArray(side.hand) ? side : null;
  }

  function cellOf(side, ref) {
    const index = refToIndex(ref);
    if (index < 0 || index >= side.cells.length) return null;
    return side.cells[index] || null;
  }

  function handCardOf(side, handIndex) {
    if (!Number.isInteger(handIndex) || handIndex < 0 || handIndex >= side.hand.length) return null;
    return side.hand[handIndex] || null;
  }

  function isLive() {
    return state.phase === "playing";
  }

  function start(startOpts = {}) {
    if (Number.isFinite(startOpts.seed)) state.seed = startOpts.seed >>> 0;
    // 同种子重开必须复现同一局：回到序列起点。
    rng.reseed(state.seed);
    stepper?.reset();
    state.phase = "playing";
    state.winner = null;
    state.tie = false;
    state.reason = null;
    state.time = 0;
    state.wave = 1;
    state.sides = { player: createSide("player"), ai: createSide("ai") };
    state.log = [];
    enqueueWave(state.sides.player, 1);
    enqueueWave(state.sides.ai, 1);
    emit("start", { seed: state.seed });
    return true;
  }

  /** 重开一局（可换种子）。 */
  function restart(restartOpts = {}) {
    return start(restartOpts);
  }

  /** 回到标题页，不保留残局。 */
  function reset() {
    stepper?.reset();
    state.phase = "menu";
    state.winner = null;
    state.tie = false;
    state.reason = null;
    state.time = 0;
    state.wave = 1;
    state.sides = { player: createSide("player"), ai: createSide("ai") };
    state.log = [];
    rng.reseed(state.seed);
    emit("reset", { seed: state.seed });
    return true;
  }

  function pause() {
    if (state.phase !== "playing") return false;
    state.phase = "paused";
    stepper?.reset();
    emit("pause", {});
    return true;
  }

  function resume() {
    if (state.phase !== "paused") return false;
    state.phase = "playing";
    stepper?.reset();
    emit("resume", {});
    return true;
  }

  function setPaused(flag) {
    return flag ? pause() : resume();
  }

  function togglePause() {
    if (state.phase === "paused") {
      resume();
      return false;
    }
    pause();
    return state.phase === "paused";
  }

  function recruit(sideId = "player") {
    const side = getSide(sideId);
    if (!side) return null;
    if (!isLive()) return null;
    if (side.hand.length >= HAND_LIMIT) return { error: "hand-full" };
    const cost = recruitCost(side.recruitCount);
    if (side.mantou < cost) return { error: "no-mantou" };
    side.mantou -= cost;
    side.recruitCount += 1;
    const card = rollRecruit(state.rng);
    if (!card) {
      side.mantou += cost;
      side.recruitCount -= 1;
      return { error: "roll-failed" };
    }
    side.hand.push(card);
    emit("recruit", { side: side.id, card, cost });
    return { card, cost };
  }

  function place(sideId, handIndex, cellRef) {
    const side = getSide(sideId);
    if (!side || !isLive()) return false;
    const card = handCardOf(side, handIndex);
    const cell = cellOf(side, cellRef);
    if (!card || !cell || !cell.unlocked) return false;
    if (card.kind === "shovel") return false;

    if (card.kind === "token") {
      if (!cell.unit) return false;
      const upgraded = applyShenbing(cell.unit);
      if (upgraded === cell.unit) return false;
      cell.unit = upgraded;
      side.hand.splice(handIndex, 1);
      emit("token", { side: side.id, cellIndex: cell.index, level: cell.unit.level });
      tryAwaken(side.id);
      return true;
    }

    if (cell.unit) {
      if (!canMerge(cell.unit, card)) return false;
      const merged = mergeUnits(cell.unit, card);
      if (!merged) return false;
      cell.unit = { ...merged, cd: cell.unit.cd || 0, cooldown: cell.unit.cooldown || 0 };
      side.hand.splice(handIndex, 1);
      emit("merge", { side: side.id, cellIndex: cell.index, level: cell.unit.level });
      tryAwaken(side.id);
      return true;
    }

    cell.unit = { ...card, cd: 0, cooldown: 0 };
    side.hand.splice(handIndex, 1);
    emit("place", { side: side.id, cellIndex: cell.index, unit: cell.unit });
    tryAwaken(side.id);
    return true;
  }

  /** 棋盘到棋盘：合并 / 神兵符 / 移动到空位 / 交换。 */
  function merge(sideId, fromRef, toRef) {
    const side = getSide(sideId);
    if (!side || !isLive()) return false;
    const a = cellOf(side, fromRef);
    const b = cellOf(side, toRef);
    if (!a || !b || a.index === b.index) return false;
    if (!a.unlocked || !b.unlocked) return false;
    if (!a.unit) return false;

    if (!b.unit) {
      b.unit = a.unit;
      a.unit = null;
      emit("move", { side: side.id, from: a.index, to: b.index });
      tryAwaken(side.id);
      return true;
    }

    if (canMerge(a.unit, b.unit)) {
      const merged = mergeUnits(a.unit, b.unit);
      if (!merged) return false;
      b.unit = { ...merged, cd: b.unit.cd || 0, cooldown: b.unit.cooldown || 0 };
      a.unit = null;
      emit("merge", { side: side.id, cellIndex: b.index, level: b.unit.level });
      tryAwaken(side.id);
      return true;
    }

    if (a.unit.kind === "token" || b.unit.kind === "token") {
      const tokenCell = a.unit.kind === "token" ? a : b;
      const targetCell = tokenCell === a ? b : a;
      const upgraded = applyShenbing(targetCell.unit);
      if (upgraded === targetCell.unit) return false;
      b.unit = upgraded;
      a.unit = null;
      emit("token", { side: side.id, cellIndex: b.index, level: b.unit.level });
      tryAwaken(side.id);
      return true;
    }

    const tmp = a.unit;
    a.unit = b.unit;
    b.unit = tmp;
    emit("swap", { side: side.id, from: a.index, to: b.index });
    tryAwaken(side.id);
    return true;
  }

  function useShovel(sideId, handIndex, cellRef) {
    const side = getSide(sideId);
    if (!side || !isLive()) return false;
    const card = handCardOf(side, handIndex);
    const cell = cellOf(side, cellRef);
    if (!card || card.kind !== "shovel") return false;
    if (!cell || cell.unlocked) return false;
    cell.unlocked = true;
    side.hand.splice(handIndex, 1);
    emit("expand", { side: side.id, cellIndex: cell.index });
    return true;
  }

  function tryAwaken(sideId) {
    const side = getSide(sideId);
    if (!side) return [];
    const plan = scanAwaken(side.cells);
    if (!plan.length) return [];
    const heroes = applyAwaken(side.cells, plan);
    emit("hero-awaken", { side: side.id, names: heroes.map((h) => h.name) });
    return heroes;
  }

  /** 推进一步；返回 false 表示胜负已分，本帧无需继续推进。 */
  function step(dt) {
    state.time += dt;
    tickSideCombat(state.sides.player, dt, emit);
    tickSideCombat(state.sides.ai, dt, emit);
    checkWinner(state, emit);
    if (state.phase !== "playing") return false;
    maybeAdvanceWave(state, emit);
    return state.phase === "playing";
  }

  function tick(dt) {
    if (!isLive()) {
      stepper?.reset();
      return 0;
    }
    if (stepper) return stepper.advance(dt, step);
    const d = clampDt(dt, maxDt);
    if (d <= 0) return 0;
    step(d);
    return 1;
  }

  /**
   * 默认快照与契约一致：纯数据、JSON 安全、不含引擎内部字段。
   * `{ replay: true }`（沿用旧名 `{ rng: true }`）额外带上 rng 游标、结算标记、
   * AI 节流器与固定步长余量 —— 这份档才能逐帧续跑出同一局。
   */
  function serialize(serializeOpts = {}) {
    const replay = serializeOpts.rng === true || serializeOpts.replay === true;
    const sides = {};
    for (const id of SIDE_IDS) {
      sides[id] = replay ? state.sides[id] : withoutInternals(state.sides[id]);
    }
    const snapshot = {
      phase: state.phase,
      winner: state.winner,
      time: state.time,
      wave: state.wave,
      seed: state.seed,
      sides,
      log: state.log,
    };
    if (replay) {
      snapshot.rngState = rng.getState();
      snapshot.tie = state.tie === true;
      snapshot.reason = state.reason ?? null;
      if (stepper) snapshot.stepPending = stepper.pending;
    }
    return deepClone(snapshot);
  }

  /**
   * 读档。默认照旧记一条 `load` 事件（UI 靠它刷新，契约测试也锁了这条）。
   * 回放/对拍要的是「读完档再存档，与原档逐字节一致」，用这两个开关：
   *   - `{ log: false }`  仍派发总线事件，但不写 state.log；
   *   - `{ silent: true }` 总线与 log 都不动。
   */
  function load(snapshot, loadOpts = {}) {
    if (!snapshot || typeof snapshot !== "object") return false;
    const data = deepClone(snapshot);
    const sides = {};
    for (const id of SIDE_IDS) {
      const raw = data.sides?.[id];
      const fresh = createSide(id);
      if (!raw || typeof raw !== "object") {
        sides[id] = fresh;
        continue;
      }
      sides[id] = {
        ...fresh,
        ...raw,
        id,
        cells:
          Array.isArray(raw.cells) && raw.cells.length === fresh.cells.length
            ? raw.cells
            : fresh.cells,
        hand: Array.isArray(raw.hand) ? raw.hand.slice(0, HAND_LIMIT) : [],
        enemies: Array.isArray(raw.enemies) ? raw.enemies : [],
        spawnQueue: Array.isArray(raw.spawnQueue) ? raw.spawnQueue : [],
      };
    }
    state.phase = typeof data.phase === "string" ? data.phase : "menu";
    state.winner = data.winner ?? null;
    state.tie = data.tie === true;
    state.reason = typeof data.reason === "string" ? data.reason : null;
    state.time = Number.isFinite(data.time) ? data.time : 0;
    state.wave = Number.isFinite(data.wave) ? data.wave : 1;
    state.seed = Number.isFinite(data.seed) ? data.seed >>> 0 : state.seed;
    state.sides = sides;
    state.log = Array.isArray(data.log) ? data.log.slice(-LOG_LIMIT) : [];
    rng.reseed(state.seed);
    if (Number.isFinite(data.rngState)) rng.setState(data.rngState);
    stepper?.reset();
    if (stepper && Number.isFinite(data.stepPending)) stepper.setPending(data.stepPending);
    const payload = { seed: state.seed, phase: state.phase };
    if (loadOpts.silent === true) return true;
    if (loadOpts.log === false) bus.emit("load", payload);
    else emit("load", payload);
    return true;
  }

  return {
    state,
    bus,
    start,
    restart,
    reset,
    pause,
    resume,
    setPaused,
    togglePause,
    recruit,
    place,
    merge,
    useShovel,
    tryAwaken,
    tick,
    serialize,
    load,
    get paused() {
      return state.phase === "paused";
    },
    recruitCost(sideId = "player") {
      const side = getSide(sideId);
      return recruitCost(side ? side.recruitCount : 0);
    },
  };
}
