/**
 * gameAdapter —— 把「逻辑层」和「界面层」解耦的那一层。
 *
 * UI 全程只与本适配器返回的对象对话。
 *
 * ## 为什么按整体切换，而不是逐个函数混搭
 *
 * 第一版曾按函数粒度回退：有真的用真的，没有的用 mock。但存档是一个整体——
 * 让 `combat.estimatePower` 读 core 的 state、而兵器却由 mock 生成，只会得到
 * 一个两边都不自洽的界面。所以这里按**整体**切换：
 *
 * - `ready`（core 运行时 + data + forge + combat 全部就位）→ 全量走 `live/liveGame.js`；
 * - 否则 → 全量走 mock，同时仍订阅 core 的事件总线，
 *   并把各子系统的到位情况暴露给「背包 → 设置 → 数据来源」。
 *
 * ## ready 是怎么测出来的
 *
 * 1. **注入优先**：`mountApp(root, game)` 传进来的对象上若有 `data/forge/combat`
 *    （顶层或 `game.modules.*`，即 core `register()` 之后的形状），直接用它们。
 * 2. **仓库兜底**：没有注入时，`probeLogicModules()` 用动态 `import()` 去取
 *    `js/data|forge|combat/index.js`。动态导入的好处是：逻辑层若语法出错或抛异常，
 *    Promise 只会 reject，界面照常以 mock 运行，不会白屏。
 * 3. **函数点名**：拿到模块后逐个点名必需导出（见 `REQUIRED`），
 *    少一个就算该子系统未就绪，宁可整体退回 mock，也不给出半真半假的存档。
 */

import { createMockGame } from './mock/mockGame.js';

const isFn = (v) => typeof v === 'function';
const pick = (game, name) => game?.[name] || game?.modules?.[name] || null;

/** 各子系统的点名单：少一个就算没就位。 */
const REQUIRED = {
  forge: [
    'previewForge', 'forgeWeapon', 'enhanceWeapon', 'dismantleWeapon', 'collectIdle',
    'previewIdle', 'computeWeaponStats', 'enhanceCostFor', 'levelCapFor', 'setWeaponLock'
  ],
  combat: [
    'estimatePower', 'simulateBattle', 'generateArenaOpponents',
    'computeBonds', 'arenaOpponentToWaves', 'createCombatRng'
  ]
};

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

function dataReady(dataApi) {
  if (!dataApi) return false;
  const weapons = dataApi.weapons ?? dataApi.WEAPONS;
  const stages = dataApi.stages ?? dataApi.STAGES;
  return Array.isArray(weapons) && weapons.length > 0
    && Array.isArray(stages) && stages.length > 0;
}

function moduleReady(api, keys) {
  return Boolean(api) && keys.every((k) => isFn(api[k]));
}

/** 从注入对象里取出逻辑层模块（顶层字段或 `modules.*`）。 */
export function resolveModules(injected) {
  return {
    data: pick(injected, 'data'),
    forge: pick(injected, 'forge'),
    combat: pick(injected, 'combat')
  };
}

/**
 * 探测各子系统到位情况。
 * @param {object} injected core 运行时
 * @param {{data?:object,forge?:object,combat?:object}} [mods] 已解析的模块（省略时从 injected 取）
 * @returns {{core:boolean,data:boolean,forge:boolean,combat:boolean,ready:boolean}}
 */
export function inspectCapabilities(injected, mods) {
  const m = mods || resolveModules(injected);
  const core = hasCoreRuntime(injected);
  const data = dataReady(m.data);
  const forge = moduleReady(m.forge, REQUIRED.forge);
  const combat = moduleReady(m.combat, REQUIRED.combat);
  return { core, data, forge, combat, ready: core && data && forge && combat };
}

/**
 * 动态载入仓库内的逻辑层模块与 liveGame 工厂。
 * 任一模块导入失败（文件缺失 / 语法错 / 顶层抛错）都只是让本次探测失败，
 * 界面继续用 mock 跑，不会连累外壳。
 * @returns {Promise<{data:object|null,forge:object|null,combat:object|null,createLive:Function|null}>}
 */
export async function probeLogicModules() {
  const load = async (path) => {
    try {
      return await import(path);
    } catch (err) {
      console.warn(`[bqwz/ui] 逻辑层模块载入失败：${path}`, err);
      return null;
    }
  };
  const [data, forge, combat, live] = await Promise.all([
    load('../data/index.js'),
    load('../forge/index.js'),
    load('../combat/index.js'),
    load('./live/liveGame.js')
  ]);
  return { data, forge, combat, createLive: live?.createLiveGame || null };
}

const LABELS = { core: '核心', data: '数据', forge: '锻造', combat: '战斗' };

function describe(caps) {
  return ['core', 'data', 'forge', 'combat'].map((k) => ({
    key: k,
    label: LABELS[k],
    ready: caps[k]
  }));
}

/**
 * @param {object} injected  逻辑层（可为 `{ boot: true }` 之类的占位对象）
 * @param {{preset?:'demo', fresh?:boolean, seed?:number}} [mockOptions] 仅影响兜底数据
 * @param {{data?:object,forge?:object,combat?:object,createLive?:Function}} [probe]
 *        `probeLogicModules()` 的结果；注入对象自带模块时可省略
 */
export function createUiGame(injected, mockOptions = {}, probe) {
  const injectedMods = resolveModules(injected);
  const resolved = {
    // 注入优先：core `register()` 过的模块永远盖过仓库里的默认实现。
    data: injectedMods.data || probe?.data || null,
    forge: injectedMods.forge || probe?.forge || null,
    combat: injectedMods.combat || probe?.combat || null
  };

  const caps = inspectCapabilities(injected, resolved);
  const capabilities = describe(caps);

  if (caps.ready && isFn(probe?.createLive)) {
    try {
      const live = probe.createLive(injected, resolved);
      return Object.assign(live, {
        capabilities,
        hasCore: true,
        coreRuntime: injected,
        pendingLabels: [],
        source: 'core'
      });
    } catch (err) {
      console.error('[bqwz/ui] 逻辑层接线失败，暂用 mock 兜底', err);
      capabilities.forEach((c) => {
        if (c.key !== 'core') c.ready = false;
      });
    }
  }

  /* --------------------- 兜底：mock 驱动 --------------------- */

  const mock = createMockGame(mockOptions);
  const base = {
    ...mock,
    capabilities,
    hasCore: false,
    coreRuntime: caps.core ? injected : null,
    pendingLabels: capabilities.filter((c) => !c.ready).map((c) => c.label),
    source: caps.core ? 'core-runtime + mock' : 'mockGame'
  };

  // core 在场但玩法层还没齐：数据仍走 mock，但把 core 的事件接出来。
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
