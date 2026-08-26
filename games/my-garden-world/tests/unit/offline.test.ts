import { describe, expect, it } from "vitest";
import { WATER_CAP, createInitialState, type ActiveOrder, type GameState } from "../../src/engine/state";
import { tickGarden } from "../../src/systems/garden";
import {
  OFFLINE_GROWTH_CAP_MS,
  OFFLINE_MIN_MS,
  formatAway,
  settleOffline,
} from "../../src/systems/offline";
import { plant, waterPlot } from "../../src/systems/planting";

const T0 = 1_000_000;

function makeOrder(state: GameState, dueIn: number): ActiveOrder {
  return {
    uid: "off-1",
    templateId: "t",
    kind: "resident",
    title: "测试订单",
    hint: "",
    dueAt: state.now + dueIn,
    coin: 10,
    exp: 5,
    waterReward: 2,
    flowerIds: ["daisy"],
    flowerCount: 1,
  };
}

describe("settleOffline", () => {
  it("ignores short gaps and clock skew", () => {
    const s = createInitialState(T0);
    expect(settleOffline(s, s.now + OFFLINE_MIN_MS - 1)).toBeNull();
    expect(settleOffline(s, s.now - 5_000)).toBeNull();
    expect(s.now).toBe(T0);
  });

  it("refills water by away time, capped at WATER_CAP", () => {
    const s = createInitialState(T0);
    s.water = 0;
    s.waterAcc = 0;
    const r = settleOffline(s, s.now + 10 * 60_000);
    expect(r?.waterGained).toBe(WATER_CAP);
    expect(s.water).toBe(WATER_CAP);

    const s2 = createInitialState(T0);
    s2.water = 0;
    s2.waterAcc = 0;
    const r2 = settleOffline(s2, s2.now + 80_000);
    expect(r2?.waterGained).toBe(10);
  });

  it("advances a watered plot exactly one stage without auto-water", () => {
    const s = createInitialState(T0);
    expect(plant(s, 0, "daisy")).toBe(true);
    expect(waterPlot(s, 0)).toBe(true);
    const wall = s.now + 10 * 60_000;
    const r = settleOffline(s, wall);
    expect(r?.stageAdvances).toBe(1);
    expect(r?.bloomed).toEqual([]);
    expect(s.plots[0]?.stage).toBe("sprout");
    expect(s.plots[0]?.watered).toBe(0);
    expect(s.plots[0]?.lastTick).toBe(wall);
    expect(s.now).toBe(wall);
  });

  it("keeps partial progress when the away time is shorter than the stage", () => {
    const s = createInitialState(T0);
    const plot = s.plots[0]!;
    plot.flowerId = "dream-rose"; // 冬花在春 0.75×：单段需 33333ms
    plot.stage = "seeded";
    plot.watered = 3;
    plot.lastTick = s.now;
    const wall = s.now + 31_000;
    const r = settleOffline(s, wall);
    expect(r?.stageAdvances).toBe(0);
    expect(plot.stage).toBe("seeded");
    expect(wall - plot.lastTick).toBe(31_000);
  });

  it("auto-water spirits carry growth through to bloom while away", () => {
    const s = createInitialState(T0);
    s.unlockedSpirits = ["chiguang"];
    s.activeSpirit = "chiguang";
    expect(plant(s, 0, "daisy")).toBe(true);
    const wall = s.now + 10 * 60_000;
    const r = settleOffline(s, wall);
    expect(s.plots[0]?.stage).toBe("bloom");
    expect(r?.stageAdvances).toBe(3);
    expect(r?.bloomed).toEqual(["daisy"]);
    // 离线盛放的花回来时不许立刻枯：宽限从回归时刻重新起算
    tickGarden(s, 16);
    expect(s.plots[0]?.stage).toBe("bloom");
  });

  it("never wilts a bloom while away and grants a grace window on return", () => {
    const s = createInitialState(T0);
    const plot = s.plots[0]!;
    plot.flowerId = "daisy";
    plot.stage = "bloom";
    plot.watered = 1;
    plot.lastTick = s.now - 10_000;
    const wall = s.now + 60 * 60_000;
    settleOffline(s, wall);
    expect(plot.stage).toBe("bloom");
    tickGarden(s, 16);
    expect(plot.stage).toBe("bloom");
    // 回归后正常规则恢复：闲置超过 1.8 个花期仍会枯
    s.now = plot.lastTick + 18_000 * 1.8 + 1;
    tickGarden(s, 16);
    expect(plot.stage).toBe("wilt");
  });

  it("pauses order timers instead of expiring them", () => {
    const s = createInitialState(T0);
    const order = makeOrder(s, 50_000);
    s.orders = [order];
    const away = 8 * 60_000;
    const wall = s.now + away;
    settleOffline(s, wall);
    expect(order.dueAt).toBe(wall + 50_000);
  });

  it("caps settled growth time while reporting the full away duration", () => {
    const s = createInitialState(T0);
    const away = 10 * 60 * 60_000;
    const r = settleOffline(s, s.now + away);
    expect(r?.awayMs).toBe(away);
    expect(r?.settledMs).toBe(OFFLINE_GROWTH_CAP_MS);
  });
});

describe("formatAway", () => {
  it("formats minutes and hours in Chinese", () => {
    expect(formatAway(5 * 60_000)).toBe("5 分钟");
    expect(formatAway(90 * 60_000)).toBe("1 时 30 分");
    expect(formatAway(120 * 60_000)).toBe("2 时");
  });
});
