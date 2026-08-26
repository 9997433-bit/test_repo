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
store.events.on(EVENTS.offlineBanked, ({ seconds }) => {
  console.info(`[造化仙府] 离线 ${offlineSummary({ seconds })} 的产出已入挂机匣。`);
});

store.dispatch({ type: "BOOT", now: Date.now() });

const ui = createUI(store);
startEngine({ store, render: ui.frame });
ui.paint(store.get());

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") store.flush();
  else store.dispatch({ type: "RESUME", now: Date.now() });
});
window.addEventListener("pagehide", () => store.flush());
