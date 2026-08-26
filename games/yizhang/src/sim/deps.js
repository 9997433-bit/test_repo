// 依赖解析：优先用 `../data/gloves.js` 与 `../combat/index.js`，缺席时退回 sim 内置兜底。
//
// 为什么不直接静态 import：这两个文件在 Round 1 还可能只是 .gitkeep，静态 import 会让
// 整个 sim 加载失败、测试跑不起来。所以走“注入 + 可选动态探测”。
//
// TODO(merge): data / combat 合进来之后，可以把下面两行改成静态 import 并删掉 autoWire：
//   import * as realData from "../data/gloves.js";
//   import * as realCombat from "../combat/index.js";

import * as fallbackData from "./fallback-data.js";
import * as fallbackCombat from "./fallback-combat.js";

let dataMod = null;
let combatMod = null;
let cache = null;

/** 手套字段补全，防止 data 少给字段把 sim 打成 NaN */
function normalizeGlove(g, base) {
  const b = base || fallbackData.GLOVE_BY_ID.cotton;
  const num = (v, d) => (Number.isFinite(v) ? v : d);
  return {
    ...b,
    ...g,
    id: g.id ?? b.id,
    name: g.name ?? g.id ?? b.name,
    role: g.role ?? b.role,
    color: g.color ?? b.color,
    slapRange: num(g.slapRange, b.slapRange),
    slapAngleDeg: num(g.slapAngleDeg, b.slapAngleDeg),
    slapPower: num(g.slapPower, b.slapPower),
    slapCooldown: num(g.slapCooldown, b.slapCooldown),
    windup: num(g.windup, b.windup),
    recovery: num(g.recovery, b.recovery),
    skillId: g.skillId ?? null,
    skillCooldown: num(g.skillCooldown, b.skillCooldown ?? 0),
    unlock: g.unlock ?? b.unlock ?? "challenge",
  };
}

function rebuild() {
  const usingRealData = !!(dataMod && Array.isArray(dataMod.GLOVES) && dataMod.GLOVES.length);
  const rawGloves = usingRealData ? dataMod.GLOVES : fallbackData.GLOVES;
  const GLOVES = rawGloves.map((g) => normalizeGlove(g, fallbackData.GLOVE_BY_ID[g.id]));
  const MATCH = { ...fallbackData.MATCH, ...(dataMod && dataMod.MATCH ? dataMod.MATCH : {}) };

  const pick = (name) =>
    combatMod && typeof combatMod[name] === "function" ? combatMod[name] : fallbackCombat[name];

  cache = {
    MATCH,
    GLOVES,
    GLOVE_BY_ID: Object.fromEntries(GLOVES.map((g) => [g.id, g])),
    combat: {
      resolveSlap: pick("resolveSlap"),
      resolveSkill: pick("resolveSkill"),
      tickStatuses: pick("tickStatuses"),
      applyAwaken: pick("applyAwaken"),
    },
    usingRealData,
    usingRealCombat: !!(combatMod && typeof combatMod.resolveSlap === "function"),
  };
  return cache;
}

export function getDeps() {
  return cache || rebuild();
}

/** 由 main.js / 测试注入真实模块；参数是整个模块命名空间对象 */
export function installData(mod) {
  dataMod = mod || null;
  cache = null;
  return getDeps();
}

export function installCombat(mod) {
  combatMod = mod || null;
  cache = null;
  return getDeps();
}

/** 回到内置兜底（测试隔离用） */
export function resetDeps() {
  dataMod = null;
  combatMod = null;
  cache = null;
  return getDeps();
}

/**
 * 可选：运行时探测真实 data / combat。文件不存在时静默失败。
 * 路径故意拼接 + @vite-ignore，避免打包器在文件缺席时报解析错误。
 */
export async function autoWireOptionalDeps() {
  const out = { data: false, combat: false };
  const dataPath = "../data/" + "gloves.js";
  const combatPath = "../combat/" + "index.js";

  try {
    const m = await import(/* @vite-ignore */ dataPath);
    if (m && Array.isArray(m.GLOVES) && m.GLOVES.length) {
      installData(m);
      out.data = true;
    }
  } catch {
    /* data 还没落地 */
  }

  try {
    const m = await import(/* @vite-ignore */ combatPath);
    if (m && typeof m.resolveSlap === "function") {
      installCombat(m);
      out.combat = true;
    }
  } catch {
    /* combat 还没落地 */
  }

  return out;
}

export function resolveGlove(id) {
  const deps = getDeps();
  return deps.GLOVE_BY_ID[id] || deps.GLOVE_BY_ID.cotton || deps.GLOVES[0];
}
