#!/usr/bin/env node
/**
 * Focused headless regression and performance checks for combat VFX.
 */
import { createRequire } from "module";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const root = dirname(fileURLToPath(import.meta.url));
globalThis.SimCore = require(join(root, "../js/sim-core.js"));
require(join(root, "../js/data.js"));
require(join(root, "../js/game.js"));

const S = globalThis.SimCore;
const D = globalThis.GameData;
const Game = globalThis.Game;

let passed = 0;
let failed = 0;

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function equal(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message + " (expected " + expected + ", got " + actual + ")");
  }
}

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("  ok  " + name);
  } catch (error) {
    failed += 1;
    console.error("  FAIL  " + name);
    console.error("        " + error.message);
  }
}

function newGame(seed, difficulty, heroId) {
  return new Game({
    difficulty: difficulty || "normal",
    heroId: heroId || "paladin",
    headless: true,
    seed: seed,
  });
}

function spawnTestCreep(game) {
  const creep = game._spawnCreep(game.waves[0]);
  creep.x = 144;
  creep.y = 144;
  creep.px = creep.x;
  creep.py = creep.y;
  return creep;
}

function towerSource() {
  return {
    kind: "tower",
    canHitFlying: true,
    slow: 0,
    poison: 0,
    root: 0,
    def: { color: "#4fc3f7" },
  };
}

function placeMany(game, count) {
  const ids = D.TOWERS.map(function (tower) { return tower.id; });
  let placed = 0;
  for (let ty = 0; ty < game.mapH && placed < count; ty++) {
    for (let tx = 0; tx < game.mapW && placed < count; tx++) {
      game.gold = 99999;
      const x = tx * game.tile + game.tile / 2;
      const y = ty * game.tile + game.tile / 2;
      if (game.tryBuild(ids[placed % ids.length], x, y)) placed += 1;
    }
  }
  return placed;
}

function floodCreeps(game, count) {
  const wave = game.waves[6];
  for (let i = 0; i < count; i++) {
    const creep = game._spawnCreep(wave);
    creep.dist = (i * 14) % 400;
    const point = S.pointOnPolyline(game.path, creep.dist);
    creep.x = point.x;
    creep.y = point.y;
    creep.px = point.x;
    creep.py = point.y;
  }
}

function firstNonFinite(game) {
  const groups = [
    ["game", [game]],
    ["creeps", game.creeps],
    ["towers", game.towers],
    ["projectiles", game.projectiles],
    ["fx", game.fx],
  ];
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const label = groups[groupIndex][0];
    const values = groups[groupIndex][1];
    for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
      const value = values[valueIndex];
      const keys = Object.keys(value);
      for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
        const key = keys[keyIndex];
        if (typeof value[key] === "number" && !Number.isFinite(value[key])) {
          return label + "[" + valueIndex + "]." + key;
        }
      }
    }
  }
  return null;
}

function runBenchmark() {
  const game = newGame(737, "hard", "demonhunter");
  const initialTowers = placeMany(game, 40);
  floodCreeps(game, 80);
  const initialCreeps = game.creeps.length;
  game.betweenWaves = false;
  game.waveSpawned = 80;

  const ticks = 60 * 30;
  let ticksRun = 0;
  let nonFinite = firstNonFinite(game);
  const startedAt = performance.now();
  for (let tick = 0; tick < ticks && !nonFinite; tick++) {
    game.update(1 / 60);
    ticksRun += 1;
    nonFinite = firstNonFinite(game);
  }
  const wallMs = performance.now() - startedAt;

  return {
    initialTowers: initialTowers,
    initialCreeps: initialCreeps,
    ticks: ticks,
    ticksRun: ticksRun,
    wallMs: wallMs,
    msPerTick: wallMs / Math.max(ticksRun, 1),
    nonFinite: nonFinite,
    snapshot: game.snapshot(),
  };
}

console.log("Azeroth Keep TD — Zhigan headless checks");

console.log("\n[combat feedback]");
test("_hitCreep remains available to headless tests", function () {
  equal(typeof Game.prototype._hitCreep, "function", "Game._hitCreep is unavailable");
});

test("a simulated hit sets creep _hitFlash", function () {
  const game = newGame(731);
  const creep = spawnTestCreep(game);
  game.settings.dmgNumbers = false;
  game._hitCreep(creep, 1, "chaos", towerSource());
  equal(creep._hitFlash, 0.16, "hit flash duration was not set");
});

test("a simulated hit pushes a spark effect", function () {
  const game = newGame(732);
  const creep = spawnTestCreep(game);
  game.settings.dmgNumbers = false;
  game.fx = [];
  game._hitCreep(creep, 1, "chaos", towerSource());
  check(game.fx.some(function (effect) {
    return effect.kind === "spark";
  }), "hit did not append a spark effect");
});

test("a lethal simulated hit still grants the creep bounty", function () {
  const game = newGame(733);
  const creep = spawnTestCreep(game);
  const goldBefore = game.gold;
  const earnedBefore = game.goldEarned;
  game.settings.dmgNumbers = false;
  game._hitCreep(creep, creep.maxHp * 2, "chaos", towerSource());
  equal(game.gold, goldBefore + creep.bounty, "kill did not add bounty to gold");
  equal(game.goldEarned, earnedBefore + creep.bounty, "kill did not record earned bounty");
});

test("a lethal simulated hit pushes spark and ring effects", function () {
  const game = newGame(734);
  const creep = spawnTestCreep(game);
  game.settings.dmgNumbers = false;
  game.fx = [];
  game._hitCreep(creep, creep.maxHp * 2, "chaos", towerSource());
  check(game.fx.some(function (effect) {
    return effect.kind === "spark";
  }), "lethal hit did not append a spark effect");
  check(game.fx.some(function (effect) {
    return effect.kind === "ring";
  }), "kill did not append a ring effect");
});

console.log("\n[30-second benchmark]");
let benchmark = null;
test("benchmark starts with exactly 40 towers and 80 creeps", function () {
  benchmark = runBenchmark();
  equal(benchmark.initialTowers, 40, "benchmark tower count");
  equal(benchmark.initialCreeps, 80, "benchmark creep count");
});

test("benchmark completes 1,800 ticks without non-finite state", function () {
  check(benchmark !== null, "benchmark setup did not complete");
  equal(benchmark.ticksRun, benchmark.ticks, "benchmark stopped before 30 simulated seconds");
  equal(benchmark.nonFinite, null, "non-finite value at " + benchmark.nonFinite);
});

test("benchmark remains below 4 ms/tick", function () {
  check(benchmark !== null, "benchmark setup did not complete");
  check(
    benchmark.msPerTick < 4,
    "benchmark took " + benchmark.msPerTick.toFixed(4) + " ms/tick"
  );
});

if (benchmark) {
  console.log("\n" + JSON.stringify({
    towers: benchmark.initialTowers,
    creeps: benchmark.initialCreeps,
    ticks: benchmark.ticksRun,
    wallMs: Number(benchmark.wallMs.toFixed(2)),
    msPerTick: Number(benchmark.msPerTick.toFixed(4)),
    nonFinite: benchmark.nonFinite,
    final: benchmark.snapshot,
  }, null, 2));
}

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed) process.exit(1);
