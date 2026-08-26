/**
 * core 聚合出口 — forge / combat / ui 只从这里 import。
 *
 * `createGame()` 把 rng / clock / 事件总线 / 存档 / 状态原语组装成一个可注入的运行时。
 * 全部纯 ESM，可在 Node 中直接 import（不触碰 window / document）。
 */

import { createRng, normalizeSeed } from './rng.js';
import { createBus, ANY } from './events.js';
import { createClock, HOUR, MINUTE, SECOND, DAY, OFFLINE_CAP_HOURS, OFFLINE_CAP_MS, elapsedSince, formatDuration, gameDayIndex, isNewGameDay } from './clock.js';
import {
  SAVE_KEY,
  createStorage,
  createMemoryAdapter,
  createLocalStorageAdapter,
  createAutoAdapter,
  resolveStorage,
} from './storage.js';
import {
  SAVE_VERSION,
  RESOURCE_IDS,
  RESOURCE_CAPS,
  IDLE_RESOURCE_IDS,
  LINEUP_SLOTS,
  LINEUP_UNLOCK_STAGES,
  STAMINA_REGEN_MS,
  createInitialState,
  hydrate,
  serialize,
  tickIdle,
  takeIdlePending,
  addResource,
  spend,
  canAfford,
  getResource,
  unlockedLineupSlots,
  resetDaily,
  idleRatesPerHour,
} from './state.js';

export {
  // rng
  createRng,
  normalizeSeed,
  // events
  createBus,
  ANY,
  // clock
  createClock,
  elapsedSince,
  formatDuration,
  gameDayIndex,
  isNewGameDay,
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  OFFLINE_CAP_HOURS,
  OFFLINE_CAP_MS,
  // storage
  SAVE_KEY,
  createStorage,
  createMemoryAdapter,
  createLocalStorageAdapter,
  createAutoAdapter,
  resolveStorage,
  // state
  SAVE_VERSION,
  RESOURCE_IDS,
  RESOURCE_CAPS,
  IDLE_RESOURCE_IDS,
  LINEUP_SLOTS,
  LINEUP_UNLOCK_STAGES,
  STAMINA_REGEN_MS,
  createInitialState,
  hydrate,
  serialize,
  tickIdle,
  takeIdlePending,
  addResource,
  spend,
  canAfford,
  getResource,
  unlockedLineupSlots,
  resetDaily,
  idleRatesPerHour,
};

/** 事件名常量：跨模块统一，避免拼写漂移。 */
export const EVENTS = Object.freeze({
  READY: 'game:ready',
  STATE_CHANGED: 'state:changed',
  RESOURCE_CHANGED: 'resource:changed',
  IDLE_TICK: 'idle:tick',
  IDLE_COLLECTED: 'idle:collected',
  DAILY_RESET: 'daily:reset',
  SAVED: 'save:written',
  LOADED: 'save:loaded',
  SAVE_FAILED: 'save:failed',
  SAVE_CORRUPT: 'save:corrupt',
  RESET: 'save:reset',
});

/** 自动存档最小间隔。 */
const AUTOSAVE_INTERVAL_MS = 10 * SECOND;

/**
 * @typedef {Object} Game
 * @property {object} state              当前存档（可读；写请走原语）
 * @property {import('./events.js').Bus} bus
 * @property {import('./rng.js').Rng} rng
 * @property {import('./clock.js').Clock} clock
 * @property {import('./storage.js').Storage} storage
 * @property {typeof EVENTS} EVENTS
 */

/**
 * 组装游戏运行时。
 *
 * @param {Object} [options]
 * @param {number|string} [options.seed]      随机种子；不传则由当前时间派生（新档时）
 * @param {(() => number)|number} [options.now] 时间源；测试传固定函数
 * @param {any} [options.storage]             Storage 实例 / StorageAdapter / 省略（内存）
 * @param {string} [options.saveKey]          存档键，默认 `bqwz.save.v1`
 * @param {boolean} [options.autoLoad=true]   构造时尝试读档
 * @param {boolean} [options.autoSave=true]   tick 时按间隔自动存档
 * @param {number} [options.tzOffsetMinutes]  每日刷新用的时区偏移（UI 注入）
 * @returns {Game & Record<string, any>}
 */
