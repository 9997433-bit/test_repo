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
// 对局内切 locked↔free 只能绕角色转，不能把机位甩回相隔 ~120m 的另一区域。
const MODE_SWITCH_CAMERA_MAX_DIST = 20;
// 与生产 camera.js 的 BEHIND_LIMIT 同值：look 段必须跨过这道闸，探针才真正覆盖咬合/放手。
const BEHIND_LIMIT_RADIANS = Math.PI / 2.4;
// O2 放手带落地后，大转角的无 snap 帧应与切 V 同级，而不是绕焦点横旋约 11m。
const NO_SNAP_CAMERA_MAX_STEP = 1;
// locked 下角色前向与相机水平前向近似同向；同时钉点积与夹角，避免单一指标误读。
const LOCKED_FORWARD_MIN_DOT = 0.999;
const LOCKED_FORWARD_MAX_ANGLE_DEGREES = 3;
const LOCKED_FORWARD_MAX_ANGLE_RADIANS =
  (LOCKED_FORWARD_MAX_ANGLE_DEGREES * Math.PI) / 180;
const LOCKED_TARGET_MAX_ANGLE_RADIANS = 1e-9;
const LOOK_TURN_MIN_ANGLE_RADIANS = BEHIND_LIMIT_RADIANS;
const INPUT_YAW_MAX_ERROR_RADIANS = 1e-9;
// getView() 的公开契约把 yaw round4；容差略高于最坏 0.00005rad 量化误差。
const VIEW_YAW_MAX_ERROR_RADIANS = 0.0001;
const LOCKED_CAMERA_MAX_BEHINDNESS = -3;
// sim 约定 yaw=0 面向 -Z；贴脸扇脚本固定朝 +X，避免 AI/随机走位掩盖无敌帧回归。
const FACE_PLUS_X_RADIANS = -Math.PI / 2;
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
    modeSwitchCameraMaxDist: maximumMetric(
      passedRuns,
      'modeSwitchCameraMaxDist',
    ),
    lookTurnMinAngleDeg: minimumMetric(passedRuns, 'lookTurnMinAngleDeg'),
    noSnapFrameMaxDisplacement: maximumMetric(
      passedRuns,
      'noSnapFrameMaxDisplacement',
    ),
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
    respawnSlapHits: minimumMetric(passedRuns, 'respawnSlapHits'),
    respawnSlapWhiffs: maximumMetric(passedRuns, 'respawnSlapWhiffs'),
    portalInvulnExpiryMaxSeconds: maximumMetric(
      passedRuns,
      'portalInvulnExpirySeconds',
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
            `mode switch ≤${result.modeSwitchCameraMaxDist.toFixed(3)}m, ` +
            `look turn ≥${result.lookTurnMinAngleDeg.toFixed(3)}°, ` +
            `no-snap step ≤${result.noSnapFrameMaxDisplacement.toFixed(3)}m, ` +
            `locked dot ≥${result.lockedForwardMinDot.toFixed(6)}, ` +
            `locked turn ${result.lockedTurnAngleDeg.toFixed(3)}°, ` +
            `behind ${result.lockedCameraBehindness.toFixed(3)}m, ` +
            `free hold Δ${result.freeStationaryYawDeltaDeg.toFixed(6)}°, ` +
            `free move error ${result.freeMoveYawErrorDeg.toFixed(6)}°, ` +
            `respawn slap ${result.respawnSlapHits} hit(s)/` +
            `${result.respawnSlapWhiffs} whiff(s), ` +
            `portal invuln ${result.portalInvulnExpirySeconds.toFixed(3)}s, ` +
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
    const invulnerabilityBehavior = runInvulnerabilityBehaviorProbe(
      simulation,
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
        modeSwitchCameraMaxDist: lookBehavior.modeSwitchCameraMaxDistance,
        lookTurnMinAngleDeg:
          (lookBehavior.lookTurnMinAngle * 180) / Math.PI,
        noSnapFrameMaxDisplacement:
          lookBehavior.noSnapFrameMaxDisplacement,
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
        respawnSlapHits: invulnerabilityBehavior.respawn.slapHits,
        respawnSlapWhiffs: invulnerabilityBehavior.respawn.slapWhiffs,
        portalInvulnExpirySeconds:
          invulnerabilityBehavior.portal.expiredAfterSeconds,
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
          modeSwitchCameraMaxDist: MODE_SWITCH_CAMERA_MAX_DIST,
          behindLimitDeg: (BEHIND_LIMIT_RADIANS * 180) / Math.PI,
          noSnapCameraMaxStep: NO_SNAP_CAMERA_MAX_STEP,
          lockedForwardMinDot: LOCKED_FORWARD_MIN_DOT,
          lockedForwardMaxAngleDeg: LOCKED_FORWARD_MAX_ANGLE_DEGREES,
          openingCameraDistance: lookProbe.openingCameraDistance,
          arenaEntryCameraDistance: lookProbe.arenaEntryCameraDistance,
          arenaEntryPreSnapDistance: lookProbe.arenaEntryPreSnapDistance,
          checks: lookProbe.checks,
          modes: lookBehavior,
        },
        invulnerabilityProbe: invulnerabilityBehavior,
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
 * 用真实 sim + combat 跑两个确定性小剧本，不借随机 Bot 的命中率判断无敌帧：
 * 1) 真摔落、真重组，等 invulnT 结束后贴脸扇必须命中，不能全是 slapWhiff；
 * 2) 真 enterArena 落地，倒计时不能早于 invulnTime，也不能永久卡住。
 */
