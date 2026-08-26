import { cropById } from "../../data/crops.js";
import { guestById } from "../../data/guests.js";
import { addInv } from "../../core/store.js";

/** 错季生长速度倍率：0.55 倍速，即耗时 1/0.55。 */
const OFF_SEASON_FACTOR = 0.55;
/** 错季作物成熟后不收，撑过这段时间就枯萎。 */
const WILT_GRACE_MS = 45_000;
/** 离线折算上限：回来时最多按 8 小时结算。 */
const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
/** 嘉宾 buff 叠加下限，防止乘到荒谬的数值。 */
const MIN_BUFF_FACTOR = 0.5;
const MIN_GROW_MS = 1_000;
const LOG_MAX = 40;
const GROWABLE = new Set(["growing", "ready"]);

function pushLog(state, line) {
  return { ...state, log: [line, ...(state.log || [])].slice(0, LOG_MAX) };
}

/** 温室地块或已建成的温室都免疫错季惩罚。 */
function isGreenhouse(state, plot) {
  return Boolean(plot?.greenhouse || state?.buildings?.greenhouse?.built);
}

function nextPlotId(plots) {
  let max = 0;
  for (const p of plots) {
    const n = Number.parseInt(String(p.id).replace(/^p/, ""), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `p${max + 1}`;
}

export function seasonFactor(crop, season, greenhouse = false) {
  if (greenhouse) return 1;
  if (!crop) return 1;
  return crop.seasons.includes(season) ? 1 : OFF_SEASON_FACTOR;
}

/**
 * 屋里坐着的嘉宾对种植的加成（林婶：生长时间 ×0.85）。
 * 不传 growMs 时返回倍率本身。
 */
export function applyGuestFarmBuff(state, growMs = 1) {
  let factor = 1;
  for (const entry of state?.guests || []) {
    const def = guestById(typeof entry === "string" ? entry : entry?.id);
    if (def?.buff?.target === "farm") factor *= def.buff.factor;
  }
  return growMs * Math.max(MIN_BUFF_FACTOR, factor);
}

export function till(state, { plotId }) {
  const plots = state.plots.map((p) => {
    if (p.id !== plotId) return p;
    if (p.status !== "untilled" && p.status !== "wilted") return p;
    return { ...p, status: "empty", cropId: null, plantedAt: 0, doneAt: 0, wiltAt: 0 };
  });
  return { ...state, plots };
}

export function plant(state, { plotId, cropId }, now = Date.now()) {
  const crop = cropById(cropId);
  if (!crop) return { ok: false, reason: "没有这种作物", state };
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot) return { ok: false, reason: "没有这块地", state };
  if (plot.status !== "empty") return { ok: false, reason: "这块地还不能种", state };
  if (state.resources.coin < crop.seedCost) return { ok: false, reason: "金币不够买种子", state };

  const greenhouse = isGreenhouse(state, plot);
  const factor = seasonFactor(crop, state.meta.season, greenhouse);
  const grow = Math.max(MIN_GROW_MS, Math.round(applyGuestFarmBuff(state, crop.growMs / factor)));
  const doneAt = now + grow;
  const plots = state.plots.map((p) =>
    p.id === plotId
      ? {
          ...p,
          status: "growing",
          cropId,
          plantedAt: now,
          doneAt,
          wiltAt: factor === 1 ? 0 : doneAt + WILT_GRACE_MS,
        }
      : p,
  );
  return {
    ok: true,
    state: {
      ...state,
      resources: { ...state.resources, coin: state.resources.coin - crop.seedCost },
      plots,
    },
  };
}

export function harvest(state, { plotId }, now = Date.now()) {
  const plot = state.plots.find((p) => p.id === plotId);
  const ripe = plot && (plot.status === "ready" || (plot.status === "growing" && now >= plot.doneAt));
  if (!ripe) return { ok: false, reason: "还没熟", state };
  const crop = cropById(plot.cropId);
  if (!crop) return { ok: false, reason: "地里空着", state };
  let next = addInv(state, crop.yieldId, crop.yieldQty);
  next = {
    ...next,
    meta: { ...next.meta, xp: next.meta.xp + crop.xp },
    plots: next.plots.map((p) =>
      p.id === plotId
        ? { ...p, status: "empty", cropId: null, plantedAt: 0, doneAt: 0, wiltAt: 0 }
        : p,
    ),
  };
  return { ok: true, state: pushLog(next, `收了${crop.name}，${crop.yieldQty} 份进了筐。`) };
}

/** 一次收完所有熟了的地，供“全部收获”按钮与挂机结算使用。 */
export function harvestAll(state, now = Date.now()) {
  let next = state;
  let count = 0;
  for (const plot of state.plots) {
    const got = harvest(next, { plotId: plot.id }, now);
    if (got.ok) {
      next = got.state;
      count += 1;
    }
  }
  if (!count) return { ok: false, reason: "还没有能收的地", state, count: 0 };
  return { ok: true, state: next, count };
}

/** 让一块地枯萎：作物没了，得重新开垦。 */
export function wilt(state, { plotId }) {
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot) return { ok: false, reason: "没有这块地", state };
  if (!GROWABLE.has(plot.status)) return { ok: false, reason: "这块地没种东西", state };
  const crop = cropById(plot.cropId);
  const plots = state.plots.map((p) =>
    p.id === plotId
      ? { ...p, status: "wilted", cropId: null, plantedAt: 0, doneAt: 0, wiltAt: 0 }
      : p,
  );
  const name = crop ? crop.name : "地里的苗";
  return { ok: true, state: pushLog({ ...state, plots }, `${name}没扛住这个季节，蔫了。`) };
}

