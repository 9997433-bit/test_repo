#!/usr/bin/env node
import { performance } from "node:perf_hooks";

import { createMatch, getView, step } from "../src/sim/index.js";

const DT = 1 / 60;
const TARGET_WAVES = 5;
const MAX_STEPS = 180 / DT;
const LAYOUT_SOCKETS = [0, 3, 6, 9, 12, 15, 18, 21];
const TOWER_CYCLE = ["rail", "prism", "scatter", "well", "star"];
const LAYOUT = LAYOUT_SOCKETS.map((socket, index) => ({
  socket,
  towerId: TOWER_CYCLE[index % TOWER_CYCLE.length],
}));

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function p99(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.99) - 1)] ?? 0;
}

function timedStep(match, input, dt, durations) {
  const startedAt = performance.now();
  const result = step(match, input, dt);
  durations.push(performance.now() - startedAt);
  return result;
}

function placeAffordableLayout(match, initialView, durations) {
  let view = initialView;

  for (const placement of LAYOUT) {
    const socket = view.sockets?.find(
      (candidate) => candidate?.i === placement.socket,
    );

    if (!socket || socket.towerId != null) continue;

    const result = timedStep(
      match,
      { place: placement },
      0,
      durations,
    );
    const events = Array.isArray(result?.events) ? result.events : [];
    view = getView(match);

    const placed =
      view.sockets?.find((candidate) => candidate?.i === placement.socket)
        ?.towerId === placement.towerId;
    if (!placed) {
      const denial = events.find((event) => event?.type === "deny");
      if (denial?.reason === "scrap") continue;
      throw new Error(
        `layout placement ${placement.towerId}@${placement.socket} failed` +
          (denial?.reason ? `: ${denial.reason}` : ""),
      );
    }
  }

  return view;
}

try {
  const match = createMatch(0x5eed, { waveCount: TARGET_WAVES });
  const durations = [];
  let view = getView(match);
  let kills = 0;
  let leaks = 0;
  let wavesCleared = 0;
  let win = false;
  let lose = false;
  let steps = 0;

  if (!Number.isFinite(view.wave)) {
    throw new TypeError(
      `getView(match).wave must be a finite number; got ${String(view.wave)}`,
    );
  }

  view = placeAffordableLayout(match, view, durations);

  while (steps < MAX_STEPS && !win && !lose) {
    const result = timedStep(match, {}, DT, durations);
    steps += 1;

    const events = Array.isArray(result?.events) ? result.events : [];
    for (const event of events) {
      if (event?.type === "kill") kills += 1;
      if (event?.type === "leak") leaks += 1;
      if (event?.type === "waveClear") wavesCleared += 1;
      if (event?.type === "win") win = true;
      if (event?.type === "lose") lose = true;
    }

    view = getView(match);
    if (
      events.some((event) => event?.type === "waveClear") &&
      !win &&
      !lose
    ) {
      view = placeAffordableLayout(match, view, durations);
    }
  }

  if (steps === 0) {
    throw new Error("simulation completed without executing a step");
  }
  if (!Number.isFinite(view.coreHp)) {
    throw new TypeError(
      `getView(match).coreHp must be a finite number; got ${String(view.coreHp)}`,
    );
  }

  const completedFiveWaves = wavesCleared >= TARGET_WAVES || win;
  const passed =
    completedFiveWaves && view.coreHp > 0 && leaks <= 2 && !lose;
  const summary = {
    backend: view.backend ?? "sim",
    steps,
    simulatedSeconds: Number((steps * DT).toFixed(3)),
    wave: view.wave,
    wavesCleared,
    kills,
    leaks,
    coreHp: view.coreHp,
    win,
    lose,
    p99StepMs: Number(p99(durations).toFixed(4)),
    layout: LAYOUT.flatMap(({ socket }) => {
      const towerId = view.sockets?.find(
        (candidate) => candidate?.i === socket,
      )?.towerId;
      return towerId ? [`${towerId}@${socket}`] : [];
    }),
    passed,
  };

  console.log(
    JSON.stringify(summary, null, 2),
  );

  if (!passed) {
    console.error(
      `[shihe-yaosai] probe failed: expected five cleared waves, coreHp > 0, ` +
        `and leaks <= 2; got wavesCleared=${wavesCleared}, ` +
        `coreHp=${view.coreHp}, leaks=${leaks}`,
    );
    process.exitCode = 1;
  }
} catch (error) {
  console.error(
    `[shihe-yaosai] probe failed: simulation did not advance: ${errorMessage(error)}`,
  );
  process.exitCode = 1;
}
