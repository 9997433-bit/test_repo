import {
  isMainThread,
  parentPort,
  Worker,
  workerData,
} from 'node:worker_threads';
import { performance } from 'node:perf_hooks';

import {
  DT,
  PROBE_STEPS,
  createFourPlayerMatch,
  errorMessage,
  findNonFinite,
  getWiredCombat,
  getPlayers,
  loadHeadlessLookInput,
  loadHeadlessLookRenderer,
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
// 视角契约阈值：snap 后水平机位必须在角色 20m 内，禁止 hub→arena 的 ~120m 飞越。
const CAMERA_SNAP_MAX_DIST = 20;
// locked 下角色前向与相机水平前向近似同向；同时钉点积与夹角，避免单一指标误读。
const LOCKED_FORWARD_MIN_DOT = 0.999;
const LOCKED_FORWARD_MAX_ANGLE_DEGREES = 3;
const LOCKED_FORWARD_MAX_ANGLE_RADIANS =
  (LOCKED_FORWARD_MAX_ANGLE_DEGREES * Math.PI) / 180;
const LOCKED_TARGET_MAX_ANGLE_RADIANS = 1e-9;
const LOOK_TURN_MIN_ANGLE_RADIANS = 0.5;
const INPUT_YAW_MAX_ERROR_RADIANS = 1e-9;
// getView() 的公开契约把 yaw round4；容差略高于最坏 0.00005rad 量化误差。
const VIEW_YAW_MAX_ERROR_RADIANS = 0.0001;
const LOCKED_CAMERA_MAX_BEHINDNESS = -3;
const DEFAULT_PROBE_SEEDS = Object.freeze([
  0x1a2b3c4d,
  0x5eed1234,
  0xc0ffee42,
]);
const MODEL_SLUG = process.env.MODEL_SLUG || 'yizhang-probe';

if (isMainThread) {
  console.log(`MODEL_SLUG: ${MODEL_SLUG}`);
  await superviseProbe(readProbeSeeds(process.env.PROBE_SEED));
} else {
  await executeProbeWorker();
}

async function superviseProbe(seeds) {
  const runs = [];
  for (const seed of seeds) {
    runs.push(await superviseProbeSeed(seed));
  }

  const passedRuns = runs.filter((run) => run.status === 'pass');
  const allPassed = passedRuns.length === runs.length;
  const summary = {
    status: allPassed ? 'pass' : 'fail',
    seedCount: runs.length,
    steps: PROBE_STEPS,
    simulatedSeconds: PROBE_STEPS * DT,
    kills: minimumMetric(passedRuns, 'kills'),
    arenaKills: minimumMetric(passedRuns, 'arenaKills'),
    movedPlayers: minimumMetric(passedRuns, 'movedPlayers'),
    cameraSnapMaxDist: maximumMetric(passedRuns, 'cameraSnapMaxDist'),
    lockedForwardMinDot: minimumMetric(passedRuns, 'lockedForwardMinDot'),
    lockedForwardMaxAngleDeg: maximumMetric(
      passedRuns,
      'lockedForwardMaxAngleDeg',
    ),
    lockedTurnMinAngleDeg: minimumMetric(passedRuns, 'lockedTurnAngleDeg'),
    lockedCameraMaxBehindness: maximumMetric(
      passedRuns,
      'lockedCameraBehindness',
    ),
    freeStationaryMaxYawDeltaDeg: maximumMetric(
      passedRuns,
      'freeStationaryYawDeltaDeg',
    ),
    freeMoveMaxYawErrorDeg: maximumMetric(
      passedRuns,
      'freeMoveYawErrorDeg',
    ),
    p99StepMs: maximumMetric(passedRuns, 'p99StepMs'),
    ai:
      allPassed && passedRuns.every((run) => run.ai === 'think')
        ? 'think'
        : 'unavailable',
    wiredCombat:
      allPassed && passedRuns.every((run) => run.wiredCombat === true),
    runs,
  };

  console.log(
    allPassed
      ? `PROBE PASS: ${runs.length}/${runs.length} fixed seeds passed`
      : `PROBE FAIL: ${passedRuns.length}/${runs.length} fixed seeds passed`,
  );
  console.log(JSON.stringify(summary));
  if (!allPassed) {
    process.exitCode = 1;
  }
}

function superviseProbeSeed(seed) {
  return new Promise((resolve) => {
    const seedLabel = formatSeed(seed);
    const worker = new Worker(new URL(import.meta.url), {
      workerData: { seed },
    });
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
        const message =
          `hang detected during ${location}; no progress for ` +
          `${HANG_TIMEOUT_MS}ms`;
        console.error(`PROBE FAIL [${seedLabel}]: ${message}`);
        resolve({ status: 'fail', seed: seedLabel, error: message });
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
        console.error(`PROBE FAIL [${seedLabel}]: ${message.message}`);
        resolve({
          status: 'fail',
          seed: seedLabel,
          error: message.message,
        });
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
          `PROBE PASS [${seedLabel}]: ${PROBE_STEPS} steps ` +
            `(${result.simulatedSeconds}s), ` +
            `hub→${result.phase}, ${result.arenaKills} arena kill(s), ` +
            `camera snap ≤${result.cameraSnapMaxDist.toFixed(3)}m, ` +
            `locked dot ≥${result.lockedForwardMinDot.toFixed(6)}, ` +
            `locked turn ${result.lockedTurnAngleDeg.toFixed(3)}°, ` +
            `behind ${result.lockedCameraBehindness.toFixed(3)}m, ` +
            `free hold Δ${result.freeStationaryYawDeltaDeg.toFixed(6)}°, ` +
            `free move error ${result.freeMoveYawErrorDeg.toFixed(6)}°, ` +
            `real combat ` +
            (result.wiredCombat === undefined
              ? 'status unavailable'
              : result.wiredCombat
                ? 'wired'
                : 'not wired'),
        );
        resolve(result);
      }
    });

    worker.once('error', (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(watchdog);
      const message = `worker error: ${errorMessage(error)}`;
      console.error(`PROBE FAIL [${seedLabel}]: ${message}`);
      resolve({ status: 'fail', seed: seedLabel, error: message });
    });

    worker.once('exit', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(watchdog);
      const message = `worker exited before reporting a result (exit ${code})`;
      console.error(`PROBE FAIL [${seedLabel}]: ${message}`);
      resolve({ status: 'fail', seed: seedLabel, error: message });
    });
  });
}

