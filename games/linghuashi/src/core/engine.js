import { renderApp } from "../ui/screens.js";

export function boot(root, store) {
  store.hydrate();
  if (!store.get().screen) store.set({ screen: "splash" });

  function navigate(screen) {
    store.set({ screen });
    store.persist();
    renderApp(root, store, navigate);
  }

  renderApp(root, store, navigate);
  window.addEventListener("beforeunload", () => store.persist());
  return { navigate };
}
