/* Balance report: plays a scripted campaign headlessly and prints a per-wave
 * table of gold / towers / lives. Usage: node tests/report.mjs [difficulty] */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');

[
  'js/config.js', 'js/data/damageTable.js', 'js/data/towers.js', 'js/data/creeps.js',
  'js/data/waves.js', 'js/data/heroes.js', 'js/engine/rng.js', 'js/engine/path.js',
  'js/engine/spatial.js', 'js/sim/combat.js', 'js/entities/fx.js', 'js/entities/creep.js',
  'js/entities/projectile.js', 'js/entities/tower.js', 'js/entities/hero.js', 'js/sim/game.js'
].forEach((f) => require(path.join(rootDir, f)));

const NS = globalThis.WC3TD;

const ORDER = [
  'h_arrow_t1', 'o_troll_t1', 'h_cannon_t1', 'u_zigg_t1', 'o_spirit_t1', 'u_meat_t1',
  'h_arcane_t1', 'e_chimaera_t1', 'u_spirit_t1', 'e_moon_t1', 'o_watch_t1', 'e_ancient_t1'
];

function arcOf(path, x, y) {
  let best = 0, bestD = Infinity;
  for (const s of path.segments) {
    let tt = ((x - s.a.x) * s.dx + (y - s.a.y) * s.dy) / (s.len * s.len);
    tt = Math.max(0, Math.min(1, tt));
    const px = s.a.x + s.dx * tt, py = s.a.y + s.dy * tt;
    const d = Math.hypot(x - px, y - py);
    if (d < bestD) { bestD = d; best = s.start + s.len * tt; }
  }
  return best;
}

function buildSpots(game) {
  const spots = [];
  for (let y = 0; y < NS.Config.grid.rows; y++) {
    for (let x = 0; x < NS.Config.grid.cols; x++) {
      if (!game.isBuildable(x, y)) continue;
      const d = game.path.distanceTo(x + 0.5, y + 0.5);
      if (d > 3.2) continue;
      spots.push({ x, y, d, s: arcOf(game.path, x + 0.5, y + 0.5) });
    }
  }
  // spread along the road from the portal onwards, hugging it where possible
  spots.sort((a, b) => (a.s - b.s) || (a.d - b.d));
  return spots;
}

function think(game, spots, state) {
  let acted = true;
  while (acted) {
    acted = false;
    let best = null;
    for (const tw of game.towers) {
      const next = tw.upgradeDef();
      if (!next || !game.canAfford(next)) continue;
      if (!best || tw.def.tier < best.def.tier) best = tw;
    }
    if (best && (game.towers.length >= Math.min(spots.length, 18) || game.gold > 700)) {
      if (game.upgrade(best).ok) { acted = true; continue; }
    }
    const defId = ORDER.slice(state.n % ORDER.length).concat(ORDER)
      .find((id) => game.canAfford(NS.TowerData.get(id)));
    if (defId) {
      while (state.spot < spots.length) {
        const s = spots[state.spot];
        if (!game.isBuildable(s.x, s.y)) { state.spot++; continue; }
        if (game.build(defId, s.x, s.y).ok) { state.n++; state.spot++; acted = true; }
        break;
      }
    } else if (best && game.upgrade(best).ok) acted = true;
  }
}

const difficulty = process.argv[2] || 'normal';
const seed = Number(process.argv[3] || 1234);
const game = new NS.Game({ difficulty, seed, hero: null });
const spots = buildSpots(game);
const state = { n: 0, spot: 0 };
const rows = [];
let lastWave = 0;

const dt = 1 / 30;
let guard = 0;
while (game.status === 'playing' && guard < 30 * 60 * 60) {
  think(game, spots, state);
  game.update(dt);
  guard++;
  if (game.wave !== lastWave) {
    lastWave = game.wave;
    const tiers = [0, 0, 0];
    game.towers.forEach((tw) => tiers[tw.def.tier - 1]++);
    rows.push({
      wave: game.wave,
      hp: Math.round(NS.CreepData.baseHp(game.wave) * game.diff.hp),
      n: NS.WaveData.totalCreeps(game.wave),
      gold: Math.round(game.gold),
      lum: game.lumber,
      towers: game.towers.length,
      t1: tiers[0], t2: tiers[1], t3: tiers[2],
      dps: Math.round(game.towers.reduce((s, tw) => s + tw.def.dps, 0)),
      lives: game.lives,
      leaks: game.stats.leaks
    });
  }
}

console.log(`\n${difficulty} / seed ${seed} -> ${game.status} at wave ${game.wave}, lives ${game.lives}, ${Math.round(guard * dt)}s\n`);
console.log('wave  hp   n   gold lum  tw  t1/t2/t3   rawDPS lives leaks');
rows.forEach((r) => {
  console.log(
    String(r.wave).padStart(4) + String(r.hp).padStart(6) + String(r.n).padStart(4) +
    String(r.gold).padStart(7) + String(r.lum).padStart(4) + String(r.towers).padStart(4) +
    `   ${r.t1}/${r.t2}/${r.t3}`.padEnd(11) + String(r.dps).padStart(7) +
    String(r.lives).padStart(6) + String(r.leaks).padStart(6)
  );
});
console.log('\nstats:', JSON.stringify(game.stats));
