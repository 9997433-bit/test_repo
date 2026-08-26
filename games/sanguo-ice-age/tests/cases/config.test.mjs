import { suite, test, assert, assertEq } from "../harness.mjs";
import {
  FACTIONS,
  FACTION_BEATS,
  TROOPS,
  TROOP_BEATS,
  QUALITY_RANK,
  QUALITIES,
  SPEEDS,
  RESOURCES,
} from "../../js/config.js";

suite("config：克制关系与常量", () => {
  test("阵营克制构成 吴>蜀>魏>吴 闭环", () => {
    assertEq(FACTION_BEATS.wu, "shu");
    assertEq(FACTION_BEATS.shu, "wei");
    assertEq(FACTION_BEATS.wei, "wu");
    assertEq(FACTION_BEATS.qun, undefined, "群雄不参与克制");
  });

  test("兵种克制构成三角闭环且覆盖全部兵种", () => {
    const covered = new Set();
    let cur = "infantry";
    for (let i = 0; i < 3; i++) {
      covered.add(cur);
      cur = TROOP_BEATS[cur];
      assert(TROOPS.includes(cur), "克制目标必须是合法兵种");
    }
    assertEq(cur, "infantry", "三步应回到起点");
    assertEq(covered.size, 3);
  });

  test("品质从蓝到红递增", () => {
    assert(QUALITY_RANK.blue < QUALITY_RANK.purple);
    assert(QUALITY_RANK.purple < QUALITY_RANK.orange);
    assert(QUALITY_RANK.orange < QUALITY_RANK.red);
    assertEq(QUALITIES.length, 4);
  });

  test("资源为 肉/木/煤/铁 四种，速度含暂停", () => {
    assertEq(RESOURCES.join(","), "food,wood,coal,iron");
    assert(SPEEDS.includes(0) && SPEEDS.includes(1) && SPEEDS.includes(4));
    assertEq(FACTIONS.length, 4);
  });
});
