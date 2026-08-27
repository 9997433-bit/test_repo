import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const DT = 1 / 60;
export const PLAYER_COUNT = 4;
export const PROBE_STEPS = readProbeSteps(process.env.YZ_STEPS);

const ZERO_INPUT = Object.freeze({
  moveX: 0,
  moveZ: 0,
  yaw: 0,
  slap: false,
  skill: false,
  switchGlove: false,
  dash: false,
  jump: false,
});

const SIMULATION_URL = new URL('../src/sim/index.js', import.meta.url);
const AI_URL = new URL('../src/ai/bots.js', import.meta.url);
const RENDERER_URL = new URL('../src/render/renderer.js', import.meta.url);
const CAMERA_URL = new URL('../src/render/camera.js', import.meta.url);
const INPUT_URL = new URL('../src/input/index.js', import.meta.url);
const LOOK_URL = new URL('../src/core/look.js', import.meta.url);
const PROBE_URL = new URL('./probe.mjs', import.meta.url);
const FORBIDDEN_PURITY_DIRECTORIES = new Set(['render', 'ui']);
const STATIC_MODULE_SPECIFIER =
  /\b(?:import|export)\s+(?:[^"'`;]*?\s+from\s*)?["']([^"']+)["']/g;
const DYNAMIC_MODULE_SPECIFIER =
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

function moduleSpecifier(environmentName, defaultUrl) {
  return process.env[environmentName] || defaultUrl.href;
}

export async function loadSimulation() {
  const override = process.env.YIZHANG_SIM_MODULE;

  if (!override && !existsSync(SIMULATION_URL)) {
    throw new Error(
      `simulation module missing: expected ${fileURLToPath(SIMULATION_URL)}`,
    );
  }

  let simulation;
  try {
    simulation = await import(
      moduleSpecifier('YIZHANG_SIM_MODULE', SIMULATION_URL)
    );
  } catch (error) {
    throw new Error(
      `could not load simulation module: ${errorMessage(error)}`,
      { cause: error },
    );
  }

  for (const exportName of ['createMatch', 'step', 'getView']) {
    if (typeof simulation[exportName] !== 'function') {
      throw new Error(
        `simulation module must export function ${exportName}()`,
      );
    }
  }

  return simulation;
}

/**
 * Node 不创建 WebGLRenderer，只把真实 Renderer 原型与真实 camera rig 装在一起。
 * 与 loadSimulation 一样保留模块覆盖口，便于探针故障注入；默认模块会进入纯度扫描。
 */
export async function loadHeadlessLookRenderer() {
  let renderer;
  let camera;
  try {
    [renderer, camera] = await Promise.all([
      import(moduleSpecifier('YIZHANG_RENDERER_MODULE', RENDERER_URL)),
      import(moduleSpecifier('YIZHANG_CAMERA_MODULE', CAMERA_URL)),
    ]);
  } catch (error) {
    throw new Error(
      `could not load headless look renderer: ${errorMessage(error)}`,
      { cause: error },
    );
  }

  if (typeof renderer.YizhangRenderer !== 'function') {
    throw new Error(
      'renderer module must export class YizhangRenderer for look probe',
    );
  }
  if (typeof camera.createCamera !== 'function') {
    throw new Error(
      'camera module must export function createCamera() for look probe',
    );
  }

  return {
    YizhangRenderer: renderer.YizhangRenderer,
    createCamera: camera.createCamera,
  };
}

/**
 * 加载生产输入与视线 payload 链。调用方提供最小事件节点，因此不需要浏览器 DOM。
 */
export async function loadHeadlessLookInput() {
  let input;
  let look;
  try {
    [input, look] = await Promise.all([
      import(moduleSpecifier('YIZHANG_INPUT_MODULE', INPUT_URL)),
      import(moduleSpecifier('YIZHANG_LOOK_MODULE', LOOK_URL)),
    ]);
  } catch (error) {
    throw new Error(
      `could not load headless look input: ${errorMessage(error)}`,
      { cause: error },
    );
  }

  if (typeof input.createInput !== 'function') {
    throw new Error(
      'input module must export function createInput() for look probe',
    );
  }
  if (typeof look.lookPayload !== 'function') {
    throw new Error(
      'look module must export function lookPayload() for look probe',
    );
  }

  return {
    createInput: input.createInput,
    lookPayload: look.lookPayload,
  };
}

/**
 * 静态遍历探针、生产 sim/AI 与显式白名单相机链的本地依赖图。这里只读源码；
 * sim/AI 若经普通依赖越界到 render/ui 会失败，白名单相机链则只供无头装配。
 */
export async function scanProbePurity() {
  // renderer/camera 是显式白名单入口：只加载模块与相机数学，不调用 WebGL 构造器。
  // 其它被测图若通过普通 import 越界到 render/ 或 ui/，assertPureSpecifier 仍会失败。
  const pending = [
    PROBE_URL,
    SIMULATION_URL,
    RENDERER_URL,
    CAMERA_URL,
    INPUT_URL,
    LOOK_URL,
  ];
  if (existsSync(AI_URL)) {
    pending.push(AI_URL);
  }

  const visited = new Set();
  while (pending.length > 0) {
    const moduleUrl = pending.pop();
    const moduleKey = moduleUrl.href;
    if (visited.has(moduleKey)) {
      continue;
    }
    visited.add(moduleKey);

    const source = await readFile(moduleUrl, 'utf8');
    for (const specifier of localModuleSpecifiers(source)) {
      assertPureSpecifier(moduleUrl, specifier);
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        const dependencyUrl = new URL(specifier, moduleUrl);
        if (dependencyUrl.protocol === 'file:') {
          pending.push(dependencyUrl);
        }
      }
    }
  }

  return {
    filesScanned: visited.size,
    forbiddenDirectories: [...FORBIDDEN_PURITY_DIRECTORIES],
  };
}

