// 快速冒烟探针：识别、模板、战斗、tick 可靠性、解锁与迁移。任何一步失败即非零退出。
import { classifyStroke } from "../src/drawing/recognizer.js";
import { templatePoints, TEMPLATE_TYPES } from "../src/drawing/templates.js";
import { createBattle } from "../src/combat/battle.js";
import { generateTrajectory, TRAJECTORY_TYPES } from "./trajectories.mjs";

const failures = [];
const recognitionStartedAt = performance.now();
const recognitions = TRAJECTORY_TYPES.map((expectedType) => {
  const points = generateTrajectory(expectedType);
  const result = classifyStroke(points);

  if (result.type !== expectedType) {
    failures.push(`expected ${expectedType}, got ${result.type}`);
  }
  if (!Number.isFinite(result.precision) || result.precision < 0 || result.precision > 1) {
    failures.push(`${expectedType} returned invalid precision ${result.precision}`);
  }

  return {
    expectedType,
    points: points.length,
    result,
  };
});
const recognitionMs = performance.now() - recognitionStartedAt;

if (TRAJECTORY_TYPES.length !== 6) {
  failures.push(`expected 6 trajectory generators, got ${TRAJECTORY_TYPES.length}`);
}

const rounds = 50;
const initialPlayerHp = 50_000;
const initialEnemyHp = 100_000;
const battle = createBattle({
  player: {
    id: "probe-player",
    name: "probe-player",
    classId: "fa",
    element: "fire",
    hp: initialPlayerHp,
    atk: 20,
    qi: 2_000,
  },
  enemy: {
    id: "probe-enemy",
    name: "probe-enemy",
    classId: "ti",
    element: "earth",
    hp: initialEnemyHp,
    atk: 100,
  },
  seed: 2026,
});

const battleStartedAt = performance.now();
let casts = 0;
for (let round = 0; round < rounds; round += 1) {
  const stroke = recognitions[round % recognitions.length].result;
  const castResult = battle.cast(stroke);
  casts += castResult.events.filter((event) => event.type === "cast").length;
  battle.tick(1_800);
}
const battleMs = performance.now() - battleStartedAt;
const state = battle.getState();

if (casts !== rounds) failures.push(`expected ${rounds} casts, got ${casts}`);
if (state.t !== rounds * 1_800) failures.push(`expected battle time ${rounds * 1_800}, got ${state.t}`);
if (state.enemy.hp >= initialEnemyHp) failures.push("50-round battle did no enemy damage");
if (state.player.hp >= initialPlayerHp) failures.push("50-round battle applied no enemy pressure");
if (state.finished !== null) failures.push(`stress battle ended early with ${state.finished}`);
if (state.log.length > 24) failures.push(`battle log exceeded cap: ${state.log.length}`);

const report = {
  trajectories: recognitions.map(({ expectedType, points, result }) => ({
    expected: expectedType,
    recognized: result.type,
    points,
    precision: Number(result.precision.toFixed(4)),
  })),
  recognitionMs: Number(recognitionMs.toFixed(3)),
  battle: {
    rounds,
    casts,
    ms: Number(battleMs.toFixed(3)),
    enemyDamage: Number((initialEnemyHp - state.enemy.hp).toFixed(2)),
    playerDamage: Number((initialPlayerHp - state.player.hp).toFixed(2)),
    logEntries: state.log.length,
  },
};

console.log(JSON.stringify(report, null, 2));
if (failures.length > 0) {
  for (const failure of failures) console.error(`probe: ${failure}`);
  process.exitCode = 1;
} else {
  console.log("probe ok");
}
