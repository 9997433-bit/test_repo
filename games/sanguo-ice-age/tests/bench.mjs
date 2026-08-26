/** 性能基准：node tests/bench.mjs */
import { performance } from "node:perf_hooks";
import { createInitialState } from "../js/sim/state.js";
import { runTicks } from "../js/sim/tick.js";
import { upgrade } from "../js/sim/buildings.js";
import { simulateBattle, makeEnemyUnit } from "../js/sim/battle.js";
import { rollQuality } from "../js/sim/heroes.js";
import { mulberry32 } from "../js/engine/rng.js";
import { TICKS_PER_DAY, TICK_MS } from "../js/config.js";

function fmt(n) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function bench(name, fn) {
  fn(); // 预热
  const t0 = performance.now();
  const result = fn();
  const ms = performance.now() - t0;
  return { name, ms, result };
}

console.log("三国：冰河时代 — 基准测试\n");

// —— 1. 城建模拟吞吐 ——
{
  const midGame = () => {
    const s = createInitialState(99);
    for (const r of Object.keys(s.resources)) s.resources[r] = 99999;
    for (let i = 0; i < 5; i++) upgrade(s, "furnace");
    for (const id of ["hunter", "lumber", "coalMine", "ironMine", "house", "warehouse", "kitchen", "clinic"]) {
      for (let i = 0; i < 4; i++) upgrade(s, id);
    }
    s.population = 40;
    return s;
  };
  const N = 200000;
  const { ms } = bench("sim", () => {
    const s = midGame();
    runTicks(s, N);
    return s;
  });
  const ticksPerSec = (N / ms) * 1000;
  const daysPerSec = ticksPerSec / TICKS_PER_DAY;
  const budget = ((ms / N) / TICK_MS) * 100;
  console.log(`城建模拟：${fmt(N)} tick 用时 ${ms.toFixed(1)}ms`);
  console.log(`  → ${fmt(ticksPerSec)} tick/s（${fmt(daysPerSec)} 游戏日/s，单 tick 占帧预算 ${budget.toFixed(3)}%）`);
}

// —— 2. 自动战斗吞吐 ——
{
  const N = 20000;
  const rng = mulberry32(7);
  const { ms } = bench("battle", () => {
    let wins = 0;
    for (let i = 0; i < N; i++) {
      const atk = [
        makeEnemyUnit({ name: "A1", faction: "shu", troop: "infantry", atk: 90, def: 40, troops: 300 }),
        makeEnemyUnit({ name: "A2", faction: "shu", troop: "archer", atk: 80, def: 30, troops: 260 }),
        makeEnemyUnit({ name: "A3", faction: "shu", troop: "cavalry", atk: 85, def: 35, troops: 280 }),
      ];
      const def = [
        makeEnemyUnit({ name: "D1", faction: "wei", troop: "infantry", atk: 88, def: 42, troops: 300 }),
        makeEnemyUnit({ name: "D2", faction: "wei", troop: "cavalry", atk: 84, def: 32, troops: 270 }),
      ];
      if (simulateBattle(atk, def, rng).winner === "attacker") wins++;
    }
    return wins;
  });
  console.log(`自动战斗：${fmt(N)} 场（3v2 满阵）用时 ${ms.toFixed(1)}ms → ${fmt((N / ms) * 1000)} 场/s`);
}

// —— 3. 招贤抽取吞吐 ——
{
  const N = 1000000;
  const rng = mulberry32(13);
  const { ms } = bench("gacha", () => {
    const counts = { blue: 0, purple: 0, orange: 0, red: 0 };
    for (let i = 0; i < N; i++) counts[rollQuality(rng, 5)]++;
    return counts;
  });
  console.log(`招贤抽取：${fmt(N)} 次用时 ${ms.toFixed(1)}ms → ${fmt((N / ms) * 1000)} 次/s`);
}

console.log("\n基准完成。");
