import { afterEach, describe, expect, it, vi } from "vitest";
import { Scene, Vector3 } from "../src/render/gfx.js";

import { feedLook, resolveLookMode } from "../src/core/look.js";
import { cameraYawToSimYaw } from "../src/core/view.js";
import { createInput } from "../src/input/index.js";
import { createCharacters, SLAP_PHASE } from "../src/render/characters.js";
import { QUALITY } from "../src/render/config.js";
import { readView } from "../src/render/view.js";
import {
  createMatch,
  forwardX,
  forwardZ,
  getPlayer,
  getView,
  playerInHub,
  step,
} from "../src/sim/index.js";
import { DT } from "./helpers.js";

function fakeNode() {
  const handlers = new Map();
  return {
    addEventListener(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      handlers.get(type)?.delete(fn);
    },
    emit(type, event = {}) {
      for (const fn of handlers.get(type) || []) {
        fn({ preventDefault() {}, ...event });
      }
    },
  };
}

const liveInputs = [];

function inputHarness(opts = {}) {
  const doc = fakeNode();
  doc.hidden = false;
  doc.pointerLockElement = null;
  const canvas = fakeNode();
  globalThis.window = fakeNode();
  const input = createInput(doc, canvas, { pointerLock: false, ...opts });
  liveInputs.push(input);
  return { input, canvas };
}

function fakeStorage(seed = null) {
  const entries = new Map();
  if (seed !== null) {
    entries.set(
      "yizhang-save-v1",
      typeof seed === "string" ? seed : JSON.stringify(seed),
    );
  }
  let writes = 0;
  return {
    getItem(key) {
      return entries.get(key) ?? null;
    },
    setItem(key, value) {
      writes += 1;
      entries.set(key, String(value));
    },
    removeItem(key) {
      entries.delete(key);
    },
    get writes() {
      return writes;
    },
    raw(key) {
      return entries.get(key) ?? null;
    },
  };
}

async function loadSaveFrom(seed) {
  const storage = fakeStorage(seed);
  globalThis.localStorage = storage;
  vi.resetModules();
  const { loadSave } = await import("../src/core/storage.js");
  return { save: loadSave(), storage };
}

function fakeTextures() {
  const materialMaps = () => ({ rough: null, normal: null, albedo: null });
  return {
    cloth: materialMaps(),
    leather: materialMaps(),
    metal: materialMaps(),
    dust: null,
    ember: null,
  };
}

afterEach(() => {
  for (const input of liveInputs.splice(0)) input.dispose();
  delete globalThis.window;
  delete globalThis.localStorage;
  vi.resetModules();
});

