/**
 * gameAdapter —— 把「逻辑层」和「界面层」解耦的那一层。
 *
 * UI 全程只与本适配器返回的对象对话，因此 `js/core|forge|combat|data`
 * 什么时候落地都不影响界面开发。
 *
 * ## 为什么不做「逐个函数混搭」
 *
 * 第一版曾按函数粒度回退：有真的用真的，没有的用 mock。但存档是一个整体——
 * 让 `combat.estimatePower` 读 core 的 state、而兵器却由 mock 生成，只会得到
 * 一个两边都不自洽的界面。所以这里改成**按整体切换**：
 *
 * - `ready`（core + data + forge + combat 全部就位）→ 全量走逻辑层；
 * - 否则 → 全量走 mock，同时仍然订阅 core 的事件总线，
 *   并把各子系统的到位情况暴露给「背包 → 设置 → 数据来源」。
 *
 * ## 期望的注入形状
 *
 * 兼容两种写法：顶层字段，或 core `register()` 之后的 `game.modules.*`。
 *
 *   mountApp(root, {
 *     state, bus, rng,                          // core/index.js createGame()
 *     data:   { weapons, stages, skills, strings },
 *     forge:  { previewForge, forgeWeapon, enhanceWeapon, dismantleWeapon, collectIdle },
 *     combat: { estimatePower, simulateBattle, generateArenaOpponents },
 *     save() {}
 *   })
 */

import { createMockGame } from './mock/mockGame.js';

const isFn = (v) => typeof v === 'function';
const pick = (game, name) => game?.[name] || game?.modules?.[name] || null;

/** core 运行时本身是否在场（`createGame()` 的产物）。 */
export function hasCoreRuntime(injected) {
  return Boolean(
    injected &&
    typeof injected === 'object' &&
    injected.state &&
    injected.bus &&
    isFn(injected.tick)
  );
}

/**
 * 探测各子系统到位情况。
 * @returns {{core:boolean,data:boolean,forge:boolean,combat:boolean,ready:boolean}}
 */
export function inspectCapabilities(injected) {
  const dataApi = pick(injected, 'data');
  const forgeApi = pick(injected, 'forge');
  const combatApi = pick(injected, 'combat');
  const core = hasCoreRuntime(injected);
  const data = Array.isArray(dataApi?.weapons) && Array.isArray(dataApi?.stages);
  const forge = ['previewForge', 'forgeWeapon', 'enhanceWeapon', 'dismantleWeapon', 'collectIdle']
    .every((k) => isFn(forgeApi?.[k]));
  const combat = ['estimatePower', 'simulateBattle', 'generateArenaOpponents']
    .every((k) => isFn(combatApi?.[k]));
  return { core, data, forge, combat, ready: core && data && forge && combat };
}

/**
 * UI 需要、但冻结契约里没有的动词（关卡挑战、竞技对战、上阵、羁绊…）。
 * 全量接入后它们必须由 Round 2 的编排层显式提供，否则宁可返回「待接入」，
 * 也不能悄悄落回 mock —— 那会让 core 的存档和 mock 的兵器各说各话。
 */
const ORCHESTRATION_VERBS = [
  'challengeStage', 'arenaFight', 'setLineup', 'clearSlot',
  'bonds', 'peekIdle', 'weapons', 'weapon', 'campaign', 'arena', 'enhanceCost'
];

const LABELS = { core: '核心', data: '数据', forge: '锻造', combat: '战斗' };

/**
 * @param {object} injected  逻辑层（可为 `{ boot: true }` 之类的占位对象）
 * @param {{preset?:'demo', fresh?:boolean, seed?:number}} [mockOptions] 仅影响兜底数据
 */
export function createUiGame(injected, mockOptions = {}) {
  const caps = inspectCapabilities(injected);
  const mock = createMockGame(mockOptions);

  /** 供设置页展示的接线进度。 */
  const capabilities = ['core', 'data', 'forge', 'combat'].map((k) => ({
    key: k,
    label: LABELS[k],
    ready: caps[k]
  }));

  const pending = capabilities.filter((c) => !c.ready).map((c) => c.label);

  const base = {
    ...mock,
    capabilities,
    /** 逻辑层是否已经能够独立驱动整个界面。 */
    hasCore: caps.ready,
    coreRuntime: caps.core ? injected : null,
    pendingLabels: pending,
    source: caps.ready ? 'core' : caps.core ? 'core-runtime + mock' : 'mockGame'
  };

  if (!caps.ready) {
    // core 在场但玩法层还没齐：数据仍走 mock，但把 core 的事件接出来，
    // 这样 Round 2 接线时 UI 侧不需要再改。
    if (caps.core) {
      base.subscribe = (fn) => {
        const offMock = mock.subscribe(fn);
        const handler = (payload, ctx) => fn(ctx?.type || 'core', payload);
        injected.bus.on('*', handler);
        return () => {
          offMock();
          injected.bus.off?.('*', handler);
        };
      };
    }
    return base;
  }

  /* ------------------------------------------------------------------ *
   * 全量接入：core + data + forge + combat 都在场                        *
   * ------------------------------------------------------------------ */

  const dataApi = pick(injected, 'data');
  const forgeApi = pick(injected, 'forge');
  const combatApi = pick(injected, 'combat');
  const stateOf = () => injected.state;
  const withState = (fn) => (...args) => fn(stateOf(), ...args);

  // 逻辑层没提供的编排动词一律显式失败，绝不静默回落到 mock。
  const guards = {};
  ORCHESTRATION_VERBS.forEach((verb) => {
    if (isFn(injected[verb])) {
      guards[verb] = (...args) => injected[verb](...args);
      return;
    }
    guards[verb] = () => {
      console.warn(`[bqwz/ui] 逻辑层缺少 ${verb}()，该操作已停用（不回落 mock）`);
      return { ok: false, error: `「${verb}」尚未接入` };
    };
  });

  return {
    ...base,
    ...guards,

    get state() {
      return stateOf();
    },

    subscribe(fn) {
      const handler = (payload, ctx) => fn(ctx?.type || 'core', payload);
      injected.bus.on('*', handler);
      return () => injected.bus.off?.('*', handler);
    },
    emit: (type, payload) => injected.bus.emit(type, payload),

    resources: () => stateOf().resources,
    tick: (now) => injected.tick(now),

    stages: () => dataApi.stages,
    codexEntries: () => dataApi.weapons.map((proto) => ({
      ...proto,
      found: Boolean(stateOf().codex?.[proto.id]),
      count: stateOf().codex?.[proto.id] || 0
    })),
    prototypeCount: () => dataApi.weapons.length,

    previewForge: withState(forgeApi.previewForge),
    forgeWeapon: (opts) => forgeApi.forgeWeapon(stateOf(), opts, injected.rng),
    enhanceWeapon: withState(forgeApi.enhanceWeapon),
    dismantleWeapon: withState(forgeApi.dismantleWeapon),
    collectIdle: (now = Date.now()) => forgeApi.collectIdle(stateOf(), now),

    estimatePower: (ids) => combatApi.estimatePower(stateOf(), ids ?? stateOf().lineup),
    arenaOpponents: () => combatApi.generateArenaOpponents(stateOf(), injected.rng),

    lineup: () => stateOf().lineup,
    lineupUnlocked: () => injected.unlockedLineupSlots?.() ?? mock.lineupUnlocked(),

    save: isFn(injected.save) ? injected.save : mock.save,
    reset: isFn(injected.reset) ? injected.reset : mock.reset
  };
}
