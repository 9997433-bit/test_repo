import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { simulate } from "../src/combat/battle.js";
import { defaultState, reduce } from "../src/core/store.js";
import { towerEnemy } from "../src/data/enemies.js";
import { heroesOf } from "../src/data/heroes.js";

const BASELINE_ARTIFACTS = Object.freeze(["zhumo", "qixing", "wanhun", "lundao"]);
const ENDGAME_ARTIFACTS = Object.freeze(["zhuque", "qixing", "wanhun", "hetu"]);
const ENDGAME_NO_REVIVE_ARTIFACTS = Object.freeze(["zhuque", "qixing", "taixu", "hetu"]);

export const TOWER_STRESS_CONFIG = Object.freeze({
  floors: Object.freeze([20, 25, 30, 35, 40, 45]),
  factions: Object.freeze(["mortal", "divine", "demon"]),
  runsPerFloor: 60,
  seedBase: 260826000,
  scenarios: Object.freeze([
    Object.freeze({
      id: "spirit-5",
      realm: Object.freeze({ index: 4, layer: 5 }),
      buildingLevel: 8,
      artifacts: BASELINE_ARTIFACTS,
    }),
    Object.freeze({
      id: "mahayana-5",
      realm: Object.freeze({ index: 7, layer: 5 }),
      buildingLevel: 12,
      artifacts: BASELINE_ARTIFACTS,
    }),
    Object.freeze({
      id: "tribulation-9",
      realm: Object.freeze({ index: 8, layer: 9 }),
      buildingLevel: 12,
      artifacts: ENDGAME_ARTIFACTS,
    }),
    Object.freeze({
      id: "tribulation-9-no-revive",
      realm: Object.freeze({ index: 8, layer: 9 }),
      buildingLevel: 12,
      artifacts: ENDGAME_NO_REVIVE_ARTIFACTS,
    }),
    Object.freeze({
      id: "ascend-1",
      realm: Object.freeze({ index: 9, layer: 1 }),
      buildingLevel: 12,
      artifacts: ENDGAME_ARTIFACTS,
    }),
  ]),
});

function round(value, digits = 4) {
  return Number(value.toFixed(digits));
}

function stressState(faction, scenario) {
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
    realm: { ...base.realm, ...scenario.realm },
    buildings: [
      ...base.buildings,
      {
        id: "stress-alchemy",
        type: "alchemy",
        level: scenario.buildingLevel,
        x: 1,
        y: 1,
      },
      {
        id: "stress-forge",
        type: "forge",
        level: scenario.buildingLevel,
        x: 1,
        y: 2,
      },
      {
        id: "stress-drill",
        type: "drill",
        level: scenario.buildingLevel,
        x: 1,
        y: 3,
      },
    ],
    equipped: [...scenario.artifacts],
  };
}

export function runTowerStress() {
  const { floors, factions, runsPerFloor, scenarios, seedBase } = TOWER_STRESS_CONFIG;
  const results = {};
  let invalid = 0;
  let completed = 0;
  let totalTicks = 0;
  const start = performance.now();

  for (const [scenarioIndex, scenario] of scenarios.entries()) {
    const winRates = Object.fromEntries(factions.map((faction) => [faction, {}]));
    for (const faction of factions) {
      const state = stressState(faction, scenario);
      for (const floor of floors) {
        let wins = 0;
        for (let run = 0; run < runsPerFloor; run += 1) {
          const result = simulate({
            seed: seedBase + scenarioIndex * 100000 + floor * runsPerFloor + run,
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
    results[scenario.id] = {
      realm: { ...scenario.realm },
      buildingLevels: { alchemy: scenario.buildingLevel, forge: scenario.buildingLevel, drill: scenario.buildingLevel },
      artifacts: [...scenario.artifacts],
      winRates,
      checkpoints: Object.fromEntries(
        floors.map((floor) => [
          floor,
          Object.fromEntries(factions.map((faction) => [faction, winRates[faction][floor]])),
        ]),
      ),
    };
  }

  const expectedBattles = scenarios.length * factions.length * floors.length * runsPerFloor;
  const report = {
    ok: invalid === 0 && completed === expectedBattles && totalTicks > 0,
    floors: [...floors],
    factions: [...factions],
    scenarios: scenarios.map((scenario) => scenario.id),
    runsPerFloor,
    expectedBattles,
    completedBattles: completed,
    invalid,
    totalTicks,
    elapsedMs: round(performance.now() - start, 2),
    partySize: 6,
    seedBase,
    results,
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
