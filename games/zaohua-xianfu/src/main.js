import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/mansion.css";
import "./styles/combat.css";
import { createStore } from "./core/store.js";
import { startEngine } from "./core/engine.js";
import { EVENTS } from "./core/events.js";
import { offlineSummary } from "./core/offline.js";
import { createUI } from "./ui/app.js";

const store = createStore();

store.events.on(EVENTS.saveCorrupt, ({ status, reason }) => {
  console.warn(`[造化仙府] 存档${status === "unsupported" ? "版本不认" : "损坏"}（${reason}），已备份并回退默认档。`);
});
store.events.on(EVENTS.saveFailed, ({ error, bytes }) => {
  console.warn(`[造化仙府] 存档写入失败（${error}，${bytes} 字节），稍后自动重试。`);
});
store.events.on(EVENTS.offlineBanked, ({ seconds, efficiency }) => {
  const pct = Math.round((Number.isFinite(efficiency) ? efficiency : 1) * 100);
  console.info(`[造化仙府] 离线 ${offlineSummary({ seconds })} 的产出已按 ${pct}% 折算入挂机匣。`);
});

store.dispatch({ type: "BOOT", now: Date.now() });

const ui = createUI(store);
startEngine({ store, render: ui.frame });
ui.paint(store.get());

// 纯视图点击（切页签、选地块）不进 dispatch，而 engine 每帧只热补 HUD，
// 所以在 composition root 上补一次重绘；已 dispatch 的点击此处会被 HTML 比对短路。
document.addEventListener("click", (event) => {
  if (event.target?.closest?.("[data-act]")) ui.paint(store.get());
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") store.flush();
  else store.dispatch({ type: "RESUME", now: Date.now() });
});
window.addEventListener("pagehide", () => store.flush());