describe("Round 1 look cross-layer invariants", () => {
  it("feedLook hands setLook the same sim-space angle in yaw and simYaw", () => {
    const cameraYaw = 0;
    const renderer = { setLook: vi.fn() };

    feedLook(renderer, { yaw: cameraYaw, pitch: 0.25 });

    expect(renderer.setLook).toHaveBeenCalledTimes(1);
    const payload = renderer.setLook.mock.calls[0][0];
    expect(payload.yaw).toBe(payload.simYaw);
    expect(payload.simYaw).toBe(cameraYawToSimYaw(cameraYaw));
    expect(payload.yaw).not.toBe(cameraYaw);
  });

  it("resolves look mode as URL, then saved preference, then locked without writing URL overrides", async () => {
    const legacy = await loadSaveFrom({ version: 1, quality: "low" });
    expect(legacy.save.lookMode).toBe("locked");
    expect(resolveLookMode({ save: legacy.save })).toBe("locked");

    const persisted = await loadSaveFrom({ version: 1, lookMode: "free" });
    const before = persisted.storage.raw("yizhang-save-v1");
    expect(resolveLookMode({ save: persisted.save })).toBe("free");
    expect(
      resolveLookMode({
        url: new URL("https://example.test/?look=locked").searchParams.get("look"),
        save: persisted.save,
      }),
    ).toBe("locked");
    expect(
      resolveLookMode({
        url: new URL("https://example.test/?look=invalid").searchParams.get("look"),
        save: persisted.save,
      }),
    ).toBe("free");
    expect(persisted.storage.writes).toBe(0);
    expect(persisted.storage.raw("yizhang-save-v1")).toBe(before);
  });

  it("keeps locked input, sim player yaw, and camera-forward yaw equal in one tick", () => {
    const cameraYaw = 0.73;
    const { input } = inputHarness();
    input.setLook(cameraYaw, -0.2);

    expect(input.getLookMode()).toBe("locked");
    const sampled = input.sample();
    const state = createMatch({ seed: 0x473001, botCount: 0, phase: "arena" });
    const player = getPlayer(state, "p0");
    step(state, { p0: sampled }, DT);

    let cameraLook = null;
    feedLook(
      {
        setLook(payload) {
          cameraLook = payload;
        },
      },
      input.getLook(),
    );

    expect(sampled.yaw).toBe(cameraYawToSimYaw(cameraYaw));
    expect(player.yaw).toBe(sampled.yaw);
    expect(cameraLook.yaw).toBe(cameraLook.simYaw);
    expect(cameraLook.yaw).toBe(player.yaw);
    expect(forwardX(player.yaw)).toBeCloseTo(Math.cos(cameraYaw), 12);
    expect(forwardZ(player.yaw)).toBeCloseTo(Math.sin(cameraYaw), 12);
  });

  it("defaults to the hub and blocks even direct held-slap input from becoming a whiff", () => {
    const state = createMatch({ seed: 0x473002, botCount: 0 });
    const player = getPlayer(state, "p0");
    const { input } = inputHarness({ phase: state.phase });
    input.setTouchButton("slap", true);

    expect(state.phase).toBe("hub");
    expect(getView(state).phase).toBe("hub");
    expect(playerInHub(state, player)).toBe(true);
    expect(input.sample(0).slap).toBe(false);

    const combatEvents = [];
    for (let tick = 0; tick < 90; tick += 1) {
      step(state, { p0: { slap: true } }, DT);
      combatEvents.push(
        ...state.events.filter((event) =>
          ["slapStart", "slap", "hit"].includes(event.type),
        ),
      );
    }

    expect(combatEvents).toEqual([]);
    expect(state.stats.slaps).toBe(0);
    expect(player.attack.phase).toBe("idle");
  });
});

describe("Round 1 horizontal slap integration", () => {
  it("carries a sim slap-start through the render adapter into a laterally dominant strike", () => {
    const state = createMatch({
      seed: 0x473003,
      botCount: 0,
      phase: "arena",
    });
    const player = getPlayer(state, "p0");
    Object.assign(player, {
      x: 0,
      y: 0,
      z: 0,
      yaw: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      grounded: true,
    });

    const scene = new Scene();
    const characters = createCharacters({
      scene,
      quality: QUALITY.low,
      textures: fakeTextures(),
    });

    try {
      characters.reconcile(readView(getView(state)).players, "p0");
      step(state, { p0: { slap: true, yaw: 0 } }, DT);
      const renderView = readView(getView(state));
      characters.reconcile(renderView.players, renderView.localId);
      const swing = renderView.events.find((event) => event.kind === "swing");

      expect(swing).toMatchObject({ actorId: "p0", kind: "swing" });
      characters.playSlap(swing.actorId, swing.power);

      const character = characters.get("p0");
      const glove = character.arms.find((arm) => arm.side === 1).glove;
      const position = new Vector3();
      const strike = [];
      let time = 0;

      while (character.slapT >= 0) {
        time += 1 / 120;
        characters.update(1 / 120, time);
        character.rootGroup.updateMatrixWorld(true);
        if (
          character.slapT >= SLAP_PHASE.windupEnd &&
          character.slapT <= SLAP_PHASE.strikeEnd
        ) {
          strike.push(glove.getWorldPosition(position).clone());
        }
      }

      expect(strike.length).toBeGreaterThan(1);
      const travel = { x: 0, y: 0, z: 0 };
      for (let index = 1; index < strike.length; index += 1) {
        travel.x += Math.abs(strike[index].x - strike[index - 1].x);
        travel.y += Math.abs(strike[index].y - strike[index - 1].y);
        travel.z += Math.abs(strike[index].z - strike[index - 1].z);
      }
      expect(travel.x).toBeGreaterThan(travel.y);
      expect(travel.x).toBeGreaterThan(travel.z);
    } finally {
      characters.dispose();
    }
  });
});
