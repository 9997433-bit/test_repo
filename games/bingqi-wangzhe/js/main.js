/**
 * 浏览器入口 —— 组合根（composition root）。
 *
 * 这里是整个工程里**唯一**知道四个目录同时存在的地方：
 *
 *   data ─┐
 *   forge ├→ core/api.js installGameApi() → game → ui/app.js mountApp()
 *   combat┘
 *
 * 职责只有三件：装配、挂载、心跳。任何玩法规则都不许写在这个文件里
 * （规则在 forge/combat/data，编排在 core/api.js）。
 *
 * 浏览器专属的东西（window / document / localStorage）也只允许出现在这里：
 * 逻辑层拿到的存储是 core 的 storage 适配器，看不到 window。
 */

import * as data from './data/index.js';
import * as forge from './forge/index.js';
import * as combat from './combat/index.js';
import {
  createGame,
  createAutoAdapter,
  installGameApi,
  SAVE_KEY,
} from './core/index.js';

/** 心跳：1 秒一次，负责挂机结算、每日刷新与自动存档。 */
const TICK_MS = 1000;

/**
 * 装配逻辑层：core 运行时 + data/forge/combat + 编排动词。
 * 不碰 DOM，因此测试脚本可以直接调它。
 *
 * @param {object} [options] 透传给 createGame（now / storage / seed / saveKey…）
 * @returns {object} 可直接交给 mountApp() 的 game
 */
export function createBoundGame(options = {}) {
  const game = createGame({
    saveKey: SAVE_KEY,
    // 资源挂机由 forge/idle.js 记账，core 只管体力，避免两套账本各发一份。
    idleResources: false,
    ...options,
  });
  return installGameApi(game, { data, forge, combat });
}

async function boot() {
  const root = document.getElementById('app');

  const game = createBoundGame({
    now: () => Date.now(),
    storage: createAutoAdapter(),
    tzOffsetMinutes: -new Date().getTimezoneOffset(),
  });

  // 界面层在模块顶层就会读 document（motion.js 同步一次动效偏好），
  // 所以这里延到 boot 里动态 import —— 这样 createBoundGame() 在 Node 下也能被直接测。
  const { mountApp } = await import('./ui/app.js');
  if (root) mountApp(root, game);

  const timer = window.setInterval(() => game.tick(), TICK_MS);

  // 切后台 / 关页面时补一次结算与存档，避免丢进度。
  document.addEventListener('visibilitychange', () => {
    game.tick();
    if (document.visibilityState === 'hidden') game.save();
  });
  window.addEventListener('pagehide', () => {
    game.tick();
    game.save();
  });
  window.addEventListener('beforeunload', () => game.save());

  window.__BQWZ__ = { game, data, forge, combat, stop: () => window.clearInterval(timer) };
  return game;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}

export { boot };