function runInvulnerabilityBehaviorProbe(simulation, seed) {
  for (const exportName of ['getPlayer', 'activeGlove', 'enterArena']) {
    if (typeof simulation[exportName] !== 'function') {
      throw new Error(
        `simulation module must export function ${exportName}() for invulnerability probe`,
      );
    }
  }

  const respawnState = simulation.createMatch({
    seed: seed ^ 0x6e5a11ed,
    gloveId: 'cotton',
    offhandId: 'granite',
    botCount: 1,
    phase: 'arena',
  });
  const attacker = requiredStatePlayer(
    simulation,
    respawnState,
    'p0',
    'respawn attacker',
  );
  const target = requiredStatePlayer(
    simulation,
    respawnState,
    'b0',
    'respawn target',
  );

  // 先真摔死，避免直接调 respawnPlayer 把重组倒计时链漏测。
  target.y = respawnState.config.fallY - 1;
  target.grounded = false;
  target.vx = 0;
  target.vy = 0;
  target.vz = 0;
  simulation.step(respawnState, {}, DT);
  if (target.alive !== false || !(target.respawnT > 0)) {
    throw new Error('respawn probe failed to knock target out before respawn');
  }

  const respawnFrames = advanceUntil(
    simulation,
    respawnState,
    () => target.alive === true,
    Math.ceil((respawnState.config.respawnDelay + 4 * DT) / DT),
    'target did not respawn after respawnDelay',
  );
  const respawnInvulnStart = target.invulnT;
  if (
    !(respawnInvulnStart > 0) ||
    Math.abs(respawnInvulnStart - respawnState.config.invulnTime) > DT
  ) {
    throw new Error(
      `respawn invulnerability started at ${String(respawnInvulnStart)}s; ` +
        `expected ${respawnState.config.invulnTime}s`,
    );
  }

  const respawnInvulnFrames = advanceUntil(
    simulation,
    respawnState,
    () => target.invulnT === 0,
    Math.ceil((respawnInvulnStart + 4 * DT) / DT),
    'respawn invulnerability did not end after invulnTime',
  );
  if (target.invulnT !== 0) {
    throw new Error(
      `respawn target remained invulnerable (${String(target.invulnT)}s)`,
    );
  }

  placeForProbe(attacker, 0, 0, FACE_PLUS_X_RADIANS);
  placeForProbe(target, 2, 0, 0);
  resetProbeAttacker(attacker);
  const hitsBefore = target.hitsTaken;
  const cotton = simulation.activeGlove(attacker);
  if (!Number.isFinite(cotton?.windup) || cotton.windup <= 0) {
    throw new Error(
      `respawn probe received invalid cotton windup: ${String(cotton?.windup)}`,
    );
  }
  const slapEvents = advanceProbeFrames(
    simulation,
    respawnState,
    {
      p0: {
        moveX: 0,
        moveZ: 0,
        yaw: FACE_PLUS_X_RADIANS,
        slap: true,
        skill: false,
        switchGlove: false,
        dash: false,
        jump: false,
      },
    },
    Math.ceil((cotton.windup + 2 * DT) / DT),
  );
  const slapHits = target.hitsTaken - hitsBefore;
  const slapWhiffs = slapEvents.filter(
    (event) => event?.type === 'slapWhiff' && event.attackerId === attacker.id,
  ).length;
  const landedSlaps = slapEvents.filter(
    (event) =>
      event?.type === 'slap' &&
      event.id === attacker.id &&
      Number(event.hits) > 0,
  ).length;
  if (slapHits < 1 || landedSlaps < 1) {
    throw new Error(
      `respawn target was not hit after invulnTime ` +
        `(hits=${slapHits}, landedSlaps=${landedSlaps}, ` +
        `slapWhiffs=${slapWhiffs})`,
    );
  }
  if (slapWhiffs !== 0) {
    throw new Error(
      `respawn face-off emitted ${slapWhiffs} slapWhiff event(s) after invulnTime`,
    );
  }

  const portalState = simulation.createMatch({
    seed: seed ^ 0xa11d00f,
    gloveId: 'cotton',
    offhandId: 'granite',
    botCount: 0,
    phase: 'hub',
  });
  const portalPlayer = requiredStatePlayer(
    simulation,
    portalState,
    'p0',
    'portal player',
  );
  simulation.enterArena(portalState, portalPlayer);
  const portalInvulnStart = portalPlayer.invulnT;
  if (
    portalState.phase !== 'arena' ||
    Math.abs(portalInvulnStart - portalState.config.invulnTime) > 1e-9
  ) {
    throw new Error(
      `portal landing invulnerability started at ${String(portalInvulnStart)}s; ` +
        `expected ${portalState.config.invulnTime}s`,
    );
  }

  // 到期前一帧必须仍无敌；随后只容许一个 60Hz 量化帧归零。
  const portalFramesBeforeExpiry = Math.max(
    0,
    Math.ceil(portalInvulnStart / DT) - 1,
  );
  advanceProbeFrames(
    simulation,
    portalState,
    {},
    portalFramesBeforeExpiry,
  );
  const portalInvulnBeforeExpiry = portalPlayer.invulnT;
  if (!(portalInvulnBeforeExpiry > 0)) {
    throw new Error(
      `portal landing invulnerability ended early, before invulnTime ` +
        `(${portalFramesBeforeExpiry * DT}s)`,
    );
  }
  const portalExpiryFrames = advanceUntil(
    simulation,
    portalState,
    () => portalPlayer.invulnT === 0,
    2,
    'portal landing invulnerability did not end after invulnTime',
  );
  const portalInvulnExpirySeconds =
    (portalFramesBeforeExpiry + portalExpiryFrames) * DT;
  if (
    portalInvulnExpirySeconds + 1e-9 < portalInvulnStart ||
    portalInvulnExpirySeconds > portalInvulnStart + DT + 1e-9
  ) {
    throw new Error(
      `portal landing invulnerability expired after ` +
        `${portalInvulnExpirySeconds}s; expected ${portalInvulnStart}s`,
    );
  }

  return {
    respawn: {
      respawnedAfterSeconds: respawnFrames * DT,
      invulnStartSeconds: respawnInvulnStart,
      invulnExpiredAfterSeconds: respawnInvulnFrames * DT,
      slapHits,
      landedSlaps,
      slapWhiffs,
    },
    portal: {
      invulnStartSeconds: portalInvulnStart,
      beforeExpirySeconds: portalFramesBeforeExpiry * DT,
      beforeExpiryRemainingSeconds: portalInvulnBeforeExpiry,
      expiredAfterSeconds: portalInvulnExpirySeconds,
    },
    checks: {
      respawnedWithInvulnerability: 1,
      respawnInvulnerabilityExpired: 1,
      respawnFaceOffHit: 1,
      portalInvulnerabilityHeldUntilDeadline: 1,
      portalInvulnerabilityExpired: 1,
    },
  };
}

