#!/usr/bin/env node
/** Headless 探针脚手架。GPT-sol-1 负责补齐。 */
import assert from "node:assert/strict";
import {
  FIXED_DT,
  createWorld,
  predictTrajectory,
  stepWorld,
} from "../src/physics/index.js";
import { resolveHit } from "../src/combat/index.js";
import {
  SAVE_KEY,
  defaultSave,
  loadSave,
  writeSave,
} from "../src/core/store.js";
import { HERO_LIST } from "../src/data/index.js";

const world = createWorld();
stepWorld(world);
const hit = resolveHit({ power: 12 }, { hp: 40 }, { combo: 0 });
const checks = [];

function check(name, assertion) {
  try {
    assertion();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({ name, ok: false, error: error.message });
  }
}

check("empty world fixed step", () => {
  assert.equal(world.eggs.length, 0);
  assert.equal(world.statics.length, 0);
  assert.ok(Math.abs(world.time - FIXED_DT) < Number.EPSILON);
});

check("damage is monotonic by power", () => {
  const damages = [0, 1, 5, 10, 20].map(
    (power) => resolveHit({ power }, { hp: 100 }, { combo: 0 }).damage,
  );
  damages.slice(1).forEach((damage, index) => {
    assert.ok(damage >= damages[index]);
  });
});

const zeroPowerHit = resolveHit({ power: 0 }, { hp: 40 }, { combo: 0 });
check("zero power has finite non-negative damage", () => {
  assert.ok(Number.isFinite(zeroPowerHit.damage));
  assert.ok(zeroPowerHit.damage >= 0);
});

check("missing egg fields use safe combat defaults", () => {
  const result = resolveHit({}, {}, {});
  assert.ok(Number.isFinite(result.damage));
  assert.ok(result.damage > 0);
  assert.equal(result.comboDelta, 1);
  assert.deepEqual(result.effects, []);
});

check("damage is monotonic by combo", () => {
  const damages = [0, 1, 5, 10, 20].map(
    (combo) => resolveHit({ power: 12 }, { hp: 100 }, { combo }).damage,
  );
  damages.slice(1).forEach((damage, index) => {
    assert.ok(damage >= damages[index]);
  });
});

const malformedWorld = createWorld();
malformedWorld.eggs.push({
  id: "nan-speed",
  x: 100,
  y: 100,
  vx: Number.NaN,
  vy: Number.NaN,
});
check("NaN egg speed does not corrupt the world clock", () => {
  stepWorld(malformedWorld, FIXED_DT);
  assert.ok(Number.isFinite(malformedWorld.time));
});

check("hero ids are unique", () => {
  const ids = HERO_LIST.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => typeof id === "string" && id.length > 0));
});

check("save round-trip works with injected storage", () => {
  let raw = null;
  const storage = {
    getItem: (key) => (key === SAVE_KEY ? raw : null),
    setItem: (key, value) => {
      if (key === SAVE_KEY) raw = String(value);
    },
  };
  const previousDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );

  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    });
    const save = { ...defaultSave(), gold: 321 };
    writeSave(save);
    assert.deepEqual(loadSave(), save);
  } finally {
    if (previousDescriptor) {
      Object.defineProperty(
        globalThis,
        "localStorage",
        previousDescriptor,
      );
    } else {
      delete globalThis.localStorage;
    }
  }
});

const requestedSamples = 12;
const trajectory = predictTrajectory(
  { x: 240, y: 40 },
  { x: 120, y: 360 },
  createWorld(),
  requestedSamples,
);
check("trajectory predictor returns an array", () => {
  assert.ok(Array.isArray(trajectory));
});

const escapedWorld = createWorld();
escapedWorld.eggs.push({
  id: "escaped",
  x: 240,
  y: 821,
  vx: 0,
  vy: 20,
  radius: 12,
});
stepWorld(escapedWorld, FIXED_DT);

const failed = checks.filter(({ ok }) => !ok);
const report = {
  ok: failed.length === 0,
  checks,
  metrics: {
    time: world.time,
    damage: hit.damage,
    trajectorySamples: trajectory.length,
    heroCount: HERO_LIST.length,
  },
  round2: {
    trajectoryLength:
      trajectory.length === requestedSamples ? "implemented" : "pending",
    outOfBoundsRecycle:
      escapedWorld.eggs.length === 0 ? "implemented" : "pending",
    nanVelocitySanitization:
      Number.isFinite(malformedWorld.eggs[0]?.vx) ? "implemented" : "pending",
    zeroPowerNoDamage: zeroPowerHit.damage === 0 ? "implemented" : "pending",
    completeHeroRoster: HERO_LIST.length === 18 ? "implemented" : "pending",
  },
};

console.log(JSON.stringify(report, null, 2));
if (failed.length > 0) process.exitCode = 1;
