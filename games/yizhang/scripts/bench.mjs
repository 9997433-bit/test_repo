import { performance } from 'node:perf_hooks';

import {
  DT,
  PLAYER_COUNT,
  PROBE_STEPS,
  createFourPlayerMatch,
  errorMessage,
  getWiredCombat,
  loadSimulation,
  makeBenchInputFrames,
  validateRoster,
} from './harness.mjs';

const WARMUP_STEPS = 60 * 10;

try {
  const simulation = await loadSimulation();
  const wiredCombat = getWiredCombat(simulation);
  let state = createFourPlayerMatch(simulation);
  let view = simulation.getView(state);
  validateRoster(view);
  let inputFrames = makeBenchInputFrames(view);

  for (let stepIndex = 0; stepIndex < WARMUP_STEPS; stepIndex += 1) {
    state =
      simulation.step(
        state,
        inputFrames[stepIndex % inputFrames.length],
        DT,
      ) ?? state;
  }

  state = createFourPlayerMatch(simulation);
  view = simulation.getView(state);
  validateRoster(view);
  inputFrames = makeBenchInputFrames(view);

  const startedAt = performance.now();
  for (let stepIndex = 0; stepIndex < PROBE_STEPS; stepIndex += 1) {
    state =
      simulation.step(
        state,
        inputFrames[stepIndex % inputFrames.length],
        DT,
      ) ?? state;
  }
  const elapsedSeconds = (performance.now() - startedAt) / 1_000;
  const stepsPerSec = PROBE_STEPS / elapsedSeconds;

  if (!Number.isFinite(stepsPerSec) || stepsPerSec <= 0) {
    throw new Error(`invalid benchmark result: ${String(stepsPerSec)}`);
  }

  console.log(
    JSON.stringify({
      stepsPerSec,
      players: PLAYER_COUNT,
      dt: DT,
      ...(typeof wiredCombat === 'boolean' ? { wiredCombat } : {}),
    }),
  );
} catch (error) {
  console.error(`BENCH FAIL: ${errorMessage(error)}`);
  process.exitCode = 1;
}
