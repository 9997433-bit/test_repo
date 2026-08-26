export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function mount(root, node) {
  root.innerHTML = "";
  root.append(node);
}

export function money(n) {
  const v = Math.floor(n);
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(1)}万`;
  return `${v}`;
}
