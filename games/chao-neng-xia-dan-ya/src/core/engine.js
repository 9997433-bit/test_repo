/** 主循环入口：装配存档、音频、事件总线与屏幕外壳。 */
import { createAudio } from "../audio/index.js";
import { createShell } from "../ui/shell.js";
import { describeCaps } from "./adapters.js";
import { HERO_CATALOG } from "./catalog.js";
import { createBus } from "./events.js";
import { buildLoadout } from "./progress.js";
import { loadSave, resetSave, writeSave } from "./store.js";

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

  audio.startMusic("menu");
  shell.navigate("menu", {}, { replace: true });

  globalThis.__CNYD__ = app;
  return app;
}
