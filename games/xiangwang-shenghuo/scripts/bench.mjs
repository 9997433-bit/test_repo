import { createInitialState, advanceTime } from "../src/core/engine.js";
import { tickPlots, plant } from "../src/systems/farm/index.js";
import { tickProduction } from "../src/systems/production/index.js";
import { tickVillage } from "../src/systems/village/index.js";

const N = 2000;
let s = createInitialState();
s = { ...s, resources: { ...s.resources, coin: 10_000 } };
const planted = plant(s, { plotId: "p1", cropId: "rice" });
s = planted.state || s;
const t0 = Date.now();
for (let i = 0; i < N; i += 1) {
  const stepped = advanceTime(s, 16);
  s = tickVillage(tickProduction(tickPlots(stepped.state, 16), 16));
}
const ms = Date.now() - t0;
const per = ms / N;
const report = { ticks: N, ms, msPerTick: Number(per.toFixed(4)), ok: per < 2 };
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
