import { boot } from "./core/engine.js";

const root = document.getElementById("screen-root");

try {
  boot(root);
} catch (err) {
  console.error("启动失败", err);
  if (root) {
    root.innerHTML = `<pre style="color:#ff6b9d;padding:20px;white-space:pre-wrap">启动失败：${String(err?.stack ?? err)}</pre>`;
  }
}
