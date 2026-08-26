// 依赖接线。生产路径**静态** import 真实 `../data/gloves.js` 与 `../combat/index.js`，
// 不再有 sim 侧的兜底战斗（fallback-combat 已删除）。
//
// `installData` / `installCombat` 只保留给测试做替身；`resetDeps()` 回到真实模块，
// 不是回到兜底。

import * as realData from "../data/gloves.js";
import * as bridge from "./combat-bridge.js";

const REAL_COMBAT = {
  resolveSlap: bridge.resolveSlap,
  resolveSkill: bridge.resolveSkill,
  tickStatuses: bridge.tickStatuses,
  applyAwaken: bridge.applyAwaken,
};

const BASE_GLOVE_BY_ID = realData.GLOVE_BY_ID;
const BASE_GLOVE = BASE_GLOVE_BY_ID.cotton || realData.GLOVES[0];

let dataMod = null;
let combatMod = null;
let cache = null;

/** 手套字段补全，防止替身 data 少给字段把 sim 打成 NaN */
function normalizeGlove(g, base) {
  const b = base || BASE_GLOVE;
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
  const overrideGloves = dataMod && Array.isArray(dataMod.GLOVES) && dataMod.GLOVES.length;
  const rawGloves = overrideGloves ? dataMod.GLOVES : realData.GLOVES;
  const GLOVES = rawGloves.map((g) => normalizeGlove(g, BASE_GLOVE_BY_ID[g.id]));
  const MATCH = { ...realData.MATCH, ...(dataMod && dataMod.MATCH ? dataMod.MATCH : {}) };
  const GLOVE_BY_ID = Object.fromEntries(GLOVES.map((g) => [g.id, g]));

  const usingRealCombat = !combatMod;
  const pick = (name) =>
    combatMod && typeof combatMod[name] === "function" ? combatMod[name] : REAL_COMBAT[name];

  // combat 内部的延迟结算路径也要看到同一张表
  bridge.syncGloveTable(GLOVE_BY_ID);

  cache = {
    MATCH,
    GLOVES,
    GLOVE_BY_ID,
    combat: {
      resolveSlap: pick("resolveSlap"),
      resolveSkill: pick("resolveSkill"),
      tickStatuses: pick("tickStatuses"),
      applyAwaken: pick("applyAwaken"),
    },
    usingRealData: !overrideGloves,
    usingRealCombat,
  };
  return cache;
}

export function getDeps() {
  return cache || rebuild();
}

/** 测试替身：传整个模块命名空间对象，传 null 回到真实模块 */
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

/** 卸掉所有替身，回到真实 data + combat */
export function resetDeps() {
  dataMod = null;
  combatMod = null;
  cache = null;
  return getDeps();
}

export function resolveGlove(id) {
  const deps = getDeps();
  return deps.GLOVE_BY_ID[id] || deps.GLOVE_BY_ID.cotton || deps.GLOVES[0];
}
