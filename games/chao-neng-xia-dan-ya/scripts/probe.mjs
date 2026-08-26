#!/usr/bin/env node
/** Headless 探针脚手架。GPT-sol-1 负责补齐。 */
import { createWorld, stepWorld } from "../src/physics/index.js";
import { resolveHit } from "../src/combat/index.js";

const world = createWorld();
stepWorld(world);
const hit = resolveHit({ power: 12 }, { hp: 40 }, { combo: 0 });
console.log(
  JSON.stringify({ ok: true, time: world.time, damage: hit.damage }, null, 2),
);
