const LIVE_POLITE_ID = "lhs-live-polite";
const LIVE_ALERT_ID = "lhs-live-alert";

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key === "style") Object.assign(node.style, value);
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(typeof child === "string" || typeof child === "number" ? document.createTextNode(String(child)) : child);
  }
  return node;
}

export function button(props = {}, children = []) {
  return el("button", { type: "button", ...props }, children);
}

function liveRegion(id) {
  let node = document.getElementById(id);
  if (node) return node;
  node = el("div", {
    id,
    class: "sr-only",
    "aria-live": id === LIVE_ALERT_ID ? "assertive" : "polite",
    "aria-atomic": "true",
  });
  document.body.appendChild(node);
  return node;
}

/** 播报到屏幕阅读器。重复文案追加零宽字符，确保再次朗读。 */
export function announce(message, { assertive = false } = {}) {
  if (!message) return;
  const node = liveRegion(assertive ? LIVE_ALERT_ID : LIVE_POLITE_ID);
  node.textContent = node.textContent === message ? `${message}\u200b` : message;
}

/** 屏切换后把焦点交给标题，键盘用户不会被丢回文档顶部。 */
export function focusScreen(root) {
  // 弹层自己管焦点，别把它抢回底层界面。
  if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
  const target = root.querySelector("[data-autofocus]") || root.querySelector("h1, h2");
  if (!target) return;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  try {
    target.focus({ preventScroll: true });
  } catch {
    target.focus();
  }
}

/**
 * 语义化进度条：视觉是水墨横条，读屏是 progressbar + 百分比文案。
 */
export function meter(label, className = "") {
  const fill = el("i");
  const node = el(
    "div",
    {
      class: `bar ${className}`.trim(),
      role: "progressbar",
      "aria-label": label,
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuenow": "0",
    },
    [fill],
  );
  return {
    node,
    set(value, max, suffix = "") {
      const safeMax = max > 0 ? max : 1;
      const pct = Math.max(0, Math.min(100, (value / safeMax) * 100));
      fill.style.width = `${pct}%`;
      node.setAttribute("aria-valuenow", String(Math.round(pct)));
      node.setAttribute("aria-valuetext", `${Math.round(value)} / ${Math.round(max)}${suffix}`);
    },
  };
}

export function srOnly(text) {
  return el("span", { class: "sr-only", text });
}

/** 弹层内的 Tab 循环，避免焦点跑到被遮挡的底层界面。 */
export function trapFocus(container) {
  const selector = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  function onKeydown(ev) {
    if (ev.key !== "Tab") return;
    const nodes = [...container.querySelectorAll(selector)].filter((n) => n.offsetParent !== null || n === document.activeElement);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    }
  }
  container.addEventListener("keydown", onKeydown);
  return () => container.removeEventListener("keydown", onKeydown);
}
