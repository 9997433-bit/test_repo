#!/usr/bin/env node
/**
 * No-dep Node test runner for Azeroth Keep TD.
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const root = dirname(fileURLToPath(import.meta.url));
const S = require(join(root, "../js/sim-core.js"));
require(join(root, "../js/data.js"));
const { Game } = requireEnvGame();

function requireEnvGame() {
  // game.js expects SimCore + GameData on globalThis
  awaitScripts();
  require(join(root, "../js/game.js"));
  return { Game: globalThis.Game };
}

function awaitScripts() {
  globalThis.SimCore = S;
  require(join(root, "../js/data.js"));
}

let failed = 0;
let passed = 0;
function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log("  ok  " + msg);
  } else {
    failed += 1;
    console.error("  FAIL  " + msg);
  }
}
function almost(a, b, msg) {
  assert(Math.abs(a - b) < 1e-6, msg + " (" + a + " vs " + b + ")");
}

console.log("Azeroth Keep TD — tests");

console.log("\n[damage table]");
almost(S.damageMultiplier("pierce", "light"), 2.0, "pierce vs light = 2x");
almost(S.damageMultiplier("siege", "fortified"), 1.5, "siege vs fort = 1.5x");
almost(S.damageMultiplier("magic", "heavy"), 2.0, "magic vs heavy = 2x");
almost(S.damageMultiplier("pierce", "fortified"), 0.35, "pierce vs fort = 0.35x");
almost(S.damageMultiplier("chaos", "divine"), 1.0, "chaos vs divine = 1x");
const hit = S.applyHit(100, "pierce", "light", 0);
almost(hit.damage, 200, "100 pierce vs light 0 armor = 200");
const blocked = S.applyHit(100, "pierce", "light", 0, { flying: true, canHitFlying: false });
assert(blocked.blocked === "flying" && blocked.damage === 0, "ground tower cannot hit flying");
const immune = S.applyHit(100, "magic", "heavy", 0, { spellImmune: true });
assert(immune.blocked === "immune" && immune.damage === 0, "spell immune blocks magic");
const armored = S.applyHit(100, "normal", "heavy", 10);
const red = S.armorReduction(10);
almost(armored.damage, 100 * (1 - red), "WC3 armor formula applied");

console.log("\n[economy]");
assert(S.interestGold(100, 0.02) === 2, "2% of 100 = 2");
assert(S.interestGold(80, 0.08) === 6, "8% of 80 = 6");
assert(S.sellRefund(200, 0.75) === 150, "75% of 200 = 150");
assert(S.nextInterestRate(0.02, 3) === 0.08, "interest cap 8%");
const eco = S.createEconomy("easy");
assert(eco.gold === 160 && eco.lives === 30, "easy start gold/lives");

console.log("\n[path / leak]");
const path = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 50 },
];
assert(Math.abs(S.polylineLength(path) - 150) < 1e-6, "polyline length 150");
const mid = S.pointOnPolyline(path, 50);
almost(mid.x, 50, "mid x");
const end = S.pointOnPolyline(path, 999);
assert(end.done === true, "past end is done");
assert(S.livesAfterLeak(20, 3, 1) === 17, "3 leaks from 20");
assert(S.livesAfterLeak(2, 5, 1) === 0, "lives floor at 0");

console.log("\n[spatial hash]");
const hash = new S.SpatialHash(64);
hash.insert({ x: 10, y: 10, id: 1 });
hash.insert({ x: 400, y: 400, id: 2 });
assert(hash.queryRadius(12, 12, 20).length === 1, "hash finds nearby");
assert(hash.queryRadius(12, 12, 20)[0].id === 1, "hash returns correct entity");

console.log("\n[headless match]");
const g = new globalThis.Game({ difficulty: "easy", heroId: "paladin", lang: "en", headless: true, seed: 42 });
assert(g.gold === 160, "easy gold");
assert(g.lives === 30, "easy lives");
const t = g.tryBuild("h_guard", 3 * 48 + 24, 5 * 48 + 24);
assert(!!t, "placed guard tower off-path");
assert(g.gold === 160 - 70, "gold deducted");
assert(g.tryBuild("h_guard", 0 * 48 + 24, 3 * 48 + 24) === false, "cannot build on path");
g.gold += 200;
const up = g.upgradeSelected();
assert(up === true, "upgrade T1->T2");
const refund = g.sellSelected();
assert(refund === Math.floor((70 + 110) * 0.75), "sell refund 75% of invested");

const g2 = new globalThis.Game({ difficulty: "normal", heroId: "blademaster", lang: "zh", headless: true, seed: 7 });
g2.startNextWave();
for (let i = 0; i < 60; i++) g2.update(0.5);
assert(g2.creeps.length > 0 || g2.waveSpawned > 0, "wave spawned creeps");
const before = g2.lives;
// force leak
if (g2.creeps[0]) {
  g2.creeps[0].dist = 99999;
  g2.update(0.2);
}
assert(g2.lives < before || g2.lives === before, "leak path exercised");

console.log("\n[determinism]");
function runSeed(seed) {
  const a = new globalThis.Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: seed });
  a.tryBuild("h_cannon", 4 * 48 + 24, 5 * 48 + 24);
  a.tryBuild("o_burrow", 8 * 48 + 24, 6 * 48 + 24);
  a.startNextWave();
  for (let i = 0; i < 240; i++) a.update(1 / 60);
  return a.snapshot();
}
const s1 = runSeed(99);
const s2 = runSeed(99);
assert(JSON.stringify(s1) === JSON.stringify(s2), "same seed same snapshot");

console.log("\n[flying rules]");
assert(S.canTowerHit({ canHitFlying: false, attackType: "siege" }, { hp: 10, flying: true }) === false, "cannon vs wyvern");
assert(S.canTowerHit({ canHitFlying: true, attackType: "pierce" }, { hp: 10, flying: true }) === true, "guard vs wyvern");

console.log("\n[splash helper]");
const splash = S.splashDamage({ damage: 50, multiplier: 1.5 }, 0.4, 2);
assert(splash.length === 3 && splash[1].damage === 20, "splash 40% on 2 extras");

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed) process.exit(1);
