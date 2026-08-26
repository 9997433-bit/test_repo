import { describe, expect, it } from "vitest";
import { createTicker } from "../src/core/loop.js";

describe("fixed-step ticker", () => {
  it("converts elapsed time into whole ticks", () => {
    const t = createTicker(200);
    expect(t.advance(0)).toBe(0); // 初始化基准
    expect(t.advance(600)).toBe(3);
    expect(t.advance(700)).toBe(0); // 累积 100ms
    expect(t.advance(1000)).toBe(2); // 100 + 300 = 400ms
  });
  it("clamps huge gaps (tab suspend) instead of avalanching", () => {
    const t = createTicker(200, 1000);
    t.advance(0);
    expect(t.advance(60000)).toBe(5); // 最多补 1000ms = 5 tick
  });
  it("ignores clock going backwards", () => {
    const t = createTicker(200);
    t.advance(1000);
    expect(t.advance(500)).toBe(0);
    expect(t.advance(900)).toBe(2);
  });
  it("reset clears accumulated time", () => {
    const t = createTicker(200);
    t.advance(0);
    t.advance(150);
    t.reset();
    expect(t.advance(100)).toBe(0);
    expect(t.advance(150)).toBe(0);
    expect(t.advance(300)).toBe(1);
  });
});
