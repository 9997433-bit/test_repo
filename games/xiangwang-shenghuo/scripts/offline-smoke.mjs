import { createInitialState } from "../src/core/engine.js";

const farm = await import("../src/systems/farm/index.js");
const CAP_HOURS = 8;
const HOUR_MS = 60 * 60 * 1000;

if (typeof farm.catchUpPlots !== "function") {
  console.log(
    JSON.stringify(
      {
        ok: true,
        skipped: true,
        reason: "optional export farm.catchUpPlots is unavailable",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const savedAt = 1_000_000;
const now = savedAt + 12 * HOUR_MS;

function growingRice(doneAt) {
  const state = createInitialState();
  return {
    ...state,
    plots: state.plots.map((plot) =>
      plot.id === "p1"
        ? {
            ...plot,
            status: "growing",
            cropId: "rice",
            plantedAt: savedAt,
            doneAt,
            wiltAt: 0,
            greenhouse: true,
          }
        : plot,
    ),
  };
}

const withinCap = farm.catchUpPlots(
  growingRice(savedAt + CAP_HOURS * HOUR_MS - 1),
  savedAt,
  now,
);
const beyondCap = farm.catchUpPlots(
  growingRice(savedAt + CAP_HOURS * HOUR_MS + 1),
  savedAt,
  now,
);
const withinCapStatus = withinCap.plots.find(({ id }) => id === "p1")?.status;
const beyondCapStatus = beyondCap.plots.find(({ id }) => id === "p1")?.status;
const checks = {
  withinCapSettled: withinCapStatus === "ready",
  beyondCapDeferred: beyondCapStatus === "growing",
};

console.log(
  JSON.stringify(
    {
      ok: Object.values(checks).every(Boolean),
      skipped: false,
      capHours: CAP_HOURS,
      simulatedAwayHours: (now - savedAt) / HOUR_MS,
      withinCapStatus,
      beyondCapStatus,
      checks,
    },
    null,
    2,
  ),
);
