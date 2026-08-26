/** 极简 DOM 工具（不引入框架）。 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "dataset") for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = dv;
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(typeof child === "string" || typeof child === "number" ? document.createTextNode(String(child)) : child);
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function button(label, onClick, opts = {}) {
  return el(
    "button",
    {
      class: `btn ${opts.variant ? `btn-${opts.variant}` : ""} ${opts.class ?? ""}`.trim(),
      type: "button",
      onclick: onClick,
      disabled: opts.disabled,
      title: opts.title,
    },
    opts.icon ? [el("span", { class: "btn-icon", text: opts.icon }), el("span", { text: label })] : [label],
  );
}

export function panel(title, children, opts = {}) {
  return el("section", { class: `panel ${opts.class ?? ""}`.trim() }, [
    title ? el("h3", { class: "panel-title", text: title }) : null,
    ...[].concat(children),
  ]);
}

export function bar(ratio, opts = {}) {
  const fill = el("i", { class: "bar-fill", style: { width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, background: opts.color ?? "var(--yolk)" } });
  const node = el("div", { class: `bar ${opts.class ?? ""}`.trim() }, [fill]);
  node.setFill = (r) => {
    fill.style.width = `${Math.max(0, Math.min(1, r)) * 100}%`;
  };
  return node;
}

export function stars(count, max = 3) {
  return el(
    "span",
    { class: "stars" },
    Array.from({ length: max }, (_, i) => el("i", { class: `star ${i < count ? "on" : ""}`, text: "★" })),
  );
}

export function fmt(n) {
  const v = Math.round(n);
  return v >= 10000 ? `${(v / 10000).toFixed(1)}万` : String(v);
}
