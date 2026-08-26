import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { simulate } from "../src/combat/battle.js";
import { defaultState, reduce } from "../src/core/store.js";
import { towerEnemy } from "../src/data/enemies.js";
import { heroesOf } from "../src/data/heroes.js";

export const TOWER_STRESS_CONFIG = Object.freeze({
  firstFloor: 1,
  lastFloor: 30,
  factions: Object.freeze(["mortal", "divine", "demon"]),
  runsPerFloor: 60,
  seedBase: 260826000,
  realm: Object.freeze({ index: 3, layer: 8 }),
  buildingLevels: Object.freeze({ pill: 8, forge: 8 }),
  artifacts: Object.freeze(["qixing", "lundao", "zhumo", "wanhun"]),
});

function round(value, digits = 4) {
  return Number(value.toFixed(digits));
}

function stressState(faction) {
  const base = reduce(defaultState(), {
    type: "CHOOSE_FACTION",
    faction,
    name: "tower-stress",
    now: 1,
  });
  const party = heroesOf(faction)
    .slice(0, 6)
    .map((hero) => hero.id);
  return {
    ...base,
    unlockedHeroes: party,
    party,
    realm: { ...base.realm, ...TOWER_STRESS_CONFIG.realm },
    buildings: [
      ...base.buildings,
      {
        id: "stress-pill",
        type: "pill",
        level: TOWER_STRESS_CONFIG.buildingLevels.pill,
        x: 1,
        y: 1,
      },
      {
        id: "stress-forge",
        type: "forge",
        level: TOWER_STRESS_CONFIG.buildingLevels.forge,
        x: 1,
        y: 2,
      },
    ],
    equipped: [...TOWER_STRESS_CONFIG.artifacts],
  };
}

export function runTowerStress() {
  const { firstFloor, lastFloor, factions, runsPerFloor, seedBase } = TOWER_STRESS_CONFIG;
  const winRates = Object.fromEntries(factions.map((faction) => [faction, {}]));
  let invalid = 0;
  let completed = 0;
  let totalTicks = 0;
  const start = performance.now();

  for (const faction of factions) {
    const state = stressState(faction);
    for (let floor = firstFloor; floor <= lastFloor; floor += 1) {
      let wins = 0;
      for (let run = 0; run < runsPerFloor; run += 1) {
        const result = simulate({
          seed: seedBase + floor * runsPerFloor + run,
          heroIds: state.party,
          foes: towerEnemy(floor).foes,
          state,
          equipped: state.equipped,
        });
        if (
          (result?.winner !== "a" && result?.winner !== "b") ||
          !Number.isFinite(result?.ticks) ||
          result.ticks <= 0 ||
          !Array.isArray(result?.frames) ||
          result.frames.length === 0
        ) {
          invalid += 1;
          continue;
        }
        completed += 1;
        totalTicks += result.ticks;
        if (result.winner === "a") wins += 1;
      }
      winRates[faction][floor] = round(wins / runsPerFloor);
    }
  }

  const expectedBattles = factions.length * (lastFloor - firstFloor + 1) * runsPerFloor;
  const report = {
    ok: invalid === 0 && completed === expectedBattles && totalTicks > 0,
    floors: { first: firstFloor, last: lastFloor },
    factions: [...factions],
    runsPerFloor,
    expectedBattles,
    completedBattles: completed,
    invalid,
    totalTicks,
    elapsedMs: round(performance.now() - start, 2),
    scenario: {
      realm: { ...TOWER_STRESS_CONFIG.realm },
      partySize: 6,
      buildingLevels: { ...TOWER_STRESS_CONFIG.buildingLevels },
      artifacts: [...TOWER_STRESS_CONFIG.artifacts],
      seedBase,
    },
    winRates,
  };
  return report;
}

const directPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (directPath === fileURLToPath(import.meta.url)) {
  try {
    const report = runTowerStress();
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          error: {
            name: error instanceof Error ? error.name : "Error",
            message: error instanceof Error ? error.message : String(error),
          },
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  }
}
