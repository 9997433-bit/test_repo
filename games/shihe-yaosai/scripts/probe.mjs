#!/usr/bin/env node
import { performance } from "node:perf_hooks";

import { createMatch, getView, step } from "../src/sim/index.js";

const DT = 1 / 60;
const TARGET_WAVE = 5;
const MAX_STEPS = 120 / DT;

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function p99(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.99) - 1)] ?? 0;
}

function emptySocket(view) {
  return view.sockets?.find((socket) => socket?.towerId == null);
}

function makeRailPlacer() {
  let railCost = null;
  let rejectedAtScrap = null;

  return {
    input(view) {
      const socket = emptySocket(view);
      if (
        !socket ||
        !Number.isFinite(view.scrap) ||
        (railCost !== null && view.scrap < railCost) ||
        view.scrap === rejectedAtScrap
      ) {
        return {};
      }
      return { place: { socket: socket.i, towerId: "rail" } };
    },

    observe(before, after, input, events) {
      if (!input.place) return;

      const placed =
        after.sockets?.find((socket) => socket?.i === input.place.socket)
          ?.towerId === "rail" ||
        events.some((event) => event?.type === "place");

      if (placed) {
        const spent = before.scrap - after.scrap;
        if (Number.isFinite(spent) && spent > 0) railCost = spent;
        rejectedAtScrap = null;
      } else {
        rejectedAtScrap = before.scrap;
      }
    },
  };
}

try {
  const match = createMatch(0x5eed);
  const placer = makeRailPlacer();
  const durations = [];
  let view = getView(match);
  let kills = 0;
  let leaks = 0;
  let win = false;
  let lose = false;
  let steps = 0;

  if (!Number.isFinite(view.wave)) {
    throw new TypeError(
      `getView(match).wave must be a finite number; got ${String(view.wave)}`,
    );
  }

  while (
    steps < MAX_STEPS &&
    view.wave < TARGET_WAVE &&
    !win &&
    !lose
  ) {
    const before = view;
    const input = placer.input(before);
    const startedAt = performance.now();
    const result = step(match, input, DT);
    durations.push(performance.now() - startedAt);
    steps += 1;

    const events = Array.isArray(result?.events) ? result.events : [];
    for (const event of events) {
      if (event?.type === "kill") kills += 1;
      if (event?.type === "leak") leaks += 1;
      if (event?.type === "win") win = true;
      if (event?.type === "lose") lose = true;
    }

    view = getView(match);
    placer.observe(before, view, input, events);
  }

  if (steps === 0) {
    throw new Error("simulation completed without executing a step");
  }
  if (!Number.isFinite(view.coreHp)) {
    throw new TypeError(
      `getView(match).coreHp must be a finite number; got ${String(view.coreHp)}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        backend: view.backend ?? "sim",
        steps,
        simulatedSeconds: Number((steps * DT).toFixed(3)),
        wave: view.wave,
        kills,
        leaks,
        coreHp: view.coreHp,
        win,
        lose,
        p99StepMs: Number(p99(durations).toFixed(4)),
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    `[shihe-yaosai] probe failed: simulation did not advance: ${errorMessage(error)}`,
  );
  process.exitCode = 1;
}
