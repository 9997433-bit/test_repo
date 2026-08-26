import { destroyApp, renderApp, SCREENS } from "../ui/screens.js";

/** 战斗态不入存档，重开时回枢纽，避免读档直接站在半场战斗里。 */
function entryScreen(save) {
  const screen = save.screen;
  if (!screen || !SCREENS.includes(screen)) return "splash";
  if (screen === "battle") return "hub";
  return screen;
}

export function boot(root, store) {
  store.hydrate();
  store.set({ screen: entryScreen(store.get()) });

  function navigate(screen) {
    store.set({ screen });
    store.persist();
    renderApp(root, store, navigate);
  }

  const persist = () => store.persist();
  const onVisibility = () => {
    if (document.visibilityState === "hidden") store.persist();
  };

  renderApp(root, store, navigate);
  window.addEventListener("beforeunload", persist);
  window.addEventListener("pagehide", persist);
  document.addEventListener("visibilitychange", onVisibility);

  return {
    navigate,
    destroy() {
      window.removeEventListener("beforeunload", persist);
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", onVisibility);
      destroyApp(root);
      store.persist();
    },
  };
}