export function getWiredCombat(simulation) {
  if (typeof simulation?.usingRealCombat === 'boolean') {
    return simulation.usingRealCombat;
  }

  if (typeof simulation?.getDeps === 'function') {
    const dependencies = simulation.getDeps();
    if (typeof dependencies?.usingRealCombat === 'boolean') {
      return dependencies.usingRealCombat;
    }
  }

  return undefined;
}

export async function loadOptionalAi() {
  const override = process.env.YIZHANG_AI_MODULE;

  if (!override && !existsSync(AI_URL)) {
    return null;
  }

  let ai;
  try {
    ai = await import(moduleSpecifier('YIZHANG_AI_MODULE', AI_URL));
  } catch (error) {
    throw new Error(`could not load AI module: ${errorMessage(error)}`, {
      cause: error,
    });
  }

  if (typeof ai.think !== 'function') {
    throw new Error('AI module must export function think()');
  }

  return ai;
}

export function createFourPlayerMatch(simulation, matchOptions = {}) {
  // 缺省量格斗区：createMatch 默认开在安全区，Bot 会休眠。
  // hub → 选掌 → 门 → 岛 的剧本由 probe 自己排，可经 matchOptions 覆盖。
  const state = simulation.createMatch({
    seed: 0x1a2b3c4d,
    gloveId: 'cotton',
    offhandId: 'granite',
    botCount: 3,
    phase: 'arena',
    ...matchOptions,
  });

  if (!state || typeof state !== 'object') {
    throw new Error('createMatch() did not return a state object');
  }

  return state;
}

export function getPlayers(view) {
  const collection =
    view?.players ??
    view?.entities?.players ??
    (Array.isArray(view) ? view : null);

  const players = Array.isArray(collection)
    ? collection
    : collection && typeof collection === 'object'
      ? Object.values(collection)
      : null;

  if (!players) {
    throw new Error('getView() snapshot does not contain a players collection');
  }
  if (players.length === 0) {
    throw new Error('getView() snapshot contains an empty players collection');
  }

  return players;
}

export function validateRoster(view) {
  const players = getPlayers(view);
  const humans = players.filter((player) => player?.kind === 'human');
  const bots = players.filter((player) => player?.kind === 'bot');

  if (
    players.length !== PLAYER_COUNT ||
    humans.length !== 1 ||
    bots.length !== 3
  ) {
    throw new Error(
      `expected 1 human + 3 bots; got ${humans.length} human(s), ` +
        `${bots.length} bot(s), ${players.length} total`,
    );
  }
  if (humans[0]?.id !== 'p0') {
    throw new Error(
      `expected p0 to be the human player; got ${String(humans[0]?.id)}`,
    );
  }

  const ids = new Set();
  for (const player of players) {
    if (
      player?.id === undefined ||
      player.id === null ||
      String(player.id).length === 0
    ) {
      throw new Error('every player must have a non-empty id');
    }
    if (ids.has(player.id)) {
      throw new Error(`duplicate player id: ${String(player.id)}`);
    }
    ids.add(player.id);

    for (const coordinate of ['x', 'y', 'z']) {
      if (!Number.isFinite(player[coordinate])) {
        throw new Error(
          `player ${String(player.id)} has invalid ${coordinate} coordinate`,
        );
      }
    }
  }

  return players;
}

export function makeSeededRandom(seed) {
  let value = seed >>> 0;
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 0x100000000;
  };

  random.next = random;
  random.float = random;
  random.range = (minimum, maximum) =>
    minimum + (maximum - minimum) * random();
  random.int = (minimum, maximum) =>
    Math.floor(random.range(minimum, maximum + 1));

  return random;
}

