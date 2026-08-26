import { createGame } from "../src/core/game.js";
import { leakCompensation } from "../src/data/waves.js";
import { createInvariantTracker } from "./invariants.mjs";
import {
  createMatchTelemetry,
  summarizeMatchMetrics,
} from "./metrics.mjs";

const g = createGame({ seed: 99 });
const tracker = createInvariantTracker();
const telemetry = createMatchTelemetry(g);
const failedChecks = [];

function check(condition, message) {
  if (!condition) failedChecks.push(message);
  return condition;
}

function observe(label) {
  tracker.observe(g.state, label);
}

function unit(id, glyph) {
  return { kind: "unit", id, glyph, level: 1 };
}

g.start();
observe("start");

const player = g.state.sides.player;
const recruitMantouBefore = player.mantou;
const recruitResult = g.recruit("player");
const recruitPassed = check(
  !!recruitResult?.card &&
    player.hand.length === 1 &&
    player.mantou === recruitMantouBefore - recruitResult.cost,
  "recruit did not add exactly one card and charge its cost",
);
observe("recruit");

player.hand.length = 0;
player.hand.push(unit("dao", "刀"));
const placePassed = check(
  g.place("player", 0, 5) && player.cells[5].unit?.id === "dao",
  "place did not move a unit card into an unlocked cell",
);
observe("place");

player.hand.push(unit("dao", "刀"));
const mergeSetupPassed = check(
  g.place("player", 0, 6) && player.cells[6].unit?.id === "dao",
  "merge setup could not place the matching unit",
);
const mergePassed = check(
  g.merge("player", 6, 5) &&
    player.cells[6].unit === null &&
    player.cells[5].unit?.level === 2,
  "merge did not consume the source and level the target",
);
observe("merge");

player.hand.push({ kind: "glyph", glyph: "赵", level: 1 });
const firstGlyphPlaced = g.place("player", 0, 7);
player.hand.push({ kind: "glyph", glyph: "云", level: 1 });
const secondGlyphPlaced = g.place("player", 0, 8);
const awakenPassed = check(
  firstGlyphPlaced &&
    secondGlyphPlaced &&
    player.cells[7].unit?.kind === "hero" &&
    player.cells[7].unit?.id === "zhaoyun" &&
    player.cells[8].unit === null,
  "adjacent 赵 + 云 glyphs did not awaken Zhao Yun",
);
observe("awaken");

player.hand.push({ kind: "shovel", glyph: "铲", level: 1 });
const shovelPassed = check(
  !player.cells[0].unlocked &&
    g.useShovel("player", 0, 0) &&
    player.cells[0].unlocked &&
    player.hand.length === 0,
  "shovel did not unlock and consume the selected locked cell",
);
observe("shovel");

player.spawnQueue.length = 0;
player.enemies.length = 0;
player.enemies.push({
  id: "probe-leak",
  t: 0.999,
  hp: 1_000_000,
  maxHp: 1_000_000,
  speed: 100,
  reward: 0,
  boss: false,
  skill: null,
  stun: 0,
  shield: 0,
  glyph: "兵",
});
const heartsBeforeLeak = player.hearts;
const mantouBeforeLeak = player.mantou;
g.tick(0.05);
const leakEvents = g.state.log.filter(
  (entry) => entry.type === "leak" && entry.payload.side === "player",
);
const leakPassed = check(
  player.hearts === heartsBeforeLeak - 1 &&
    player.mantou === mantouBeforeLeak + leakCompensation(player.wave) &&
    leakEvents.length === 1,
  "leak did not remove one heart, compensate mantou, and emit one event",
);
observe("leak");

g.state.sides.ai.hearts = 0;
g.tick(0.05);
const gameOverPassed = check(
  g.state.phase === "over" && g.state.winner === "player",
  "zero-heart opponent did not settle as a player win",
);
observe("game-over");

const observedTelemetry = telemetry.report();
telemetry.dispose();
const metrics = summarizeMatchMetrics([
  {
    settled: g.state.phase === "over",
    winner: g.state.winner,
    durationSeconds: g.state.time,
    maxWave: g.state.wave,
    telemetry: observedTelemetry,
  },
]);
const telemetryPassed = check(
  metrics.leaksByWave[0]?.wave === 1 &&
    metrics.leaksByWave[0]?.player === 1 &&
    metrics.leaksByWave[0]?.ai === 0 &&
    metrics.avgAwakenedHeroes === 1,
  "telemetry did not attribute the leak and awakening to the player",
);
const summaryPassed = check(
  metrics.matches === 1 &&
    metrics.settledRate === 1 &&
    metrics.winRate === 1 &&
    metrics.durationDistributionSeconds.samples === 1,
  "match summary did not report the deterministic settled win",
);
const invariants = tracker.report();
const report = {
  seed: g.state.seed,
  paths: {
    recruit: {
      passed: recruitPassed,
      cardKind: recruitResult?.card?.kind ?? null,
      cost: recruitResult?.cost ?? null,
    },
    place: { passed: placePassed, cell: 5 },
    merge: {
      passed: mergeSetupPassed && mergePassed,
      from: 6,
      to: 5,
      level: player.cells[5].unit?.level ?? null,
    },
    awaken: {
      passed: awakenPassed,
      hero: player.cells[7].unit?.id ?? null,
    },
    shovel: { passed: shovelPassed, cell: 0 },
    leak: {
      passed: leakPassed,
      heartsBefore: heartsBeforeLeak,
      heartsAfter: player.hearts,
      compensation: player.mantou - mantouBeforeLeak,
    },
    gameOver: {
      passed: gameOverPassed,
      winner: g.state.winner,
    },
    telemetry: {
      passed: telemetryPassed && summaryPassed,
    },
  },
  metrics,
  invariants,
  failedChecks,
  passed: failedChecks.length === 0 && invariants.passed,
};
console.log(JSON.stringify(report, null, 2));
if (!report.passed) {
  process.exitCode = 1;
}
