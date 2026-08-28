// @vitest-environment node

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as data from "../src/data/index.js";
import * as sim from "../src/sim/index.js";

const ARMORS = ["shell", "shield", "swarm"];
const TOWER_IDS = ["rail", "prism", "scatter", "well", "star"];

function viewOf(match) {
  const view = sim.getView(match);
  expect(view).toBeTypeOf("object");
  expect(view).not.toBeNull();
  return view;
}

function expectJsonPure(value) {
  let encoded;
  expect(() => {
    encoded = JSON.stringify(value);
  }).not.toThrow();
  expect(encoded).toBeTypeOf("string");
  expect(JSON.parse(encoded)).toEqual(value);

  const pending = [value];
  const visited = new Set();
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === null || typeof current !== "object" || visited.has(current)) {
      continue;
    }
    visited.add(current);
    expect(current.constructor?.name).not.toBe("Vector3");
    pending.push(...Object.values(current));
  }
}

function advance(match, count, dtSec = 0.1) {
  const events = [];
  for (let i = 0; i < count; i += 1) {
    const result = sim.step(match, {}, dtSec);
    expect(result).toMatchObject({ events: expect.any(Array) });
    events.push(...result.events);
  }
  return events;
}

function enemyPositions(view) {
  return view.enemies.map(({ id, lane, radius, y, x, z }) => ({
    id,
    lane,
    radius,
    y,
    ...(x === undefined ? {} : { x }),
    ...(z === undefined ? {} : { z }),
  }));
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:[cm]?js|ts)$/.test(entry.name) ? [path] : [];
  });
}

describe("pure simulation contract", () => {
  it("exports createMatch, step, and getView and returns a JSON-pure view", () => {
    expect(sim.createMatch).toBeTypeOf("function");
    expect(sim.step).toBeTypeOf("function");
    expect(sim.getView).toBeTypeOf("function");

    const match = sim.createMatch(0x51a7);
    expectJsonPure(viewOf(match));
  });

  it("creates exactly 24 indexed sockets", () => {
    const view = viewOf(sim.createMatch(24));

    expect(view.sockets).toHaveLength(24);
    expect(view.sockets.map((socket) => socket.i)).toEqual(
      Array.from({ length: 24 }, (_, index) => index),
    );
  });

  it("spends scrap and fills the requested socket when placing a tower", () => {
    const match = sim.createMatch(101);
    const before = viewOf(match);
    const result = sim.step(
      match,
      { place: { socket: 0, towerId: "rail" } },
      1 / 60,
    );
    const after = viewOf(match);

    expect(after.scrap).toBeLessThan(before.scrap);
    expect(after.sockets[0].towerId).toBe("rail");
    expect(result.events).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "place" })]),
    );
  });

  it("produces identical enemy ids and positions for the same seed", () => {
    const first = sim.createMatch(0x5eed);
    const second = sim.createMatch(0x5eed);
    let firstView = viewOf(first);
    let secondView = viewOf(second);

    // Fixed 1/60 steps avoid coupling determinism to a large dt. The frozen
    // Round 2 spawn contract requires an enemy to be visible within 2 seconds.
    for (let step = 0; step < 120 && firstView.enemies.length === 0; step += 1) {
      sim.step(first, {}, 1 / 60);
      sim.step(second, {}, 1 / 60);
      firstView = viewOf(first);
      secondView = viewOf(second);
      expect(secondView).toEqual(firstView);
    }

    const firstEnemies = enemyPositions(firstView);
    const secondEnemies = enemyPositions(secondView);
    expect(firstEnemies.length).toBeGreaterThan(0);
    expect(secondEnemies).toEqual(firstEnemies);
  });

  it("reduces coreHp when an enemy leaks", () => {
    const match = sim.createMatch(0x1ea5);
    const initialHp = viewOf(match).coreHp;
    let leakEvent;

    for (let i = 0; i < 1_200 && !leakEvent; i += 1) {
      const result = sim.step(match, {}, 0.1);
      expect(result).toMatchObject({ events: expect.any(Array) });
      leakEvent = result.events.find((event) => event.type === "leak");
    }

    expect(leakEvent).toBeDefined();
    expect(viewOf(match).coreHp).toBeLessThan(initialHp);
  });

  it("runs overclock before the four-second overheat transition", () => {
    const match = sim.createMatch(0xc10c);
    sim.step(
      match,
      { place: { socket: 0, towerId: "rail" } },
      1 / 60,
    );

    const activation = sim.step(match, { overclockSocket: 0 }, 1 / 60);
    const activeSocket = viewOf(match).sockets[0];
    expect(activation.events).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "overclock" })]),
    );
    expect(activeSocket.overclockT).toBeGreaterThan(0);
    expect(activeSocket.overheatT).toBe(0);

    const earlyEvents = advance(match, 39);
    expect(earlyEvents.some((event) => event.type === "overheat")).toBe(false);

    const transitionEvents = advance(match, 2);
    const overheatedSocket = viewOf(match).sockets[0];
    expect(transitionEvents).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "overheat" })]),
    );
    expect(overheatedSocket.overclockT).toBe(0);
    expect(overheatedSocket.overheatT).toBeGreaterThan(0);

    advance(match, 31);
    const cooledSocket = viewOf(match).sockets[0];
    expect(cooledSocket.overclockT).toBe(0);
    expect(cooledSocket.overheatT).toBe(0);
  });
});

describe("data contract", () => {
  it("returns a positive finite multiplier for every tower/armor pair when exported", () => {
    if (!Object.hasOwn(data, "armorMultiplier")) return;

    expect(data.armorMultiplier).toBeTypeOf("function");
    const values = TOWER_IDS.flatMap((towerId) =>
      ARMORS.map((armor) => data.armorMultiplier(towerId, armor)),
    );

    for (const value of values) {
      expect(value).toBeTypeOf("number");
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
    expect(new Set(values).size).toBeGreaterThan(1);
  });
});

describe("simulation isolation", () => {
  it("keeps every sim and data source free of Babylon and DOM access", () => {
    const roots = [
      fileURLToPath(new URL("../src/sim", import.meta.url)),
      fileURLToPath(new URL("../src/data", import.meta.url)),
    ];

    for (const file of roots.flatMap(sourceFiles)) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/@babylonjs|\bBABYLON\b|\bdocument\b/);
    }
  });
});
