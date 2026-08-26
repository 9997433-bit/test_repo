/** 应用外壳：480×800 舞台缩放、屏幕路由、统一 rAF、Toast、键盘分发。 */
import { clear, el } from "./dom.js";
import { SCREENS } from "./screens/index.js";

export function createShell(root, app) {
  const stage = el("div", { class: "stage", id: "stage-frame" });
  const wrap = el("div", { class: "stage-wrap" }, [stage]);
  const toastLayer = el("div", { class: "toast-layer" });
  const overlay = el("div", { class: "overlay-layer" });
  stage.appendChild(overlay);
  stage.appendChild(toastLayer);
  clear(root).appendChild(wrap);

  let active = null;
  let activeId = null;
  let activeParams = {};
  let container = null;
  const history = [];
  /** 打开中的弹窗栈（后进先出）。Esc 只关最上面一层，绝不叠一层新的。 */
  const modals = [];

  function resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min((vw - 16) / 480, (vh - 16) / 800, 1.25);
    const s = Math.max(0.35, scale);
    stage.style.transform = `scale(${s})`;
    wrap.style.height = `${800 * s}px`;
    wrap.style.width = `${480 * s}px`;
  }
  window.addEventListener("resize", resize);
  resize();

  function destroyActive() {
    try {
      active?.destroy?.();
    } catch (err) {
      console.warn("screen destroy failed", err);
    }
    active = null;
    if (container) container.remove();
    container = null;
  }

  function navigate(id, params = {}, opts = {}) {
    const screen = SCREENS[id];
    if (!screen) {
      console.warn(`未知屏幕：${id}`);
      return;
    }
    if (!opts.replace && activeId) history.push({ id: activeId, params: activeParams });
    // 弹窗挂在常驻的 overlay 上，不随屏幕卸载；切屏时必须自己收干净
    closeAllModals();
    destroyActive();
    activeId = id;
    activeParams = params;
    container = el("div", { class: `screen screen-${id}` });
    stage.insertBefore(container, overlay);
    requestAnimationFrame(() => container?.classList.add("enter"));
    active = screen.mount(app, container, params) ?? {};
    app.bus.emit("navigate", { id, params });
  }

  function back(fallback = "menu") {
    const prev = history.pop();
    app.audio.play("back");
    if (prev) navigate(prev.id, prev.params, { replace: true });
    else navigate(fallback, {}, { replace: true });
  }

  function toast(message, kind = "info") {
    const node = el("div", { class: `toast toast-${kind}`, text: message });
    toastLayer.appendChild(node);
    setTimeout(() => node.classList.add("out"), 1800);
    setTimeout(() => node.remove(), 2300);
  }

  /**
   * 打开一个弹窗。
   *
   * @param {(box: HTMLElement, close: () => void) => void} render
   * @param {{ dismissible?: boolean, onClose?: () => void }} [opts]
   *   `dismissible` 为 false 时 Esc 关不掉（三选一这类必须做出选择的弹窗）。
   *   `onClose` 无论由谁触发关闭都只会跑一次，调用方靠它复位自己的状态（例如解除暂停）。
   * @returns {() => void} 关闭函数，重复调用安全
   */
  function modal(render, opts = {}) {
    const back$ = el("div", { class: "modal-backdrop" });
    const box = el("div", { class: "modal" });
    back$.appendChild(box);
    overlay.appendChild(back$);

    let closed = false;
    const entry = {
      dismissible: opts.dismissible !== false,
      close() {
        if (closed) return;
        closed = true;
        const i = modals.indexOf(entry);
        if (i >= 0) modals.splice(i, 1);
        back$.remove();
        opts.onClose?.();
      },
    };
    modals.push(entry);
    render(box, entry.close);
    requestAnimationFrame(() => back$.classList.add("show"));
    return entry.close;
  }

  function closeAllModals() {
    while (modals.length) modals[modals.length - 1].close();
  }

  /** Esc 交给最上层弹窗；关掉一层就算处理完，事件不再往屏幕转发。 */
  function dismissTopModal() {
    const top = modals[modals.length - 1];
    if (!top?.dismissible) return modals.length > 0;
    top.close();
    return true;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    try {
      active?.tick?.(dt);
    } catch (err) {
      console.error("screen tick failed", err);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLInputElement) return;
    // 弹窗开着时先吃掉 Esc：否则战斗屏会再开一层暂停窗
    if (e.key === "Escape" && modals.length) {
      e.preventDefault();
      dismissTopModal();
      return;
    }
    if (modals.length) return;
    active?.onKey?.(e);
  });

  const unlock = () => app.audio.unlock();
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });

  return {
    navigate,
    back,
    toast,
    modal,
    closeAllModals,
    modalCount: () => modals.length,
    get activeId() { return activeId; },
  };
}
