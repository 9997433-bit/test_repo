import { isMainThread, parentPort, Worker } from 'node:worker_threads';
import { performance } from 'node:perf_hooks';

import {
  DT,
  PROBE_STEPS,
  createFourPlayerMatch,
  errorMessage,
  findNonFinite,
  getPlayers,
  loadOptionalAi,
  loadSimulation,
  makeProbeInputs,
  makeSeededRandom,
  validateRoster,
} from './harness.mjs';

const P99_WARNING_MS = 50;
const HANG_TIMEOUT_MS = 5_000;
const MOVEMENT_EPSILON_SQUARED = 1e-8;

if (isMainThread) {
  await superviseProbe();
} else {
  await executeProbeWorker();
}

function superviseProbe() {
  return new Promise((resolve) => {
    const worker = new Worker(new URL(import.meta.url));
    let settled = false;
    let phase = 'startup';
    let activeStep = null;
    let watchdog;

    const armWatchdog = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(async () => {
        if (settled) {
          return;
        }

        settled = true;
        await worker.terminate();
        const location =
          activeStep === null ? phase : `${phase} at step ${activeStep}`;
        console.error(
          `PROBE FAIL: hang detected during ${location}; no progress for ` +
            `${HANG_TIMEOUT_MS}ms`,
        );
        process.exitCode = 1;
        resolve();
      }, HANG_TIMEOUT_MS);
    };

    armWatchdog();

    worker.on('message', (message) => {
      if (settled) {
        return;
      }

      if (message?.type === 'heartbeat') {
        phase = message.phase;
        activeStep = message.step ?? null;
        armWatchdog();
        return;
      }

      if (message?.type === 'failure') {
        settled = true;
        clearTimeout(watchdog);
        console.error(`PROBE FAIL: ${message.message}`);
        process.exitCode = 1;
        resolve();
        return;
      }

      if (message?.type === 'result') {
        settled = true;
        clearTimeout(watchdog);
        const result = message.result;

        if (result.p99StepMs > P99_WARNING_MS) {
          console.warn(
            `PROBE WARNING: step p99 ${result.p99StepMs.toFixed(3)}ms ` +
              `exceeds ${P99_WARNING_MS}ms budget`,
          );
        }

        const label =
          result.status === 'soft-pass' ? 'PROBE SOFT PASS' : 'PROBE PASS';
        const detail =
          result.status === 'soft-pass'
            ? 'zero kills, but players moved'
            : `${result.kills} kill(s) observed`;
        console.log(
          `${label}: ${PROBE_STEPS} steps (${result.simulatedSeconds}s), ` +
            `${detail}`,
        );
        console.log(JSON.stringify(result));
        resolve();
      }
    });

    worker.once('error', (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(watchdog);
      console.error(`PROBE FAIL: worker error: ${errorMessage(error)}`);
      process.exitCode = 1;
      resolve();
    });

    worker.once('exit', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(watchdog);
      console.error(
        `PROBE FAIL: worker exited before reporting a result (exit ${code})`,
      );
      process.exitCode = 1;
      resolve();
    });
  });
}

async function executeProbeWorker() {
  try {
    heartbeat('loading');
    const simulation = await loadSimulation();
    const ai = await loadOptionalAi();
    let state = createFourPlayerMatch(simulation);
    let view = simulation.getView(state);

    const initialNonFinite =
      findNonFinite(state) ?? findNonFinite(view, 'view');
    if (initialNonFinite) {
      throw new Error(`non-finite number before first step: ${initialNonFinite}`);
    }

    const initialPlayers = validateRoster(view);
    const initialById = new Map(
      initialPlayers.map((player) => [player.id, positionOf(player)]),
    );
    const initialKills = totalKills(initialPlayers);
    let previousSignature = playerSignature(initialPlayers);
    let entityUpdates = 0;
    let maximumMovementSquared = 0;
    const movedPlayerIds = new Set();
    const stepDurations = [];
    const random = makeSeededRandom(0x5eed1234);

    for (let stepIndex = 0; stepIndex < PROBE_STEPS; stepIndex += 1) {
      heartbeat('simulation step', stepIndex);
      const inputs = makeProbeInputs(view, stepIndex, ai, random);
      const startedAt = performance.now();
      const nextState = simulation.step(state, inputs, DT);
      stepDurations.push(performance.now() - startedAt);
      state = nextState ?? state;
      view = simulation.getView(state);

      const nonFinite =
        findNonFinite(state) ?? findNonFinite(view, 'view');
      if (nonFinite) {
        throw new Error(
          `non-finite number after step ${stepIndex + 1}: ${nonFinite}`,
        );
      }

      const players = validateRoster(view);
      const signature = playerSignature(players);
      if (signature !== previousSignature) {
        entityUpdates += 1;
        previousSignature = signature;
      }

      for (const player of players) {
        const initial = initialById.get(player.id);
        if (!initial) {
          continue;
        }
        const movementSquared = squaredDistance(initial, positionOf(player));
        maximumMovementSquared = Math.max(
          maximumMovementSquared,
          movementSquared,
        );
        if (movementSquared > MOVEMENT_EPSILON_SQUARED) {
          movedPlayerIds.add(player.id);
        }
      }

      heartbeat('simulation step complete', stepIndex);
    }

    if (entityUpdates === 0) {
      throw new Error(
        `no entity updates observed across ${PROBE_STEPS} simulation steps`,
      );
    }

    if (movedPlayerIds.size === 0) {
      throw new Error(
        `no player movement observed across ${PROBE_STEPS} simulation steps`,
      );
    }

    const finalPlayers = getPlayers(view);
    const kills = Math.max(0, totalKills(finalPlayers) - initialKills);
    const sortedDurations = [...stepDurations].sort(
      (left, right) => left - right,
    );
    const p99Index = Math.max(
      0,
      Math.ceil(sortedDurations.length * 0.99) - 1,
    );

    parentPort.postMessage({
      type: 'result',
      result: {
        status: kills === 0 ? 'soft-pass' : 'pass',
        steps: PROBE_STEPS,
        players: initialPlayers.length,
        dt: DT,
        simulatedSeconds: PROBE_STEPS * DT,
        kills,
        movedPlayers: movedPlayerIds.size,
        maxMovement: Math.sqrt(maximumMovementSquared),
        entityUpdateSteps: entityUpdates,
        p99StepMs: sortedDurations[p99Index],
        maxStepMs: Math.max(...stepDurations),
        ai: ai ? 'think' : 'fallback',
      },
    });
  } catch (error) {
    parentPort.postMessage({
      type: 'failure',
      message: errorMessage(error),
    });
  }
}

function heartbeat(phase, step) {
  parentPort.postMessage({ type: 'heartbeat', phase, step });
}

function playerSignature(players) {
  return JSON.stringify(players);
}

function positionOf(player) {
  return { x: player.x, y: player.y, z: player.z };
}

function squaredDistance(left, right) {
  const deltaX = right.x - left.x;
  const deltaY = right.y - left.y;
  const deltaZ = right.z - left.z;
  return deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;
}

function totalKills(players) {
  return players.reduce(
    (total, player) =>
      total + (Number.isFinite(player?.kills) ? player.kills : 0),
    0,
  );
}