export function makeProbeInputs(view, stepIndex, ai, random, activity) {
  const players = validateRoster(view);
  const inputs = {};

  for (let index = 0; index < players.length; index += 1) {
    const player = players[index];
    let input;

    if (player.id === 'p0') {
      input = scriptedInput(players, player, stepIndex, 0);
    } else if (ai) {
      input = ai.think(view, player.id, random);
      if (activity) {
        activity.botThinkCalls = (activity.botThinkCalls ?? 0) + 1;
        if (input?.slap) {
          activity.botSlapAttempts = (activity.botSlapAttempts ?? 0) + 1;
        }
      }
    } else {
      input = scriptedInput(players, player, stepIndex, index);
    }

    inputs[player.id] = normalizeInput(input);
  }

  return inputs;
}

export function makeBenchInputFrames(view, frameCount = 240) {
  const players = validateRoster(view);
  const frames = [];

  for (let frame = 0; frame < frameCount; frame += 1) {
    const inputs = {};
    for (let index = 0; index < players.length; index += 1) {
      inputs[players[index].id] = normalizeInput({
        moveX: Math.sin(frame * 0.08 + index * 1.7) * 0.7,
        moveZ: Math.cos(frame * 0.06 + index * 1.3) * 0.85,
        yaw: frame * 0.025 + index * (Math.PI / 2),
        slap: (frame + index * 7) % 30 === 0,
        skill: (frame + index * 17) % 180 === 0,
        switchGlove: (frame + index * 29) % 240 === 0,
        dash: (frame + index * 11) % 90 === 0,
        jump: (frame + index * 13) % 150 === 0,
      });
    }
    frames.push(inputs);
  }

  return frames;
}

export function findNonFinite(value, path = 'state', seen = new WeakSet()) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? null : `${path}=${String(value)}`;
  }

  if (!value || typeof value !== 'object' || seen.has(value)) {
    return null;
  }
  seen.add(value);

  for (const [key, child] of Object.entries(value)) {
    const failure = findNonFinite(child, `${path}.${key}`, seen);
    if (failure) {
      return failure;
    }
  }

  return null;
}

export function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function localModuleSpecifiers(source) {
  const specifiers = new Set();
  for (const pattern of [STATIC_MODULE_SPECIFIER, DYNAMIC_MODULE_SPECIFIER]) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      specifiers.add(match[1]);
    }
  }
  return specifiers;
}

function assertPureSpecifier(importerUrl, specifier) {
  const pathSegments = specifier
    .split(/[\\/]/)
    .map((segment) => segment.split(/[?#]/, 1)[0])
    .filter(Boolean);
  const forbidden = pathSegments.find((segment) =>
    FORBIDDEN_PURITY_DIRECTORIES.has(segment),
  );
  if (forbidden) {
    throw new Error(
      `probe purity violation: ${fileURLToPath(importerUrl)} imports ` +
        `${JSON.stringify(specifier)} from forbidden ${forbidden}/`,
    );
  }
}

function readProbeSteps(value) {
  if (value === undefined || value === '') {
    return 60 * 60;
  }

  const steps = Number(value);
  if (!Number.isSafeInteger(steps) || steps <= 0) {
    throw new Error(
      `YZ_STEPS must be a positive integer; got ${JSON.stringify(value)}`,
    );
  }
  return steps;
}

function scriptedInput(players, player, stepIndex, offset) {
  const opponent = nearestOpponent(players, player);
  const deltaX = opponent ? opponent.x - player.x : 0;
  const deltaZ = opponent ? opponent.z - player.z : 1;
  const yaw = Math.atan2(deltaX, deltaZ);

  return {
    moveX: Math.sin(stepIndex * 0.055 + offset * 1.9) * 0.55,
    moveZ: 0.9,
    yaw,
    slap: (stepIndex + offset * 7) % 24 === 0,
    skill: (stepIndex + offset * 19) % 180 === 0,
    switchGlove: (stepIndex + offset * 31) % 240 === 0,
    dash: (stepIndex + offset * 13) % 90 === 0,
    jump: (stepIndex + offset * 17) % 150 === 0,
  };
}

function nearestOpponent(players, player) {
  let nearest = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of players) {
    if (
      candidate === player ||
      candidate?.id === player.id ||
      candidate?.alive === false
    ) {
      continue;
    }

    const deltaX = candidate.x - player.x;
    const deltaZ = candidate.z - player.z;
    const distance = deltaX * deltaX + deltaZ * deltaZ;
    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object') {
    return { ...ZERO_INPUT };
  }

  return {
    moveX: finiteInputNumber(input.moveX, 'moveX'),
    moveZ: finiteInputNumber(input.moveZ, 'moveZ'),
    yaw: finiteInputNumber(input.yaw, 'yaw'),
    slap: Boolean(input.slap),
    skill: Boolean(input.skill),
    switchGlove: Boolean(input.switchGlove),
    dash: Boolean(input.dash),
    jump: Boolean(input.jump),
  };
}

function finiteInputNumber(value, field) {
  if (value === undefined) {
    return 0;
  }
  if (!Number.isFinite(value)) {
    throw new Error(`input.${field} is not finite: ${String(value)}`);
  }
  return value;
}
