/**
 * 修业接线（AD-17）。仙府层是修业口径的唯一出处：导出 `scriptureXpAward` 时照单发放，
 * 缺席才退回 `disciples/train.js` 的旧速率——与 `core/offline.js` 同一套能力探测写法，
 * 契约缺席时降级，而不是让 TICK 崩在导入上。
 *
 * 两条路径的共同硬边界：核心层只涨 `xp`，永不改 `profession`。修业条满仅代表
 * 「可晋阶」，晋阶的丹药灵草仍由 `TRAIN` 支付，藏经楼不发免费一级。
 */
import * as production from "../mansion/production.js";
import * as train from "../disciples/train.js";
import { num } from "./state.js";

/** 仙府层不给修业建筑名单时，按建筑类型兜底认藏经楼。 */
const SCRIPTURE_TYPE = "scripture";

function seconds(value) {
  const n = num(value, 0);
  return n > 0 ? n : 0;
}

/** 修业上限：满条即「可晋阶」，多修的部分不再累加，等 `TRAIN` 付账后清零重修。 */
export function xpCap(profession) {
  const need = typeof train.xpNeeded === "function" ? num(train.xpNeeded(profession), NaN) : NaN;
  return Number.isFinite(need) && need > 0 ? need : Infinity;
}

/** 领修业的建筑 id 集合，只用于仙府层契约缺席时的兜底口径。 */
function hallIds(state) {
  const halls = typeof production.xpBuildings === "function" ? production.xpBuildings(state) : null;
  const list = Array.isArray(halls)
    ? halls
    : (Array.isArray(state?.buildings) ? state.buildings : []).filter((b) => b?.type === SCRIPTURE_TYPE);
  return new Set(list.map((b) => b?.id).filter(Boolean));
}

/** 兜底发放：按 `scriptureRate` 的府级速率发给驻在修业建筑里的弟子，不普发给任意岗位。 */
function fallbackAward(state, dt) {
  const rate = typeof train.scriptureRate === "function" ? num(train.scriptureRate(state), 0) : 0;
  if (rate <= 0) return {};
  const halls = hallIds(state);
  if (!halls.size) return {};
  const out = {};
  for (const d of Array.isArray(state?.disciples) ? state.disciples : []) {
    if (!d?.id || !halls.has(d.buildingId)) continue;
    out[d.id] = (out[d.id] ?? 0) + rate * dt;
  }
  return out;
}

/** dt 秒内每名弟子应得的修业，键为弟子 id。 */
export function scriptureAward(state, dtSec) {
  const dt = seconds(dtSec);
  if (dt <= 0) return {};
  if (typeof production.scriptureXpAward === "function") {
    const award = production.scriptureXpAward(state, dt);
    return award && typeof award === "object" ? award : {};
  }
  return fallbackAward(state, dt);
}

/** 发放修业，返回新的弟子表；无人领取时原样返回，免得白白顶掉一次重绘。 */
export function grantScriptureXp(state, dtSec) {
  const disciples = Array.isArray(state?.disciples) ? state.disciples : [];
  if (!disciples.length) return disciples;
  const award = scriptureAward(state, dtSec);
  let changed = false;
  const next = disciples.map((d) => {
    const gain = num(award?.[d?.id], 0);
    if (gain <= 0) return d;
    const xp = Math.min(xpCap(d.profession), num(d.xp, 0) + gain);
    if (xp === num(d.xp, 0)) return d;
    changed = true;
    return { ...d, xp };
  });
  return changed ? next : disciples;
}
