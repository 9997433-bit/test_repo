/**
 * 视图层共用的 DOM 小工具。所有玩家可控字符串（state.name、toast、导入档内
 * 任意字段）进入 innerHTML 前必须过 esc()，能用 textContent 的地方一律用
 * setText()。
 */

const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

export function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"'`]/g, (ch) => ESCAPES[ch]);
}

export function setText(node, text) {
  if (node) node.textContent = text === null || text === undefined ? "" : String(text);
  return node;
}

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "text") node.textContent = String(value);
    else if (key === "class") node.className = value;
    else if (key === "style") node.setAttribute("style", value);
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "dataset") {
      Object.assign(node.dataset, value);
    } else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}
