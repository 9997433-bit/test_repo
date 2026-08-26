import { suite, test, assert, assertEq, assertClose } from "../harness.mjs";
import { TICKS_PER_DAY, WORK, POPULATION } from "../../js/config.js";
import { createInitialState, storageCap } from "../../js/sim/state.js";
import { assignJobs, tickEconomy, productionFactors, kitchenFoodSave } from "../../js/sim/economy.js";

function warmState(seed = 3) {
  const s = createInitialState(seed);
  s.temperature = 5; // normal 档
  return s;
}

suite("economy：岗位与产出", () => {
  test("岗位按 猎屋→伐木→煤矿→铁矿 优先级分配", () => {
    const s = warmState();
    s.population = 7;
    s.buildings.hunter = 1; // 3 岗
    s.buildings.lumber = 2; // 6 岗
    const jobs = assignJobs(s);
    assertEq(jobs.assigned.hunter, 3);
    assertEq(jobs.assigned.lumber, 4, "剩余工人给伐木场");
    assertEq(jobs.assigned.coalMine, 0);
  });

  test("产出写入资源并累计统计", () => {
    const s = warmState();
    s.buildings.lumber = 1;
    s.population = 10;
    const before = s.resources.wood;
    const ev = [];
    tickEconomy(s, ev);
    assert(s.resources.wood > before - 1, "产出应抵消部分消耗");
    assert(s.stats.produced.wood > 0);
  });

  test("仓储上限截断产出", () => {
    const s = warmState();
    s.buildings.lumber = 5;
    s.buildings.furnace = 5;
    s.population = 30;
    s.resources.wood = storageCap(s);
    const ev = [];
    tickEconomy(s, ev);
    assert(s.resources.wood <= storageCap(s));
  });

  test("民心与温度影响产量系数", () => {
    const s = warmState();
    s.morale = 100;
    s.temperature = 10;
    const high = productionFactors(s).total;
    s.morale = 20;
    s.temperature = -10;
    const low = productionFactors(s).total;
    assert(high > low * 1.8, `寒冷低迷时产出应显著下降（${high} vs ${low}）`);
  });

  test("太学院提升产出", () => {
    const s = warmState();
    const base = productionFactors(s).total;
    s.buildings.academy = 5;
    assertClose(productionFactors(s).total, base * (1 + 5 * WORK.academyBonusPerLevel), 1e-9);
  });
});

suite("economy：消耗与饥荒", () => {
  test("人口按每天口粮消耗肉食", () => {
    const s = warmState();
    s.population = 10;
    s.resources.food = 100;
    const ev = [];
    tickEconomy(s, ev);
    const expected = 100 - (10 * POPULATION.eatPerDay) / TICKS_PER_DAY;
    assertClose(s.resources.food, expected, 1e-6);
  });

  test("厨房降低口粮消耗", () => {
    const s = warmState();
    s.buildings.kitchen = 5;
    assertClose(kitchenFoodSave(s), 0.2, 1e-9);
    assertEq(kitchenFoodSave({ ...s, buildings: { ...s.buildings, kitchen: 99 } }), 0.4, "有上限");
  });

  test("断粮触发饥荒事件", () => {
    const s = warmState();
    s.resources.food = 0;
    const ev = [];
    tickEconomy(s, ev);
    assert(s.starving);
    assert(ev.some((e) => e.type === "starving"));
  });

  test("军队消耗军粮", () => {
    const s = warmState();
    s.population = 0;
    s.army.infantry = 100;
    s.resources.food = 100;
    const ev = [];
    tickEconomy(s, ev);
    assert(s.resources.food < 100, "士兵应消耗军粮");
  });
});
