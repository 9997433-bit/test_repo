#!/usr/bin/env node
import { performance } from "node:perf_hooks";

import { BOT_DT, botInput, createBot } from "../src/sim/bot.mjs";
import { createMatch, getView, step } from "../src/sim/index.js";

const SEED = 7;
const DT = BOT_DT;
const TARGET_WAVES = 5;
const MAX_LEAKS = 2;
const MAX_STEPS = (20 * 60) / DT;

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

try {
  const match = createMatch(SEED, { waveCount: TARGET_WAVES });
  const durations = [];
  let view = getView(match);
  const bot = createBot(SEED, view);
  let kills = 0;
  let leaks = 0;
  let wavesCleared = 0;
  let steps = 0;

  if (!Number.isFinite(view.wave)) {
    throw new TypeError(
      `getView(match).wave must be a finite number; got ${String(view.wave)}`,
    );
  }

  while (steps < MAX_STEPS && !view.over) {
    const input = botInput(bot, view);
    const result = timedStep(match, input, DT, durations);
    steps += 1;

    const events = Array.isArray(result?.events) ? result.events : [];
    for (const event of events) {
      if (event?.type === "kill") kills += 1;
      if (event?.type === "leak") leaks += 1;
      if (event?.type === "waveClear") wavesCleared += 1;
    }

    view = getView(match);
  }

  if (steps === 0) {
    throw new Error("simulation completed without executing a step");
  }
  if (!Number.isFinite(view.coreHp)) {
    throw new TypeError(
      `getView(match).coreHp must be a finite number; got ${String(view.coreHp)}`,
    );
  }

  const passed =
    wavesCleared >= TARGET_WAVES &&
    view.coreHp > 0 &&
    leaks <= MAX_LEAKS;
  const summary = {
    backend: view.backend ?? "sim",
    seed: SEED,
    steps,
    simulatedSeconds: Number((steps * DT).toFixed(3)),
    wave: view.wave,
    wavesCleared,
    kills,
    leaks,
    coreHp: view.coreHp,
    win: view.result === "win",
    lose: view.result === "lose",
    p99StepMs: Number(p99(durations).toFixed(4)),
    towers: view.sockets.flatMap((socket) =>
      socket.towerId ? [`${socket.towerId}@${socket.i}`] : [],
    ),
    passed,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!passed) {
    console.error(
      `[shihe-yaosai] probe failed: expected five cleared waves, coreHp > 0, ` +
        `and leaks <= ${MAX_LEAKS}; got wavesCleared=${wavesCleared}, ` +
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
