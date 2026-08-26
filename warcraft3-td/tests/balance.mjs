#!/usr/bin/env node
/**
 * Balance regression suite for Frontier Keep TD (audit fix #1).
 *
 * Scripted "bot" commanders autoplay full 30-wave matches headlessly and the
 * results gate the difficulty curve:
 *   - mixed  bot (counter-builds vs the announced wave) must WIN Easy with
 *     a comfortable life buffer — the first-timer proxy.
 *   - t3     bot (upgrade-focused) must WIN Normal.
 *   - best bot on Hard must reach wave 18+ — challenging but honest.
 *   - Insane is allowed to be brutal, but must survive the opening.
 *
 * Everything is seeded and deterministic; the suite stays under a minute.
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
const D = globalThis.GameData;
const Game = globalThis.Game;

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log("  ok  " + msg);
  } else {
    failed += 1;
    console.error("  FAIL  " + msg);
  }
}

/* ------------------------------------------------------------------ spots */

/** Buildable tiles ranked by how much of the lane a tower there can cover. */
function rankedSpots(game, range) {
  const pts = game.path;
  const r2 = range * range;
  const out = [];
  for (let ty = 0; ty < game.mapH; ty++) {
    for (let tx = 0; tx < game.mapW; tx++) {
      if (game.pathBlocked[tx + "," + ty]) continue;
      const x = tx * game.tile + game.tile / 2;
      const y = ty * game.tile + game.tile / 2;
      let cover = 0;
      for (let i = 0; i < pts.length; i++) {
        if (S.dist2(x, y, pts[i].x, pts[i].y) <= r2) cover += 1;
      }
      if (cover > 0) out.push({ x: x, y: y, cover: cover });
    }
  }
  out.sort(function (a, b) { return b.cover - a.cover || a.y - b.y || a.x - b.x; });
  return out;
}

function buildAt(game, id, spots) {
  for (let i = 0; i < spots.length; i++) {
    const s = spots[i];
    if (!game.canBuildAt(s.x, s.y)) continue;
    const t = game.tryBuild(id, s.x, s.y);
    if (t) {
      game.selected = null;
      return t;
    }
  }
  return null;
}

function upgradeTower(game, tower) {
  const prev = game.selected;
  game.selected = tower;
  const ok = game.upgradeSelected();
  game.selected = prev === tower ? null : prev;
  return ok;
}

/* ------------------------------------------------------------- wave intel */

/** Which attack type counters the coming wave, honoring air + immunity. */
function counterTowerIds(wave) {
  if (!wave) return ["h_guard"];
  const fly = wave.flying;
  const immune = wave.spellImmune;
  switch (wave.armorType) {
    case "fortified":
      return fly ? ["n_chimaera"] : ["u_wagon", "h_cannon"];
    case "heavy":
      if (immune) return ["h_guard", "o_burrow"]; // magic is dark, pierce x1 vs heavy
      return ["h_arcane", "o_spirit", "n_moon"];
    case "medium":
      return fly ? ["u_spirit", "h_guard"] : ["o_watch", "n_ancient"];
    case "hero":
      return fly ? ["h_guard"] : ["o_watch", "n_ancient"];
    case "light":
    case "unarmored":
    default:
      return ["h_guard", "u_spirit", "o_burrow"];
  }
}

function towerCounters(tower, wave) {
  if (!wave) return true;
  if (wave.flying && !tower.canHitFlying) return false;
  if (wave.spellImmune && (tower.attackType === "magic" || tower.attackType === "spells")) return false;
  return S.damageMultiplier(tower.attackType, wave.armorType) >= 1.0;
}

/* ------------------------------------------------------------------ hero  */

function heroThink(game) {
  const h = game.hero;
  if (!h || h.dead) return;
  // Park at a mid-lane choke so auras cover towers and ults reach the lane.
  const park = S.pointOnPolyline(game.path, S.polylineLength(game.path) * 0.68);
  if (S.dist2(h.tx, h.ty, park.x, park.y + 26) > 4) game.commandHero(park.x, park.y + 26);

  const bossOnField = game.creeps.some(function (c) { return c.boss && c.hp > 0; });
  const nearCount = game.creeps.reduce(function (n, c) {
    return n + (c.hp > 0 && S.dist2(c.x, c.y, h.x, h.y) < 220 * 220 ? 1 : 0);
  }, 0);
  const rDef = h.def.r || {};
  // R first: on the boss, or on a thick pack.
  if (h.cd.r <= 0 && h.mana >= (rDef.mana || 999)) {
    if (bossOnField || nearCount >= 5) game.cast("r");
  }
  const reserve = bossOnField || game.wavePreview(0) && game.wavePreview(0).boss ? 0 : (rDef.mana || 0) * 0.5;
  const qDef = h.def.q || {};
  if (h.cd.q <= 0 && nearCount > 0 && h.mana >= (qDef.mana || 0) + reserve) game.cast("q");
  const wDef = h.def.w || {};
  if (!wDef.toggle && h.cd.w <= 0 && nearCount >= 2 && h.mana >= (wDef.mana || 0) + reserve) game.cast("w");
}

