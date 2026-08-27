import { afterEach, describe, expect, it } from "vitest";

import { cameraYawToSimYaw } from "../src/core/view.js";
import { createInput } from "../src/input/index.js";
import {
  createMatch,
  forwardX,
  forwardZ,
  getPlayer,
  step,
  yawFromDir,
} from "../src/sim/index.js";
import { DT } from "./helpers.js";

function fakeNode() {
  const handlers = new Map();
  return {
    hidden: false,
    pointerLockElement: null,
    addEventListener(type, handler) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      handlers.get(type)?.delete(handler);
    },
    emit(type, event = {}) {
      for (const handler of handlers.get(type) || []) {
        handler({ preventDefault() {}, ...event });
      }
    },
  };
}

const liveInputs = [];

function inputHarness(lookMode) {
  const doc = fakeNode();
  const canvas = fakeNode();
  const win = fakeNode();
  globalThis.window = win;
  const input = createInput(doc, canvas, {
    lookMode,
    phase: "arena",
    pointerLock: false,
  });
  liveInputs.push(input);
  return { input, win };
}

function park(player, { x, z, yaw }) {
  Object.assign(player, {
    x,
    y: 0,
    z,
    yaw,
    vx: 0,
    vy: 0,
    vz: 0,
    grounded: true,
    alive: true,
    invulnT: 0,
    respawnT: 0,
  });
}

afterEach(() => {
  for (const input of liveInputs.splice(0)) input.dispose();
  delete globalThis.window;
});

describe("Round 2 LK-04 input dispatch", () => {
  it("rotating the view changes locked yaw while stationary free yaw stays null", () => {
    const locked = inputHarness("locked").input;
    const free = inputHarness("free").input;
    const firstCameraYaw = -0.82;
    const secondCameraYaw = 1.17;

    const lockedBefore = locked.sample(firstCameraYaw);
    const lockedAfter = locked.sample(secondCameraYaw);
    const freeBefore = free.sample(firstCameraYaw);
    const freeAfter = free.sample(secondCameraYaw);

    expect(
      lockedBefore.yaw,
      "LK-04: locked sample() must continuously emit the camera's sim-space yaw",
    ).toBe(cameraYawToSimYaw(firstCameraYaw));
    expect(
      lockedAfter.yaw,
      "LK-04: rotating a locked view must immediately update emitted yaw",
    ).toBe(cameraYawToSimYaw(secondCameraYaw));
    expect(lockedAfter.yaw).not.toBe(lockedBefore.yaw);
    expect(
      freeBefore.yaw,
      "LK-04: stationary free sample() must emit yaw: null instead of camera yaw",
    ).toBeNull();
    expect(
      freeAfter.yaw,
      "LK-04: rotating a stationary free view must keep emitted yaw null",
    ).toBeNull();
  });

  it("free movement faces its world-space travel direction instead of locked camera yaw", () => {
    const cameraYaw = 0.43;
    const lockedHarness = inputHarness("locked");
    const freeHarness = inputHarness("free");
    lockedHarness.win.emit("keydown", { code: "KeyD" });
    freeHarness.win.emit("keydown", { code: "KeyD" });

    const locked = lockedHarness.input.sample(cameraYaw);
    const free = freeHarness.input.sample(cameraYaw);
    const movementYaw = yawFromDir(free.moveX, free.moveZ);

    expect(Math.hypot(free.moveX, free.moveZ)).toBeCloseTo(1, 9);
    expect(
      free.yaw,
      "LK-04: moving in free mode must emit yawFromDir(moveX, moveZ)",
    ).toBeCloseTo(movementYaw, 12);
    expect(
      free.yaw,
      "LK-04: strafing must make free and locked emit different yaw values",
    ).not.toBeCloseTo(locked.yaw, 12);
    expect(locked.yaw).toBe(cameraYawToSimYaw(cameraYaw));
  });
});

describe("Round 2 locked slap facing regression", () => {
  it("uses the locked sight's sim yaw as the slap cone forward", () => {
    const cameraYaw = 0.61;
    const expectedYaw = cameraYawToSimYaw(cameraYaw);
    const { input } = inputHarness("locked");
    const state = createMatch({
      seed: 0x473104,
      botCount: 1,
      phase: "arena",
    });
    const attacker = getPlayer(state, "p0");
    const target = getPlayer(state, "b0");
    const distance = 2.2;

    park(attacker, { x: 0, z: 0, yaw: expectedYaw + Math.PI });
    park(target, {
      x: forwardX(expectedYaw) * distance,
      z: forwardZ(expectedYaw) * distance,
      yaw: expectedYaw + Math.PI,
    });
    input.setTouchButton("slap", true);

    let sampled = null;
    for (let frame = 0; frame < 60 && target.hitsTaken === 0; frame += 1) {
      sampled = input.sample(cameraYaw);
      step(state, { p0: sampled }, DT);
    }

    expect(sampled?.yaw).toBe(expectedYaw);
    expect(attacker.yaw).toBe(expectedYaw);
    expect(
      forwardX(attacker.yaw) * (target.x - attacker.x) +
        forwardZ(attacker.yaw) * (target.z - attacker.z),
    ).toBeGreaterThan(0);
    expect(
      target.hitsTaken,
      "locked slap must hit a target placed on the sight's sim-yaw forward",
    ).toBeGreaterThan(0);
  });
});