export function expandPlot(state) {
  const level = state.meta.level || 1;
  const pop = state.resources.pop || 0;
  // 一个人照看两块地，等级再放开上限：Lv1 两块，往后每级 +1。
  const byPop = pop * 2;
  const byLevel = 1 + level;
  if (state.plots.length >= byPop) {
    return { ok: false, reason: "人手不够，先盖房子添人", state };
  }
  if (state.plots.length >= byLevel) {
    return { ok: false, reason: "小镇等级不够，再攒些经验", state };
  }
  if (state.resources.coin < 40 || state.resources.shovel < 1) {
    return { ok: false, reason: "扩建要 40 金币和 1 把锹", state };
  }
  const id = nextPlotId(state.plots);
  const next = {
    ...state,
    resources: {
      ...state.resources,
      coin: state.resources.coin - 40,
      shovel: state.resources.shovel - 1,
    },
    plots: [
      ...state.plots,
      { id, status: "untilled", cropId: null, plantedAt: 0, doneAt: 0, wiltAt: 0, greenhouse: false },
    ],
  };
  return { ok: true, state: pushLog(next, "锹下去一层土，又多了一块地。") };
}

export function tickPlots(state, _dtMs, now = Date.now()) {
  const season = state.meta.season;
  let changed = false;
  const plots = state.plots.map((p) => {
    if (!GROWABLE.has(p.status)) return p;
    const crop = cropById(p.cropId);
    if (!crop) return p;

    let next = p;
    if (next.status === "growing" && now >= next.doneAt) next = { ...next, status: "ready" };

    if (seasonFactor(crop, season, isGreenhouse(state, next)) === 1) {
      // 回到当季就免了枯萎倒计时。
      if (next.wiltAt) next = { ...next, wiltAt: 0 };
    } else {
      const deadline = next.wiltAt || Math.max(next.doneAt, now) + WILT_GRACE_MS;
      if (deadline !== next.wiltAt) next = { ...next, wiltAt: deadline };
      if (now >= deadline) {
        next = { ...next, status: "wilted", cropId: null, plantedAt: 0, doneAt: 0, wiltAt: 0 };
      }
    }

    if (next !== p) changed = true;
    return next;
  });
  if (!changed) return state;
  return { ...state, plots };
}

/**
 * 读档后结算地块：作物照常成熟，但人不在家的时候不判枯萎，
 * 到期的倒计时按回来的时刻重新起算。折算时长上限 8 小时。
 */
export function catchUpPlots(state, savedAt, now = Date.now()) {
  const from = Number.isFinite(savedAt) ? savedAt : now;
  const away = Math.min(Math.max(0, now - from), OFFLINE_CAP_MS);
  if (!away) return tickPlots(state, 0, now);
  const plots = state.plots.map((p) =>
    p.wiltAt && p.wiltAt > from ? { ...p, wiltAt: Math.max(p.wiltAt, now + WILT_GRACE_MS) } : p,
  );
  return tickPlots({ ...state, plots }, away, now);
}
