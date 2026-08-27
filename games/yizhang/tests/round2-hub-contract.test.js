import { describe, expect, it } from "vitest";

import { ENTRY, resolveEntry } from "../src/core/entry.js";
import {
  createMatch,
  getPlayer,
  getView,
  playerInHub,
  step,
} from "../src/sim/index.js";
import { DT, input } from "./helpers.js";

function playerView(state, id = "p0") {
  return getView(state).players.find((player) => player.id === id);
}

function placeOnArena(player) {
  player.x = 0;
  player.y = 0;
  player.z = 0;
  player.yaw = 0;
  player.vx = 0;
  player.vy = 0;
  player.vz = 0;
  player.grounded = true;
}

describe("Round 2 hub combat boundary", () => {
  it("blocks held combat controls in the default hub without counting empty slaps", () => {
    const state = createMatch({
      seed: 0x52324731,
      botCount: 0,
      gloveId: "afterimage",
    });
    const player = getPlayer(state, "p0");
    const combatEvents = [];

    expect(state.phase).toBe("hub");
    expect(playerInHub(state, player)).toBe(true);

    for (let tick = 0; tick < 180; tick += 1) {
      step(
        state,
        { p0: input({ slap: true, skill: true, dash: true }) },
        DT,
      );
      combatEvents.push(
        ...state.events.filter((event) =>
          ["slapStart", "slap", "skill", "dash"].includes(event.type),
        ),
      );
    }

    expect(combatEvents).toEqual([]);
    expect(state.stats.slaps).toBe(0);
    expect(player.attack.phase).toBe("idle");
    expect(player.slapCd).toBe(0);
    expect(player.skillCd).toBe(0);
    expect(player.dashCd).toBe(0);
    expect(getView(state).combat.ghosts).toEqual([]);
  });

  it("allows a hub-phase player teleported onto the arena disk to slap", () => {
    const state = createMatch({ seed: 0x52324732, botCount: 0 });
    const player = getPlayer(state, "p0");
    const eventTypes = [];

    placeOnArena(player);
    expect(state.phase).toBe("hub");
    expect(playerInHub(state, player)).toBe(false);

    for (let tick = 0; tick < 30; tick += 1) {
      step(state, { p0: input({ slap: true }) }, DT);
      eventTypes.push(...state.events.map((event) => event.type));
    }

    expect(state.phase).toBe("hub");
    expect(eventTypes).toContain("slapStart");
    expect(state.stats.slaps).toBeGreaterThan(0);
  });
});

describe("Round 2 public view fields", () => {
  it("exports p0 skinId and uses null when the option is absent", () => {
    const skinned = createMatch({
      seed: 0x52324733,
      botCount: 0,
      skinId: "wildhorn",
    });
    const unskinned = createMatch({ seed: 0x52324734, botCount: 0 });

    expect(playerView(skinned).skinId).toBe("wildhorn");
    expect(playerView(unskinned).skinId).toBeNull();
  });

  it("always exports ghosts and exposes a real afterimage skill spawn", () => {
    const state = createMatch({
      seed: 0x52324735,
      botCount: 1,
      phase: "arena",
      gloveId: "afterimage",
      unlocked: "all",
    });
    const player = getPlayer(state, "p0");
    const target = getPlayer(state, "b0");

    placeOnArena(player);
    placeOnArena(target);
    target.z = -3;
    target.yaw = Math.PI;

    expect(getView(state).combat.ghosts).toEqual([]);

    let spawned = [];
    for (let tick = 0; tick < 12 && spawned.length === 0; tick += 1) {
      step(
        state,
        { p0: input({ skill: tick === 0 }) },
        DT,
      );
      spawned = getView(state).combat.ghosts;
    }

    expect(spawned.length).toBeGreaterThan(0);
    expect(spawned).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ownerId: "p0",
          ttl0: expect.any(Number),
        }),
      ]),
    );
    expect(spawned.every((ghost) => ghost.ttl0 > 0)).toBe(true);

    for (let tick = 0; tick < 240; tick += 1) {
      step(state, {}, DT);
    }
    expect(getView(state).combat.ghosts).toEqual([]);
  });
});

describe("Round 2 result entry routing", () => {
  it("restarts on the arena while the return route goes to the hub", () => {
    const context = {
      lastLoadout: {
        main: "afterimage",
        off: "magnet",
        skinId: "wildhorn",
      },
    };
    const restart = resolveEntry(ENTRY.RESTART, context);
    const hubReturn = resolveEntry(ENTRY.HUB, context);

    expect(restart).toMatchObject({
      kind: ENTRY.RESTART,
      skipHub: true,
      main: "afterimage",
      off: "magnet",
      skinId: "wildhorn",
    });
    expect(hubReturn).toMatchObject({
      kind: ENTRY.HUB,
      skipHub: false,
      main: restart.main,
      off: restart.off,
      skinId: restart.skinId,
    });

    const restartState = createMatch({
      seed: 0x52324736,
      botCount: 0,
      skipHub: restart.skipHub,
    });
    const hubState = createMatch({
      seed: 0x52324737,
      botCount: 0,
      skipHub: hubReturn.skipHub,
    });

    expect(getView(restartState).phase).toBe("arena");
    expect(getView(hubState).phase).toBe("hub");
  });
});
