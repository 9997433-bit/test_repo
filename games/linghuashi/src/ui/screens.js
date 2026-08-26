import "./ui.css";
import { announce, focusScreen } from "./dom.js";
import { renderSplash } from "./screen-splash.js";
import { renderClass } from "./screen-class.js";
import { renderHub } from "./screen-hub.js";
import { renderBattle } from "./screen-battle.js";
import { renderResult } from "./screen-result.js";
import { renderGallery } from "./screen-gallery.js";

const VIEWS = {
  splash: { render: renderSplash, title: "卷首" },
  class: { render: renderClass, title: "择道" },
  hub: { render: renderHub, title: "枢纽" },
  battle: { render: renderBattle, title: "对战" },
  result: { render: renderResult, title: "结算" },
  gallery: { render: renderGallery, title: "画阁" },
};

export const SCREENS = Object.keys(VIEWS);

// 每个 root 记住上一屏的清理函数：切屏、重绘、卸载都先跑一次，
// 定时器 / 全局监听 / 画布回调不会跨屏残留。
const disposers = new WeakMap();

function disposeScreen(root) {
  const dispose = disposers.get(root);
  if (!dispose) return;
  disposers.delete(root);
  try {
    dispose();
  } catch (err) {
    console.error("[linghuashi] 屏幕清理失败", err);
  }
}

export function renderApp(root, store, navigate) {
  disposeScreen(root);
  const state = store.get();
  const name = VIEWS[state.screen] ? state.screen : "splash";
  if (name !== state.screen) store.set({ screen: name });
  const view = VIEWS[name];

  root.innerHTML = "";
  root.dataset.screen = name;
  const dispose = view.render({ root, store, navigate, screen: name });
  if (typeof dispose === "function") disposers.set(root, dispose);
  focusScreen(root);
  if (typeof document !== "undefined") document.title = `灵画师 · ${view.title}`;
  announce(`已进入${view.title}`);
}

/** 供 boot 卸载时使用，保证最后一屏也被清理。 */
export function destroyApp(root) {
  disposeScreen(root);
  root.innerHTML = "";
}
