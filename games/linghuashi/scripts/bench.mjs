// 性能基准：笔迹识别与战斗 tick 必须足够便宜（60fps 预算内）。
import { classifyStroke } from "../src/drawing/recognizer.js";
import { createBattle } from "../src/combat/battle.js";
import { generateTrajectory, TRAJECTORY_TYPES } from "./trajectories.mjs";

const samplesPerType = 500;
const samples = [];
for (const type of TRAJECTORY_TYPES) {
  for (let variant = 0; variant < samplesPerType; variant += 1) {
    samples.push({
      expectedType: type,
      points: generateTrajectory(type, variant),
    });
  }
}

for (let variant = 0; variant < 25; variant += 1) {
  for (const type of TRAJECTORY_TYPES) {
    classifyStroke(generateTrajectory(type, variant));
  }
}

const failures = [];
const mismatches = [];
const timings = [];
const timingsByType = Object.fromEntries(TRAJECTORY_TYPES.map((type) => [type, []]));
const recognizedCounts = {};
const representativeStrokes = {};
const startedAt = performance.now();

for (const sample of samples) {
  const strokeStartedAt = performance.now();
  const result = classifyStroke(sample.points);
  const elapsed = performance.now() - strokeStartedAt;

  timings.push(elapsed);
  timingsByType[sample.expectedType].push(elapsed);
  recognizedCounts[result.type] = (recognizedCounts[result.type] ?? 0) + 1;
  representativeStrokes[sample.expectedType] ??= result;
  if (result.type !== sample.expectedType) {
    mismatches.push({ expected: sample.expectedType, recognized: result.type });
  }
}

const recognitionMs = performance.now() - startedAt;
const perStrokeMs = recognitionMs / samples.length;
const p50Ms = percentile(timings, 0.5);
const p95Ms = percentile(timings, 0.95);

if (TRAJECTORY_TYPES.length !== 6) {
  failures.push(`expected 6 trajectory generators, got ${TRAJECTORY_TYPES.length}`);
}
if (mismatches.length > 0) {
  const first = mismatches[0];
  failures.push(
    `${mismatches.length} recognition mismatches; first expected ${first.expected}, got ${first.recognized}`,
  );
}
if (!Number.isFinite(perStrokeMs) || !Number.isFinite(p50Ms) || !Number.isFinite(p95Ms)) {
  failures.push("recognition timing produced a non-finite value");
}
if (perStrokeMs > 4) failures.push(`mean recognition time ${perStrokeMs.toFixed(3)}ms exceeded 4ms`);
if (p95Ms > 4) failures.push(`recognition p95 ${p95Ms.toFixed(3)}ms exceeded 4ms`);

const battleRounds = 50;
const initialEnemyHp = 100_000;
const battle = createBattle({
  player: {
    id: "bench-player",
    name: "bench-player",
    classId: "fa",
    element: "fire",
    hp: 50_000,
    atk: 20,
    qi: 2_000,
  },
  enemy: {
    id: "bench-enemy",
    name: "bench-enemy",
    classId: "ti",
    element: "earth",
    hp: initialEnemyHp,
    atk: 100,
  },
  seed: 2026,
});

let battleCasts = 0;
const battleStartedAt = performance.now();
for (let round = 0; round < battleRounds; round += 1) {
  const type = TRAJECTORY_TYPES[round % TRAJECTORY_TYPES.length];
  const castResult = battle.cast(representativeStrokes[type]);
  battleCasts += castResult.events.filter((event) => event.type === "cast").length;
  battle.tick(1_800);
}
const battleMs = performance.now() - battleStartedAt;
const battleState = battle.getState();

if (battleCasts !== battleRounds) {
  failures.push(`expected ${battleRounds} battle casts, got ${battleCasts}`);
}
if (battleState.finished !== null) {
  failures.push(`stress battle ended early with ${battleState.finished}`);
}
if (battleState.enemy.hp >= initialEnemyHp) {
  failures.push("50-round stress battle did no enemy damage");
}

const byType = Object.fromEntries(TRAJECTORY_TYPES.map((type) => [
  type,
  {
    samples: timingsByType[type].length,
    p50Ms: rounded(percentile(timingsByType[type], 0.5)),
    p95Ms: rounded(percentile(timingsByType[type], 0.95)),
  },
]));

console.log(JSON.stringify({
  trajectoryTypes: TRAJECTORY_TYPES.length,
  strokes: samples.length,
  samplesPerType,
  generatedPoints: samples.reduce((total, sample) => total + sample.points.length, 0),
  ms: rounded(recognitionMs),
  perStrokeMs: rounded(perStrokeMs),
  p50Ms: rounded(p50Ms),
  p95Ms: rounded(p95Ms),
  byType,
  recognizedCounts,
  mismatches: mismatches.length,
  battle: {
    rounds: battleRounds,
    casts: battleCasts,
    ms: rounded(battleMs),
    perRoundMs: rounded(battleMs / battleRounds),
    enemyDamage: rounded(initialEnemyHp - battleState.enemy.hp),
  },
}, null, 2));

if (failures.length > 0) {
  for (const failure of failures) console.error(`bench: ${failure}`);
  process.exitCode = 2;
}

function percentile(values, ratio) {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index];
}

function rounded(value) {
  return Number(value.toFixed(4));
}
