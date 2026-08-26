import assert from "node:assert/strict";
import { test } from "node:test";
import { SHOPS } from "../src/data/balance.js";
import { assertSimulation, simulate } from "../scripts/simulate.mjs";

const MIN_GOALS_COMPLETED = 10;
const simulations = [
  ["半活跃", simulate("active")],
  ["纯挂机", simulate("idle")],
];

test("60 分钟推进后 SHOPS 中每家店都已解锁", () => {
  for (const [label, result] of simulations) {
    assertSimulation(result);
    assert.ok(
      SHOPS.every((shop) => result.finalState.shops[shop.id]?.unlocked === true),
      `${label}模拟结束时仍有店铺未解锁`,
    );
  }
});

test("60 分钟推进会让限时目标保守续期至少十轮", () => {
  for (const [label, result] of simulations) {
    assertSimulation(result);
    assert.ok(
      result.stats.goalsCompleted >= MIN_GOALS_COMPLETED,
      `${label}只完成并续期了 ${result.stats.goalsCompleted} 轮限时目标`,
    );
  }
});
