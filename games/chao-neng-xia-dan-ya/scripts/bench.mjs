#!/usr/bin/env node
/** 基准脚手架。GPT-sol-2 负责补齐。 */
import { createWorld, stepWorld } from "../src/physics/index.js";

const N = 10_000;
const t0 = performance.now();
const world = createWorld();
for (let i = 0; i < N; i++) stepWorld(world);
const ms = performance.now() - t0;
console.log(
  JSON.stringify(
    { steps: N, ms: Number(ms.toFixed(2)), stepsPerMs: Number((N / ms).toFixed(2)) },
    null,
    2,
  ),
);
