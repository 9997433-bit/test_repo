import { suite, test, assert, assertEq, assertClose } from "../harness.mjs";
import { CLIMATE, FUEL, TICKS_PER_DAY } from "../../js/config.js";
import {
  blizzardOfIndex,
  blizzardAtDay,
  worldBaseTemp,
  computeTemperature,
  heatOutput,
  fuelNeedPerTick,
  tickClimate,
  tempBand,
} from "../../js/sim/climate.js";
import { createInitialState } from "../../js/sim/state.js";
import { runTicks } from "../../js/sim/tick.js";

suite("climate：寒潮时刻表", () => {
  test("第 1 次寒潮在第 7 天开始，持续 2 天", () => {
    const b = blizzardOfIndex(1);
    assertEq(b.start, 7);
    assertEq(b.end, 8);
    assertEq(b.delta, CLIMATE.blizzardTempDelta);
  });

  test("寒潮逐次加深且有下限", () => {
    const b5 = blizzardOfIndex(5);
    assertClose(b5.delta, CLIMATE.blizzardTempDelta + CLIMATE.blizzardEscalation * 4, 1e-9);
    const b99 = blizzardOfIndex(99);
    assertEq(b99.delta, CLIMATE.blizzardDeltaFloor);
  });

  test("blizzardAtDay 边界正确", () => {
    assert(!blizzardAtDay(6).active);
    assert(blizzardAtDay(7).active);
    assert(blizzardAtDay(8).active);
    assert(!blizzardAtDay(9).active);
    assertEq(blizzardAtDay(6).next.start, 7);
    assertEq(blizzardAtDay(9).next.start, 14);
  });

  test("世界渐冷至下限", () => {
    assert(worldBaseTemp(1) === CLIMATE.baseTemp);
    assert(worldBaseTemp(50) < worldBaseTemp(10));
    assertEq(worldBaseTemp(10000), CLIMATE.worldCoolingFloor);
  });
});

suite("climate：火炉供热与燃料", () => {
  test("供热 = 等级 × 每级供热 × 档位系数", () => {
    const s = createInitialState(1);
    s.buildings.furnace = 3;
    s.fuel.mode = "normal";
    assertClose(heatOutput(s), 3 * CLIMATE.furnaceHeatPerLevel, 1e-9);
    s.fuel.mode = "high";
    assertClose(heatOutput(s), 3 * CLIMATE.furnaceHeatPerLevel * FUEL.modes.high.heat, 1e-9);
    s.fuel.mode = "off";
    assertEq(heatOutput(s), 0);
  });

  test("自动模式优先烧木，缺木才烧煤；可强制只烧煤", () => {
    const s = createInitialState(1);
    s.resources.coal = 100;
    s.resources.wood = 100;
    tickClimate(s, []);
    assert(s.resources.wood < 100, "有木时应先烧木");
    assertEq(s.resources.coal, 100, "煤应结余");
    s.resources.wood = 0;
    tickClimate(s, []);
    assert(s.resources.coal < 100, "缺木时应烧煤");
    const forced = createInitialState(2);
    forced.fuel.source = "coal";
    forced.resources.coal = 100;
    forced.resources.wood = 100;
    tickClimate(forced, []);
    assert(forced.resources.coal < 100 && forced.resources.wood === 100, "只烧煤模式生效");
  });

  test("燃料耗尽 → 火炉熄灭事件 + 供热归零；补充后恢复", () => {
    const s = createInitialState(1);
    s.resources.wood = 0;
    s.resources.coal = 0;
    const ev = [];
    tickClimate(s, ev);
    assert(s.fuel.starved);
    assert(ev.some((e) => e.type === "fuel-out"));
    assertEq(heatOutput(s), 0);
    s.resources.wood = 50;
    const ev2 = [];
    tickClimate(s, ev2);
    assert(!s.fuel.starved);
    assert(ev2.some((e) => e.type === "fuel-restored"));
  });

  test("旺火燃料消耗高于慢火", () => {
    const s = createInitialState(1);
    s.fuel.mode = "high";
    const high = fuelNeedPerTick(s);
    s.fuel.mode = "low";
    const low = fuelNeedPerTick(s);
    assert(high > low && low > 0);
  });

  test("温度 = 基础 + 寒潮 + 供热", () => {
    const s = createInitialState(1);
    s.day = 7; // 寒潮中
    s.buildings.furnace = 2;
    const t = computeTemperature(s);
    assertClose(
      t,
      worldBaseTemp(7) + CLIMATE.blizzardTempDelta + 2 * CLIMATE.furnaceHeatPerLevel,
      1e-9,
    );
  });

  test("温度分档", () => {
    assertEq(tempBand(-10), "freeze");
    assertEq(tempBand(-3), "cold");
    assertEq(tempBand(3), "normal");
    assertEq(tempBand(10), "comfort");
  });
});

suite("climate：寒潮全流程事件", () => {
  test("跑到第 9 天：寒潮开始/结束事件各一次，幸存计数 +1", () => {
    const s = createInitialState(7);
    s.resources.wood = 5000;
    s.resources.food = 5000;
    const seen = [];
    runTicks(s, TICKS_PER_DAY * 9, (events) => {
      for (const e of events) seen.push(e.type);
    });
    assert(seen.includes("blizzard-start"), "应出现寒潮开始事件");
    assert(seen.includes("blizzard-end"), "应出现寒潮结束事件");
    assertEq(s.stats.blizzardsSurvived, 1);
  });
});
