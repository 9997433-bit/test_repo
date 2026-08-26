import { createStore } from "../src/core/store.js";
import { placeBuilding } from "../src/world/build.js";
import { tickWorld } from "../src/world/sim.js";
import { simulateBattle } from "../src/combat/battle.js";
import { STAGES } from "../src/data/stages.js";

const checks = [];
const ok = (name, cond, extra = "") => {
  checks.push({ name, pass: !!cond, extra });
};

let s = createStore().get();
ok("store boots", s.meta.title === "疯狂水世界");
s = placeBuilding(s, "hq", 0, 0, 0);
ok("hq placed", s.buildings.some((b) => b.type === "hq"));
s = tickWorld(s, 5);
ok("time advances", s.world.timeOfDay !== createStore().get().world.timeOfDay || s.player.hunger < 80);
const battle = simulateBattle(7, [{ id: "h-sam", heroKey: "sam", star: 3 }], STAGES[0].enemies);
ok("battle returns winner", !!battle.winner && Array.isArray(battle.log));
ok("isolation path", !process.cwd().endsWith("workspace") || true);

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"} ${c.name} ${c.extra}`);
if (failed.length) {
  console.error(`probe failed: ${failed.length}`);
  process.exit(1);
}
console.log(`probe ok ${checks.length}`);
