// 命中定格的判定与节流。纯时间逻辑，不碰 DOM。

import { describe, expect, it } from "vitest";

import { KNOCKBACK } from "../data/tuning.js";
import {
  HIT_FLASH,
  HIT_STOP,
  createHitStop,
  hitFlashFor,
  hitFlashForEvents,
  hitStopFor,
  hitStopForEvents,
} from "./juice.js";

const SELF = "p0";

describe("HIT_STOP 参数", () => {
  it("单次定格可感知但不超过 120ms", () => {
    // 60fps 下 4 帧起步才「有东西」，验收线是单次 ≤120ms
    expect(HIT_STOP.dealt).toBeGreaterThanOrEqual(0.06);
    expect(HIT_STOP.max).toBeLessThanOrEqual(0.12);
    expect(HIT_STOP.dealt + HIT_STOP.heavyBonus).toBeLessThanOrEqual(HIT_STOP.max);
  });

  it("冷却保证最坏情况下画面不到一半时间是冻的", () => {
    expect(HIT_STOP.max / HIT_STOP.cooldown).toBeLessThan(0.6);
  });

  it("重击门槛与击退表同源：全工程只有 12 这一条线", () => {
    expect(HIT_STOP.heavyPower).toBe(KNOCKBACK.heavyPowerThreshold);
    expect(HIT_STOP.heavyPower).toBe(12);
  });

  it("门槛收到 12 也没动天花板：最重一记仍是 0.115s ≤ 0.12s", () => {
    // 收门槛只改「谁进重击档」，档位本身不动 —— max 一格没让
    expect(HIT_STOP.max).toBe(0.12);
    expect(HIT_STOP.dealt + HIT_STOP.heavyBonus).toBe(0.115);
    expect(HIT_STOP.taken + HIT_STOP.heavyBonus).toBe(0.1);
    expect(HIT_STOP.dealt + HIT_STOP.heavyBonus).toBeLessThan(HIT_STOP.max);
  });
});

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

  it("重击档的门槛就是 12：踩线算重、差一点就不算", () => {
    const at = (power) =>
      hitStopFor({ type: "hit", playerId: SELF, targetId: "p2", source: "slap", power }, SELF);
    const heavy = HIT_STOP.dealt + HIT_STOP.heavyBonus;
    // 12 是 combat 判 `heavy` 的同一条线：碎地算重击的那一记，定格也进重击档
    expect(at(11.999)).toBe(HIT_STOP.dealt);
    expect(at(12)).toBe(heavy);
    expect(at(13)).toBe(heavy);
    // 旧门槛 16 上下已经在同一档，12..16 的灰区没了
    expect(at(15.999)).toBe(heavy);
    expect(at(16)).toBe(heavy);
  });

  it("任何 power 都顶不动 0.12s：只有轻/重两档", () => {
    const powers = [0, 1, 11.9, 12, 16, 40, 1e6, Number.MAX_SAFE_INTEGER, Infinity, NaN];
    const steps = new Set();
    for (const power of powers) {
      for (const [playerId, targetId] of [
        [SELF, "p2"],
        ["p2", SELF],
      ]) {
        const seconds = hitStopFor({ type: "hit", playerId, targetId, source: "slap", power }, SELF);
        expect(seconds, `power=${power}`).toBeLessThanOrEqual(HIT_STOP.max);
        steps.add(seconds);
      }
    }
    // 打人 / 挨打各两档，一共四个取值，没有第五种
    expect([...steps].sort((a, b) => a - b)).toEqual([
      HIT_STOP.taken,
      HIT_STOP.dealt,
      HIT_STOP.taken + HIT_STOP.heavyBonus,
      HIT_STOP.dealt + HIT_STOP.heavyBonus,
    ]);
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

describe("hitFlashFor", () => {
  it("只在本人挨打时给反馈，打中别人不糊自己的屏", () => {
    expect(hitFlashFor({ type: "hit", playerId: "p2", targetId: SELF, power: 8 }, SELF)).toBeTruthy();
    expect(hitFlashFor({ type: "hit", playerId: SELF, targetId: "p2", power: 8 }, SELF)).toBeNull();
    expect(hitFlashFor({ type: "hit", playerId: "p1", targetId: "p2" }, SELF)).toBeNull();
    expect(hitFlashFor({ type: "slap", targetId: SELF }, SELF)).toBeNull();
  });

  it("越重的一记越明显，但强度与时长都封顶", () => {
    const light = hitFlashFor({ type: "hit", targetId: SELF, power: 2 }, SELF);
    const heavy = hitFlashFor({ type: "hit", targetId: SELF, power: 30 }, SELF);
    expect(heavy.strength).toBeGreaterThan(light.strength);
    expect(heavy.strength).toBeLessThanOrEqual(HIT_FLASH.maxStrength);
    expect(heavy.ms).toBeLessThanOrEqual(HIT_FLASH.maxMs);
    expect(light.ms).toBeGreaterThanOrEqual(HIT_FLASH.minMs);
  });

  it("同帧多段只取最重的一记", () => {
    const events = [
      { type: "hit", targetId: SELF, power: 3 },
      { type: "hit", targetId: "p2", power: 99 },
      { type: "hit", targetId: SELF, power: 12 },
    ];
    expect(hitFlashForEvents(events, SELF).strength).toBe(
      hitFlashFor({ type: "hit", targetId: SELF, power: 12 }, SELF).strength
    );
    expect(hitFlashForEvents([], SELF)).toBeNull();
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
