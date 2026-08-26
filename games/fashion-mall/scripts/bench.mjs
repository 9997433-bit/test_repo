import { defaultState, tick } from "../src/core/state.js";
import { totalOnlinePerSec, settleOffline } from "../src/core/economy.js";

const state = defaultState();
state.introDone = true;
state.shops.fastfood.auto = true;
state.shops.fastfood.staff = 3;
state.shops.fresh.unlocked = true;
state.shops.fresh.auto = true;

const n = 20000;
const t0 = performance.now();
for (let i = 0; i < n; i++) tick(state, 0.25);
const t1 = performance.now();
const off = settleOffline({ ...state, lastTick: Date.now() - 3 * 3600 * 1000 });

const report = {
  ticks: n,
  ms: Number((t1 - t0).toFixed(2)),
  ticksPerSec: Math.round(n / ((t1 - t0) / 1000)),
  onlinePerSec: Number(totalOnlinePerSec(state).toFixed(2)),
  gold: Math.floor(state.gold),
  offline3h: off.gold,
};
console.log(JSON.stringify(report, null, 2));
if (report.ticksPerSec < 2000) {
  console.error("tick throughput below probe floor");
  process.exit(1);
}
