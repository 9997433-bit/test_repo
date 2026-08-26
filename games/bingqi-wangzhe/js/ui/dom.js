/**
 * 极简 hyperscript：零依赖构建 DOM。
 * h('div.card', { onclick }, child, ...)
 * 选择器语法支持 tag / .class / #id，例如 'button.btn.btn--primary'
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set([
  'svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'ellipse', 'defs', 'linearGradient', 'radialGradient', 'stop', 'use',
  'text', 'tspan', 'clipPath', 'filter', 'feGaussianBlur', 'mask'
]);

function parseSelector(selector) {
  const idMatch = selector.match(/#([\w-]+)/);
  const classes = [...selector.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
  const tag = selector.match(/^[\w:-]+/)?.[0] || 'div';
  return { tag, id: idMatch?.[1], classes };
}

function applyProp(el, key, value) {
  if (value == null || value === false) return;

  if (key === 'class' || key === 'className') {
    const extra = Array.isArray(value)
      ? value.filter(Boolean).join(' ')
      : String(value);
    if (extra) el.setAttribute('class', `${el.getAttribute('class') || ''} ${extra}`.trim());
    return;
  }
  if (key === 'text') {
    el.textContent = String(value);
    return;
  }
  if (key === 'html') {
    el.innerHTML = String(value);
    return;
  }
  if (key === 'style') {
    if (typeof value === 'string') el.setAttribute('style', value);
    else Object.entries(value).forEach(([k, v]) => {
      if (v == null) return;
      if (k.startsWith('--')) el.style.setProperty(k, String(v));
      else el.style[k] = v;
    });
    return;
  }
  if (key === 'dataset') {
    Object.entries(value).forEach(([k, v]) => {
      if (v != null) el.dataset[k] = String(v);
    });
    return;
  }
  if (key.startsWith('on') && typeof value === 'function') {
    el.addEventListener(key.slice(2).toLowerCase(), value);
    return;
  }
  if (key === 'ref' && typeof value === 'function') {
    value(el);
    return;
  }
  if (value === true) {
    el.setAttribute(key, '');
    return;
  }
  el.setAttribute(key, String(value));
}

function appendChild(el, child) {
  if (child == null || child === false || child === true) return;
  if (Array.isArray(child)) {
    child.forEach((c) => appendChild(el, c));
    return;
  }
  el.append(child instanceof Node ? child : document.createTextNode(String(child)));
}

export function h(selector, props, ...children) {
  const { tag, id, classes } = parseSelector(selector);
  const el = SVG_TAGS.has(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);

  if (id) el.id = id;
  if (classes.length) el.setAttribute('class', classes.join(' '));

  let rest = children;
  if (props != null && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) {
    rest = [props, ...children];
  } else if (props) {
    Object.entries(props).forEach(([k, v]) => applyProp(el, k, v));
  }

  rest.forEach((c) => appendChild(el, c));
  return el;
}

/** 从 HTML 字符串解析出单个元素（用于内联 SVG 图标）。 */
export function fromHTML(markup) {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup.trim();
  return tpl.content.firstElementChild;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function replace(node, ...children) {
  clear(node);
  children.forEach((c) => appendChild(node, c));
  return node;
}

export function qs(root, selector) {
  return root.querySelector(selector);
}

export function qsa(root, selector) {
  return [...root.querySelectorAll(selector)];
}
