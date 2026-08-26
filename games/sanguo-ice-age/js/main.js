/** 入口：装配状态、循环、渲染器与 UI。仅在浏览器环境执行。 */
import { TICK_MS, AUTOSAVE_MS } from "./config.js";
import { createBus } from "./engine/bus.js";
import { createLoop } from "./engine/loop.js";
import { loadGame, saveGame } from "./engine/save.js";
import { createInitialState, rehydrate } from "./sim/state.js";
import { tickGame } from "./sim/tick.js";
import { createRenderer } from "./render/renderer.js";
import { createApp } from "./ui/app.js";

function init() {
  let state = loadGame();
  if (state) {
    state = rehydrate(state);
  } else {
    state = createInitialState();
  }

  const bus = createBus();
  const canvas = document.getElementById("game-canvas");
  const renderer = createRenderer(canvas, () => state);

  const game = {
    getState: () => state,
    setState(next) {
      state = rehydrate(next);
    },
    renderer,
    bus,
    loop: null,
    restart() {
      state = createInitialState();
      game.loop.setSpeed(1);
    },
  };

  let app = null;
  const loop = createLoop({
    tickMs: TICK_MS,
    onTick() {
      const events = tickGame(state);
      if (events.length) bus.emit("sim-events", events);
    },
    onFrame(dt, time) {
      renderer.frame(dt, time);
      if (app) app.uiFrame(performance.now());
    },
  });
  game.loop = loop;

  app = createApp(game);
  loop.start();

  setInterval(() => {
    if (!state.gameOver) saveGame(state);
  }, AUTOSAVE_MS);

  window.addEventListener("beforeunload", () => {
    if (!state.gameOver) saveGame(state);
  });

  // 调试出口
  window.__game = game;
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}