function requiredStatePlayer(simulation, state, id, label) {
  const player = simulation.getPlayer(state, id);
  if (!player) {
    throw new Error(`${label}: simulation state has no player ${id}`);
  }
  return player;
}

function placeForProbe(player, x, z, yaw) {
  player.x = x;
  player.y = 0;
  player.z = z;
  player.yaw = yaw;
  player.vx = 0;
  player.vy = 0;
  player.vz = 0;
  player.grounded = true;
}

function resetProbeAttacker(attacker) {
  attacker.invulnT = 0;
  attacker.invulnerable = false;
  attacker.slapCd = 0;
  attacker.switchLockT = 0;
  attacker.busyUntil = 0;
  attacker.rootUntil = 0;
  attacker.kbT = 0;
  attacker.knockbackT = 0;
  attacker.attack.phase = 'idle';
  attacker.attack.t = 0;
  attacker.attack.struck = false;
  attacker.prev.slap = false;
  if (attacker.cd) attacker.cd.slapAt = 0;
  if (Array.isArray(attacker.statuses)) attacker.statuses.length = 0;
}

function advanceUntil(simulation, state, predicate, maximumFrames, message) {
  for (let frame = 0; frame <= maximumFrames; frame += 1) {
    if (predicate()) return frame;
    if (frame < maximumFrames) simulation.step(state, {}, DT);
  }
  throw new Error(message);
}

