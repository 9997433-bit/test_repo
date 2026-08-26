import { describe, expect, it } from "vitest";
import { FLOWER_MAP } from "../../src/data/flowers";
import { onGameEvent, type GameEvent } from "../../src/engine/events";
import { OFFLINE_CAP_MS, applyOfflineCatchUp } from "../../src/engine/offline";
import { WATER_CAP, createInitialState, type GameState } from "../../src/engine/state";

const HOUR = 60 * 60 * 1000;

function seed(state: GameState, plotId: number, flowerId: string, watered: number): void {
  const plot = state.plots[plotId]!;
  plot.flowerId = flowerId;
  plot.stage = "seeded";
  plot.plantedAt = state.now;
  plot.lastTick = state.now;
  plot.watered = watered;
}

describe("offline catch-up", () => {
  it("treats a short gap as continuous play but still re-anchors the clock", () => {
    const state = createInitialState(0);
    const report = applyOfflineCatchUp(state, 3_000);

    expect(report.appliedMs).toBe(0);
    expect(state.now).toBe(0);
    expect(state.lastSeenAt).toBe(3_000);
  });

  it("refills water and pushes watered plots one stage forward", () => {
    const state = createInitialState(0);
    state.water = 0;
    state.waterAcc = 0;
    seed(state, 0, "daisy", FLOWER_MAP.daisy!.waterNeed);
    seed(state, 1, "daisy", 0);

    const report = applyOfflineCatchUp(state, 30 * 60_000);

    expect(report.appliedMs).toBe(30 * 60_000);
    expect(report.capped).toBe(false);
    expect(state.water).toBe(WATER_CAP);
    expect(report.water).toBe(WATER_CAP);
    // 浇过水的推进一段后停在缺水处；没浇水的原地不动
    expect(state.plots[0]?.stage).toBe("sprout");
    expect(state.plots[1]?.stage).toBe("seeded");
    expect(report.grown).toBe(1);
  });

  it("never wilts a bloom that was waiting while the gardener was away", () => {
    const state = createInitialState(0);
    const plot = state.plots[0]!;
    plot.flowerId = "daisy";
    plot.stage = "bloom";
    plot.lastTick = 0;

    applyOfflineCatchUp(state, 6 * HOUR);

    expect(state.plots[0]?.stage).toBe("bloom");
  });

  it("caps a long absence and does not pay the leftover out on the next resume", () => {
    const state = createInitialState(0);
    const first = applyOfflineCatchUp(state, 10 * HOUR);

    expect(first.appliedMs).toBe(OFFLINE_CAP_MS);
    expect(first.capped).toBe(true);
    expect(state.now).toBe(OFFLINE_CAP_MS);
    expect(state.lastSeenAt).toBe(10 * HOUR);

    const second = applyOfflineCatchUp(state, 10 * HOUR);
    expect(second.appliedMs).toBe(0);
    expect(state.now).toBe(OFFLINE_CAP_MS);
  });

  it("announces a meaningful absence once and stays quiet for a brief one", () => {
    const seen: GameEvent[] = [];
    const off = onGameEvent((e) => seen.push(e));
    try {
      const quiet = createInitialState(0);
      applyOfflineCatchUp(quiet, 20_000);
      expect(seen.filter((e) => e.type === "toast")).toHaveLength(0);

      const away = createInitialState(0);
      applyOfflineCatchUp(away, 3 * HOUR);
      const toasts = seen.filter((e) => e.type === "toast");
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({ type: "toast", tone: "ok" });
      expect((toasts[0] as { text: string }).text).toContain("离园");
    } finally {
      off();
    }
  });
});
