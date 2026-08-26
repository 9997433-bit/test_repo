import { cropById } from "../../data/crops.js";
import { addInv, spendInv } from "../../core/store.js";

export function seasonFactor(crop, season, greenhouse = false) {
  if (greenhouse) return 1;
  if (!crop) return 1;
  return crop.seasons.includes(season) ? 1 : 0.55;
}

export function till(state, { plotId }) {
  const plots = state.plots.map((p) => {
    if (p.id !== plotId) return p;
    if (p.status !== "untilled" && p.status !== "wilted") return p;
    return { ...p, status: "empty", cropId: null };
  });
  return { ...state, plots };
}

export function plant(state, { plotId, cropId }) {
  const crop = cropById(cropId);
  if (!crop) return { ok: false, reason: "没有这种作物", state };
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot || plot.status !== "empty") return { ok: false, reason: "这块地还不能种", state };
  const paid = spendInv(
    { ...state, inv: { ...state.inv, coin: state.resources.coin } },
    { coin: crop.seedCost },
  );
  if (!paid.ok) {
    if (state.resources.coin < crop.seedCost) return { ok: false, reason: "金币不够买种子", state };
  }
  if (state.resources.coin < crop.seedCost) return { ok: false, reason: "金币不够买种子", state };
  const factor = seasonFactor(crop, state.meta.season, plot.greenhouse);
  const now = Date.now();
  const grow = Math.round(crop.growMs / factor);
  const plots = state.plots.map((p) =>
    p.id === plotId
      ? { ...p, status: "growing", cropId, plantedAt: now, doneAt: now + grow }
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

export function harvest(state, { plotId }) {
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot || plot.status !== "ready") return { ok: false, reason: "还没熟", state };
  const crop = cropById(plot.cropId);
  let next = addInv(state, crop.yieldId, crop.yieldQty);
  next = {
    ...next,
    meta: { ...next.meta, xp: next.meta.xp + crop.xp },
    plots: next.plots.map((p) =>
      p.id === plotId ? { ...p, status: "empty", cropId: null, plantedAt: 0, doneAt: 0 } : p,
    ),
  };
  return { ok: true, state: next };
}

export function expandPlot(state) {
  const needPop = 2 + state.plots.length;
  if (state.resources.pop < Math.min(needPop, state.resources.popCap)) {
    return { ok: false, reason: "人手不够，先盖房子", state };
  }
  if (state.resources.coin < 40 || state.resources.shovel < 1) {
    return { ok: false, reason: "扩建要 40 金币和 1 把锹", state };
  }
  const id = `p${state.plots.length + 1}`;
  return {
    ok: true,
    state: {
      ...state,
      resources: {
        ...state.resources,
        coin: state.resources.coin - 40,
        shovel: state.resources.shovel - 1,
      },
      plots: [...state.plots, { id, status: "untilled", cropId: null, plantedAt: 0, doneAt: 0, greenhouse: false }],
    },
  };
}

export function tickPlots(state, _dtMs, now = Date.now()) {
  const plots = state.plots.map((p) => {
    if (p.status === "growing" && now >= p.doneAt) return { ...p, status: "ready" };
    return p;
  });
  return { ...state, plots };
}
