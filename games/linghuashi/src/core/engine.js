import { renderApp } from "../ui/screens.js";

export function boot(root, store) {
  store.hydrate();
  if (!store.get().screen) store.set({ screen: "splash" });
  let cleanup = null;

  function navigate(screen) {
    if (typeof cleanup === "function") cleanup();
    cleanup = null;
    store.set({ screen });
    store.persist();
    cleanup = renderApp(root, store, navigate) || null;
    focusHeading(root);
  }

  cleanup = renderApp(root, store, navigate) || null;
  window.addEventListener("beforeunload", () => store.persist());
  return { navigate };
}

// 无障碍：切屏后把焦点移到主标题，屏幕阅读器能感知场景变化
function focusHeading(root) {
  const heading = root.querySelector("h1, h2");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: false });
}
