/**
 * 弟子侧的修业通道。数值口径归仙府层所有（`mansion/production.js`）：
 * 藏经楼产多少、发给谁，一律照 `scriptureXpAward` 的账发放，本层不复算速率。
 * 仙府层若尚未提供该函数，才退回同口径的本地兜底，免得 TICK 直接白跑。
 *
 * AD-17 的边界写在这里：修业条积满只代表「可晋阶」，晋阶仍由 `TRAIN` 付丹药灵草，
 * 本层永不自行 `profession + 1`；积满后修业停在满格，不再空转累积。
 */
import * as mansion from "../mansion/production.js";
import { yieldMultiplier } from "./assign.js";

/** 藏经楼晋阶所需修业，与 scriptureXp 共用同一口径。 */
export function xpNeeded(profession) {
  return 20 + profession * 12;
}

/** 仙府层缺席时的兜底速率：与 `buildings.js#DEFAULT_XP_PER_SEC` 同值，按楼级线性。 */
const FALLBACK_XP_PER_SEC = 0.35;

function seconds(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function fallbackHalls(state) {
  return (state?.buildings ?? []).filter((b) => b?.type === "scripture");
}

/** 只发给驻在藏经楼里的那名弟子，与仙府层 `scriptureXpFor` 同口径。 */
function fallbackAward(state, dtSec) {
  const dt = seconds(dtSec);
  const out = {};
  if (dt <= 0) return out;
  const disciples = Array.isArray(state?.disciples) ? state.disciples : [];
  for (const hall of fallbackHalls(state)) {
    const worker = disciples.find((d) => d?.buildingId === hall.id);
    if (!worker) continue;
    const level = Math.max(1, Number(hall.level) || 1);
    const perSec = FALLBACK_XP_PER_SEC * level * yieldMultiplier(worker, hall);
    out[worker.id] = (out[worker.id] ?? 0) + perSec * dt;
  }
  return out;
}

/** dt 秒内每名弟子应得的修业，键为弟子 id。 */
export function scriptureAward(state, dtSec) {
  if (typeof mansion.scriptureXpAward === "function") {
    return mansion.scriptureXpAward(state, dtSec) ?? {};
  }
  return fallbackAward(state, dtSec);
}

/** 府级每秒修业（Σ 楼级基准），面板用来说明「藏经楼在出多少」。 */
export function scriptureRate(state) {
  if (typeof mansion.scriptureXpPerSec === "function") return mansion.scriptureXpPerSec(state);
  return fallbackHalls(state).reduce((s, b) => s + FALLBACK_XP_PER_SEC * Math.max(1, Number(b.level) || 1), 0);
}

/** 这名弟子每秒实得的修业：不驻藏经楼即为 0。 */
export function scriptureRateFor(state, disciple) {
  if (typeof mansion.scriptureXpFor === "function") return mansion.scriptureXpFor(state, disciple);
  const dt = 1;
  return fallbackAward(state, dt)[disciple?.id] ?? 0;
}

/** 修业已积满，只差一次传功。 */
export function xpReady(disciple) {
  return (disciple?.xp ?? 0) >= xpNeeded(disciple?.profession ?? 1);
}

/** 面板要的一整行：进度、速率、还差多久积满。晋阶与否不在此判断。 */
export function xpProgress(state, disciple) {
  const need = xpNeeded(disciple?.profession ?? 1);
  const rate = scriptureRateFor(state, disciple);
  const xp = Math.max(0, Math.min(need, disciple?.xp ?? 0));
  const ready = xp >= need;
  return {
    xp,
    need,
    rate,
    ready,
    ratio: need > 0 ? xp / need : 0,
    remainSec: ready || rate <= 0 ? 0 : (need - xp) / rate,
  };
}

/**
 * 把这一段时间的修业记到弟子头上。满格即止，专业只会由 `TRAIN` 抬升。
 * 没有人该领时原样返回同一份名册，免得 TICK 每帧造一批新对象。
 */
export function scriptureXp(state, dtSec) {
  const disciples = Array.isArray(state?.disciples) ? state.disciples : [];
  const award = scriptureAward(state, dtSec);
  if (!disciples.length || !Object.keys(award).length) return state?.disciples ?? disciples;
  let changed = false;
  const next = disciples.map((d) => {
    const gain = Number(award[d?.id]);
    if (!Number.isFinite(gain) || gain <= 0) return d;
    const xp = Math.min(xpNeeded(d.profession), (d.xp ?? 0) + gain);
    if (xp === (d.xp ?? 0)) return d;
    changed = true;
    return { ...d, xp };
  });
  return changed ? next : state.disciples;
}
