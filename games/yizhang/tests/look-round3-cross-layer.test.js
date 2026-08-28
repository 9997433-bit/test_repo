import { afterEach, describe, expect, it } from "vitest";
import { Vector3 } from "../src/render/gfx.js";

import { feedLook } from "../src/core/look.js";
import { cameraYawToSimYaw } from "../src/core/view.js";
import { createInput } from "../src/input/index.js";
import { createCamera } from "../src/render/camera.js";
import { YizhangRenderer } from "../src/render/renderer.js";
import {
  createMatch,
  forwardX,
  forwardZ,
  getPlayer,
  step,
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

function inputHarness(lookMode, opts = {}) {
  const doc = fakeNode();
  const canvas = fakeNode();
  const win = fakeNode();
  globalThis.window = win;
  const input = createInput(doc, canvas, {
    phase: "arena",
    pointerLock: false,
    lookMode,
    ...opts,
  });
  liveInputs.push(input);
  return { input, canvas, win };
}

function park(player, { x = 0, z = 0, yaw = 0 } = {}) {
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

function lookOnlyRenderer() {
  const renderer = Object.create(YizhangRenderer.prototype);
  renderer.cameraRig = createCamera({});
  renderer.lookPitch = null;
  renderer.lookYaw = null;
  renderer.lookMode = "locked";
  return renderer;
}

function cameraForward(renderer, player, frames = 420) {
  const focus = new Vector3(player.x, player.y, player.z);
  const velocity = new Vector3(player.vx, 0, player.vz);
  for (let frame = 0; frame < frames; frame += 1) {
    renderer.cameraRig.update(
      DT,
      focus,
      renderer._followYaw(player),
      velocity,
      { pitchBias: renderer._pitchBias() },
    );
  }
  const direction = new Vector3();
  renderer.cameraRig.camera.getWorldDirection(direction);
  const horizontalLength = Math.hypot(direction.x, direction.z);
  return { x: direction.x / horizontalLength, z: direction.z / horizontalLength };
}

function angleBetween(a, b) {
  const dot = a.x * b.x + a.z * b.z;
  const lengths = Math.hypot(a.x, a.z) * Math.hypot(b.x, b.z);
  return Math.acos(Math.max(-1, Math.min(1, dot / lengths)));
}

afterEach(() => {
  for (const input of liveInputs.splice(0)) input.dispose();
  delete globalThis.window;
});

describe("Round 3 look cross-layer continuity", () => {
  it("switching lookMode preserves the moving sim trajectory without a position leap", () => {
    const cameraYaw = 0.43;
    const controlHarness = inputHarness("locked", { yaw: cameraYaw });
    const switchedHarness = inputHarness("locked", { yaw: cameraYaw });
    const controlState = createMatch({ seed: 0x473201, botCount: 0, phase: "arena" });
    const switchedState = createMatch({ seed: 0x473201, botCount: 0, phase: "arena" });
    const controlPlayer = getPlayer(controlState, "p0");
    const switchedPlayer = getPlayer(switchedState, "p0");

    controlHarness.win.emit("keydown", { code: "KeyD" });
    switchedHarness.win.emit("keydown", { code: "KeyD" });
    for (let frame = 0; frame < 20; frame += 1) {
      step(controlState, { p0: controlHarness.input.sample() }, DT);
      step(switchedState, { p0: switchedHarness.input.sample() }, DT);
    }

    const atToggle = { x: switchedPlayer.x, y: switchedPlayer.y, z: switchedPlayer.z };
    switchedHarness.win.emit("keydown", { code: "KeyV" });
    expect(switchedHarness.input.getLookMode()).toBe("free");
    expect({ x: switchedPlayer.x, y: switchedPlayer.y, z: switchedPlayer.z }).toEqual(atToggle);

    for (let frame = 0; frame < 30; frame += 1) {
      const before = { x: switchedPlayer.x, z: switchedPlayer.z };
      step(controlState, { p0: controlHarness.input.sample() }, DT);
      step(switchedState, { p0: switchedHarness.input.sample() }, DT);

      expect(
        Math.hypot(switchedPlayer.x - before.x, switchedPlayer.z - before.z),
        "a look-mode-only transition must not teleport the sim player",
      ).toBeLessThan(0.25);
      expect(switchedPlayer.x).toBeCloseTo(controlPlayer.x, 12);
      expect(switchedPlayer.y).toBeCloseTo(controlPlayer.y, 12);
      expect(switchedPlayer.z).toBeCloseTo(controlPlayer.z, 12);
      expect(switchedPlayer.vx).toBeCloseTo(controlPlayer.vx, 12);
      expect(switchedPlayer.vz).toBeCloseTo(controlPlayer.vz, 12);
    }
  });

  it("uses the real locked camera sightline as the slap forward after a runtime mode switch", () => {
    const cameraYaw = 0.61;
    const expectedYaw = cameraYawToSimYaw(cameraYaw);
    const { input } = inputHarness("free", { yaw: cameraYaw });
    const state = createMatch({ seed: 0x473202, botCount: 1, phase: "arena" });
    const attacker = getPlayer(state, "p0");
    const target = getPlayer(state, "b0");
    park(attacker, { yaw: expectedYaw + Math.PI });
    park(target, { x: 8, z: 8, yaw: expectedYaw + Math.PI });

    input.toggleLookMode();
    expect(input.getLookMode()).toBe("locked");
    step(state, { p0: input.sample() }, DT);
    expect(attacker.yaw).toBe(expectedYaw);

    const renderer = lookOnlyRenderer();
    feedLook(renderer, input.getLook());
    expect(renderer.getLookMode()).toBe("locked");
    const sightline = cameraForward(renderer, attacker);
    const distance = 2.2;
    target.x = attacker.x + sightline.x * distance;
    target.y = attacker.y;
    target.z = attacker.z + sightline.z * distance;

    expect(
      angleBetween(sightline, {
        x: forwardX(attacker.yaw),
        z: forwardZ(attacker.yaw),
      }),
    ).toBeLessThan(0.03);

    input.setTouchButton("slap", true);
    const hits = [];
    for (let frame = 0; frame < 60 && hits.length === 0; frame += 1) {
      step(state, { p0: input.sample() }, DT);
      hits.push(...state.events.filter((event) => event.type === "hit" && event.id === attacker.id));
    }

    expect(hits[0]?.targetId, "locked slap must hit the target on the camera sightline").toBe(
      target.id,
    );
  });

  it("keeps p.yaw fixed while a stationary free camera rotates", () => {
    const { input, canvas, win } = inputHarness("free", { yaw: -0.82, pitch: 0 });
    const state = createMatch({ seed: 0x473203, botCount: 0, phase: "arena" });
    const player = getPlayer(state, "p0");
    const originalYaw = 0.91;
    park(player, { yaw: originalYaw });

    const renderer = lookOnlyRenderer();
    feedLook(renderer, input.getLook());
    const before = cameraForward(renderer, player);
    const originalPosition = { x: player.x, y: player.y, z: player.z };

    canvas.emit("mousedown", { button: 2 });
    for (let frame = 0; frame < 12; frame += 1) {
      win.emit("mousemove", { movementX: 50, movementY: 0 });
      feedLook(renderer, input.getLook());
      const sampled = input.sample();
      expect(Math.hypot(sampled.moveX, sampled.moveZ)).toBe(0);
      expect(sampled.yaw).toBeNull();
      step(state, { p0: sampled }, DT);
      expect(player.yaw).toBe(originalYaw);
    }
    win.emit("mouseup", { button: 2 });

    const after = cameraForward(renderer, player);
    expect(angleBetween(before, after)).toBeGreaterThan(1);
    expect(player.yaw).toBe(originalYaw);
    expect({ x: player.x, y: player.y, z: player.z }).toEqual(originalPosition);
  });
});
