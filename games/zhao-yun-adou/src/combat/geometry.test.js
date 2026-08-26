import { afterEach, describe, expect, it } from "vitest";
import { cellDistToPath } from "../board/grid.js";
import {
  cellAnchor,
  configureReach,
  coverageRatio,
  coverageWindows,
  distanceToProgress,
  inReach,
  reachConfig,
  reachOf,
} from "./geometry.js";

const DEFAULTS = reachConfig();
afterEach(() => configureReach(DEFAULTS));

describe("lane geometry", () => {
  it("maps range tiers to increasing reach and coverage", () => {
    expect(reachOf(1)).toBeLessThan(reachOf(2));
    expect(reachOf(2)).toBeLessThan(reachOf(3));
    expect(coverageRatio(7, 1)).toBeLessThan(coverageRatio(7, 2));
    expect(coverageRatio(9, 2)).toBeLessThan(coverageRatio(9, 3));
    expect(coverageRatio(7, 1)).toBeGreaterThan(0.1);
    expect(coverageRatio(9, 1)).toBeLessThan(0.75);
  });

  it("distinguishes cells that the old edge metric treated as identical", () => {
    // 5 / 9 / 10 在 cellDistToPath 里都是 0，旧判定对它们一视同仁。
    expect(cellDistToPath(5)).toBe(cellDistToPath(9));
    expect(cellDistToPath(9)).toBe(cellDistToPath(10));

    // 但它们守的是路线上完全不同的段落。
    expect(inReach(9, 0.35, 1)).toBe(true);
    expect(inReach(5, 0.35, 1)).toBe(false);
    expect(inReach(5, 0.75, 1)).toBe(true);
    expect(inReach(9, 0.75, 1)).toBe(false);
  });

  it("coverage windows agree with the per-point distance check", () => {
    const windows = coverageWindows(6, 1);
    expect(windows.length).toBeGreaterThan(1);
    for (const w of windows) {
      const mid = (w.from + w.to) / 2;
      expect(distanceToProgress(6, mid)).toBeLessThanOrEqual(reachOf(1) + 1e-6);
    }
    const gapStart = windows[0].to + (windows[1].from - windows[0].to) / 2;
    expect(distanceToProgress(6, gapStart)).toBeGreaterThan(reachOf(1));
  });

  it("anchors report the nearest lane progress for a cell", () => {
    const a = cellAnchor(9);
    expect(a.dist).toBeGreaterThanOrEqual(0);
    expect(distanceToProgress(9, a.t)).toBeCloseTo(a.dist, 5);
  });

  it("reach is tunable without touching the data tables", () => {
    const before = coverageRatio(9, 1);
    configureReach({ scale: 3, pad: 1 });
    expect(coverageRatio(9, 1)).toBeGreaterThan(before);
    expect(reachConfig().scale).toBe(3);
  });
});
