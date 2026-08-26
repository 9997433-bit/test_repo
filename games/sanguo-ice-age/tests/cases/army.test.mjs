import { suite, test, assert, assertEq } from "../harness.mjs";
import { createInitialState, troopCap } from "../../js/sim/state.js";
import { train, trainCost, maxTrainable } from "../../js/sim/army.js";
import { ARMY } from "../../js/config.js";

suite("army：练兵", () => {
  test("无兵营不能练兵", () => {
    const s = createInitialState(31);
    const r = train(s, "infantry", 10);
    assert(!r.ok && r.reason.includes("营"));
  });

  test("编制上限 = 兵营等级 × 每级编制", () => {
    const s = createInitialState(32);
    s.buildings.infantryCamp = 2;
    const cap = 2 * ARMY.capPerCampLevel;
    assertEq(troopCap(s, "infantry"), cap);
    s.resources.food = 99999;
    s.resources.wood = 99999;
    assert(!train(s, "infantry", cap + 1).ok, "超编拒绝");
    assertEq(train(s, "infantry", cap).ok, true);
  });

  test("扣费正确且累计训练统计", () => {
    const s = createInitialState(33);
    s.buildings.infantryCamp = 1;
    s.resources.food = 100;
    s.resources.wood = 100;
    const cost = trainCost("infantry", 10);
    assertEq(train(s, "infantry", 10).ok, true);
    assertEq(s.resources.food, 100 - cost.food);
    assertEq(s.resources.wood, 100 - cost.wood);
    assertEq(s.stats.trained, 10);
  });

  test("maxTrainable 同时受资源与编制约束", () => {
    const s = createInitialState(34);
    s.buildings.cavalryCamp = 1;
    s.resources.food = 60; // 骑兵 6 食/人 → 资源上限 10
    s.resources.iron = 100;
    assertEq(maxTrainable(s, "cavalry"), 10);
    s.resources.food = 99999;
    assertEq(maxTrainable(s, "cavalry"), ARMY.capPerCampLevel);
  });
});
