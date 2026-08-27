import { isMainThread, parentPort, Worker } from 'node:worker_threads';
import { performance } from 'node:perf_hooks';

import {
  DT,
  PROBE_STEPS,
  createFourPlayerMatch,
  errorMessage,
  findNonFinite,
  getWiredCombat,
  getPlayers,
  loadOptionalAi,
  loadSimulation,
  makeProbeInputs,
  makeSeededRandom,
  scanProbePurity,
  validateRoster,
} from './harness.mjs';

const P99_WARNING_MS = 50;
const HANG_TIMEOUT_MS = 5_000;
const MOVEMENT_EPSILON_SQUARED = 1e-8;
const HUB_SCRIPT_TIMEOUT_STEPS = 60 * 20;
const MODEL_SLUG = 'gpt-5.6-sol-xhigh-fast';

if (isMainThread) {
  console.log(`MODEL_SLUG: ${MODEL_SLUG}`);
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

        console.log(
          `PROBE PASS: ${PROBE_STEPS} steps (${result.simulatedSeconds}s), ` +
            `hub→${result.phase}, ${result.arenaKills} arena kill(s), ` +
            `real combat ` +
            (result.wiredCombat === undefined
              ? 'status unavailable'
              : result.wiredCombat
                ? 'wired'
                : 'not wired'),
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
    heartbeat('purity scan');
    const purity = await scanProbePurity();
    heartbeat('loading');
    const simulation = await loadSimulation();
    const ai = await loadOptionalAi();
    if (!ai) {
      throw new Error('AI module is required to verify bot think() calls');
    }
    let state = createFourPlayerMatch(simulation, {
      phase: 'hub',
      gloveId: null,
      offhandId: null,
      unlocked: ['cotton'],
    });
    const wiredCombat = getWiredCombat(simulation);
    if (wiredCombat !== true) {
      throw new Error(
        `production combat is not statically wired: ${String(wiredCombat)}`,
      );
    }
    let view = simulation.getView(state);
    const hubJourney = createHubJourney(view);

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
    const activity = { botThinkCalls: 0, botSlapAttempts: 0 };

    for (let stepIndex = 0; stepIndex < PROBE_STEPS; stepIndex += 1) {
      heartbeat('simulation step', stepIndex);
      const inputs = makeProbeInputs(
        view,
        stepIndex,
        ai,
        random,
        activity,
      );
      if (view.phase === 'hub') {
        inputs.p0 = {
          ...inputs.p0,
          ...makeHubJourneyInput(view, hubJourney),
        };
      }
      const previousView = view;
      const startedAt = performance.now();
      const nextState = simulation.step(state, inputs, DT);
      stepDurations.push(performance.now() - startedAt);
      state = nextState ?? state;
      view = simulation.getView(state);
      observeHubJourney(hubJourney, previousView, view, stepIndex + 1);

      if (
        view.phase === 'hub' &&
        stepIndex + 1 >= HUB_SCRIPT_TIMEOUT_STEPS
      ) {
        throw new Error(
          `hub journey did not enter arena within ${HUB_SCRIPT_TIMEOUT_STEPS} steps`,
        );
      }

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

    validateHubJourney(hubJourney, view);

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

    if (activity.botThinkCalls === 0) {
      throw new Error(
        `bot think() was not called across ${PROBE_STEPS} simulation steps`,
      );
    }

    if (activity.botSlapAttempts === 0) {
      throw new Error(
        `bots made no slap attempts across ${PROBE_STEPS} simulation steps`,
      );
    }

    const finalPlayers = getPlayers(view);
    const kills = totalKills(finalPlayers) - initialKills;
    if (!Number.isFinite(kills)) {
      throw new Error(`non-finite kill count after simulation: ${String(kills)}`);
    }
    if (kills < 1) {
      throw new Error(
        `zero kills observed across ${PROBE_STEPS} simulation steps`,
      );
    }
    const arenaKills = kills - hubJourney.killsAtArena;
    if (arenaKills < 1) {
      throw new Error(
        `zero kills observed after entering arena at step ${hubJourney.enteredArenaStep}`,
      );
    }
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
        status: 'pass',
        steps: PROBE_STEPS,
        players: initialPlayers.length,
        dt: DT,
        simulatedSeconds: PROBE_STEPS * DT,
        phase: view.phase,
        kills,
        arenaKills,
        movedPlayers: movedPlayerIds.size,
        maxMovement: Math.sqrt(maximumMovementSquared),
        entityUpdateSteps: entityUpdates,
        p99StepMs: sortedDurations[p99Index],
        maxStepMs: Math.max(...stepDurations),
        ai: ai ? 'think' : 'fallback',
        botThinkCalls: activity.botThinkCalls,
        botSlapAttempts: activity.botSlapAttempts,
        usingRealCombat: wiredCombat,
        wiredCombat,
        hubJourney: {
          targetGloveId: hubJourney.targetGloveId,
          focusObserved: hubJourney.focusObserved,
          equippedMainGloveId: hubJourney.equippedMainGloveId,
          equippedAtStep: hubJourney.equippedAtStep,
          enteredArenaAtStep: hubJourney.enteredArenaStep,
          killsAtArenaEntry: hubJourney.killsAtArena,
        },
        purityFilesScanned: purity.filesScanned,
      },
    });
  } catch (error) {
    parentPort.postMessage({
      type: 'failure',
      message: errorMessage(error),
    });
  }
}

