import { suite, test, assert, assertEq, assertDeepEq } from "../harness.mjs";
import { createInitialState } from "../../js/sim/state.js";
import { canUpgrade, upgrade, nextCost } from "../../js/sim/buildings.js";
import { BUILDINGS, BUILDING_ORDER, buildingCost } from "../../js/data/buildings.js";

function richState() {
  const s = createInitialState(5);
  for (const r of Object.keys(s.resources)) s.resources[r] = 999999;
  return s;
}

suite("buildings：火炉上限规则", () => {
  test("其他建筑等级不能超过火炉等级", () => {
    const s = richState();
    assertEq(upgrade(s, "hunter").ok, true, "升到 1 级（火炉 1 级）");
    const denied = canUpgrade(s, "hunter");
    assert(!denied.ok, "火炉 1 级时猎屋不能升到 2 级");
    assert(denied.reason.includes("火炉"));
    upgrade(s, "furnace");
    assertEq(canUpgrade(s, "hunter").ok, true, "火炉升级后放开限制");
  });

  test("解锁等级：煤矿需火炉 2 级、铁矿需 3 级、骑兵营需 4 级", () => {
    const s = richState();
    assert(!canUpgrade(s, "coalMine").ok);
    assert(!canUpgrade(s, "ironMine").ok);
    assert(!canUpgrade(s, "cavalryCamp").ok);
    upgrade(s, "furnace"); // 2
    assert(canUpgrade(s, "coalMine").ok);
    assert(!canUpgrade(s, "ironMine").ok);
    upgrade(s, "furnace"); // 3
    assert(canUpgrade(s, "ironMine").ok);
    assert(!canUpgrade(s, "cavalryCamp").ok);
    upgrade(s, "furnace"); // 4
    assert(canUpgrade(s, "cavalryCamp").ok);
  });

  test("火炉本身不受火炉限制，可升到 10 级", () => {
    const s = richState();
    for (let i = 1; i < 10; i++) assertEq(upgrade(s, "furnace").ok, true, `升到 ${i + 1} 级`);
    assert(!canUpgrade(s, "furnace").ok, "10 级封顶");
  });
});

suite("buildings：造价与扣费", () => {
  test("火炉 1→2 级用阶梯造价（只需木材）", () => {
    assertDeepEq(buildingCost(BUILDINGS.furnace, 1), { wood: 60 });
  });

  test("公式造价按增长率上升", () => {
    const def = BUILDINGS.lumber;
    const c0 = buildingCost(def, 0).wood;
    const c1 = buildingCost(def, 1).wood;
    assertEq(c1, Math.round(c0 * def.costGrowth));
  });

  test("升级扣除资源，不足则拒绝", () => {
    const s = createInitialState(9);
    s.resources.wood = 25;
    const before = s.resources.wood;
    assertEq(upgrade(s, "hunter").ok, true);
    assertEq(s.resources.wood, before - nextCostWood());
    function nextCostWood() {
      return buildingCost(BUILDINGS.hunter, 0).wood;
    }
    s.resources.wood = 0;
    const denied = canUpgrade(s, "lumber");
    assert(!denied.ok && denied.reason.includes("不足"));
  });

  test("全部 17 种建筑都有定义与渲染坐标", () => {
    assertEq(BUILDING_ORDER.length, 17);
    for (const id of BUILDING_ORDER) {
      const def = BUILDINGS[id];
      assert(def && def.name && def.tile && def.effectText, `${id} 定义完整`);
    }
  });
});