/* ------------------------------------------------------------------ bots  */

/**
 * Mixed bot: reads the wave preview and counter-builds/upgrades, keeps a
 * small interest reserve mid-game, spends lumber. Plays like an informed
 * first-timer, not an optimizer.
 */
function mixedBot(game, spots) {
  let acted = false;
  const wave = game.wavePreview(0);
  const w = wave ? game.waves[Math.min(game.waveIndex, game.waves.length - 1)] : null;
  const waveNum = wave ? wave.index : 30;

  // Lumber: interest snowball first, then permanent damage, then range.
  ["interest", "armory", "sentry"].some(function (id) {
    const st = game.lumberUpgradeState(id);
    if (st && st.affordable) { game.spendLumber(id); acted = true; return true; }
    return false;
  });
  if (game.lives <= 6) {
    const st = game.lumberUpgradeState("repair");
    if (st && st.affordable) { game.spendLumber("repair"); acted = true; }
  }

  // Interest reserve only ever gates idle spending — answering the announced
  // wave always takes priority over banking gold.
  const reserve = Math.min(250, Math.max(0, (waveNum - 8) * 25));

  // 1) Upgrade a counter tower (biggest bang for the buck).
  const upgradable = game.towers.filter(function (t) {
    return !t.temp && t.tier < 3 && towerCounters(t, w);
  });
  upgradable.sort(function (a, b) { return b.tier - a.tier || a.def.cost[a.tier] - b.def.cost[b.tier]; });
  for (let i = 0; i < upgradable.length; i++) {
    const cost = upgradable[i].def.cost[upgradable[i].tier];
    if (game.gold >= cost && upgradeTower(game, upgradable[i])) { acted = true; break; }
  }

  // 2) Build a counter tower if we lack coverage for this wave type.
  const ids = counterTowerIds(w);
  const have = game.towers.filter(function (t) { return !t.temp && towerCounters(t, w); }).length;
  const wantCounters = Math.min(3 + Math.floor(waveNum / 4), 10);
  if (have < wantCounters) {
    for (let i = 0; i < ids.length; i++) {
      const def = D.towerById(ids[i]);
      if (def && game.gold >= def.cost[0]) {
        if (buildAt(game, ids[i], spots)) { acted = true; break; }
      }
    }
  }

  // 3) Idle gold beyond the reserve: generic pierce backbone or upgrades.
  if (!acted && game.gold - reserve >= 160) {
    const anyUp = game.towers.filter(function (t) { return !t.temp && t.tier < 3; });
    anyUp.sort(function (a, b) { return a.def.cost[a.tier] - b.def.cost[b.tier]; });
    if (anyUp.length && game.gold - reserve >= anyUp[0].def.cost[anyUp[0].tier]) {
      if (upgradeTower(game, anyUp[0])) acted = true;
    }
    if (!acted && buildAt(game, "h_guard", spots)) acted = true;
  }

  heroThink(game);
  return acted;
}

/**
 * T3 bot: the audit's "narrow but real" strategy — rush tall towers in a
 * fixed rotation that covers air/fort/heavy, upgrade before spreading.
 */
function t3Bot(game, spots) {
  let acted = false;
  ["armory", "interest", "sentry"].some(function (id) {
    const st = game.lumberUpgradeState(id);
    if (st && st.affordable) { game.spendLumber(id); acted = true; return true; }
    return false;
  });
  if (game.lives <= 6) {
    const st = game.lumberUpgradeState("repair");
    if (st && st.affordable) { game.spendLumber("repair"); acted = true; }
  }

  // Normal-attack towers (o_watch/n_ancient) are the designed counter to
  // hero-armor bosses at waves 15/25/30 — a tall build still needs them.
  const rotation = ["o_burrow", "h_cannon", "h_arcane", "o_burrow", "u_wagon", "o_watch", "o_spirit", "h_guard", "h_arcane", "o_watch", "h_cannon", "o_burrow", "n_moon", "u_wagon", "n_ancient", "h_guard"];
  // Upgrade the earliest non-maxed tower first (tall before wide).
  for (let i = 0; i < game.towers.length; i++) {
    const t = game.towers[i];
    if (t.temp || t.tier >= 3) continue;
    const cost = t.def.cost[t.tier];
    if (game.gold >= cost && upgradeTower(game, t)) acted = true;
    break; // strictly one column at a time
  }
  if (!acted) {
    const owned = game.towers.filter(function (t) { return !t.temp; }).length;
    const nextId = rotation[Math.min(owned, rotation.length - 1)];
    const def = D.towerById(nextId);
    if (def && game.gold >= def.cost[0] && buildAt(game, nextId, spots)) acted = true;
  }
  heroThink(game);
  return acted;
}

