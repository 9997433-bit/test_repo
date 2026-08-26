// 命中定格的判定与节流。纯时间逻辑，不碰 DOM。

import { describe, expect, it } from "vitest";

import { HIT_STOP, createHitStop, hitStopFor, hitStopForEvents } from "./juice.js";

const SELF = "p0";

describe("hitStopFor", () => {
  it("本人扇中别人：定格一记，且不超过上限", () => {
    const seconds = hitStopFor(
      { type: "hit", playerId: SELF, targetId: "p2", source: "slap", power: 8 },
      SELF
    );
    expect(seconds).toBe(HIT_STOP.dealt);
    expect(seconds).toBeLessThanOrEqual(HIT_STOP.max);
  });

  it("本人挨扇：也定格，但比自己打人短", () => {
    const seconds = hitStopFor(
      { type: "hit", playerId: "p2", targetId: SELF, source: "slap", power: 8 },
      SELF
    );
    expect(seconds).toBe(HIT_STOP.taken);
    expect(seconds).toBeLessThan(HIT_STOP.dealt);
  });

  it("重击加一点点，仍卡在上限内", () => {
    const seconds = hitStopFor(
      { type: "hit", playerId: SELF, targetId: "p2", source: "slap", power: 40 },
      SELF
    );
    expect(seconds).toBeGreaterThan(HIT_STOP.dealt);
    expect(seconds).toBeLessThanOrEqual(HIT_STOP.max);
  });

  it("与本人无关的互扇不冻我的画面", () => {
    expect(
      hitStopFor({ type: "hit", playerId: "p1", targetId: "p2", source: "slap" }, SELF)
    ).toBe(0);
  });

  it("技能命中不叠时间停顿，其它事件一律 0", () => {
    expect(
      hitStopFor({ type: "hit", playerId: SELF, targetId: "p2", source: "meteorSlam" }, SELF)
    ).toBe(0);
    expect(hitStopFor({ type: "slap", playerId: SELF }, SELF)).toBe(0);
    expect(hitStopFor(null, SELF)).toBe(0);
  });

  it("同帧多段只取最长的一次", () => {
    const events = [
      { type: "hit", playerId: "p1", targetId: "p3", source: "slap", power: 99 },
      { type: "hit", playerId: "p2", targetId: SELF, source: "slap", power: 4 },
      { type: "hit", playerId: SELF, targetId: "p2", source: "slap", power: 99 },
    ];
    expect(hitStopForEvents(events, SELF)).toBe(HIT_STOP.dealt + HIT_STOP.heavyBonus);
    expect(hitStopForEvents([], SELF)).toBe(0);
  });
});

describe("createHitStop", () => {
  it("请求后定格到期自动解冻", () => {
    const gate = createHitStop();
    expect(gate.held(10)).toBe(false);
    expect(gate.request(0.05, 10)).toBe(true);
    expect(gate.held(10.02)).toBe(true);
    expect(gate.remaining(10.02)).toBeCloseTo(0.03, 5);
    expect(gate.held(10.06)).toBe(false);
    expect(gate.remaining(10.06)).toBe(0);
  });

  it("连段被冷却挡住：不会把画面剁成幻灯片", () => {
    const gate = createHitStop({ cooldown: 0.14 });
    expect(gate.request(0.05, 0)).toBe(true);
    expect(gate.request(0.05, 0.06)).toBe(false);
    expect(gate.held(0.08)).toBe(false);
    expect(gate.request(0.05, 0.2)).toBe(true);
  });

  it("单次时长按上限截断", () => {
    const gate = createHitStop({ max: 0.09 });
    gate.request(5, 0);
    expect(gate.remaining(0)).toBe(0.09);
  });

  it("reset 立刻解冻并清掉冷却", () => {
    const gate = createHitStop();
    gate.request(0.09, 0);
    gate.reset();
    expect(gate.held(0.01)).toBe(false);
    expect(gate.request(0.05, 0.01)).toBe(true);
  });
});
