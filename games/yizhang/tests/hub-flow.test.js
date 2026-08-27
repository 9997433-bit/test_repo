import { describe, expect, it } from "vitest";
import {
  applyKnockback,
  createMatch,
  getPlayer,
  getView,
  hasFloorUnder,
  playerInHub,
  step,
} from "../src/sim/index.js";
import { DT, input } from "./helpers.js";

function pedestalOf(state, gloveId) {
  const pedestal = state.hub.pedestals.find((item) => item.gloveId === gloveId);
  expect(pedestal, `大厅应展示 ${gloveId} 掌`).toBeDefined();
  return pedestal;
}

function placePlayer(player, x, z, y = 0, yaw = 0) {
  player.x = x;
  player.y = y;
  player.z = z;
  player.yaw = yaw;
  player.vx = 0;
  player.vy = 0;
  player.vz = 0;
  player.grounded = true;
}

function standBy(player, pedestal) {
  const inwardOffset = pedestal.x < 0 ? 1.4 : -1.4;
  placePlayer(player, pedestal.x + inwardOffset, pedestal.z);
}

function hubMatch(options = {}) {
  return createMatch({
    seed: 0x485542,
    botCount: 0,
    ...options,
  });
}

describe("安全区大厅确定性流程", () => {
  it("靠近时聚焦展掌，interact 上升沿依次装备主掌和副掌", () => {
    const state = hubMatch({ unlocked: ["cotton", "frost", "magnet"] });
    const player = getPlayer(state, "p0");
    const frost = pedestalOf(state, "frost");
    const magnet = pedestalOf(state, "magnet");

    standBy(player, frost);
    step(state, { p0: input() }, DT);
    expect(getView(state).hub.focusGloveId).toBe("frost");
    expect(getView(state).hub.portalReady).toBe(false);

    step(state, { p0: input({ interact: true }) }, DT);
    expect(player.gloveId).toBe("frost");
    expect(player.offhandId).toBe("frost");
    expect(getView(state).hub.portalReady).toBe(true);
    expect(state.events).toContainEqual(
      expect.objectContaining({
        type: "hubEquip",
        id: "p0",
        gloveId: "frost",
        slot: "main",
      }),
    );

    // 保持按键并走到另一座，不应把同一次按下重复消费成副掌装备。
    standBy(player, magnet);
    step(state, { p0: input({ interact: true }) }, DT);
    expect(getView(state).hub.focusGloveId).toBe("magnet");
    expect(player.offhandId).toBe("frost");

    step(state, { p0: input({ interact: false }) }, DT);
    step(state, { p0: input({ interact: true }) }, DT);
    expect(player.gloveId).toBe("frost");
    expect(player.offhandId).toBe("magnet");
    expect(state.events).toContainEqual(
      expect.objectContaining({
        type: "hubEquip",
        id: "p0",
        gloveId: "magnet",
        slot: "off",
      }),
    );
  });

  it("离开交互半径后取消聚焦，未解锁展掌拒绝装备", () => {
    const state = hubMatch();
    const player = getPlayer(state, "p0");
    const granite = pedestalOf(state, "granite");
    const loadoutBefore = {
      gloveId: player.gloveId,
      offhandId: player.offhandId,
      activeSlot: player.activeSlot,
    };

    expect(granite.unlocked).toBe(false);
    standBy(player, granite);
    step(state, { p0: input() }, DT);
    expect(getView(state).hub.focusGloveId).toBe("granite");

    step(state, { p0: input({ interact: true }) }, DT);
    expect({
      gloveId: player.gloveId,
      offhandId: player.offhandId,
      activeSlot: player.activeSlot,
    }).toEqual(loadoutBefore);
    expect(getView(state).hub.portalReady).toBe(false);
    expect(state.events.some((event) => event.type === "hubEquip")).toBe(false);

    const spawn = state.hub.layout.spawn;
    placePlayer(player, spawn.x, spawn.z);
    step(state, { p0: input({ interact: false }) }, DT);
    expect(getView(state).hub.focusGloveId).toBe(null);
  });

  it("选定主掌后穿过传送门，同一 tick 进入 arena 并落在岛上", () => {
    const state = hubMatch({ unlocked: ["cotton", "frost"] });
    const player = getPlayer(state, "p0");

    standBy(player, pedestalOf(state, "frost"));
    step(state, { p0: input({ interact: true }) }, DT);
    expect(getView(state).hub.portalReady).toBe(true);

    const portal = state.hub.layout.portal;
    placePlayer(player, portal.x, portal.z);
    step(state, { p0: input({ interact: false }) }, DT);

    expect(state.phase).toBe("arena");
    expect(getView(state).phase).toBe("arena");
    expect(playerInHub(state, player)).toBe(false);
    expect(player.alive).toBe(true);
    expect(Math.hypot(player.x, player.z)).toBeLessThan(state.config.arenaRadius);
    expect(hasFloorUnder(state, player.x, player.z)).toBe(true);
    expect(player.gloveId).toBe("frost");
  });

  it("hub 内免疫击退，持续受击也不会产生 KO", () => {
    const state = hubMatch({ botCount: 1 });
    const player = getPlayer(state, "p0");
    const bot = getPlayer(state, "b0");
    const start = { x: player.x, y: player.y, z: player.z };
    const koEvents = [];

    placePlayer(bot, player.x, player.z + 2, 0, 0);
    bot.invulnT = 0;
    player.invulnT = 0;
    expect(playerInHub(state, player)).toBe(true);
    expect(playerInHub(state, bot)).toBe(true);
    expect(applyKnockback(state, player, 80, 20, 0, "b0")).toBe(0);

    for (let frame = 0; frame < 180; frame += 1) {
      step(state, { b0: input({ slap: true, yaw: 0 }) }, DT);
      koEvents.push(...state.events.filter((event) => event.type === "ko"));
    }

    expect(player.alive).toBe(true);
    expect(player.deaths).toBe(0);
    expect(player.hitsTaken).toBe(0);
    expect(Math.hypot(player.vx, player.vz)).toBeLessThan(0.001);
    expect(player.x).toBeCloseTo(start.x, 6);
    expect(player.y).toBeCloseTo(start.y, 6);
    expect(player.z).toBeCloseTo(start.z, 6);
    expect(koEvents).toEqual([]);
  });
});
