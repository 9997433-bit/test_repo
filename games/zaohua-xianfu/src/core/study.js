/**
 * 修业接线（AD-17）。仙府层是修业口径的唯一出处：导出 `scriptureXpAward` 时照单发放，
 * 缺席才退回弟子层的同口径兜底——与 `core/offline.js` 同一套能力探测写法，
 * 契约缺席时降级，而不是让 TICK 崩在导入上。
 *
 * 无论走哪条路，核心层的硬边界不变：只涨 `xp`，永不改 `profession`。修业条满仅代表
 * 「可晋阶」，晋阶的丹药灵草仍由 `TRAIN` 支付，藏经楼不发免费一级。
 */
import * as production from "../mansion/production.js";
import * as train from "../disciples/train.js";
import { num } from "./state.js";

function seconds(value) {
  const n = num(value, 0);
  return n > 0 ? n : 0;
}

/** 修业上限：满条即「可晋阶」，多修的部分不再累加，等 `TRAIN` 付账后清零重修。 */
export function xpCap(profession) {
  const need = typeof train.xpNeeded === "function" ? num(train.xpNeeded(profession), NaN) : NaN;
  return Number.isFinite(need) && need > 0 ? need : Infinity;
}

/** dt 秒内每名弟子应得的修业，键为弟子 id。名单与数额都不在核心层复算。 */
export function scriptureAward(state, dtSec) {
  const dt = seconds(dtSec);
  if (dt <= 0) return {};
  const source =
    typeof production.scriptureXpAward === "function"
      ? production.scriptureXpAward
      : typeof train.scriptureAward === "function"
        ? train.scriptureAward
        : null;
  if (!source) return {};
  const award = source(state, dt);
  return award && typeof award === "object" ? award : {};
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
