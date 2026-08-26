import { suite, test, assert, assertEq } from "../harness.mjs";
import {
  simulateBattle,
  attackOnce,
  makeEnemyUnit,
  sideSynergy,
  runExpedition,
  expeditionUnits,
  hospitalRescueRate,
} from "../../js/sim/battle.js";
import { createInitialState } from "../../js/sim/state.js";
import { BATTLE } from "../../js/config.js";
import { STAGES } from "../../js/data/enemies.js";

const flatRng = () => 0.5; // 无技能触发、无浮动

function unit(overrides = {}) {
  return makeEnemyUnit({
    name: overrides.name || "试验队",
    faction: overrides.faction || "qun",
    troop: overrides.troop || "infantry",
    atk: overrides.atk ?? 50,
    def: overrides.def ?? 20,
    troops: overrides.troops ?? 200,
  });
}

/** 归一化克制探针：双方共用同一套兵种基础属性，只保留克制标签差异。 */
function lossesAfterOneAttack(atkTroop, defTroop, atkFaction = "qun", defFaction = "qun") {
  const attacker = unit({ troop: atkTroop, faction: atkFaction });
  const defender = unit({ troop: defTroop, faction: defFaction, troops: 100000 });
  attacker.troopStats = { hp: 30, atk: 6, def: 2 };
  defender.troopStats = { hp: 30, atk: 6, def: 2 };
  const before = defender.troops;
  attackOnce(attacker, defender, 1, flatRng, [], 1, "attacker");
  return before - defender.troops;
}

suite("battle：克制关系生效", () => {
  test("步克骑：步兵打骑兵伤害高于打步兵", () => {
    const vsCav = lossesAfterOneAttack("infantry", "cavalry");
    const vsInf = lossesAfterOneAttack("infantry", "infantry");
    assert(vsCav > vsInf, `步兵对骑兵应更痛（${vsCav} vs ${vsInf}）`);
  });

  test("骑克弓、弓克步；被克方出手受罚", () => {
    assert(lossesAfterOneAttack("cavalry", "archer") > lossesAfterOneAttack("cavalry", "cavalry"));
    assert(lossesAfterOneAttack("archer", "infantry") > lossesAfterOneAttack("archer", "archer"));
    assert(
      lossesAfterOneAttack("archer", "cavalry") < lossesAfterOneAttack("archer", "archer"),
      "弓兵打克自己的骑兵应打折",
    );
  });

  test("阵营克制：吴打蜀伤害高于吴打吴", () => {
    const bonus = lossesAfterOneAttack("infantry", "infantry", "wu", "shu");
    const neutral = lossesAfterOneAttack("infantry", "infantry", "wu", "wu");
    assert(bonus > neutral, `${bonus} vs ${neutral}`);
  });

  test("被克阵营出手有惩罚：魏打吴 > 蜀打吴（蜀被吴克…吴克蜀，蜀打吴无克无惩；魏打吴有克）", () => {
    const weiVsWu = lossesAfterOneAttack("infantry", "infantry", "wei", "wu");
    const shuVsWu = lossesAfterOneAttack("infantry", "infantry", "shu", "wu");
    assert(weiVsWu > shuVsWu);
  });
});

suite("battle：协同与流程", () => {
  test("三同阵营协同 1.2、两同 1.08", () => {
    const wu3 = [unit({ faction: "wu" }), unit({ faction: "wu" }), unit({ faction: "wu" })];
    assertEq(sideSynergy(wu3), BATTLE.synergy3);
    const wu2 = [unit({ faction: "wu" }), unit({ faction: "wu" }), unit({ faction: "shu" })];
    assertEq(sideSynergy(wu2), BATTLE.synergy2);
    assertEq(sideSynergy([unit()]), 1);
  });

  test("压倒性兵力必胜且回合数有限", () => {
    const atk = [unit({ atk: 200, troops: 1000 })];
    const def = [unit({ atk: 10, troops: 50 })];
    const r = simulateBattle(atk, def, flatRng);
    assertEq(r.winner, "attacker");
    assert(r.rounds <= BATTLE.maxRounds);
    assert(r.log.length > 0, "应有战报");
  });

  test("空兵力进攻方速败", () => {
    const atk = [unit({ troops: 0 })];
    const def = [unit({ troops: 100 })];
    const r = simulateBattle(atk, def, flatRng);
    assertEq(r.winner, "defender");
  });
});

suite("battle：讨伐结算", () => {
  function readyState() {
    const s = createInitialState(21);
    s.buildings.recruitHall = 1;
    s.buildings.infantryCamp = 5;
    s.buildings.furnace = 5;
    s.heroes.push({ id: "guanyu", level: 10, dupes: 0 });
    s.team[0] = "guanyu";
    s.army.infantry = 150;
    s.marches = 3;
    return s;
  }

  test("无编队/无行军令/越级均被拒绝", () => {
    const s = createInitialState(22);
    s.marches = 1;
    assert(runExpedition(s, 1).error, "无编队应拒绝");
    const ready = readyState();
    ready.marches = 0;
    assert(runExpedition(ready, 1).error.includes("行军令"));
    const ready2 = readyState();
    assert(runExpedition(ready2, 3).error, "未通关前一关不能越级");
  });

  test("胜利获得奖励并推进关卡；行军令 -1", () => {
    const s = readyState();
    const foodBefore = s.resources.food;
    const r = runExpedition(s, 1);
    assert(!r.error, r.error || "");
    assertEq(r.win, true, "关羽满编打黄巾必胜");
    assertEq(s.stage, 1);
    assertEq(s.marches, 2);
    assert(s.resources.food > foodBefore, "应有肉食奖励");
    assert(s.tokens >= 1 && s.souls > 0, "首通应给招贤令与将魂");
    assert(r.log.length > 0);
  });

  test("军医所抢救战损", () => {
    const s = readyState();
    s.buildings.hospital = 10;
    assertEq(hospitalRescueRate(s), BATTLE.hospitalRescueMax);
  });

  test("同种子讨伐结果可复现", () => {
    const a = readyState();
    const b = readyState();
    const ra = runExpedition(a, 1);
    const rb = runExpedition(b, 1);
    assertEq(ra.win, rb.win);
    assertEq(JSON.stringify(ra.losses), JSON.stringify(rb.losses));
    assertEq(a.rngState, b.rngState);
  });

  test("出阵按将领统率分配兵力池", () => {
    const s = readyState();
    s.heroes.push({ id: "zhangfei", level: 1, dupes: 0 });
    s.team[1] = "zhangfei";
    s.army.infantry = 100;
    const units = expeditionUnits(s);
    assertEq(units.length, 2);
    const total = units.reduce((sum, u) => sum + u.troops, 0);
    assert(total <= 100, "分配总兵力不超过兵力池");
  });

  test("12 关难度递增（战力评估单调）", () => {
    let last = 0;
    for (const stage of STAGES) {
      const power = stage.units.reduce((sum, u) => sum + u.atk * 6 + u.troops * 6, 0);
      assert(power > last, `${stage.name} 应强于上一关`);
      last = power;
    }
  });
});
