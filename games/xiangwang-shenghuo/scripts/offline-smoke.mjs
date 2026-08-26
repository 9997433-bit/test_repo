import { createInitialState } from "../src/core/engine.js";

const farm = await import("../src/systems/farm/index.js");
const HOUR_MS = 60 * 60 * 1000;
const BOUNDARY_DELTA_MS = 1;

if (typeof farm.catchUpPlots !== "function") {
  console.log(
    JSON.stringify(
      {
        ok: false,
        skipped: true,
        reason: "optional export farm.catchUpPlots is unavailable",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const capMs = farm.OFFLINE_CAP_MS;
if (!Number.isSafeInteger(capMs) || capMs <= BOUNDARY_DELTA_MS) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        skipped: true,
        reason: "farm.OFFLINE_CAP_MS must be a safe integer greater than 1",
        capMs: Number.isFinite(capMs) ? capMs : null,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const savedAt = 1_000_000;
const overCapMs = Math.max(HOUR_MS, Math.floor(capMs / 2));
const simulatedAwayMs = capMs + overCapMs;
const now = savedAt + simulatedAwayMs;

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
  growingRice(savedAt + capMs - BOUNDARY_DELTA_MS),
  savedAt,
  now,
);
const beyondCapOriginalDoneAt = savedAt + capMs + BOUNDARY_DELTA_MS;
const beyondCap = farm.catchUpPlots(
  growingRice(beyondCapOriginalDoneAt),
  savedAt,
  now,
);
const withinCapPlot = withinCap.plots.find(({ id }) => id === "p1");
const beyondCapPlot = beyondCap.plots.find(({ id }) => id === "p1");
const withinCapStatus = withinCapPlot?.status;
const beyondCapStatus = beyondCapPlot?.status;
const beyondCapRemainingMs = beyondCapPlot?.doneAt - now;
const checks = {
  withinCapSettled: withinCapStatus === "ready",
  beyondCapDeferred: beyondCapStatus === "growing",
  beyondCapRemainingPreserved: beyondCapRemainingMs === BOUNDARY_DELTA_MS,
};

console.log(
  JSON.stringify(
    {
      ok: Object.values(checks).every(Boolean),
      skipped: false,
      capMs,
      capHours: capMs / HOUR_MS,
      simulatedAwayMs,
      simulatedAwayHours: simulatedAwayMs / HOUR_MS,
      overCapMs,
      withinCapStatus,
      beyondCapStatus,
      beyondCapRemainingMs,
      expectedBeyondCapRemainingMs: BOUNDARY_DELTA_MS,
      checks,
    },
    null,
    2,
  ),
);