/* ---------------------------------------------------------------- runner  */

function play(difficulty, botName, heroId, opts) {
  opts = opts || {};
  const game = new Game({ difficulty: difficulty, heroId: heroId, headless: true, seed: opts.seed || 7, lang: "en" });
  const spots = rankedSpots(game, 150);
  const bot = botName === "t3" ? t3Bot : mixedBot;
  const dt = 1 / 30;
  const thinkEvery = 0.5;
  let sinceThink = thinkEvery; // think immediately
  let acted = true;
  const trace = [];
  let lastWave = -1;
  const maxTime = 3000;
  while (!game.ended && game.time < maxTime) {
    game.update(dt);
    sinceThink += dt;
    if (sinceThink >= thinkEvery) {
      sinceThink = 0;
      acted = bot(game, spots);
      if (game.betweenWaves && !acted && !game.ended) game.startNextWave();
    }
    if (opts.trace && game.waveIndex !== lastWave) {
      lastWave = game.waveIndex;
      const s = game.snapshot();
      trace.push("w" + s.wave + " lives=" + s.lives + " gold=" + s.gold + " towers=" + s.towers);
    }
  }
  const snap = game.snapshot();
  snap.result = game.ended || "timeout";
  snap.trace = trace;
  return snap;
}

function report(label, r) {
  console.log("  -- " + label + ": " + r.result + " @wave " + r.wave + "/30, lives " + r.lives +
    ", towers " + r.towers + ", gold " + r.gold + ", t=" + Math.round(r.time) + "s");
  if (r.trace && r.trace.length) console.log("     " + r.trace.join(" | "));
}

console.log("Frontier Keep TD — balance regression (seeded bots)");
const TRACE = !!process.env.BAL_TRACE; // per-wave lives/gold trace for tuning
const t0 = Date.now();

console.log("\n[easy — must be completable]");
const easyMixed = play("easy", "mixed", "paladin", { seed: 7, trace: TRACE });
report("mixed/paladin", easyMixed);
assert(easyMixed.result === "victory", "mixed bot beats Easy");
assert(easyMixed.lives >= 10, "mixed bot keeps a comfortable life buffer on Easy (>=10)");

console.log("\n[normal — winnable with focus]");
const normalT3 = play("normal", "t3", "deathknight", { seed: 7, trace: TRACE });
report("t3/deathknight", normalT3);
assert(normalT3.result === "victory", "t3 bot beats Normal");
const normalMixed = play("normal", "mixed", "paladin", { seed: 7, trace: TRACE });
report("mixed/paladin", normalMixed);
assert(normalMixed.result === "victory" || normalMixed.wave >= 24,
  "mixed bot wins Normal or at least reaches wave 24");

console.log("\n[hard — a real challenge]");
const hardT3 = play("hard", "t3", "deathknight", { seed: 7, trace: TRACE });
report("t3/deathknight", hardT3);
const hardMixed = play("hard", "mixed", "paladin", { seed: 7, trace: TRACE });
report("mixed/paladin", hardMixed);
const hardBest = Math.max(hardT3.result === "victory" ? 30 : hardT3.wave, hardMixed.result === "victory" ? 30 : hardMixed.wave);
assert(hardBest >= 18, "best bot reaches wave 18+ on Hard");

console.log("\n[insane — brutal but not a brick wall]");
const insaneT3 = play("insane", "t3", "deathknight", { seed: 7, trace: TRACE });
report("t3/deathknight", insaneT3);
assert(insaneT3.wave >= 8 || insaneT3.result === "victory", "t3 bot survives the Insane opening (wave 8+)");

console.log("\nsuite time: " + ((Date.now() - t0) / 1000).toFixed(1) + "s");
console.log(passed + " passed, " + failed + " failed");
if (failed) process.exit(1);
