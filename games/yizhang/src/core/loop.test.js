// 主循环的命中定格：停 step、不停 draw、不补帧。
// 测试环境是 node，这里给一套最小的 rAF/时钟替身，手动推帧。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLoop } from "./loop.js";

function stubFrameClock() {
  let seconds = 0;
  let pending = null;

  vi.stubGlobal("performance", { now: () => seconds * 1000 });
  vi.stubGlobal("requestAnimationFrame", (cb) => {
    pending = cb;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    pending = null;
  });
  vi.stubGlobal("document", {
    hidden: false,
    addEventListener() {},
    removeEventListener() {},
  });
  vi.stubGlobal("window", { addEventListener() {}, removeEventListener() {} });

  return {
    now: () => seconds,
    /** 推进 dt 秒并跑一帧 */
    tick(dt) {
      seconds += dt;
      const cb = pending;
      pending = null;
      if (cb) cb(seconds * 1000);
    },
  };
}

describe("createLoop 命中定格", () => {
  let clock;
  let steps;
  let draws;
  let loop;

  beforeEach(() => {
    clock = stubFrameClock();
    steps = 0;
    draws = [];
    loop = createLoop({
      dt: 1 / 60,
      step: () => {
        steps += 1;
      },
      draw: (alpha, info) => {
        draws.push(info);
      },
    });
    loop.start();
  });

  afterEach(() => {
    loop.stop();
    vi.unstubAllGlobals();
  });

  it("定格期间不再 step，但每帧照旧 draw", () => {
    clock.tick(1 / 60);
    clock.tick(1 / 60);
    expect(steps).toBeGreaterThan(0);

    const stepsBefore = steps;
    const drawsBefore = draws.length;
    expect(loop.hold(0.05)).toBe(true);
    expect(loop.isHeld()).toBe(true);

    clock.tick(1 / 60);
    clock.tick(1 / 60);
    expect(steps).toBe(stepsBefore);
    expect(draws.length).toBe(drawsBefore + 2);
    expect(draws.at(-1)).toMatchObject({ paused: false, held: true, stepped: 0 });
  });

  it("定格到期后恢复推进，且不把定格的时间补回来", () => {
    clock.tick(1 / 60);
    const stepsBefore = steps;
    loop.hold(0.05);

    for (let i = 0; i < 3; i += 1) clock.tick(1 / 60);
    expect(steps).toBe(stepsBefore);

    clock.tick(1 / 60);
    expect(loop.isHeld()).toBe(false);
    // 解冻后的这一帧只补它自己的 16.7ms，不追欠下的 50ms。
    expect(steps).toBe(stepsBefore + 1);
    expect(draws.at(-1).held).toBeUndefined();
  });

  it("连段只定一次：冷却内的第二次请求被吞掉", () => {
    clock.tick(1 / 60);
    expect(loop.hold(0.05)).toBe(true);
    clock.tick(0.06);
    expect(loop.isHeld()).toBe(false);
    expect(loop.hold(0.05)).toBe(false);
    expect(loop.isHeld()).toBe(false);
  });

  it("暂停时不接受定格，暂停切换会清掉残留定格", () => {
    clock.tick(1 / 60);
    loop.hold(0.05);
    expect(loop.isHeld()).toBe(true);

    loop.setPaused(true);
    expect(loop.isHeld()).toBe(false);
    expect(loop.hold(0.05)).toBe(false);

    loop.setPaused(false);
    const stepsBefore = steps;
    clock.tick(1 / 60);
    expect(steps).toBe(stepsBefore + 1);
  });
});