function advanceProbeFrames(simulation, state, inputs, frames) {
  const events = [];
  for (let frame = 0; frame < frames; frame += 1) {
    simulation.step(state, inputs, DT);
    if (Array.isArray(state.events)) {
      events.push(...state.events);
    }
  }
  return events;
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
      600,
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

    toggleLookMode(eventHarness, 'free', 'locked→free');
    const freeYawBefore = lockedPlayerAfter.yaw;
    const freeTurn = rotateInputView(eventHarness, -600, 'free view turn');
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
    const lockedToFreeCamera = observeNoSnapCameraFrames(
      rendererProbe,
      lockedPlayerAfter,
      'locked→free',
    );

    // 先让 free 机位在当前视线后稳定、背后闸重新咬合，再一帧猛甩近 π。
    // 这样测到的是 O2 放手带本身，而不是切模式时 releaseBehind() 已经松开的闸。
    const freeSettleCamera = observeNoSnapCameraFrames(
      rendererProbe,
      lockedPlayerAfter,
      'free settle before large turn',
      240,
    );
    const freeGateTurn = rotateInputView(
      eventHarness,
      1200,
      'free view turn beyond BEHIND_LIMIT',
    );
    renderer.setLook(lookPayload(freeGateTurn.after));
    const freeGateCamera = observeNoSnapCameraFrames(
      rendererProbe,
      lockedPlayerAfter,
      'free view turn beyond BEHIND_LIMIT',
    );

    const freeStationaryInput = eventHarness.input.sample(
      freeGateTurn.after.yaw,
    );
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
    const freeMovingInput = eventHarness.input.sample(freeGateTurn.after.yaw);
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

    const lockedLookAfterFree = toggleLookMode(
      eventHarness,
      'locked',
      'free→locked',
    );
    renderer.setLook(lookPayload(lockedLookAfterFree));
    if (renderer.getLook().lookMode !== 'locked') {
      throw new Error('headless renderer refused locked look payload');
    }
    const lockedReturnInput = eventHarness.input.sample(
      lockedLookAfterFree.yaw,
    );
    if (!Number.isFinite(lockedReturnInput.yaw)) {
      throw new Error('free→locked emitted a non-finite player yaw');
    }
    state = simulation.step(state, { p0: lockedReturnInput }, DT) ?? state;
    const lockedReturnPlayer = humanPlayer(
      simulation.getView(state),
      'locked after free mode',
    );
    const lockedReturnYawError = Math.abs(
      shortestAngle(lockedReturnInput.yaw, lockedReturnPlayer.yaw),
    );
    if (lockedReturnYawError > VIEW_YAW_MAX_ERROR_RADIANS) {
      throw new Error(
        `free→locked did not restore 1:1 player yaw ` +
          `(error=${formatDegrees(lockedReturnYawError)}°)`,
      );
    }
    const freeToLockedCamera = observeNoSnapCameraFrames(
      rendererProbe,
      lockedReturnPlayer,
      'free→locked',
    );
    const modeSwitchCameraMaxDistance = Math.max(
      lockedToFreeCamera.beforeDistance,
      lockedToFreeCamera.afterDistance,
      freeToLockedCamera.beforeDistance,
      freeToLockedCamera.afterDistance,
    );
    const lookTurnMinAngle = Math.min(
      lockedTurn.angle,
      freeTurn.angle,
      freeGateTurn.angle,
    );
    const noSnapFrameMaxDisplacement = Math.max(
      lockedToFreeCamera.maxFrameDisplacement,
      freeSettleCamera.maxFrameDisplacement,
      freeGateCamera.maxFrameDisplacement,
      freeToLockedCamera.maxFrameDisplacement,
    );

    return {
      lockedTurnAngle: Math.abs(
        shortestAngle(lockedPlayerBefore.yaw, lockedPlayerAfter.yaw),
      ),
      lockedYawError,
      lockedReturnYawError,
      lockedCameraBehindness,
      freeLookTurnAngle: freeTurn.angle,
      freeGateTurnAngle: freeGateTurn.angle,
      lookTurnMinAngle,
      freeStationaryYawDelta,
      freeMoveYawError,
      modeSwitchCameraMaxDistance,
      noSnapFrameMaxDisplacement,
      modeSwitchCameraDistances: {
        lockedToFree: lockedToFreeCamera,
        freeToLocked: freeToLockedCamera,
      },
      noSnapCameraFrames: {
        freeSettle: freeSettleCamera,
        freeGateTurn: freeGateCamera,
      },
      checks: {
        lockedViewTurns: 1,
        lockedReturnDirections: 1,
        lockedBehindFrames: 1,
        freeStationaryViewTurns: 1,
        freeMovementDirections: 1,
        lookModeTransitions: 2,
        modeSwitchCameraFrames: 2,
        noSnapCameraFrames:
          lockedToFreeCamera.frames +
          freeSettleCamera.frames +
          freeGateCamera.frames +
          freeToLockedCamera.frames,
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
  if (angle <= LOOK_TURN_MIN_ANGLE_RADIANS) {
    throw new Error(
      `${label} changed input look by only ${formatDegrees(angle)}°; ` +
        `must exceed BEHIND_LIMIT ${formatDegrees(BEHIND_LIMIT_RADIANS)}°`,
    );
  }
  return { before, after, angle };
}

function toggleLookMode(eventHarness, expectedMode, label) {
  const before = eventHarness.input.getLookMode();
  eventHarness.window.emit('keydown', { code: 'KeyV' });
  eventHarness.window.emit('keyup', { code: 'KeyV' });
  const after = eventHarness.input.getLookMode();
  if (after !== expectedMode || after === before) {
    throw new Error(
      `${label}: KeyV changed look mode from ${String(before)} to ` +
        `${String(after)} instead of ${expectedMode}`,
    );
  }
  return eventHarness.input.getLook();
}

function observeNoSnapCameraFrames(probe, player, label, frames = 1) {
  const renderer = probe.renderer;
  if (renderer._snapPending) {
    throw new Error(`${label}: no-snap camera frame started with snap armed`);
  }
  const focus = positionOf(player);
  const beforeDistance = horizontalDistance(renderer.camera.position, focus);
  let previousPosition = renderer.camera.position.clone();
  let maxFrameDisplacement = 0;
  let maximumDistance = beforeDistance;
  for (let frame = 0; frame < frames; frame += 1) {
    const snapped = renderer._followCamera(
      DT,
      focus,
      renderer._followYaw(player),
    );
    if (snapped !== false) {
      throw new Error(`${label}: camera snapped on no-snap frame ${frame + 1}`);
    }
    const frameDisplacement =
      renderer.camera.position.distanceTo(previousPosition);
    maxFrameDisplacement = Math.max(
      maxFrameDisplacement,
      frameDisplacement,
    );
    maximumDistance = Math.max(
      maximumDistance,
      horizontalDistance(renderer.camera.position, focus),
    );
    previousPosition = renderer.camera.position.clone();
  }
  const afterDistance = horizontalDistance(renderer.camera.position, focus);
  if (
    !Number.isFinite(maximumDistance) ||
    maximumDistance >= MODE_SWITCH_CAMERA_MAX_DIST
  ) {
    throw new Error(
      `${label}: camera reached ${String(maximumDistance)}m from player ` +
        `(MODE_SWITCH_CAMERA_MAX_DIST=${MODE_SWITCH_CAMERA_MAX_DIST}m)`,
    );
  }
  if (
    !Number.isFinite(maxFrameDisplacement) ||
    maxFrameDisplacement >= NO_SNAP_CAMERA_MAX_STEP
  ) {
    throw new Error(
      `${label}: no-snap frame moved camera ` +
        `${String(maxFrameDisplacement)}m ` +
        `(NO_SNAP_CAMERA_MAX_STEP=${NO_SNAP_CAMERA_MAX_STEP}m)`,
    );
  }
  return {
    frames,
    beforeDistance,
    afterDistance,
    maximumDistance,
    maxFrameDisplacement,
  };
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
