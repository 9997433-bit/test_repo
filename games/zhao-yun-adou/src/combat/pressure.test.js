import { afterEach, describe, expect, it } from "vitest";
import { waveSpec } from "../data/waves.js";
import {
  configurePressure,
  linkArena,
  linkSides,
  notePressureKill,
  opponentOf,
  pressureConfig,
  sendPressure,
} from "./pressure.js";
import { checkWinner, tickSideCombat } from "./sim.js";
import { collect, makeArena, makeEnemy, makeSide } from "./testkit.js";

const DEFAULTS = pressureConfig();
afterEach(() => configurePressure(DEFAULTS));

describe("sendPressure", () => {
  it("queues a weaker extra enemy on the other side", () => {
    const a = makeSide("player");
    const b = makeSide("ai", { wave: 3 });
    const push = sendPressure(a, b);
    expect(push).toMatchObject({ from: "player", to: "ai", count: 1, wave: 3 });
    expect(b.spawnQueue).toHaveLength(1);
    expect(a.spawnQueue).toHaveLength(0);
    expect(b.spawnQueue[0].spec.hp).toBeLessThan(waveSpec(3).hp);
    expect(b.spawnQueue[0].spec.boss).toBeNull();
  });

  it("spawns that enemy flagged as pressure", () => {
    const a = makeSide("player");
    const b = makeSide("ai");
    sendPressure(a, b);
    tickSideCombat(b, 0.6, collect());
    expect(b.enemies).toHaveLength(1);
    expect(b.enemies[0].pressure).toBe(true);
    expect(b.enemies[0].glyph).toBe("援");
    expect(b.spawnQueue).toHaveLength(0);
  });

  it("respects the per-wave cap", () => {
    const a = makeSide("player");
    const b = makeSide("ai");
    configurePressure({ perWaveCap: 2 });
    expect(sendPressure(a, b)).not.toBeNull();
    expect(sendPressure(a, b)).not.toBeNull();
    expect(sendPressure(a, b)).toBeNull();
    b.wave = 2;
    expect(sendPressure(a, b)).not.toBeNull();
  });

  it("can be disabled and force-overridden", () => {
    const a = makeSide("player");
    const b = makeSide("ai");
    configurePressure({ enabled: false });
    expect(sendPressure(a, b)).toBeNull();
    expect(sendPressure(a, b, { force: true })).not.toBeNull();
  });

  it("falls back to the linked opponent when no target is passed", () => {
    const a = makeSide("player");
    const b = makeSide("ai");
    linkSides(a, b);
    expect(opponentOf(a)).toBe(b);
    expect(sendPressure(a)).toMatchObject({ to: "ai" });
    expect(b.spawnQueue).toHaveLength(1);
  });
});

describe("kill-driven pressure", () => {
  it("fires once the kill charge crosses the threshold", () => {
    const a = makeSide("player");
    const b = makeSide("ai");
    linkSides(a, b);
    configurePressure({ killsPerPressure: 5 });
    for (let i = 0; i < 4; i++) expect(notePressureKill(a, makeEnemy())).toBeNull();
    expect(notePressureKill(a, makeEnemy())).toMatchObject({ to: "ai" });
    expect(b.spawnQueue).toHaveLength(1);
  });

  it("counts a boss as several kills", () => {
    const a = makeSide("player");
    const b = makeSide("ai");
    linkSides(a, b);
    configurePressure({ killsPerPressure: 5, bossCharge: 3 });
    notePressureKill(a, makeEnemy({ boss: true }));
    notePressureKill(a, makeEnemy({ boss: true }));
    expect(b.spawnQueue).toHaveLength(1);
  });

  it("never ping-pongs off pressure enemies", () => {
    const a = makeSide("player");
    const b = makeSide("ai");
    linkSides(a, b);
    for (let i = 0; i < 50; i++) expect(notePressureKill(a, makeEnemy({ pressure: true }))).toBeNull();
    expect(a.pressureCharge || 0).toBe(0);
    expect(b.spawnQueue).toHaveLength(0);
  });
});

describe("arena hook without touching game.js", () => {
  it("links both sides from the state that checkWinner already receives", () => {
    const state = makeArena();
    expect(opponentOf(state.sides.player)).toBeNull();
    checkWinner(state, collect());
    expect(opponentOf(state.sides.player)).toBe(state.sides.ai);
    expect(opponentOf(state.sides.ai)).toBe(state.sides.player);
  });

  it("turns in-lane kills into pressure on the opposite lane", () => {
    const state = makeArena();
    linkArena(state);
    configurePressure({ killsPerPressure: 5 });
    const player = state.sides.player;
    for (let i = 0; i < 5; i++) player.enemies.push(makeEnemy({ hp: 0, t: 0.5 }));
    const emit = collect();
    tickSideCombat(player, 0.05, emit);
    expect(player.kills).toBe(5);
    expect(state.sides.ai.spawnQueue).toHaveLength(1);
    expect(emit.of("pressure")).toHaveLength(1);
    expect(emit.of("pressure")[0].payload.to).toBe("ai");
  });

  it("keeps waves finite: pressure cannot stall the wave clock forever", () => {
    const state = makeArena();
    linkArena(state);
    const player = state.sides.player;
    const ai = state.sides.ai;
    for (let i = 0; i < 40; i++) player.enemies.push(makeEnemy({ hp: 0 }));
    tickSideCombat(player, 0.05, collect());
    expect(ai.spawnQueue.length).toBeLessThanOrEqual(pressureConfig().perWaveCap);
  });
});