export function createGame(options = {}) {
  const clock = createClock(options.now);
  const bus = createBus({
    onError: (err, ctx) => {
      // eslint-disable-next-line no-console
      console.error(`[bqwz] 监听器异常 @${ctx.type}`, err);
    },
  });
  const storage = resolveStorage(options.storage, { key: options.saveKey });

  const autoSave = options.autoSave !== false;
  const explicitSeed = options.seed !== undefined && options.seed !== null;

  let state = createInitialState({
    seed: explicitSeed ? options.seed : normalizeSeed(clock.nowMs()),
    nowMs: clock.nowMs(),
  });
  let rng = createRng(state.seed);
  let lastAutoSaveMs = clock.nowMs();
  /** @type {Map<string, any>} */
  const modules = new Map();

  function nowMs() {
    return clock.nowMs();
  }

  function applyTimezone() {
    if (Number.isFinite(options.tzOffsetMinutes)) {
      state.flags.tzOffsetMinutes = options.tzOffsetMinutes;
    }
  }

  function attachRngState() {
    if (Number.isFinite(state.rngState)) rng.setState(state.rngState);
  }

  /** 从存档读取；失败或无档时保留/新建初始档。 */
  function load() {
    const result = storage.load();
    if (result.missing) {
      applyTimezone();
      bus.emit(EVENTS.LOADED, { fresh: true, state });
      return { ok: false, fresh: true, state };
    }
    if (!result.ok) {
      bus.emit(EVENTS.SAVE_CORRUPT, { error: result.error });
      applyTimezone();
      return { ok: false, fresh: true, corrupt: true, state };
    }
    state = hydrate(result.data, { seed: state.seed, nowMs: nowMs() });
    if (explicitSeed) state.seed = options.seed;
    rng = createRng(state.seed);
    attachRngState();
    applyTimezone();
    bus.emit(EVENTS.LOADED, { fresh: false, state });
    bus.emit(EVENTS.STATE_CHANGED, { reason: 'load', state });
    return { ok: true, fresh: false, state };
  }

  /** 写档；返回 storage 的结果。 */
  function save() {
    state.updatedAt = nowMs();
    state.rngState = rng.getState();
    const payload = serialize(state);
    const result = storage.save(payload);
    lastAutoSaveMs = state.updatedAt;
    if (result.ok) bus.emit(EVENTS.SAVED, { bytes: result.bytes, at: state.updatedAt });
    else bus.emit(EVENTS.SAVE_FAILED, { error: result.error });
    return result;
  }

  /** 清档重来。 */
  function reset(seed) {
    const nextSeed = seed ?? (explicitSeed ? options.seed : normalizeSeed(nowMs()));
    state = createInitialState({ seed: nextSeed, nowMs: nowMs() });
    rng = createRng(state.seed);
    applyTimezone();
    storage.clear();
    bus.emit(EVENTS.RESET, { state });
    bus.emit(EVENTS.STATE_CHANGED, { reason: 'reset', state });
    return state;
  }

  /**
   * 推进一帧：每日刷新 + 挂机结算 + 按间隔自动存档。
   * @param {number} [atMs] 覆盖当前时间（测试用）
   */
  function tick(atMs) {
    const at = Number.isFinite(atMs) ? atMs : nowMs();
    const rolled = resetDaily(state, at);
    if (rolled) bus.emit(EVENTS.DAILY_RESET, { at, state });
    const report = tickIdle(state, at);
    if (report.elapsedMs > 0) bus.emit(EVENTS.IDLE_TICK, report);
    if (autoSave && at - lastAutoSaveMs >= AUTOSAVE_INTERVAL_MS) save();
    return report;
  }

  /** 领取挂机仓库中的整数产出。 */
  function collectIdle(atMs) {
    const at = Number.isFinite(atMs) ? atMs : nowMs();
    tickIdle(state, at);
    const collected = takeIdlePending(state, at);
    bus.emit(EVENTS.IDLE_COLLECTED, { collected, at });
    bus.emit(EVENTS.STATE_CHANGED, { reason: 'idle:collect', state });
    return collected;
  }

  function addResourceTracked(id, n, reason = 'unknown') {
    const before = getResource(state, id);
    const after = addResource(state, id, n);
    if (after !== before) {
      bus.emit(EVENTS.RESOURCE_CHANGED, { id, before, after, delta: after - before, reason });
      bus.emit(EVENTS.STATE_CHANGED, { reason: `resource:${id}`, state });
    }
    return after;
  }

  function spendTracked(costMap, reason = 'unknown') {
    const ok = spend(state, costMap);
    if (ok) {
      bus.emit(EVENTS.STATE_CHANGED, { reason: `spend:${reason}`, state });
      for (const id of Object.keys(costMap || {})) {
        bus.emit(EVENTS.RESOURCE_CHANGED, {
          id,
          after: getResource(state, id),
          delta: -Number(costMap[id] || 0),
          reason,
        });
      }
    }
    return ok;
  }

  /**
   * 挂载子系统（forge / combat / ui service）。factory 收到 game 实例，返回的对象挂在 game.modules。
   * 这样 core 不需要 import 其他代理的目录，避免 Round 1 并发时的硬依赖。
   */
  function register(name, factory) {
    const api = typeof factory === 'function' ? factory(publicApi) : factory;
    modules.set(name, api);
    publicApi.modules[name] = api;
    return api;
  }

  const publicApi = {
    // 组件
    bus,
    clock,
    storage,
    modules: {},
    EVENTS,
    get state() {
      return state;
    },
    get rng() {
      return rng;
    },
    get seed() {
      return state.seed;
    },
    // 事件
    on: bus.on,
    once: bus.once,
    off: bus.off,
    emit: bus.emit,
    // 时间
    nowMs,
    // 存档
    load,
    save,
    reset,
    serialize: () => serialize(state),
    hydrate: (raw) => {
      state = hydrate(raw, { seed: state.seed, nowMs: nowMs() });
      attachRngState();
      bus.emit(EVENTS.STATE_CHANGED, { reason: 'hydrate', state });
      return state;
    },
    exportJson: () => JSON.stringify(serialize(state)),
    importJson: (json) => publicApi.hydrate(json),
    // 循环
    tick,
    collectIdle,
    // 资源原语
    addResource: addResourceTracked,
    spend: spendTracked,
    canAfford: (costMap) => canAfford(state, costMap),
    getResource: (id) => getResource(state, id),
    idleRates: () => idleRatesPerHour(state.campaign.highestStage),
    unlockedLineupSlots: () => unlockedLineupSlots(state),
    // 扩展
    register,
    getModule: (name) => modules.get(name),
    destroy: () => {
      bus.clear();
      modules.clear();
    },
  };

  if (options.autoLoad !== false) load();
  else applyTimezone();

  // 首次进入即结算一次离线收益，UI 可以直接读 idle:tick 报告。
  const bootReport = tickIdle(state, nowMs());
  resetDaily(state, nowMs());
  bus.emit(EVENTS.READY, { state, boot: bootReport });

  return publicApi;
}

export default createGame;
