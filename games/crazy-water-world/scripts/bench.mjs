import { createStore } from "../src/core/store.js";
import { placeBuilding, expandRaft } from "../src/world/build.js";
import { tickWorld } from "../src/world/sim.js";
import { spawnFlotsam } from "../src/explore/salvage.js";
import { simulateBattle } from "../src/combat/battle.js";
import { mulberry32 } from "../src/core/rng.js";
import { STAGES } from "../src/data/stages.js";

function ms(fn, n = 200) {
  const t0 = performance.now();
  for (let i = 0; i < n; i += 1) fn(i);
  return (performance.now() - t0) / n;
}

let s = createStore().get();
for (let i = 0; i < 8; i += 1) s = expandRaft(s, "right");
s = placeBuilding(s, "hq", 0, 0, 0);
s = placeBuilding(s, "fish_chair", 2, 0, 0);
s = placeBuilding(s, "still", 3, 0, 0);

const tickMs = ms(() => {
  s = tickWorld(s, 0.1);
}, 400);
const rng = mulberry32(9);
const spawnMs = ms(() => {
  s = { ...s, explore: { ...s.explore, salvage: { flotsam: spawnFlotsam(s, rng) } } };
}, 400);
const battleMs = ms((i) => {
  simulateBattle(100 + i, [{ id: "h-sam", heroKey: "sam", star: 3 }, { id: "h-mia", heroKey: "mia", star: 2 }], STAGES[5].enemies);
}, 80);

const report = { tickMs, spawnMs, battleMs, buildings: s.buildings.length };
console.log(JSON.stringify(report, null, 2));
if (tickMs > 4 || spawnMs > 2 || battleMs > 12) {
  console.error("bench over budget");
  process.exit(1);
}
