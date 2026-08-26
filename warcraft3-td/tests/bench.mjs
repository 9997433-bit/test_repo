#!/usr/bin/env node
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const root = dirname(fileURLToPath(import.meta.url));
globalThis.SimCore = require(join(root, "../js/sim-core.js"));
require(join(root, "../js/data.js"));
require(join(root, "../js/game.js"));

const Game = globalThis.Game;
const D = globalThis.GameData;

function placeMany(g) {
  const ids = D.TOWERS.map(function (t) { return t.id; });
  let n = 0;
  for (let y = 0; y < g.mapH && n < 40; y++) {
    for (let x = 0; x < g.mapW && n < 40; x++) {
      const wx = x * g.tile + g.tile / 2;
      const wy = y * g.tile + g.tile / 2;
      g.gold = 99999;
      if (g.tryBuild(ids[n % ids.length], wx, wy)) n += 1;
    }
  }
  return n;
}

function floodCreeps(g, count) {
  const wave = g.waves[6]; // flying-ish mix
  for (let i = 0; i < count; i++) {
    g._spawnCreep(wave);
    g.creeps[g.creeps.length - 1].dist = (i * 14) % 400;
    const p = globalThis.SimCore.pointOnPolyline(g.path, g.creeps[g.creeps.length - 1].dist);
    g.creeps[g.creeps.length - 1].x = p.x;
    g.creeps[g.creeps.length - 1].y = p.y;
  }
}

const g = new Game({ difficulty: "hard", heroId: "demonhunter", headless: true, seed: 1 });
const towers = placeMany(g);
floodCreeps(g, 80);
g.betweenWaves = false;
g.waveSpawned = 80;

const ticks = 60 * 30;
const t0 = Date.now();
for (let i = 0; i < ticks; i++) {
  g.update(1 / 60);
  if (Number.isNaN(g.gold) || Number.isNaN(g.time)) {
    console.error("NaN detected at tick", i);
    process.exit(2);
  }
}
const ms = Date.now() - t0;
const msPerTick = ms / ticks;
const fpsEst = 1000 / Math.max(msPerTick, 0.0001);

console.log(JSON.stringify({
  towers: towers,
  creepsEnd: g.creeps.length,
  ticks: ticks,
  wallMs: ms,
  msPerTick: Number(msPerTick.toFixed(4)),
  estimatedFpsIfRenderFree: Number(fpsEst.toFixed(1)),
  gold: g.gold,
  lives: g.lives,
  ended: g.ended,
}, null, 2));

if (msPerTick > 4) {
  console.error("PERF FAIL: ms/tick > 4");
  process.exit(3);
}

// edge probes
const z = new Game({ difficulty: "insane", headless: true, seed: 2 });
z.gold = 0;
const no = z.tryBuild("h_guard", 3 * 48 + 24, 5 * 48 + 24);
if (no) {
  console.error("built with 0 gold");
  process.exit(4);
}
z.lives = 1;
z._leak({ _dead: false, boss: false, hp: 1 });
if (z.ended !== "defeat") {
  console.error("expected defeat on last leak");
  process.exit(5);
}
console.log("edge probes ok");
