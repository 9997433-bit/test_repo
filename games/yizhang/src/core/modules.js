// 兄弟模块（sim / render / ai / data / styles）由别的代理并行产出。
// Round 1 里它们可能还是空目录，所以这里用 import.meta.glob 做「存在才加载」。
// glob 在 Vite 编译期展开：文件不存在时 map 为空，既不会 404 也不会让 build 失败。

const SIM_GLOB = import.meta.glob("../sim/index.js");
const RENDER_GLOB = import.meta.glob("../render/index.js");
const AI_GLOB = import.meta.glob("../ai/bots.js");
const DATA_GLOB = import.meta.glob("../data/gloves.js");
const COMBAT_GLOB = import.meta.glob("../combat/index.js");
const STYLE_GLOB = import.meta.glob("../styles/**/*.css", { query: "?inline", import: "default" });

/** 样式表加载顺序：变量在前，重置其次，其余按字典序。 */
const STYLE_PRIORITY = ["token", "var", "theme", "reset", "base", "index", "main"];

function styleRank(path) {
  const name = path.split("/").pop().replace(/\.css$/, "").toLowerCase();
  const hit = STYLE_PRIORITY.findIndex((k) => name.includes(k));
  return hit === -1 ? STYLE_PRIORITY.length : hit;
}

async function loadOne(glob, key, required) {
  const loader = glob[key];
  if (!loader) return { ok: false, reason: "missing", module: null };
  let mod;
  try {
    mod = await loader();
  } catch (err) {
    console.warn(`[yizhang] ${key} 加载失败`, err);
    return { ok: false, reason: "error", error: err, module: null };
  }
  const lacking = required.filter((fn) => typeof mod[fn] !== "function");
  if (lacking.length) {
    console.warn(`[yizhang] ${key} 缺少导出: ${lacking.join(", ")}`);
    return { ok: false, reason: "incomplete", missing: lacking, module: mod };
  }
  return { ok: true, reason: "ok", module: mod };
}

/**
 * 把 src/styles 下的 CSS 注入 <head>。返回注入的文件数。
 * 一份都没有时返回 0，调用方据此保留 shell 自带的暮蓝主题。
 */
export async function loadSiblingStyles() {
  const paths = Object.keys(STYLE_GLOB).sort(
    (a, b) => styleRank(a) - styleRank(b) || a.localeCompare(b)
  );
  if (!paths.length) return 0;
  let injected = 0;
  for (const path of paths) {
    try {
      const css = await STYLE_GLOB[path]();
      if (typeof css !== "string" || !css.trim()) continue;
      const tag = document.createElement("style");
      tag.dataset.yizhangStyle = path.replace("../styles/", "");
      tag.textContent = css;
      document.head.appendChild(tag);
      injected += 1;
    } catch (err) {
      console.warn(`[yizhang] 样式 ${path} 注入失败`, err);
    }
  }
  return injected;
}

/**
 * 依契约探测四个兄弟模块。任何一个缺席都不阻塞启动，
 * 调用方拿 report 去点亮「降级中」提示。
 */
export async function loadSiblingModules() {
  const [sim, render, ai, data, combat] = await Promise.all([
    loadOne(SIM_GLOB, "../sim/index.js", ["createMatch", "step", "getView"]),
    loadOne(RENDER_GLOB, "../render/index.js", ["createRenderer"]),
    loadOne(AI_GLOB, "../ai/bots.js", ["think"]),
    loadOne(DATA_GLOB, "../data/gloves.js", []),
    loadOne(COMBAT_GLOB, "../combat/index.js", []),
  ]);

  if (data.ok && !Array.isArray(data.module.GLOVES)) {
    data.ok = false;
    data.reason = "incomplete";
  }

  return { sim, render, ai, data, combat };
}

/** 渲染契约里 sync/resize/setQuality/dispose 可能挂在实例上，也可能是模块级导出。 */
export function bindRenderer(mod, instance) {
  const pick = (name) => {
    if (instance && typeof instance[name] === "function") return instance[name].bind(instance);
    if (typeof mod[name] === "function") return mod[name];
    return null;
  };
  return {
    sync: pick("sync"),
    resize: pick("resize"),
    setQuality: pick("setQuality"),
    dispose: pick("dispose"),
    render: pick("render"),
  };
}
