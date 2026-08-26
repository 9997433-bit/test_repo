// 兄弟模块（sim / render / ai / data / combat / styles）由别的代理并行产出。
// 它们可能还是空目录，所以这里用 import.meta.glob 做「存在才加载」。
// glob 在 Vite 编译期展开：文件不存在时 map 为空，既不会 404 也不会让 build 失败。

// 接线真值判定单独放 core/wiring.js（不依赖 Vite），这里转出去，
// 装配层调用方不用关心它住在哪；scripts/ 里的纯 Node 脚本可直接 import 那份。
export { wiringStatus } from "./wiring.js";

const SIM_GLOB = import.meta.glob("../sim/index.js");
const RENDER_GLOB = import.meta.glob("../render/index.js");
const AI_GLOB = import.meta.glob("../ai/bots.js");
// data 优先走汇总出口（带 UNLOCKS / isGloveUnlocked），退而求其次只要掌表。
const DATA_INDEX_GLOB = import.meta.glob("../data/index.js");
const DATA_GLOVES_GLOB = import.meta.glob("../data/gloves.js");
const COMBAT_GLOB = import.meta.glob("../combat/index.js");
// 样式走 Vite 正常的 CSS 管线（而不是 ?inline 手工注入），
// 这样 index.css 里的 @import 与外链字体才会被正确解析。
const STYLE_ENTRY_GLOB = import.meta.glob("../styles/index.css");
const STYLE_ALL_GLOB = import.meta.glob("../styles/**/*.css");

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
 * 把 src/styles 接进页面。有 index.css 就只进它（它自己 @import 其余六份），
 * 否则按优先级逐份加载。返回接入的文件数，0 表示 F2 样式缺席。
 */
export async function loadSiblingStyles() {
  const entry = STYLE_ENTRY_GLOB["../styles/index.css"];
  if (entry) {
    try {
      await entry();
      document.documentElement.dataset.yzStyles = "fable2";
      return 1;
    } catch (err) {
      console.warn("[yizhang] styles/index.css 加载失败", err);
    }
  }

  const paths = Object.keys(STYLE_ALL_GLOB).sort(
    (a, b) => styleRank(a) - styleRank(b) || a.localeCompare(b)
  );
  let injected = 0;
  for (const path of paths) {
    try {
      await STYLE_ALL_GLOB[path]();
      injected += 1;
    } catch (err) {
      console.warn(`[yizhang] 样式 ${path} 加载失败`, err);
    }
  }
  if (injected > 0) document.documentElement.dataset.yzStyles = "fable2";
  return injected;
}

/**
 * 依契约探测五个兄弟模块。任何一个缺席都不阻塞启动，
 * 调用方拿 report 去点亮「降级中」提示。
 */
export async function loadSiblingModules() {
  const [sim, render, ai, dataIndex, dataGloves, combat] = await Promise.all([
    loadOne(SIM_GLOB, "../sim/index.js", ["createMatch", "step", "getView"]),
    loadOne(RENDER_GLOB, "../render/index.js", ["createRenderer"]),
    loadOne(AI_GLOB, "../ai/bots.js", ["think"]),
    loadOne(DATA_INDEX_GLOB, "../data/index.js", []),
    loadOne(DATA_GLOVES_GLOB, "../data/gloves.js", []),
    loadOne(COMBAT_GLOB, "../combat/index.js", []),
  ]);

  const hasGloves = (r) => r.ok && Array.isArray(r.module.GLOVES) && r.module.GLOVES.length > 0;
  let data = hasGloves(dataIndex) ? dataIndex : dataGloves;
  if (!hasGloves(data)) data = { ...data, ok: false, reason: data.reason === "ok" ? "incomplete" : data.reason };

  if (combat.ok && typeof combat.module.resolveSlap !== "function") {
    combat.ok = false;
    combat.reason = "incomplete";
  }

  return { sim, render, ai, data, combat };
}

