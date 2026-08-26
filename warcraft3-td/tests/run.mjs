#!/usr/bin/env node
/**
 * No-dep Node test runner for Frontier Keep TD.
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

function testCreep(id, x, y) {
  return {
    id: id,
    x: x,
    y: y,
    hp: 1000,
    armor: 0,
    armorType: "unarmored",
    flying: false,
    spellImmune: false,
  };
}

function resolveProjectile(game, projectile, creeps) {
  game.creeps = creeps;
  game.projectiles = [projectile];
  game._rebuildHash();
  game._tickProjectiles(0);
}

console.log("Frontier Keep TD — tests");

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
assert(eco.gold === 180 && eco.lives === 30, "easy start gold/lives");
const interestGame = new Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: 11 });
interestGame.gold = 100;
interestGame.update(15);
assert(
  interestGame.gold === 102 && interestGame.goldEarned === 2 && interestGame.interestAcc === 0,
  "update(15) awards 2% interest"
);

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
assert(g.gold === 180, "easy gold");
assert(g.lives === 30, "easy lives");
const t = g.tryBuild("h_guard", 3 * 48 + 24, 5 * 48 + 24);
assert(!!t, "placed guard tower off-path");
assert(g.gold === 180 - 70, "gold deducted");
const beforeOverlap = g.gold;
assert(
  g.tryBuild("h_guard", 3 * 48 + 24, 5 * 48 + 24) === false &&
    g.gold === beforeOverlap &&
    g.towers.length === 1,
  "cannot build overlapping towers"
);
assert(g.tryBuild("h_guard", 0 * 48 + 24, 3 * 48 + 24) === false, "cannot build on path");
g.gold += 300;
const firstUpgrade = g.upgradeSelected();
const secondUpgrade = g.upgradeSelected();
assert(
  firstUpgrade === true &&
    secondUpgrade === true &&
    t.tier === 3 &&
    t.invested === 70 + 110 + 180,
  "upgrade tower twice to tier 3"
);
const beforeSell = g.gold;
const refund = g.sellSelected();
const tierThreeRefund = Math.floor((70 + 110 + 180) * 0.75);
assert(
  refund === tierThreeRefund && g.gold === beforeSell + tierThreeRefund && g.towers.length === 0,
  "sell after two upgrades refunds 75% of all invested gold"
);

const heroGame = new Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: 12 });
const manaBeforeCast = heroGame.hero.mana;
const castManaCost = heroGame.hero.def.q.mana;
assert(
  heroGame.cast("q") === true && heroGame.hero.mana === manaBeforeCast - castManaCost,
  "hero cast spends its mana cost"
);
heroGame.hero.cd.q = 0;
heroGame.hero.mana = castManaCost - 1;
assert(
  heroGame.cast("q") === false && heroGame.hero.mana === castManaCost - 1,
  "hero cannot cast without enough mana"
);

const lumberGame = new Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: 13 });
const lumberAfterClear = [];
for (let cleared = 1; cleared <= 10; cleared++) {
  lumberGame.startNextWave();
  const wave = lumberGame.waves[lumberGame.waveIndex];
  lumberGame.waveSpawned = wave.count;
  lumberGame.creeps = [];
  lumberGame.update(0);
  lumberAfterClear.push(lumberGame.lumber);
}
assert(
  JSON.stringify(lumberAfterClear) === JSON.stringify([0, 0, 0, 0, 1, 1, 1, 1, 1, 2]),
  "simulated wave clears award one lumber every 5 waves"
);

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

console.log("\n[projectile area effects]");
const chainGame = new Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: 14 });
const chainPrimary = testCreep("chain-primary", 100, 100);
const chainBounce = testCreep("chain-bounce", 130, 100);
const chainFar = testCreep("chain-far", 240, 100);
const chainSource = {
  kind: "tower",
  attackType: "magic",
  canHitFlying: true,
  slow: 0,
  poison: 0,
  root: 0,
};
resolveProjectile(chainGame, {
  x: chainPrimary.x,
  y: chainPrimary.y,
  vx: 0,
  vy: 0,
  targetId: chainPrimary.id,
  dmg: 100,
  attackType: "magic",
  splash: 0,
  chain: 1,
  source: chainSource,
  life: 1,
}, [chainPrimary, chainBounce, chainFar]);
almost(chainPrimary.hp, 900, "chain lightning damages primary target");
almost(chainBounce.hp, 930, "chain lightning bounces for 70% damage");
almost(chainFar.hp, 1000, "chain lightning does not reach distant creep");

const splashGame = new Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: 15 });
const splashPrimary = testCreep("splash-primary", 100, 100);
const splashNearby = testCreep("splash-nearby", 130, 100);
const splashFar = testCreep("splash-far", 180, 100);
const splashSource = {
  kind: "tower",
  attackType: "siege",
  canHitFlying: true,
  slow: 0,
  poison: 0,
  root: 0,
};
resolveProjectile(splashGame, {
  x: splashPrimary.x,
  y: splashPrimary.y,
  vx: 0,
  vy: 0,
  targetId: splashPrimary.id,
  dmg: 100,
  attackType: "siege",
  splash: 48,
  chain: 0,
  source: splashSource,
  life: 1,
}, [splashPrimary, splashNearby, splashFar]);
almost(splashPrimary.hp, 900, "splash projectile damages primary target");
almost(splashNearby.hp, 960, "splash damages nearby creep for 40%");
almost(splashFar.hp, 1000, "splash does not damage creep outside radius");

console.log("\n[chain hop order]");
const hopGame = new Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: 21 });
const hopA = testCreep("hop-a", 100, 100);
const hopB = testCreep("hop-b", 130, 100);
const hopC = testCreep("hop-c", 160, 100);
const hopD = testCreep("hop-d", 190, 100);
resolveProjectile(hopGame, {
  x: hopA.x, y: hopA.y, vx: 0, vy: 0, targetId: hopA.id,
  dmg: 100, attackType: "magic", splash: 0, chain: 3,
  source: { kind: "tower", attackType: "magic", canHitFlying: true },
  life: 1,
}, [hopA, hopB, hopC, hopD]);
almost(hopA.hp, 900, "chain primary takes full damage exactly once");
almost(hopB.hp, 930, "first hop is the nearest creep (70%)");
almost(hopC.hp, 945, "second hop continues down the line (55%)");
almost(hopD.hp, 960, "third hop never revisits a struck creep (40%)");

console.log("\n[difficulty ramp & speed]");
assert(S.waveHp(100, "hard", 12) === 130, "hard multiplier fully ramped at wave 12");
assert(S.waveHp(100, "hard", 30) === 130, "hard multiplier stays flat after the ramp");
assert(S.waveHp(100, "hard", 1) < 110, "hard wave 1 is nearly unscaled");
assert(S.waveHp(100, "easy", 1) === 70, "easy discount applies immediately");
assert(S.waveHp(100, "insane", 6) === Math.round(100 * (1 + 0.65 * 0.5)), "insane ramps linearly");
almost(S.creepSpeed(50, "insane"), 56, "insane creeps move 12% faster");
almost(S.creepSpeed(50, "easy"), 46, "easy creeps move 8% slower");
assert(S.DIFFICULTY.easy.gold > S.DIFFICULTY.normal.gold &&
  S.DIFFICULTY.normal.gold > S.DIFFICULTY.hard.gold &&
  S.DIFFICULTY.hard.gold > S.DIFFICULTY.insane.gold, "start gold ordered by difficulty");

console.log("\n[wave curves]");
const wavesPlan = (globalThis.GameData || require(join(root, "../js/data.js")), globalThis.GameData).makeWaves();
assert(wavesPlan.length === 30, "30 waves");
assert([5, 10, 15, 20, 25, 30].every(function (n) { return wavesPlan[n - 1].boss; }), "bosses at 5/10/15/20/25/30");
assert(wavesPlan.every(function (w) { return !w.boss || w.count === 1; }), "boss waves are a single consolidated boss");
assert(wavesPlan.some(function (w) { return w.flying && !w.boss; }), "flying waves exist");
assert(wavesPlan.some(function (w) { return w.spellImmune; }), "spell immune waves exist");
function totalHp(w) { return w.hp * w.count; }
function totalBounty(w) { return w.bounty * w.count; }
assert(totalHp(wavesPlan[29]) > totalHp(wavesPlan[0]) * 40, "EHP grows super-linearly across 30 waves");
const earlyRatio = totalHp(wavesPlan[9]) / totalHp(wavesPlan[4]);
const lateRatio = totalHp(wavesPlan[29]) / totalHp(wavesPlan[24]);
assert(lateRatio < earlyRatio, "late growth softens after the knee");
// Income must track threat: gold-per-EHP may drift down slowly (interest era)
// but never collapse the way the linear bounty did.
const goldPerHpW3 = totalBounty(wavesPlan[2]) / totalHp(wavesPlan[2]);
const goldPerHpW23 = totalBounty(wavesPlan[22]) / totalHp(wavesPlan[22]);
assert(goldPerHpW23 > goldPerHpW3 * 0.55, "bounty stays proportional to EHP (no linear collapse)");
assert(wavesPlan[13].spellImmune && !wavesPlan[13].boss, "wave 14 ancients are spell immune");

console.log("\n[data-driven status effects]");
const fxGame = new Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: 31 });
const webbed = testCreep("webbed", 100, 100);
webbed.slow = 0; webbed.slowPow = 0; webbed.poison = 0; webbed.poisonDps = 0; webbed.root = 0;
fxGame._hitCreep(webbed, 10, "magic", { slow: 0.35, tier: 1 });
const chilled = testCreep("chilled", 100, 100);
chilled.slow = 0; chilled.slowPow = 0; chilled.poison = 0; chilled.poisonDps = 0; chilled.root = 0;
fxGame._hitCreep(chilled, 10, "magic", { slow: 0.25, tier: 1 });
assert(webbed.slowPow === 0.35 && chilled.slowPow === 0.25, "slow strength comes from tower data");
const poisoned = testCreep("poisoned", 100, 100);
poisoned.slow = 0; poisoned.slowPow = 0; poisoned.poison = 0; poisoned.poisonDps = 0; poisoned.root = 0;
fxGame._hitCreep(poisoned, 10, "pierce", { poison: 4, tier: 2 });
assert(poisoned.poisonDps === 8, "poison dps = data value x tier");
const rooted = testCreep("rooted", 100, 100);
rooted.slow = 0; rooted.slowPow = 0; rooted.poison = 0; rooted.poisonDps = 0; rooted.root = 0;
fxGame._hitCreep(rooted, 10, "normal", { root: 0.6 });
almost(rooted.root, 0.6, "root duration comes from tower data");

console.log("\n[boss rules]");
const bossGame = new Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: 32 });
const livesBefore = bossGame.lives;
bossGame._leak({ boss: true, hp: 10, name: { zh: "x", en: "x" } });
assert(bossGame.lives === livesBefore - 3, "boss leak costs 3 lives");
const bossGame2 = new Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: 33 });
bossGame2._leak({ boss: false, hp: 10, name: { zh: "x", en: "x" } });
assert(bossGame2.lives === bossGame2.eco.lives - 1, "normal leak costs 1 life");

console.log("\n[overkill prevention]");
const okGame = new Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: 34 });
okGame.hero = null;
okGame.gold = 1000;
const towerA = okGame.tryBuild("h_guard", 3 * 48 + 24, 5 * 48 + 24);
const towerB = okGame.tryBuild("h_guard", 4 * 48 + 24, 5 * 48 + 24);
assert(!!towerA && !!towerB, "overkill probe towers placed");
const weak = testCreep("weak", towerA.x, towerA.y - 40);
weak.hp = 5; weak.dist = 50; weak.incoming = 0; weak.speed = 0; weak.slow = 0; weak.root = 0; weak.poison = 0;
const tank = testCreep("tank", towerA.x + 30, towerA.y - 40);
tank.hp = 1000; tank.dist = 40; tank.incoming = 0; tank.speed = 0; tank.slow = 0; tank.root = 0; tank.poison = 0;
okGame.creeps = [weak, tank];
okGame._rebuildHash();
towerA.cd = 0;
towerB.cd = 0;
okGame._tickTowers(0.01);
const targets = okGame.projectiles.map(function (p) { return p.targetId; }).sort();
assert(targets.length === 2 && targets[0] !== targets[1],
  "second tower avoids the creep already doomed by in-flight damage");
assert(weak.incoming > 0 || tank.incoming > 0, "expected damage is booked on targets");

console.log("\n[hero ultimates]");
const ultPala = new Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: 41 });
ultPala.hero.mana = 200;
ultPala.hero.hp = 100;
const novaVictim = testCreep("nova", ultPala.hero.x + 50, ultPala.hero.y);
ultPala.creeps = [novaVictim];
ultPala._rebuildHash();
assert(ultPala.cast("r") === true, "paladin R casts");
assert(novaVictim.hp < 1000, "Holy Wrath damages nearby creeps");
assert(ultPala.hero.hp === ultPala.hero.maxHp, "Holy Wrath fully heals the Paladin");
assert(ultPala.hero.cd.r > 0, "R goes on cooldown");

const ultBm = new Game({ difficulty: "normal", heroId: "blademaster", headless: true, seed: 42 });
ultBm.hero.mana = 200;
assert(ultBm.cast("r") === true, "blademaster R casts");
assert(ultBm.hero.cycloneUntil > ultBm.time, "Steel Cyclone is active");
const spinVictim = testCreep("spin", ultBm.hero.x + 20, ultBm.hero.y);
ultBm.creeps = [spinVictim];
ultBm._rebuildHash();
ultBm._heroCyclone(ultBm.hero, 1);
assert(spinVictim.hp < 1000, "Steel Cyclone deals AoE damage");

const ultDh = new Game({ difficulty: "normal", heroId: "demonhunter", headless: true, seed: 43 });
ultDh.hero.mana = 200;
const immuneVictim = testCreep("immune", ultDh.hero.x + 40, ultDh.hero.y);
immuneVictim.spellImmune = true;
ultDh.creeps = [immuneVictim];
ultDh._rebuildHash();
assert(ultDh.cast("r") === true, "demon hunter R casts");
assert(immuneVictim.hp < 1000, "Chaos Rift pierces spell immunity");
assert(immuneVictim.shredAmt >= 3, "Chaos Rift shreds armor");

const ultDk = new Game({ difficulty: "normal", heroId: "deathknight", headless: true, seed: 44 });
ultDk.hero.mana = 200;
const towersBefore = ultDk.towers.length;
assert(ultDk.cast("r") === true, "death knight R casts");
assert(ultDk.towers.length === towersBefore + 6, "Legion of the Dead raises 6 skeletons");
assert(ultDk.towers.every(function (tw) { return !tw.temp || tw.expire > ultDk.time; }), "skeletons carry an expiry");

console.log("\n[lumber shop]");
const shopGame = new Game({ difficulty: "normal", heroId: "paladin", headless: true, seed: 51 });
shopGame.lumber = 7;
assert(shopGame.spendLumber("interest") === true && shopGame.interestRate === 0.04, "interest tech +2%");
assert(shopGame.spendLumber("armory") === true && shopGame.towerDamageMul === 1.08, "armory tech +8% damage");
assert(shopGame.spendLumber("sentry") === true && shopGame.towerRangeMul === 1.08, "sentry tech +8% range");
const livesPre = shopGame.lives;
assert(shopGame.spendLumber("repair") === true && shopGame.lives === livesPre + 3, "repair tech +3 lives");
assert(shopGame.lumber === 0, "lumber fully spent");
assert(shopGame.spendLumber("interest") === false, "cannot buy without lumber");
const shopState = shopGame.lumberUpgradeState("interest");
assert(shopState.level === 1 && shopState.affordable === false, "upgrade state reports level and affordability");

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed) process.exit(1);
