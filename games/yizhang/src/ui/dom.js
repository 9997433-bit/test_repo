// 极小的 DOM 构造助手。不引框架，只是省掉一堆 createElement 样板。

export function h(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "text") el.textContent = value;
    else if (key === "html") el.innerHTML = value;
    else if (key === "style" && typeof value === "object") Object.assign(el.style, value);
    else if (key === "dataset") Object.assign(el.dataset, value);
    else if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else el.setAttribute(key, value === true ? "" : value);
  }
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child == null || child === false) continue;
    el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return el;
}

export function svg(tag, props = {}, children = []) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    el.setAttribute(key, value === true ? "" : value);
  }
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) if (child) el.appendChild(child);
  return el;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * 指针捕获是「锦上添花」：拿不到也只是手指滑出按钮后收不到 pointerup，
 * 由 lostpointercapture / pointercancel 兜底。但它会在指针已经抬起时抛
 * NotFoundError，而捕获排在业务回调之前 —— 不吞掉的话这一下按键就没了。
 */
export function capturePointer(el, pointerId) {
  try {
    el.setPointerCapture?.(pointerId);
    return true;
  } catch {
    return false;
  }
}

export function releasePointer(el, pointerId) {
  try {
    el.releasePointerCapture?.(pointerId);
  } catch {
    /* 指针早就没了，忽略 */
  }
}

/** 触控按钮：pointer 事件统一处理，按下即触发，抬起/离开即释放。 */
export function bindHoldButton(el, onDown, onUp) {
  let pointerId = null;
  const down = (e) => {
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    capturePointer(el, e.pointerId);
    el.dataset.pressed = "1";
    e.preventDefault();
    onDown(e);
  };
  const up = (e) => {
    if (pointerId !== e.pointerId) return;
    pointerId = null;
    delete el.dataset.pressed;
    releasePointer(el, e.pointerId);
    e.preventDefault();
    if (onUp) onUp(e);
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("lostpointercapture", () => {
    pointerId = null;
    delete el.dataset.pressed;
    if (onUp) onUp();
  });
  el.addEventListener("contextmenu", (e) => e.preventDefault());
  return el;
}
