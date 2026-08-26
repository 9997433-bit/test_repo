import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { simulate } = await import(pathToFileURL(join(root, "src/combat/battle.js")).href);
const { produce } = await import(pathToFileURL(join(root, "src/mansion/production.js")).href);
const { reduce, defaultState } = await import(pathToFileURL(join(root, "src/core/store.js")).href);
const { towerEnemy } = await import(pathToFileURL(join(root, "src/data/enemies.js")).href);

const state = reduce(defaultState(), { type: "CHOOSE_FACTION", faction: "divine", name: "bench", now: 1 });

const t0 = performance.now();
let wins = 0;
for (let i = 0; i < 200; i++) {
  const r = simulate({
    seed: 1000 + i,
    heroIds: state.party,
    foes: towerEnemy(1 + (i % 20)).foes,
    state,
    equipped: state.equipped,
  });
  if (r.winner === "a") wins += 1;
}
const battleMs = performance.now() - t0;

const t1 = performance.now();
for (let i = 0; i < 5000; i++) produce(state, 0.1);
const prodMs = performance.now() - t1;

const report = {
  battles: 200,
  wins,
  battleMs: Number(battleMs.toFixed(2)),
  produceIters: 5000,
  produceMs: Number(prodMs.toFixed(2)),
  ok: battleMs < 800,
};
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