function createHubJourney(view) {
  if (view?.phase !== 'hub') {
    throw new Error(`probe must start in hub phase; got ${String(view?.phase)}`);
  }
  if (!view.hub || !Array.isArray(view.hub.pedestals)) {
    throw new Error('hub view is missing its pedestal list');
  }
  if (view.hub.mainGloveId !== null || view.hub.portalReady !== false) {
    throw new Error('hub probe must start without a selected main glove');
  }

  const target = view.hub.pedestals.find(
    (pedestal) => pedestal?.unlocked === true && pedestal.selected !== true,
  );
  if (!target) {
    throw new Error('hub has no unlocked, unselected pedestal to approach');
  }
  if (
    !Number.isFinite(target.x) ||
    !Number.isFinite(target.z) ||
    !Number.isFinite(view.hub.portal?.x) ||
    !Number.isFinite(view.hub.portal?.z)
  ) {
    throw new Error('hub probe route contains a non-finite coordinate');
  }

  return {
    targetGloveId: target.gloveId,
    target: { x: target.x, z: target.z },
    portal: { x: view.hub.portal.x, z: view.hub.portal.z },
    focusObserved: false,
    equippedMainGloveId: null,
    equippedAtStep: null,
    enteredArenaStep: null,
    killsAtArena: null,
  };
}

function makeHubJourneyInput(view, journey) {
  const player = getPlayers(view).find((candidate) => candidate?.id === 'p0');
  if (!player) {
    throw new Error('hub journey cannot find human player p0');
  }

  if (view.hub.mainGloveId === journey.targetGloveId) {
    return routeInput(player, journey.portal);
  }

  if (view.hub.focusGloveId === journey.targetGloveId) {
    return routeInput(player, journey.target, true);
  }

  return routeInput(player, journey.target);
}

function routeInput(player, destination, interact = false) {
  const deltaX = destination.x - player.x;
  const deltaZ = destination.z - player.z;
  const distance = Math.hypot(deltaX, deltaZ);
  const moving = distance > 0.05;

  return {
    moveX: moving ? deltaX / distance : 0,
    moveZ: moving ? deltaZ / distance : 0,
    yaw: moving ? Math.atan2(-deltaX, -deltaZ) : player.yaw,
    slap: false,
    skill: false,
    switchGlove: false,
    dash: false,
    jump: false,
    interact,
  };
}

function observeHubJourney(journey, previousView, view, completedSteps) {
  if (view.hub?.focusGloveId === journey.targetGloveId) {
    journey.focusObserved = true;
  }

  if (
    journey.equippedAtStep === null &&
    view.hub?.mainGloveId === journey.targetGloveId
  ) {
    if (!journey.focusObserved) {
      throw new Error(
        `equipped ${journey.targetGloveId} without observing pedestal focus`,
      );
    }
    journey.equippedMainGloveId = view.hub.mainGloveId;
    journey.equippedAtStep = completedSteps;
  }

  if (previousView.phase === 'hub' && view.phase === 'arena') {
    if (journey.equippedAtStep === null) {
      throw new Error('entered arena before equipping a main glove');
    }
    journey.enteredArenaStep = completedSteps;
    journey.killsAtArena = totalKills(getPlayers(view));
  }
}

function validateHubJourney(journey, view) {
  if (!journey.focusObserved) {
    throw new Error(
      `never approached unlocked pedestal ${journey.targetGloveId}`,
    );
  }
  if (journey.equippedMainGloveId !== journey.targetGloveId) {
    throw new Error(
      `failed to equip unlocked pedestal ${journey.targetGloveId} as main glove`,
    );
  }
  if (journey.enteredArenaStep === null || view.phase !== 'arena') {
    throw new Error(`hub portal did not transition phase to arena`);
  }
  if (!Number.isFinite(journey.killsAtArena)) {
    throw new Error('kill baseline was not captured at arena entry');
  }

  const player = getPlayers(view).find((candidate) => candidate?.id === 'p0');
  if (player?.gloveId !== journey.targetGloveId) {
    throw new Error(
      `equipped main glove was not retained in arena: ${String(player?.gloveId)}`,
    );
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
  return players.reduce((total, player) => {
    if (!Number.isFinite(player?.kills)) {
      throw new Error(
        `player ${String(player?.id)} has non-finite kills: ` +
          `${String(player?.kills)}`,
      );
    }
    return total + player.kills;
  }, 0);
}
