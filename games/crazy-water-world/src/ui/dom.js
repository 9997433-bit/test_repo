// 极简 DOM 助手。没有框架，也不需要框架——本层唯一的纪律是：
// 结构只建一次，之后每帧只改文本 / 内联样式 / class，绝不重写 innerHTML。
// 所有 set* 都带上一次写入的缓存，值没变就一个 DOM 属性都不碰。

export function h(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "style") Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of Array.isArray(children) ? children : [children]) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function setText(el, value) {
  if (!el) return;
  const next = value === null || value === undefined ? "" : String(value);
  if (el.__text === next) return;
  el.__text = next;
  el.textContent = next;
}

export function setStyle(el, prop, value) {
  if (!el) return;
  const cache = el.__style || (el.__style = {});
  const next = value === null || value === undefined ? "" : String(value);
  if (cache[prop] === next) return;
  cache[prop] = next;
  el.style.setProperty(prop, next);
}

export function setClass(el, name, on) {
  if (!el) return;
  const cache = el.__class || (el.__class = {});
  const next = !!on;
  if (cache[name] === next) return;
  cache[name] = next;
  el.classList.toggle(name, next);
}

export function setAttr(el, name, value) {
  if (!el) return;
  const cache = el.__attr || (el.__attr = {});
  const next = value === null || value === undefined || value === false ? null : String(value);
  if (cache[name] === next) return;
  cache[name] = next;
  if (next === null) el.removeAttribute(name);
  else el.setAttribute(name, next);
}

export function setDisabled(el, on) {
  if (!el) return;
  const next = !!on;
  if (el.__disabled === next) return;
  el.__disabled = next;
  el.disabled = next;
}

export function setHidden(el, on) {
  setClass(el, "hidden", on);
}

// 列表类内容：签名不变就整块跳过，变了才重建。
// 重建代价只在数据真的动了的那一帧付一次，不是每帧 60 次。
export function rebuildIf(el, signature, build) {
  if (!el || el.__sig === signature) return false;
  el.__sig = signature;
  clear(el);
  const nodes = build();
  append(el, nodes || []);
  return true;
}
