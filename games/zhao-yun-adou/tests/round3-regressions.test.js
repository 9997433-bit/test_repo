import { beforeEach, describe, expect, it } from "vitest";
import { createGame } from "../src/core/game.js";
import { CURRICULUM_ROLLS } from "../src/data/recruit.js";
import { resetPressure } from "../src/combat/pressure.js";

function enemy(overrides = {}) {
  return {
    id: 1,
    t: 0.5,
    hp: 100,
    maxHp: 100,
    speed: 0,
    reward: 3,
    boss: false,
    skill: null,
    stun: 0,
    slowT: 0,
    slowMul: 1,
    shield: 0,
    pressure: false,
    glyph: "兵",
    ...overrides,
  };
}

function capture(api, type) {
  const payloads = [];
  api.bus.on(type, (payload) => payloads.push(payload));
  return payloads;
}

function prepareRecruitPicker(api) {
  api.state.rng.weighted = (table) =>
    table.find(({ v }) => v.kind === "token")?.v ??
    table.find(({ v }) => v.kind === "glyph")?.v ??
    table[0].v;
  api.state.rng.pick = (items) => items[0];
}

function recruitAndDiscard(api, sideId = "player") {
  const side = api.state.sides[sideId];
  side.mantou = 1_000_000;
  const result = api.recruit(sideId);
  expect(result).not.toHaveProperty("error");
  side.hand.length = 0;
  return result.card;
}

beforeEach(() => {
  resetPressure();
});

describe("juice event payload contracts", () => {
  it("emits complete kill and leak payloads for the effects layer", () => {
    const api = createGame({ seed: 301 });
    api.start();
    const kills = capture(api, "kill");
    const leaks = capture(api, "leak");
    const side = api.state.sides.player;
    side.spawnQueue = [];
    side.enemies = [
      enemy({ id: 41, hp: 0, reward: 7, boss: true }),
      enemy({ id: 42, t: 1, hp: 25, maxHp: 25 }),
    ];

    api.tick(0.01);

    expect(kills).toEqual([
      {
        side: "player",
        reward: 7,
        boss: true,
        pressure: false,
        id: 41,
      },
    ]);
    expect(leaks).toEqual([
      {
        side: "player",
        hearts: 2,
        boss: false,
      },
    ]);
  });

  it("emits the complete skill summary and nested juice metadata", () => {
    const api = createGame({ seed: 302 });
    api.start();
    const skills = capture(api, "skill");
    const side = api.state.sides.player;
    side.spawnQueue = [];
    side.cells[9].unit = {
      kind: "hero",
      id: "huangzhong",
      glyph: "忠",
      level: 1,
      cd: 1,
      cooldown: 0,
    };
    side.enemies = [enemy({ id: 77, t: 0.35, hp: 500, maxHp: 500 })];

    api.tick(0.01);

    expect(skills).toHaveLength(1);
    expect(skills[0]).toMatchObject({
      side: "player",
      hero: "黄忠",
      skill: "百步穿杨",
      fx: "arrow-rain",
      hits: 1,
      kills: 0,
      targets: [77],
      cellIndex: 9,
      juice: {
        shake: 0.25,
        color: "#6b7a6a",
        sfx: "twang",
        duration: 0.9,
        focusT: 0.35,
        shape: "rain",
        text: "百步穿杨",
      },
    });
    expect(skills[0].damage).toBeGreaterThan(0);
    expect(skills[0].cooldown).toBeGreaterThan(0);
    expect(Object.keys(skills[0])).toEqual([
      "side",
      "hero",
      "skill",
      "fx",
      "hits",
      "damage",
      "kills",
      "targets",
      "cooldown",
      "cellIndex",
      "juice",
    ]);
  });
});

describe("pressure persistence", () => {
  it("continues saved kill charge and emits pressure on the next qualifying kill", () => {
    const source = createGame({ seed: 303 });
    source.start();
    source.tick(0.01);
    source.state.sides.player.enemies.push(
      ...Array.from({ length: 4 }, (_, index) =>
        enemy({ id: 100 + index, hp: 0, reward: 0 }),
      ),
    );
    source.tick(0.01);
    expect(source.state.sides.player.pressureCharge).toBe(4);

    const snapshot = source.serialize({ replay: true });
    const restored = createGame({ seed: 999 });
    expect(restored.load(snapshot, { silent: true })).toBe(true);
    const pressure = capture(restored, "pressure");
    restored.tick(0.01);
    restored.state.sides.player.enemies.push(enemy({ id: 104, hp: 0, reward: 0 }));

    restored.tick(0.01);

    expect(pressure).toEqual([
      {
        from: "player",
        to: "ai",
        count: 1,
        wave: 1,
        hp: expect.any(Number),
      },
    ]);
    expect(restored.state.sides.player.pressureCharge).toBe(0);
    expect(restored.state.sides.ai.spawnQueue.at(-1)).toMatchObject({
      remain: 1,
      pressure: true,
      extra: {
        pressure: true,
        glyph: "援",
      },
    });
  });
});

describe("recruit curriculum lifecycle", () => {
  it("restores the saved curriculum phase when loading a game", () => {
    const source = createGame({ seed: 304 });
    source.start();
    prepareRecruitPicker(source);
    for (let i = 0; i < CURRICULUM_ROLLS - 1; i += 1) recruitAndDiscard(source);
    const snapshot = source.serialize({ replay: true });

    const restored = createGame({ seed: 999 });
    prepareRecruitPicker(restored);
    expect(restored.load(snapshot, { silent: true })).toBe(true);

    expect(recruitAndDiscard(restored).kind).toBe("glyph");
    expect(recruitAndDiscard(restored).kind).toBe("token");
  });

  it("resets the curriculum phase when restarting the same game", () => {
    const api = createGame({ seed: 305 });
    api.start();
    prepareRecruitPicker(api);
    for (let i = 0; i < CURRICULUM_ROLLS; i += 1) recruitAndDiscard(api);
    expect(recruitAndDiscard(api).kind).toBe("token");

    expect(api.restart()).toBe(true);

    expect(recruitAndDiscard(api).kind).toBe("glyph");
  });
});
