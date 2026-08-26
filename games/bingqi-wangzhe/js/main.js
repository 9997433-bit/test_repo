/**
 * 浏览器入口 —— 只做 boot：装配 core 运行时、挂载 UI、驱动心跳。
 * 任何玩法逻辑都不许写在这里。
 */

import { createGame, createAutoAdapter, SAVE_KEY } from './core/index.js';
import { mountApp } from './ui/app.js';

/** 心跳：1 秒一次，负责挂机结算、每日刷新与自动存档。 */
const TICK_MS = 1000;

function boot() {
  const root = document.getElementById('app');

  const game = createGame({
    now: () => Date.now(),
    storage: createAutoAdapter(),
    saveKey: SAVE_KEY,
    tzOffsetMinutes: -new Date().getTimezoneOffset(),
  });

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

  // 便于调试与后续代理接线（forge / combat / ui 通过 game.register 挂载）。
  window.__BQWZ__ = { game, stop: () => window.clearInterval(timer) };
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