function readProbeSeeds(value) {
  if (value === undefined || value.trim() === '') {
    return DEFAULT_PROBE_SEEDS;
  }

  const normalized = value.trim();
  if (!/^(?:0x[0-9a-f]+|\d+)$/i.test(normalized)) {
    throw new Error(
      `PROBE_SEED must be a uint32 integer; got ${JSON.stringify(value)}`,
    );
  }
  const seed = Number(normalized);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new Error(
      `PROBE_SEED must be a uint32 integer; got ${JSON.stringify(value)}`,
    );
  }
  return [seed];
}

function formatSeed(seed) {
  return `0x${seed.toString(16).padStart(8, '0')}`;
}

function minimumMetric(runs, field) {
  return runs.length > 0
    ? Math.min(...runs.map((run) => run[field]))
    : undefined;
}

function maximumMetric(runs, field) {
  return runs.length > 0
    ? Math.max(...runs.map((run) => run[field]))
    : undefined;
}

async function executeProbeWorker() {
  try {
    const seed = workerData?.seed;
    if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
      throw new Error(`worker received invalid seed: ${String(seed)}`);
    }
    heartbeat('purity scan');
    const purity = await scanProbePurity();
    heartbeat('loading');
    const simulation = await loadSimulation();
    const ai = await loadOptionalAi();
    const lookModules = await loadHeadlessLookRenderer();
    const lookInputModules = await loadHeadlessLookInput();
    if (!ai) {
      throw new Error('AI module is required to verify bot think() calls');
    }
    const lookBehavior = runLookModeBehaviorProbe(
      simulation,
      lookModules,
      lookInputModules,
      seed,
    );
    let state = createFourPlayerMatch(simulation, {
      phase: 'hub',
      seed,
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
    const lookProbe = createLookProbe(lookModules);
    observeLockedTarget(lookProbe, view, 'opening first frame');
    snapAndObserveCamera(lookProbe, view, 'opening first frame');
    const initialById = new Map(
      initialPlayers.map((player) => [player.id, positionOf(player)]),
    );
    const initialKills = totalKills(initialPlayers);
    let previousSignature = playerSignature(initialPlayers);
    let entityUpdates = 0;
    let maximumMovementSquared = 0;
    const movedPlayerIds = new Set();
    const stepDurations = [];
    const random = makeSeededRandom(seed ^ 0x5eed1234);
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
      observeLockedTarget(
        lookProbe,
        view,
        `simulation step ${stepIndex + 1}`,
      );
      if (previousView.phase === 'hub' && view.phase === 'arena') {
        snapAndObserveCamera(lookProbe, view, 'hub→arena first frame', {
          requireDistantPreviousCamera: true,
        });
      } else {
        followCamera(lookProbe, view);
      }

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
    validateLookProbe(lookProbe);

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
        seed: formatSeed(seed),
        steps: PROBE_STEPS,
        players: initialPlayers.length,
        dt: DT,
        simulatedSeconds: PROBE_STEPS * DT,
        phase: view.phase,
        kills,
        arenaKills,
        movedPlayers: movedPlayerIds.size,
        cameraSnapMaxDist: lookProbe.maximumSnapDistance,
        lockedForwardMinDot: lookProbe.minimumForwardDot,
        lockedForwardMaxAngleDeg:
          (lookProbe.maximumForwardAngle * 180) / Math.PI,
        lockedTurnAngleDeg:
          (lookBehavior.lockedTurnAngle * 180) / Math.PI,
        lockedCameraBehindness: lookBehavior.lockedCameraBehindness,
        freeStationaryYawDeltaDeg:
          (lookBehavior.freeStationaryYawDelta * 180) / Math.PI,
        freeMoveYawErrorDeg:
          (lookBehavior.freeMoveYawError * 180) / Math.PI,
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
        lookProbe: {
          cameraSnapMaxDist: CAMERA_SNAP_MAX_DIST,
          lockedForwardMinDot: LOCKED_FORWARD_MIN_DOT,
          lockedForwardMaxAngleDeg: LOCKED_FORWARD_MAX_ANGLE_DEGREES,
          openingCameraDistance: lookProbe.openingCameraDistance,
          arenaEntryCameraDistance: lookProbe.arenaEntryCameraDistance,
          arenaEntryPreSnapDistance: lookProbe.arenaEntryPreSnapDistance,
          checks: lookProbe.checks,
          modes: lookBehavior,
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

/**
 * 只装真实相机链，不创建 DOM/WebGL。方法来自 YizhangRenderer 原型，
 * cameraRig 来自生产 createCamera()，因此 getLook/snapCamera/_followCamera 都是真路径。
 */
function createLookProbe({ YizhangRenderer, createCamera }) {
  const renderer = Object.create(YizhangRenderer.prototype);
  renderer.cameraRig = createCamera({});
  renderer.camera = renderer.cameraRig.camera;
  renderer.lookPitch = null;
  renderer.lookYaw = null;
  renderer.lookMode = 'locked';
  renderer._vel = { x: 0, y: 0, z: 0 };
  renderer._snapPending = true;
  renderer._following = false;
  renderer._prevFocusX = 0;
  renderer._prevFocusZ = 0;
  renderer._lastPhase = null;

  if (renderer.setLookMode('locked') !== 'locked') {
    throw new Error('headless renderer refused locked look mode');
  }
  const look = renderer.getLook();
  if (look?.lookMode !== 'locked') {
    throw new Error(
      `renderer.getLook() did not report locked mode: ${String(look?.lookMode)}`,
    );
  }

  return {
    renderer,
    maximumSnapDistance: 0,
    minimumForwardDot: 1,
    maximumForwardAngle: 0,
    openingCameraDistance: null,
    arenaEntryCameraDistance: null,
    arenaEntryPreSnapDistance: null,
    checks: {
      lockedTargets: 0,
      snappedFrames: 0,
    },
  };
}

/**
 * 真 input.sample() → sim.step() → 真 camera rig 的最小闭环。
 * 鼠标事件实际修改输入层视角，避免只拿手搓 yaw 测数学公式。
 */
function runLookModeBehaviorProbe(
  simulation,
  lookModules,
  { createInput, lookPayload },
  seed,
) {
  const eventHarness = createInputEventHarness(createInput);
  try {
    let state = simulation.createMatch({
      seed: seed ^ 0x10c04f31,
      botCount: 0,
      phase: 'arena',
    });
    const rendererProbe = createLookProbe(lookModules);
    const renderer = rendererProbe.renderer;

    const lockedLookBefore = eventHarness.input.getLook();
    const lockedInputBefore = eventHarness.input.sample(lockedLookBefore.yaw);
    state =
      simulation.step(state, { p0: lockedInputBefore }, DT) ?? state;
    const lockedPlayerBefore = humanPlayer(
      simulation.getView(state),
      'locked before view turn',
    );

    const lockedTurn = rotateInputView(
      eventHarness,
      320,
      'locked view turn',
    );
    renderer.setLook(lookPayload(lockedTurn.after));
    const lockedInputAfter = eventHarness.input.sample(lockedTurn.after.yaw);
    if (!Number.isFinite(lockedInputAfter.yaw)) {
      throw new Error('locked view turn emitted a non-finite player yaw');
    }
    const emittedLockedTurn = Math.abs(
      shortestAngle(lockedInputBefore.yaw, lockedInputAfter.yaw),
    );
    if (emittedLockedTurn < LOOK_TURN_MIN_ANGLE_RADIANS) {
      throw new Error(
        `locked view turn changed emitted yaw by only ` +
          `${formatDegrees(emittedLockedTurn)}°`,
      );
    }

    state = simulation.step(state, { p0: lockedInputAfter }, DT) ?? state;
    const lockedPlayerAfter = humanPlayer(
      simulation.getView(state),
      'locked after view turn',
    );
    const lockedYawError = Math.abs(
      shortestAngle(lockedInputAfter.yaw, lockedPlayerAfter.yaw),
    );
    if (
      lockedYawError > VIEW_YAW_MAX_ERROR_RADIANS ||
      Math.abs(
        shortestAngle(lockedPlayerBefore.yaw, lockedPlayerAfter.yaw),
      ) < LOOK_TURN_MIN_ANGLE_RADIANS
    ) {
      throw new Error(
        `locked view turn did not rotate the player 1:1 ` +
          `(error=${formatDegrees(lockedYawError)}°)`,
      );
    }

    const lockedFocus = positionOf(lockedPlayerAfter);
    renderer.snapCamera();
    if (
      renderer._followCamera(
        DT,
        lockedFocus,
        renderer._followYaw(lockedPlayerAfter),
      ) !== true
    ) {
      throw new Error('locked view turn did not snap the headless camera');
    }
    assertLockedCameraForward(
      rendererProbe,
      lockedPlayerAfter,
      'locked after view turn',
    );
    const lockedCameraBehindness = cameraBehindness(
      renderer.camera.position,
      lockedPlayerAfter,
    );
    if (lockedCameraBehindness >= LOCKED_CAMERA_MAX_BEHINDNESS) {
      throw new Error(
        `locked camera is not behind the player ` +
          `(projection=${lockedCameraBehindness.toFixed(6)}m, max ` +
          `${LOCKED_CAMERA_MAX_BEHINDNESS}m)`,
      );
    }

    if (eventHarness.input.setLookMode('free') !== 'free') {
      throw new Error('headless input refused free look mode');
    }
    const freeYawBefore = lockedPlayerAfter.yaw;
    const freeTurn = rotateInputView(eventHarness, -280, 'free view turn');
    const freePayload = lookPayload(freeTurn.after);
    renderer.setLook(freePayload);
    if (renderer.getLook().lookMode !== 'free') {
      throw new Error('headless renderer refused free look payload');
    }
    const freeCameraTurn = Math.abs(
      shortestAngle(
        renderer._followYaw(lockedPlayerAfter),
        lockedPlayerAfter.yaw,
      ),
    );
    if (freeCameraTurn < LOOK_TURN_MIN_ANGLE_RADIANS) {
      throw new Error(
        `free view turn did not decouple camera and player yaw ` +
          `(${formatDegrees(freeCameraTurn)}°)`,
      );
    }

    const freeStationaryInput = eventHarness.input.sample(freeTurn.after.yaw);
    if (freeStationaryInput.yaw !== null) {
      throw new Error(
        `stationary free view turn emitted yaw ` +
          `${String(freeStationaryInput.yaw)} instead of null`,
      );
    }
    state =
      simulation.step(state, { p0: freeStationaryInput }, DT) ?? state;
    const freeStationaryPlayer = humanPlayer(
      simulation.getView(state),
      'free stationary after view turn',
    );
    const freeStationaryYawDelta = Math.abs(
      shortestAngle(freeYawBefore, freeStationaryPlayer.yaw),
    );
    if (freeStationaryYawDelta > VIEW_YAW_MAX_ERROR_RADIANS) {
      throw new Error(
        `free view turn rotated a stationary player by ` +
          `${formatDegrees(freeStationaryYawDelta)}°`,
      );
    }

    eventHarness.window.emit('keydown', { code: 'KeyD' });
    const freeMovingInput = eventHarness.input.sample(freeTurn.after.yaw);
    eventHarness.window.emit('keyup', { code: 'KeyD' });
    const movementLength = Math.hypot(
      freeMovingInput.moveX,
      freeMovingInput.moveZ,
    );
    if (!(movementLength > 0)) {
      throw new Error('moving free input produced a zero movement vector');
    }
    const movementYaw = Math.atan2(
      -freeMovingInput.moveX,
      -freeMovingInput.moveZ,
    );
    const emittedFreeMoveError = Math.abs(
      shortestAngle(movementYaw, freeMovingInput.yaw),
    );
    if (emittedFreeMoveError > INPUT_YAW_MAX_ERROR_RADIANS) {
      throw new Error(
        `moving free input yaw missed its travel direction by ` +
          `${formatDegrees(emittedFreeMoveError)}°`,
      );
    }

    state = simulation.step(state, { p0: freeMovingInput }, DT) ?? state;
    const freeMovingPlayer = humanPlayer(
      simulation.getView(state),
      'free moving after view turn',
    );
    const freeMoveYawError = Math.abs(
      shortestAngle(movementYaw, freeMovingPlayer.yaw),
    );
    if (freeMoveYawError > VIEW_YAW_MAX_ERROR_RADIANS) {
      throw new Error(
        `moving free player yaw missed its travel direction by ` +
          `${formatDegrees(freeMoveYawError)}°`,
      );
    }

    return {
      lockedTurnAngle: Math.abs(
        shortestAngle(lockedPlayerBefore.yaw, lockedPlayerAfter.yaw),
      ),
      lockedYawError,
      lockedCameraBehindness,
      freeLookTurnAngle: freeTurn.angle,
      freeStationaryYawDelta,
      freeMoveYawError,
      checks: {
        lockedViewTurns: 1,
        lockedBehindFrames: 1,
        freeStationaryViewTurns: 1,
        freeMovementDirections: 1,
      },
    };
  } finally {
    eventHarness.dispose();
  }
}

function createInputEventHarness(createInput) {
  const doc = createEventTarget({ hidden: false, pointerLockElement: null });
  const canvas = createEventTarget();
  const windowTarget = createEventTarget();
  doc.pointerLockElement = canvas;

  const hadWindow = Object.hasOwn(globalThis, 'window');
  const previousWindow = globalThis.window;
  globalThis.window = windowTarget;

  let input;
  try {
    input = createInput(doc, canvas, {
      lookMode: 'locked',
      phase: 'arena',
      pointerLock: false,
    });
  } catch (error) {
    restoreGlobalWindow(hadWindow, previousWindow);
    throw error;
  }

  return {
    input,
    window: windowTarget,
    dispose() {
      input.dispose();
      restoreGlobalWindow(hadWindow, previousWindow);
    },
  };
}

function createEventTarget(initial = {}) {
  const handlers = new Map();
  return Object.assign(initial, {
    addEventListener(type, handler) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      handlers.get(type)?.delete(handler);
    },
    emit(type, event = {}) {
      for (const handler of [...(handlers.get(type) ?? [])]) {
        handler({ preventDefault() {}, ...event });
      }
    },
  });
}

function rotateInputView(eventHarness, movementX, label) {
  const before = eventHarness.input.getLook();
  eventHarness.window.emit('mousemove', { movementX, movementY: 0 });
  const after = eventHarness.input.getLook();
  const angle = Math.abs(shortestAngle(before.yaw, after.yaw));
  if (angle < LOOK_TURN_MIN_ANGLE_RADIANS) {
    throw new Error(
      `${label} changed input look by only ${formatDegrees(angle)}°`,
    );
  }
  return { before, after, angle };
}

function restoreGlobalWindow(hadWindow, previousWindow) {
  if (hadWindow) globalThis.window = previousWindow;
  else delete globalThis.window;
}

function observeLockedTarget(probe, view, label) {
  const player = humanPlayer(view, label);
  const look = probe.renderer.getLook();
  if (look?.lookMode !== 'locked') {
    throw new Error(
      `${label}: renderer left locked mode (${String(look?.lookMode)})`,
    );
  }

  const targetYaw = probe.renderer._followYaw(player);
  const targetAngle = Math.abs(shortestAngle(player.yaw, targetYaw));
  if (targetAngle > LOCKED_TARGET_MAX_ANGLE_RADIANS) {
    throw new Error(
      `${label}: locked camera target differs from player yaw by ` +
        `${formatDegrees(targetAngle)}° (max ` +
        `${formatDegrees(LOCKED_TARGET_MAX_ANGLE_RADIANS)}°)`,
    );
  }

  const playerForward = horizontalForward(player.yaw);
  const targetForward = horizontalForward(targetYaw);
  const dot =
    playerForward.x * targetForward.x + playerForward.z * targetForward.z;
  if (dot < LOCKED_FORWARD_MIN_DOT) {
    throw new Error(
      `${label}: locked player/target forward dot ${dot.toFixed(9)} < ` +
        `${LOCKED_FORWARD_MIN_DOT}`,
    );
  }
  probe.checks.lockedTargets += 1;
}

function followCamera(probe, view) {
  const player = humanPlayer(view, 'camera follow');
  return probe.renderer._followCamera(
    DT,
    positionOf(player),
    probe.renderer._followYaw(player),
  );
}

function snapAndObserveCamera(
  probe,
  view,
  label,
  { requireDistantPreviousCamera = false } = {},
) {
  const player = humanPlayer(view, label);
  const focus = positionOf(player);
  const beforeDistance = horizontalDistance(
    probe.renderer.camera.position,
    focus,
  );
  if (
    requireDistantPreviousCamera &&
    beforeDistance <= CAMERA_SNAP_MAX_DIST
  ) {
    throw new Error(
      `${label}: route did not exercise a distant camera jump; ` +
        `${beforeDistance.toFixed(3)}m <= ${CAMERA_SNAP_MAX_DIST}m`,
    );
  }

  if (probe.renderer.snapCamera() !== true) {
    throw new Error(`${label}: renderer.snapCamera() did not arm a snap`);
  }
  const snapped = probe.renderer._followCamera(
    DT,
    focus,
    probe.renderer._followYaw(player),
  );
  if (snapped !== true) {
    throw new Error(`${label}: armed camera did not snap on the next frame`);
  }

  const distance = horizontalDistance(probe.renderer.camera.position, focus);
  if (distance >= CAMERA_SNAP_MAX_DIST) {
    throw new Error(
      `${label}: camera remained ${distance.toFixed(3)}m from player ` +
        `(CAMERA_SNAP_MAX_DIST=${CAMERA_SNAP_MAX_DIST}m)`,
    );
  }

  assertLockedCameraForward(probe, player, label);
  probe.maximumSnapDistance = Math.max(
    probe.maximumSnapDistance,
    distance,
  );
  probe.checks.snappedFrames += 1;

  if (label === 'opening first frame') {
    probe.openingCameraDistance = distance;
  } else if (label === 'hub→arena first frame') {
    probe.arenaEntryPreSnapDistance = beforeDistance;
    probe.arenaEntryCameraDistance = distance;
  }
}

function assertLockedCameraForward(probe, player, label) {
  const direction = probe.renderer.camera.position.clone();
  probe.renderer.camera.getWorldDirection(direction);
  const horizontalLength = Math.hypot(direction.x, direction.z);
  if (!(horizontalLength > 0)) {
    throw new Error(`${label}: camera has no finite horizontal forward`);
  }

  const cameraForward = {
    x: direction.x / horizontalLength,
    z: direction.z / horizontalLength,
  };
  const playerForward = horizontalForward(player.yaw);
  const rawDot =
    playerForward.x * cameraForward.x + playerForward.z * cameraForward.z;
  const dot = Math.max(-1, Math.min(1, rawDot));
  const angle = Math.acos(dot);

  probe.minimumForwardDot = Math.min(probe.minimumForwardDot, dot);
  probe.maximumForwardAngle = Math.max(probe.maximumForwardAngle, angle);
  if (
    dot < LOCKED_FORWARD_MIN_DOT ||
    angle > LOCKED_FORWARD_MAX_ANGLE_RADIANS
  ) {
    throw new Error(
      `${label}: locked player/camera horizontal forwards diverged ` +
        `(dot=${dot.toFixed(9)}, angle=${formatDegrees(angle)}°, ` +
        `minDot=${LOCKED_FORWARD_MIN_DOT}, ` +
        `maxAngle=${LOCKED_FORWARD_MAX_ANGLE_DEGREES}°)`,
    );
  }

  const look = probe.renderer.getLook();
  const yawAngle = Math.abs(shortestAngle(player.yaw, look.cameraYaw));
  if (yawAngle > LOCKED_FORWARD_MAX_ANGLE_RADIANS) {
    throw new Error(
      `${label}: renderer.getLook().cameraYaw differs from player yaw by ` +
        `${formatDegrees(yawAngle)}°`,
    );
  }
}

function validateLookProbe(probe) {
  if (
    !Number.isFinite(probe.openingCameraDistance) ||
    !Number.isFinite(probe.arenaEntryCameraDistance) ||
    !Number.isFinite(probe.arenaEntryPreSnapDistance)
  ) {
    throw new Error('look probe did not observe opening and hub→arena snaps');
  }
  if (probe.checks.snappedFrames !== 2) {
    throw new Error(
      `look probe expected 2 snapped frames; got ${probe.checks.snappedFrames}`,
    );
  }
  if (probe.checks.lockedTargets < 2) {
    throw new Error('look probe did not exercise locked camera targeting');
  }
}

function humanPlayer(view, label) {
  const player = getPlayers(view).find((candidate) => candidate?.id === 'p0');
  if (!player) {
    throw new Error(`${label}: look probe cannot find human player p0`);
  }
  if (
    !Number.isFinite(player.x) ||
    !Number.isFinite(player.y) ||
    !Number.isFinite(player.z) ||
    !Number.isFinite(player.yaw)
  ) {
    throw new Error(`${label}: human player has a non-finite camera pose`);
  }
  return player;
}

function horizontalForward(yaw) {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}

function horizontalDistance(left, right) {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

function cameraBehindness(cameraPosition, player) {
  const forward = horizontalForward(player.yaw);
  return (
    (cameraPosition.x - player.x) * forward.x +
    (cameraPosition.z - player.z) * forward.z
  );
}

function shortestAngle(from, to) {
  let difference = (to - from) % (Math.PI * 2);
  if (difference > Math.PI) difference -= Math.PI * 2;
  else if (difference < -Math.PI) difference += Math.PI * 2;
  return difference;
}

function formatDegrees(radians) {
  return ((radians * 180) / Math.PI).toFixed(6);
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
