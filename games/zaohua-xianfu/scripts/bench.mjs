import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const battleRuns = 200;
const battleBudgetMs = 800;
const productionRuns = 5000;
const warmupRuns = 10;

function roundMs(value) {
  return Number(value.toFixed(2));
}

function errorReport(error) {
  return {
    ok: false,
    battles: { runs: 0, expectedRuns: battleRuns, budgetMs: battleBudgetMs, elapsedMs: null },
    production: { runs: 0, expectedRuns: productionRuns, elapsedMs: null },
    error: {
      name: error instanceof Error ? error.name : "Error",
      message: error instanceof Error ? error.message : String(error),
    },
  };
}

try {
  const { simulate } = await import(pathToFileURL(join(root, "src/combat/battle.js")).href);
  const { produce } = await import(pathToFileURL(join(root, "src/mansion/production.js")).href);
  const { reduce, defaultState } = await import(pathToFileURL(join(root, "src/core/store.js")).href);
  const { towerEnemy } = await import(pathToFileURL(join(root, "src/data/enemies.js")).href);

  const state = reduce(defaultState(), {
    type: "CHOOSE_FACTION",
    faction: "divine",
    name: "bench",
    now: 1,
  });

  const runBattle = (index) =>
    simulate({
      seed: 1000 + index,
      heroIds: state.party,
      foes: towerEnemy(1 + (index % 20)).foes,
      state,
      equipped: state.equipped,
    });

  for (let index = -warmupRuns; index < 0; index += 1) runBattle(index);

  let wins = 0;
  let losses = 0;
  let invalidBattles = 0;
  let totalTicks = 0;
  const battleStart = performance.now();
  for (let index = 0; index < battleRuns; index += 1) {
    const result = runBattle(index);
    if (result?.winner === "a") wins += 1;
    else if (result?.winner === "b") losses += 1;
    else invalidBattles += 1;
    if (Number.isFinite(result?.ticks) && Array.isArray(result?.frames)) totalTicks += result.ticks;
    else invalidBattles += 1;
  }
  const battleElapsedMs = performance.now() - battleStart;

  const productionTotals = {};
  let invalidProduction = 0;
  const productionStart = performance.now();
  for (let index = 0; index < productionRuns; index += 1) {
    const result = produce(state, 0.1);
    for (const [resource, amount] of Object.entries(result ?? {})) {
      if (!Number.isFinite(amount)) invalidProduction += 1;
      productionTotals[resource] = (productionTotals[resource] ?? 0) + amount;
    }
  }
  const productionElapsedMs = performance.now() - productionStart;
  const productionChecksum = Object.values(productionTotals).reduce((sum, amount) => sum + amount, 0);

  const battlesOk =
    wins + losses === battleRuns &&
    invalidBattles === 0 &&
    totalTicks > 0 &&
    battleElapsedMs < battleBudgetMs;
  const productionOk =
    invalidProduction === 0 &&
    Number.isFinite(productionChecksum) &&
    productionChecksum > 0;
  const report = {
    ok: battlesOk && productionOk,
    battles: {
      ok: battlesOk,
      runs: battleRuns,
      budgetMs: battleBudgetMs,
      elapsedMs: roundMs(battleElapsedMs),
      wins,
      losses,
      invalid: invalidBattles,
      totalTicks,
    },
    production: {
      ok: productionOk,
      runs: productionRuns,
      elapsedMs: roundMs(productionElapsedMs),
      invalid: invalidProduction,
      checksum: Number(productionChecksum.toFixed(4)),
    },
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
} catch (error) {
  console.log(JSON.stringify(errorReport(error), null, 2));
  process.exitCode = 1;
}
