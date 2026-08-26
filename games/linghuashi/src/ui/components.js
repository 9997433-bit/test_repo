import { announce, button, el } from "./dom.js";
import { strokePoints } from "./keycast.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export function isMuted(store) {
  return Boolean(store.get().settings?.mute);
}

/** 静音开关：aria-pressed 反映状态，改动立即落盘。 */
export function muteToggle(store, { compact = false } = {}) {
  const node = button({ class: "toggle", "aria-pressed": "false" });
  function paint() {
    const muted = isMuted(store);
    node.setAttribute("aria-pressed", muted ? "true" : "false");
    node.textContent = muted ? `${compact ? "" : "笔声 · "}静音` : `${compact ? "" : "笔声 · "}有声`;
    node.setAttribute("aria-label", muted ? "笔声已静音，按下恢复音效" : "笔声开启中，按下静音");
  }
  node.addEventListener("click", () => {
    const settings = { ...(store.get().settings || {}), mute: !isMuted(store) };
    store.set({ settings });
    store.persist();
    paint();
    announce(settings.mute ? "已静音" : "已恢复笔声");
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
