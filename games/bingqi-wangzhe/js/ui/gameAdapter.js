/**
 * gameAdapter —— 把「逻辑层」和「界面层」解耦的那一层。
 *
 * UI 全程只与本适配器返回的对象对话，因此 `js/core|forge|combat|data`
 * 什么时候落地都不影响界面开发：缺什么就用 mock 顶上，来了就换真的。
 *
 * 期望注入形状（与 ARCHITECTURE.md 冻结签名一致，state 由适配器补位）：
 *
 *   mountApp(root, {
 *     state,                                    // core/state.js
 *     bus,                                      // core/events.js createBus()
 *     rng,                                      // core/rng.js createRng()
 *     data:   { weapons, stages, skills, strings },
 *     forge:  { previewForge, forgeWeapon, enhanceWeapon, dismantleWeapon, collectIdle },
 *     combat: { estimatePower, simulateBattle, generateArenaOpponents },
 *     save() {}
 *   })
 *
 * 任一分支缺失都合法。适配器会逐项探测并回退到 mock，
 * 并把结果记录在 `game.capabilities` 里，方便在设置页看到接线进度。
 */

import { createMockGame } from './mock/mockGame.js';

const isFn = (v) => typeof v === 'function';

/** 判断注入对象是否真的是一个逻辑层（而不是 main.js 的 `{ boot: true }`）。 */
export function looksLikeGame(injected) {
  if (!injected || typeof injected !== 'object') return false;
  return Boolean(
    injected.state ||
    isFn(injected.forge?.forgeWeapon) ||
    isFn(injected.combat?.simulateBattle) ||
    Array.isArray(injected.data?.weapons)
  );
}

/**
 * @param {object} injected  逻辑层（可为占位对象）
 * @param {{preset?:'demo', fresh?:boolean, seed?:number}} [mockOptions] 仅影响兜底数据
 */
export function createUiGame(injected, mockOptions = {}) {
  const mock = createMockGame(mockOptions);
  const real = looksLikeGame(injected) ? injected : null;
  const capabilities = [];

  /** 若真实实现存在则包一层（自动补 state 首参），否则回退 mock。 */
  function bind(label, realFn, mockFn, wrap) {
    if (isFn(realFn)) {
      capabilities.push({ label, source: 'core' });
      return wrap ? wrap(realFn) : realFn;
    }
    capabilities.push({ label, source: 'mock' });
    return mockFn;
  }

  const state = real?.state || mock.state;
  const withState = (fn) => (...args) => fn(state, ...args);

  const game = {
    ...mock,

    isMock: !real,
    source: real ? 'core+mock' : 'mockGame',

    get state() {
      return real?.state || mock.state;
    },

    /* —— 事件：优先用 core/events.js 的 bus —— */
    subscribe(fn) {
      const offMock = mock.subscribe(fn);
      if (!isFn(real?.bus?.on)) return offMock;
      const handler = (payload) => fn('core', payload);
      real.bus.on('*', handler);
      return () => {
        offMock();
        real.bus.off?.('*', handler);
      };
    },

    /* —— 数据 —— */
    stages: Array.isArray(real?.data?.stages)
      ? () => real.data.stages
      : mock.stages,

    /* —— 锻造 —— */
    previewForge: bind('previewForge', real?.forge?.previewForge, mock.previewForge, withState),
    forgeWeapon: bind('forgeWeapon', real?.forge?.forgeWeapon, mock.forgeWeapon,
      (fn) => (opts) => fn(state, opts, real?.rng)),
    enhanceWeapon: bind('enhanceWeapon', real?.forge?.enhanceWeapon, mock.enhanceWeapon, withState),
    dismantleWeapon: bind('dismantleWeapon', real?.forge?.dismantleWeapon, mock.dismantleWeapon, withState),
    collectIdle: bind('collectIdle', real?.forge?.collectIdle, mock.collectIdle,
      (fn) => (now = Date.now()) => fn(state, now)),

    /* —— 战斗 —— */
    estimatePower: bind('estimatePower', real?.combat?.estimatePower, mock.estimatePower,
      (fn) => (ids) => fn(state, ids ?? state.lineup)),
    arenaOpponents: bind('arenaOpponents', real?.combat?.generateArenaOpponents, mock.arenaOpponents,
      (fn) => () => fn(state, real?.rng)),

    /* —— 存档 —— */
    save: isFn(real?.save) ? real.save : mock.save,

    capabilities,
    hasCore: Boolean(real)
  };

  // 图鉴数据若由 data/weapons.js 提供，则以其为准（保留 mock 的 found 统计逻辑）。
  if (Array.isArray(real?.data?.weapons)) {
    capabilities.push({ label: 'data.weapons', source: 'core' });
    game.codexEntries = () => real.data.weapons.map((proto) => ({
      ...proto,
      found: Boolean(state.codex?.[proto.id]),
      count: state.codex?.[proto.id] || 0
    }));
    game.prototypeCount = () => real.data.weapons.length;
  }

  return game;
}
