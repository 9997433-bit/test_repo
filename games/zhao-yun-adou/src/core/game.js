import { createRng } from "./rng.js";
import { createBus } from "./events.js";
import { createCells } from "../board/grid.js";
import { canMerge, mergeUnits, applyShenbing } from "../board/merge.js";
import { scanAwaken, applyAwaken } from "../board/awaken.js";
import { HAND_LIMIT, START_HEARTS, START_MANTOU, recruitCost } from "../data/units.js";
import { rollRecruit } from "../data/recruit.js";
import { enqueueWave, tickSideCombat, maybeAdvanceWave, checkWinner } from "../combat/sim.js";

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

export function createGame(opts = {}) {
  const rng = createRng(opts.seed ?? 20260623);
  const bus = createBus();
  const state = {
    phase: "menu",
    winner: null,
    time: 0,
    wave: 1,
    seed: rng.seed,
    rng,
    sides: { player: createSide("player"), ai: createSide("ai") },
    log: [],
  };

  const emit = (type, payload) => {
    bus.emit(type, payload);
    state.log.push({ t: state.time, type, payload });
    if (state.log.length > 200) state.log.shift();
  };

  function start() {
    state.phase = "playing";
    state.winner = null;
    state.time = 0;
    state.wave = 1;
    state.sides = { player: createSide("player"), ai: createSide("ai") };
    enqueueWave(state.sides.player, 1);
    enqueueWave(state.sides.ai, 1);
    emit("start", { seed: state.seed });
  }

  function recruit(sideId = "player") {
    const side = state.sides[sideId];
    if (state.phase !== "playing") return null;
    if (side.hand.length >= HAND_LIMIT) return { error: "hand-full" };
    const cost = recruitCost(side.recruitCount);
    if (side.mantou < cost) return { error: "no-mantou" };
    side.mantou -= cost;
    side.recruitCount += 1;
    const card = rollRecruit(state.rng);
    side.hand.push(card);
    emit("recruit", { side: sideId, card, cost });
    return { card, cost };
  }

  function place(sideId, handIndex, cellIndex) {
    const side = state.sides[sideId];
    const card = side.hand[handIndex];
    const cell = side.cells[cellIndex];
    if (!card || !cell || !cell.unlocked) return false;
    if (card.kind === "shovel") return false;
    if (card.kind === "token") {
      if (!cell.unit) return false;
      cell.unit = applyShenbing(cell.unit);
      side.hand.splice(handIndex, 1);
      emit("token", { side: sideId, cellIndex });
      tryAwaken(sideId);
      return true;
    }
    if (cell.unit) {
      if (canMerge(cell.unit, card)) {
        cell.unit = mergeUnits(cell.unit, card);
        side.hand.splice(handIndex, 1);
        emit("merge", { side: sideId, cellIndex, level: cell.unit.level });
        tryAwaken(sideId);
        return true;
      }
      return false;
    }
    cell.unit = { ...card, cd: 0, cooldown: 0 };
    side.hand.splice(handIndex, 1);
    emit("place", { side: sideId, cellIndex, unit: cell.unit });
    tryAwaken(sideId);
    return true;
  }

  function merge(sideId, fromIndex, toIndex) {
    const side = state.sides[sideId];
    const a = side.cells[fromIndex];
    const b = side.cells[toIndex];
    if (!a?.unit || !b?.unit) return false;
    if (canMerge(a.unit, b.unit)) {
      b.unit = mergeUnits(a.unit, b.unit);
      a.unit = null;
      emit("merge", { side: sideId, cellIndex: toIndex, level: b.unit.level });
      return true;
    }
    if (a.unit.kind === "token") {
      b.unit = applyShenbing(b.unit);
      a.unit = null;
      return true;
    }
    const tmp = a.unit;
    a.unit = b.unit;
    b.unit = tmp;
    tryAwaken(sideId);
    return true;
  }

  function useShovel(sideId, handIndex, cellIndex) {
    const side = state.sides[sideId];
    const card = side.hand[handIndex];
    const cell = side.cells[cellIndex];
    if (!card || card.kind !== "shovel" || !cell || cell.unlocked) return false;
    cell.unlocked = true;
    side.hand.splice(handIndex, 1);
    emit("expand", { side: sideId, cellIndex });
    return true;
  }

  function tryAwaken(sideId) {
    const side = state.sides[sideId];
    const plan = scanAwaken(side.cells);
    if (!plan.length) return [];
    const heroes = applyAwaken(side.cells, plan);
    emit("hero-awaken", { side: sideId, names: heroes.map((h) => h.name) });
    return heroes;
  }

  function tick(dt) {
    if (state.phase !== "playing") return;
    state.time += dt;
    tickSideCombat(state.sides.player, dt, emit);
    tickSideCombat(state.sides.ai, dt, emit);
    checkWinner(state, emit);
    if (state.phase === "playing") maybeAdvanceWave(state, emit);
  }

  return {
    state,
    bus,
    start,
    recruit,
    place,
    merge,
    useShovel,
    tryAwaken,
    tick,
    serialize() {
      return JSON.parse(JSON.stringify({ ...state, rng: undefined, bus: undefined }));
    },
  };
}
