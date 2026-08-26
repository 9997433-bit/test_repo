#!/usr/bin/env node
/**
 * No-dependency gameplay edge checks for Frontier Keep TD.
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const root = dirname(fileURLToPath(import.meta.url));
globalThis.SimCore = require(join(root, "../js/sim-core.js"));
require(join(root, "../js/data.js"));
require(join(root, "../js/game.js"));

const S = globalThis.SimCore;
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

function near(actual, expected, message) {
  if (Math.abs(actual - expected) > 1e-9) {
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

function newGame(seed) {
  return new Game({
    difficulty: "normal",
    heroId: "paladin",
    headless: true,
    seed: seed,
  });
}

function buildOnOpenTile(game, towerId) {
  for (let ty = 0; ty < game.mapH; ty++) {
    for (let tx = 0; tx < game.mapW; tx++) {
      const x = tx * game.tile + game.tile / 2;
      const y = ty * game.tile + game.tile / 2;
      if (!game.canBuildAt(x, y)) continue;
      const tower = game.tryBuild(towerId, x, y);
      if (tower) return tower;
    }
  }
  throw new Error("no open tile for " + towerId);
}

function advanceUntil(game, predicate, maxSteps, dt) {
  for (let step = 0; step < maxSteps; step++) {
    game.update(dt);
    if (predicate()) return step + 1;
  }
  throw new Error("condition not reached after " + maxSteps + " updates");
}

console.log("Frontier Keep TD — edge tests");

test("pause freezes an active wave", function () {
  const game = newGame(101);
  game.hero = null;
  game.startNextWave();
  game.update(0.6);
  check(game.waveSpawned > 0, "precondition: active wave did not spawn");

  game.paused = true;
  const before = {
    time: game.time,
    waveIndex: game.waveIndex,
    waveSpawned: game.waveSpawned,
    waveAcc: game.waveAcc,
    creepDistances: game.creeps.map(function (creep) { return creep.dist; }),
  };
  for (let i = 0; i < 120; i++) game.update(0.5);

  equal(game.time, before.time, "paused game time advanced");
  equal(game.waveIndex, before.waveIndex, "paused wave index advanced");
  equal(game.waveSpawned, before.waveSpawned, "paused wave spawned creeps");
  equal(game.waveAcc, before.waveAcc, "paused wave timer advanced");
  equal(
    JSON.stringify(game.creeps.map(function (creep) { return creep.dist; })),
    JSON.stringify(before.creepDistances),
    "paused creeps moved"
  );
});

test("2x speed advances simulation faster", function () {
  function advanceAt(speed) {
    const game = newGame(202);
    game.hero = null;
    game._spawnCreep(game.waves[0]);
    game.speed = speed;
    game.update(1);
    return { time: game.time, distance: game.creeps[0].dist };
  }

  const normal = advanceAt(1);
  const double = advanceAt(2);
  near(double.time, normal.time * 2, "2x game time was not doubled");
  near(double.distance, normal.distance * 2, "2x creep travel was not doubled");
  check(double.distance > normal.distance, "2x speed did not advance farther");
});

test("selling every tower preserves exact gold accounting", function () {
  const game = newGame(303);
  game.gold = 5000;
  const initialGold = game.gold;
  const towers = [
    buildOnOpenTile(game, "h_guard"),
    buildOnOpenTile(game, "h_cannon"),
    buildOnOpenTile(game, "o_spirit"),
    buildOnOpenTile(game, "n_ancient"),
  ];

  game.selected = towers[0];
  check(game.upgradeSelected(), "first guard upgrade failed");
  check(game.upgradeSelected(), "second guard upgrade failed");
  game.selected = towers[2];
  check(game.upgradeSelected(), "spirit lodge upgrade failed");

  const totalInvested = towers.reduce(function (sum, tower) {
    return sum + tower.invested;
  }, 0);
  const totalRefund = towers.reduce(function (sum, tower) {
    return sum + S.sellRefund(tower.invested, 0.75);
  }, 0);

  towers.forEach(function (tower) {
    game.selected = tower;
    equal(
      game.sellSelected(),
      S.sellRefund(tower.invested, 0.75),
      "sell returned the wrong refund"
    );
  });

  equal(game.gold, initialGold - totalInvested + totalRefund, "gold ledger is inconsistent");
  equal(game.towers.length, 0, "sell-all left towers behind");
  equal(Object.keys(game.occupied).length, 0, "sell-all left occupied tiles behind");
});

test("divine armor takes tiny damage except from chaos", function () {
  S.ATTACK.forEach(function (attackType) {
    const hit = S.applyHit(100, attackType, "divine", 0);
    const expected = attackType === "chaos" ? 100 : 5;
    near(hit.damage, expected, attackType + " damage against divine armor");
  });
});

test("leaking an entire wave reaches defeat", function () {
  const game = newGame(404);
  const wave = game.waves[0];
  game.hero = null;
  game.lives = wave.count;
  game.startNextWave();

  advanceUntil(game, function () {
    return game.ended === "defeat";
  }, 1000, 0.25);

  equal(game.waveSpawned, wave.count, "not every creep in the wave spawned");
  equal(game.lives, 0, "all leaks did not consume every life");
  equal(game.ended, "defeat", "all leaks did not end in defeat");
  equal(game.creeps.length, 0, "defeat left live creeps behind");
});

test("a flying-only wave leaks through cannon-only defense", function () {
  const game = newGame(505);
  const flyingWaveIndex = game.waves.findIndex(function (wave) {
    return wave.flying && !wave.boss;
  });
  check(flyingWaveIndex >= 0, "no flying-only wave found");

  game.hero = null;
  game.waveIndex = flyingWaveIndex;
  game.gold = 10000;
  for (let i = 0; i < 12; i++) buildOnOpenTile(game, "h_cannon");
  check(game.towers.every(function (tower) {
    return tower.def.id === "h_cannon" && tower.canHitFlying === false;
  }), "defense contains a non-cannon or anti-air tower");

  const wave = game.waves[flyingWaveIndex];
  const startingLives = wave.count + 5;
  game.lives = startingLives;
  game.startNextWave();
  let maxProjectiles = 0;

  advanceUntil(game, function () {
    maxProjectiles = Math.max(maxProjectiles, game.projectiles.length);
    return game.betweenWaves && game.waveIndex === flyingWaveIndex + 1;
  }, 1000, 0.25);

  equal(maxProjectiles, 0, "cannons fired at flying creeps");
  equal(game.waveSpawned, wave.count, "not every flying creep spawned");
  equal(game.lives, startingLives - wave.count, "not every flying creep leaked");
  equal(game.ended, null, "flying-wave probe unexpectedly ended the game");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed) process.exit(1);
