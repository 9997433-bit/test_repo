import { announce, button, el } from "./dom.js";
import { strokePoints } from "./keycast.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export function isMuted(store) {
  return Boolean(store.get().settings?.mute);
}

export function isMotionReduced(store) {
  return Boolean(store.get().settings?.reducedMotion);
}

/**
 * 静音开关：aria-pressed 反映状态，改动立即落盘。
 * 只改存档里的 `settings.mute`，音频总线由 ui/audio-bridge.js 订阅同步，
 * 因此这一个开关管住所有音效，而不只是落笔声。
 */
export function muteToggle(store, { compact = false } = {}) {
  const node = button({ class: "toggle", "aria-pressed": "false" });
  function paint() {
    const muted = isMuted(store);
    node.setAttribute("aria-pressed", muted ? "true" : "false");
    node.textContent = muted ? `${compact ? "" : "声息 · "}静音` : `${compact ? "" : "声息 · "}有声`;
    node.setAttribute("aria-label", muted ? "全部音效已静音，按下恢复声息" : "声息开启中，按下静音全部音效");
  }
  node.addEventListener("click", () => {
    const settings = { ...(store.get().settings || {}), mute: !isMuted(store) };
    store.set({ settings });
    store.persist();
    paint();
    announce(settings.mute ? "已静音" : "已恢复声息");
  });
  paint();
  return node;
}

/**
 * 减动效开关：与静音开关同构，只改存档里的 `settings.reducedMotion`，
 * 由 ui/motion-bridge.js 推给 <html data-reduced-motion> 及各处回放。
 * 系统已经声明 prefers-reduced-motion 的玩家关掉本开关也不会被强喂动画，
 * 所以文案只说「本作」这一层，不假装能覆盖系统偏好。
 */
export function motionToggle(store, { compact = false, onChange } = {}) {
  const node = button({ class: "toggle", "aria-pressed": "false" });
  function paint() {
    const reduced = isMotionReduced(store);
    node.setAttribute("aria-pressed", reduced ? "true" : "false");
    node.textContent = reduced ? `${compact ? "" : "动效 · "}静纸` : `${compact ? "" : "动效 · "}流墨`;
    node.setAttribute("aria-label", reduced ? "已减少动效，按下恢复墨迹动画" : "墨迹动画开启中，按下减少动效");
  }
  node.addEventListener("click", () => {
    const settings = { ...(store.get().settings || {}), reducedMotion: !isMotionReduced(store) };
    store.set({ settings });
    store.persist();
    paint();
    announce(settings.reducedMotion ? "已减少动效" : "已恢复墨迹动画");
    onChange?.(settings.reducedMotion);
  });
  paint();
  return node;
}

/** 笔法示意图：与键盘施法用同一套点列，教程画的就是真实会被识别的形状。 */
export function strokeGlyph(type, { width = 96, height = 72, className = "stroke-glyph" } = {}) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("class", className);
  const points = strokePoints(type, { width, height });
  if (points.length) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" "));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "3.4");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
  }
  return svg;
}

export function pageHeader({ kicker, title, id = "screen-title", tools = [] }) {
  return el("header", { class: "screen-head" }, [
    el("div", {}, [
      kicker ? el("p", { class: "sub", text: kicker }) : null,
      el("h2", { id, class: "brand screen-title", tabindex: "-1", "data-autofocus": true, text: title }),
    ]),
    tools.length ? el("div", { class: "screen-tools" }, tools) : null,
  ]);
}
