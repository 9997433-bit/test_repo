#!/usr/bin/env node
import { performance } from "node:perf_hooks";

import { createMatch, getView, step } from "../src/sim/index.js";

const DT = 1 / 60;
const STEPS = 10_000;

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

try {
  const match = createMatch(0xbec4);
  const startedAt = performance.now();

  for (let index = 0; index < STEPS; index += 1) {
    step(match, {}, DT);
  }

  const elapsedSeconds = (performance.now() - startedAt) / 1_000;
  const stepsPerSecond = STEPS / elapsedSeconds;
  const view = getView(match);

  if (!Number.isFinite(view.coreHp)) {
    throw new TypeError(
      `getView(match).coreHp must be a finite number; got ${String(view.coreHp)}`,
    );
  }

  console.log(
    `${stepsPerSecond.toFixed(2)} steps/sec ` +
      `(${STEPS} steps in ${elapsedSeconds.toFixed(4)}s)`,
  );
} catch (error) {
  console.error(`[shihe-yaosai] bench failed: ${errorMessage(error)}`);
  process.exitCode = 1;
}
