/** 主循环入口：装配存档、音频、事件总线与屏幕外壳。 */
import { createAudio } from "../audio/index.js";
import { createShell } from "../ui/shell.js";
import { describeCaps } from "./adapters.js";
import { HERO_CATALOG } from "./catalog.js";
import { createBus } from "./events.js";
import { buildLoadout } from "./progress.js";
import { loadSave, resetSave, writeSave } from "./store.js";

/**
 * 把无障碍设置写到 `<html>` 上，供 `styles/fx.css` 的两条通道消费：
 * - `data-reduced-motion="on|off"`：压掉全部动画（`"off"` 显式覆盖系统偏好）
 * - `data-screen-shake="on|off"`：只禁 `.fx-shake-*` 位移，闪光 / 弹跳 / 飘字保留
 * 两个通道相互独立，写一次全局生效。
 */
function applyMotionPrefs(settings = {}) {
  const html = globalThis.document?.documentElement;
  if (!html) return;
  html.setAttribute("data-reduced-motion", settings.reduceMotion === true ? "on" : "off");
  html.setAttribute("data-screen-shake", settings.shake === false ? "off" : "on");
}

export function boot(root) {
  if (!root) return null;
  const bus = createBus();
  const save = loadSave();
  const audio = createAudio(save.settings);

  const app = {
    bus,
    save,
    audio,
    catalogSize: HERO_CATALOG.length,
    version: "0.9.0",
    caps: describeCaps(),
    persist() {
      writeSave(app.save);
      bus.emit("save", app.save);
    },
    reset() {
      app.save = resetSave();
      bus.emit("save", app.save);
    },
    loadout(opts = {}) {
      return buildLoadout(app.save, { catalogSize: HERO_CATALOG.length, ...opts });
    },
    addGold(n) {
      app.save.gold = Math.max(0, Math.round((app.save.gold ?? 0) + n));
    },
    addShards(heroId, n) {
      app.save.shards[heroId] = (app.save.shards[heroId] ?? 0) + n;
    },
    unlockHero(id) {
      if (!app.save.owned.includes(id)) app.save.owned.push(id);
      app.save.dex[id] = true;
    },
  };

  const shell = createShell(root, app);
  app.navigate = shell.navigate;
  app.back = shell.back;
  app.toast = shell.toast;
  app.modal = shell.modal;
  app.modalCount = shell.modalCount;

  // 设置页改了开关就 persist → emit("save")，动效通道跟着一起刷新
  applyMotionPrefs(app.save.settings);
  bus.on("save", () => applyMotionPrefs(app.save.settings));

  audio.startMusic("menu");
  shell.navigate("menu", {}, { replace: true });

  globalThis.__CNYD__ = app;
  return app;
}
