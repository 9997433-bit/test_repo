import { afterEach, describe, expect, it, vi } from "vitest";
import { createTuning, tableFrom } from "./tuning.js";

afterEach(() => {
  vi.doUnmock("../data/waves.js");
  vi.doUnmock("../data/units.js");
  vi.resetModules();
});

const DEFAULTS = { enabled: true, count: 2, glyph: "援" };

describe("createTuning", () => {
  it("layers a data table on top of the module defaults", () => {
    const t = createTuning({ defaults: DEFAULTS, table: { count: 7 } });
    expect(t.read()).toEqual({ enabled: true, count: 7, glyph: "援" });
  });

  it("drops unknown keys, mismatched types and non-finite numbers", () => {
    const t = createTuning({
      defaults: DEFAULTS,
      table: { count: "7", enabled: 1, glyph: 5, nope: 3, extra: true },
    });
    expect(t.read()).toEqual(DEFAULTS);
    t.patch({ count: Number.NaN });
    t.patch({ count: Number.POSITIVE_INFINITY });
    expect(t.read().count).toBe(2);
  });

  it("coerces both the table and later runtime patches", () => {
    const t = createTuning({
      defaults: DEFAULTS,
      table: { count: -4 },
      coerce: { count: (v) => Math.max(1, v) },
    });
    expect(t.read().count).toBe(1);
    expect(t.patch({ count: -9 }).count).toBe(1);
  });

  it("reset() drops runtime patches but keeps the data table", () => {
    const t = createTuning({ defaults: DEFAULTS, table: { count: 7 } });
    t.patch({ count: 99, enabled: false });
    expect(t.read()).toMatchObject({ count: 99, enabled: false });
    expect(t.reset()).toEqual({ enabled: true, count: 7, glyph: "援" });
    expect(t.baseline()).toEqual({ enabled: true, count: 7, glyph: "援" });
  });

  it("exposes a stable live object for hot loops", () => {
    const t = createTuning({ defaults: DEFAULTS });
    const live = t.live;
    t.patch({ count: 42 });
    expect(live.count).toBe(42);
  });

  it("tableFrom picks the first table-shaped export it finds", () => {
    const mod = { A: null, B: [1, 2], C: { x: 1 }, D: { y: 2 } };
    expect(tableFrom(mod, ["A", "B", "C", "D"])).toBe(mod.C);
    expect(tableFrom(mod, ["missing"])).toBeNull();
    expect(tableFrom(null, ["C"])).toBeNull();
  });
});

/**
 * data 表本轮不归战斗层改，所以覆盖钩子用 mock 验证：
 * 表里加上这些导出即可调参，不必再回来动战斗代码。
 */
describe("data tables can override combat constants", () => {
  it("reads pressure-wave constants from waves.PRESSURE", async () => {
    vi.doMock("../data/waves.js", async () => ({
      ...(await vi.importActual("../data/waves.js")),
      PRESSURE: { killsPerPressure: 2, glyph: "策", interval: 0.25, hpMul: 0.3 },
    }));

    const { pressureConfig, pressureSpec } = await import("./pressure.js");
    expect(pressureConfig()).toMatchObject({ killsPerPressure: 2, glyph: "策", hpMul: 0.3 });
    expect(pressureSpec(3).interval).toBe(0.25);
    // 表里没提到的键仍是战斗层默认值。
    expect(pressureConfig().perWaveCap).toBe(2);
  });

  it("reads the tower-damage compensation from waves.BALANCE", async () => {
    vi.doMock("../data/waves.js", async () => ({
      ...(await vi.importActual("../data/waves.js")),
      BALANCE: { towerDamage: 2 },
    }));

    const { balanceConfig } = await import("./sim.js");
    expect(balanceConfig().towerDamage).toBe(2);
  });

  it("reads reach constants from units.REACH, clamping the graze ring", async () => {
    vi.doMock("../data/units.js", async () => ({
      ...(await vi.importActual("../data/units.js")),
      REACH: { scale: 3, graze: 0.2 },
    }));

    const { reachConfig, reachOf, grazeOf } = await import("./geometry.js");
    expect(reachConfig()).toEqual({ scale: 3, pad: 0.55, graze: 1 });
    expect(reachOf(1)).toBeCloseTo(3.55, 5);
    expect(grazeOf(1)).toBeCloseTo(3.55, 5);
  });

  it("falls back to the built-in defaults while the tables export nothing", async () => {
    const { pressureConfig, resetPressure } = await import("./pressure.js");
    const { reachConfig } = await import("./geometry.js");
    const { balanceConfig } = await import("./sim.js");

    expect(pressureConfig()).toMatchObject({ enabled: true, killsPerPressure: 5, glyph: "援" });
    expect(reachConfig()).toEqual({ scale: 1.2, pad: 0.55, graze: 1.6 });
    expect(balanceConfig()).toEqual({ towerDamage: 1.35 });
    expect(resetPressure()).toEqual(pressureConfig());
  });
});