// 技能 id 三方分歧：data（`quake_slam`）、combat 注册表（`groundPound`）、
// API_CONTRACT（`slam`）各写各的。装配层是唯一同时看见 data 与 combat 的地方，
// 所以别名在这里对齐；哪边先统一了，下面的表命不中就自动失效。
const SKILL_ALIASES = {
  groundPound: ["groundPound", "quake_slam", "quake", "slam"],
  dashSlap: ["dashSlap", "wind_rush", "rush"],
  frostArc: ["frostArc", "frost_arc"],
  parry: ["parry", "coil_counter", "riposte", "counter"],
  blinkSwap: ["blinkSwap", "phantom_swap", "decoy_swap", "blink"],
  magnetPull: ["magnetPull", "iron_pull", "pull"],
  meteorSlam: ["meteorSlam", "sky_fall", "sky_drop", "meteorFall"],
};

const ALIAS_TO_CANON = (() => {
  const map = new Map();
  for (const [canon, names] of Object.entries(SKILL_ALIASES)) {
    for (const name of names) map.set(name, canon);
  }
  return map;
})();

function combatSkillRegistry(combatModule) {
  if (!combatModule) return null;
  if (Array.isArray(combatModule.SKILL_IDS)) return new Set(combatModule.SKILL_IDS);
  if (combatModule.SKILLS && typeof combatModule.SKILLS === "object") {
    return new Set(Object.keys(combatModule.SKILLS));
  }
  return null;
}

/**
 * 让 data 的 glove.skillId 落到 combat 认得的注册表里。
 * 认不出来的原样保留（combat 自己会退化成无主动技）。
 * @returns {{ module: object, remapped: string[] }}
 */
export function alignSkillIds(dataModule, combatModule) {
  const registry = combatSkillRegistry(combatModule);
  if (!dataModule || !registry || !Array.isArray(dataModule.GLOVES)) {
    return { module: dataModule, remapped: [] };
  }

  const remapped = [];
  const GLOVES = dataModule.GLOVES.map((g) => {
    const id = g.skillId;
    // `"none"` 是 data 侧「这只掌没有主动技」的正式写法（木棉就是它），
    // 不是缺字段，也不是假值：原样放行，别去别名表里找。
    if (!id || id === "none" || registry.has(id)) return g;
    const canon = ALIAS_TO_CANON.get(id);
    if (!canon || !registry.has(canon)) return g;
    remapped.push(`${g.id}:${id}→${canon}`);
    return { ...g, skillId: canon };
  });

  if (!remapped.length) return { module: dataModule, remapped };
  return {
    module: {
      ...dataModule,
      GLOVES,
      GLOVE_BY_ID: Object.fromEntries(GLOVES.map((g) => [g.id, g])),
    },
    remapped,
  };
}

/**
 * 把真实 data / combat 注入 sim。sim 的 deps 层默认跑内置兜底棉掌，
 * 不注入的话 8 掌数值与技能一辈子进不了局（Round 1 遗留缺陷 #2）。
 * @returns {{ data: boolean, combat: boolean, supported: boolean, remappedSkills: string[] }}
 */
export function wireSimDeps(sim, dataModule, combatModule) {
  const out = { data: false, combat: false, supported: false, remappedSkills: [] };
  if (!sim) return out;
  out.supported =
    typeof sim.installData === "function" || typeof sim.installCombat === "function";

  if (dataModule && typeof sim.installData === "function") {
    const aligned = alignSkillIds(dataModule, combatModule);
    out.remappedSkills = aligned.remapped;
    try {
      sim.installData(aligned.module);
      out.data = true;
    } catch (err) {
      console.warn("[yizhang] sim.installData 抛错", err);
    }
  }
  if (combatModule && typeof sim.installCombat === "function") {
    try {
      sim.installCombat(combatModule);
      out.combat = true;
    } catch (err) {
      console.warn("[yizhang] sim.installCombat 抛错", err);
    }
  }
  return out;
}

/** 渲染契约里 sync/resize/setQuality/dispose 可能挂在实例上，也可能是模块级导出。 */
export function bindRenderer(mod, instance) {
  const pick = (name) => {
    if (instance && typeof instance[name] === "function") return instance[name].bind(instance);
    if (mod && typeof mod[name] === "function") return mod[name];
    return null;
  };
  return {
    instance,
    sync: pick("sync"),
    resize: pick("resize"),
    setQuality: pick("setQuality"),
    setSpectator: pick("setSpectator"),
    setMobile: pick("setMobile"),
    getStats: pick("getStats"),
    dispose: pick("dispose"),
    render: pick("render"),
  };
}
