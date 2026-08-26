import { createGame } from "../src/core/game.js";
import { stepAi } from "../src/ai/opponent.js";
import { canMerge } from "../src/board/merge.js";
import { cellDistToPath, neighbors } from "../src/board/grid.js";
import { findHeroByGlyphs } from "../src/data/heroes.js";
import { HAND_LIMIT, recruitCost, UNIT_TABLE } from "../src/data/units.js";
import { collectInvariantViolations } from "./invariants.mjs";

const MATCHES = 36;
const MAX_TICKS = 12_000;
const DT = 0.05;
const MAX_MATCH_MS = 2_000;

function preferredCell(side, card) {
  const empty = side.cells.filter((cell) => cell.unlocked && !cell.unit);
  if (card.kind === "unit" && UNIT_TABLE[card.id]?.role === "ranged") {
    empty.sort((a, b) => cellDistToPath(b.index) - cellDistToPath(a.index));
  } else {
    empty.sort((a, b) => cellDistToPath(a.index) - cellDistToPath(b.index));
  }
  return empty[0] ?? null;
}

function stepPlayer(api, dt) {
  const side = api.state.sides.player;
  side._benchAcc = (side._benchAcc || 0) + dt;
  if (side._benchAcc < 0.28) return;
  side._benchAcc = 0;

  for (let index = 0; index < side.cells.length; index += 1) {
    const source = side.cells[index].unit;
    if (!source) continue;
    const target = neighbors(index).find((next) =>
      canMerge(source, side.cells[next].unit),
    );
    if (target != null) {
      api.merge("player", index, target);
      return;
    }
  }

  for (let handIndex = 0; handIndex < side.hand.length; handIndex += 1) {
    const card = side.hand[handIndex];
    if (card.kind === "shovel") {
      const locked = side.cells.find((cell) => !cell.unlocked);
      if (locked) {
        api.useShovel("player", handIndex, locked.index);
        return;
      }
      continue;
    }
    if (card.kind === "token") {
      const target = side.cells.find(
        (cell) => cell.unit?.kind === "unit" && cell.unit.level < 5,
      );
      if (target) {
        api.place("player", handIndex, target.index);
        return;
      }
    }
    if (card.kind === "unit") {
      const target = side.cells.find((cell) => canMerge(cell.unit, card));
      if (target) {
        api.place("player", handIndex, target.index);
        return;
      }
    }
    if (card.kind === "glyph") {
      const partner = side.cells.find(
        (cell) =>
          cell.unit?.kind === "glyph" &&
          findHeroByGlyphs(card.glyph, cell.unit.glyph),
      );
      const targetIndex =
        partner &&
        neighbors(partner.index).find(
          (index) => side.cells[index].unlocked && !side.cells[index].unit,
        );
      if (targetIndex != null) {
        api.place("player", handIndex, targetIndex);
        return;
      }
    }
    const target = preferredCell(side, card);
    if (target && card.kind !== "shovel") {
      api.place("player", handIndex, target.index);
      return;
    }
  }

  const cost = recruitCost(side.recruitCount);
  if (side.hand.length < HAND_LIMIT && side.mantou >= cost) {
    api.recruit("player");
  }
}

function percentile95(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

const results = [];
const invariantViolations = [];
const benchStartedAt = performance.now();
for (let index = 0; index < MATCHES; index += 1) {
  const seed = 1000 + index * 17;
  const g = createGame({ seed });
  g.start();
  const matchStartedAt = performance.now();
  let ticks = 0;
  while (ticks < MAX_TICKS && g.state.phase === "playing") {
    g.tick(DT);
    stepAi(g, DT);
    stepPlayer(g, DT);
    ticks += 1;

    if (ticks % 100 === 0) {
      for (const violation of collectInvariantViolations(g.state)) {
        invariantViolations.push({ seed, tick: ticks, ...violation });
      }
    }
  }
  for (const violation of collectInvariantViolations(g.state)) {
    invariantViolations.push({ seed, tick: ticks, ...violation });
  }
  results.push({
    seed,
    settled: g.state.phase === "over",
    winner: g.state.winner,
    durationSeconds: g.state.time,
    ticks,
    simTimeMs: performance.now() - matchStartedAt,
  });
}

const settled = results.filter((result) => result.settled);
const playerWins = settled.filter((result) => result.winner === "player").length;
const simTimes = results.map((result) => result.simTimeMs);
const totalDuration = results.reduce(
  (sum, result) => sum + result.durationSeconds,
  0,
);
const totalTicks = results.reduce((sum, result) => sum + result.ticks, 0);
const totalSimTimeMs = performance.now() - benchStartedAt;
const settledRate = settled.length / MATCHES;
const maxSimTimeMs = Math.max(...simTimes);
const passed =
  settledRate >= 0.8 &&
  maxSimTimeMs <= MAX_MATCH_MS &&
  invariantViolations.length === 0;
const report = {
  matches: MATCHES,
  settled: settled.length,
  settledRate: Number(settledRate.toFixed(4)),
  playerWins,
  winRate: Number(
    (settled.length === 0 ? 0 : playerWins / settled.length).toFixed(4),
  ),
  avgDurationSeconds: Number((totalDuration / MATCHES).toFixed(2)),
  avgTicks: Number((totalTicks / MATCHES).toFixed(2)),
  totalSimTimeMs: Number(totalSimTimeMs.toFixed(2)),
  avgSimTimeMs: Number((totalSimTimeMs / MATCHES).toFixed(2)),
  p95SimTimeMs: Number(percentile95(simTimes).toFixed(2)),
  maxSimTimeMs: Number(maxSimTimeMs.toFixed(2)),
  thresholds: {
    minSettledRate: 0.8,
    maxMatchSimTimeMs: MAX_MATCH_MS,
  },
  invariantViolations: invariantViolations.slice(0, 20),
  passed,
};
console.log(JSON.stringify(report, null, 2));
if (!passed) {
  process.exitCode = 1;
}
