import { describe, expect, it } from "vitest";
import { simulateBattle } from "../src/combat/battle.js";
import { createStore } from "../src/core/store.js";
import { STAGES } from "../src/data/stages.js";
import { assignHero, recruit, starUp } from "../src/heroes/roster.js";
import { placeBuilding } from "../src/world/build.js";

const battleHp = (result, id) => result.leftover.find((unit) => unit.id === id)?.hp;
const battleLane = (result, id) => result.leftover.find((unit) => unit.id === id)?.lane;

const snapshotBattles = [
  [
    "满编挑战终局 Boss",
    () =>
      simulateBattle(
        0xc0ffee,
        [
          { id: "h-sam", heroKey: "sam", star: 5 },
          { id: "h-yilong", heroKey: "yilong", star: 5 },
          { id: "h-mia", heroKey: "mia", star: 5 },
          { id: "h-rambo", heroKey: "rambo", star: 5 },
          { id: "h-drunk_dragon", heroKey: "drunk_dragon", star: 5 },
        ],
        STAGES[29].enemies,
      ),
  ],
  [
    "单人挑战单个杂兵",
    () =>
      simulateBattle(
        17,
        [{ id: "solo", heroKey: "yilong", star: 1 }],
        [{ ...STAGES[0].enemies[0], id: "grunt" }],
      ),
  ],
  [
    "同名同速单位按稳定兜底顺序行动",
    () =>
      simulateBattle(
        2026,
        [
          { id: "ally-a", key: "twin", name: "同名单位", hp: 150, atk: 22, def: 4, spd: 100, lane: "front" },
          { id: "ally-b", key: "twin", name: "同名单位", hp: 150, atk: 22, def: 4, spd: 100, lane: "front" },
        ],
        [
          { id: "enemy-a", key: "twin", name: "同名单位", hp: 150, atk: 22, def: 4, spd: 100, lane: "front" },
          { id: "enemy-b", key: "twin", name: "同名单位", hp: 150, atk: 22, def: 4, spd: 100, lane: "front" },
        ],
      ),
  ],
];

describe("battle JSON contract snapshots", () => {
  it.each(snapshotBattles)("%s", (_name, run) => {
    expect(JSON.stringify(run())).toMatchSnapshot();
  });
});

const skillCases = [
  {
    kind: "taunt",
    value: 1,
    assertEffect(active, inactive) {
      expect(battleHp(active, "skill-user")).toBeGreaterThan(battleHp(inactive, "skill-user"));
    },
  },
  {
    kind: "multishot",
    value: 2,
    assertEffect(active, inactive) {
      expect(battleHp(active, "skill-target")).toBeLessThan(battleHp(inactive, "skill-target"));
    },
  },
  {
    kind: "heal",
    value: 20,
    assertEffect(active, inactive) {
      expect(battleHp(active, "skill-user")).toBeGreaterThan(battleHp(inactive, "skill-user"));
    },
  },
  {
    kind: "aoe",
    value: 0.4,
    assertEffect(active, inactive) {
      expect(battleHp(active, "skill-target")).toBeLessThan(battleHp(inactive, "skill-target"));
    },
  },
  {
    kind: "burst",
    value: 2,
    assertEffect(active, inactive) {
      expect(battleHp(active, "skill-target")).toBeLessThan(battleHp(inactive, "skill-target"));
    },
  },
  {
    kind: "buff",
    value: 0.3,
    assertEffect(active, inactive) {
      expect(battleHp(active, "skill-target")).toBeLessThan(battleHp(inactive, "skill-target"));
    },
  },
  {
    kind: "hook",
    value: 1,
    assertEffect(active, inactive) {
      expect(battleHp(active, "skill-target")).toBeLessThan(battleHp(inactive, "skill-target"));
      expect(battleLane(active, "skill-target")).toBe("front");
      expect(battleLane(inactive, "skill-target")).toBe("back");
    },
  },
];

function skillBattle(skill, star) {
  return simulateBattle(
    314159,
    [
      {
        id: "skill-user",
        key: "skill-user",
        name: "技能测试员",
        hp: 1_000,
        atk: 20,
        def: 0,
        spd: 120,
        lane: "front",
        star,
        skill,
      },
    ],
    [
      {
        id: "skill-target",
        key: "skill-target",
        name: "数值木桩",
        hp: 5_000,
        atk: 15,
        def: 0,
        spd: 80,
        lane: skill?.kind === "hook" ? "back" : "front",
      },
    ],
  );
}

describe("all skill kinds honor their star gate", () => {
  it.each(skillCases)("$kind: 达标有数值后果，差一星完全不生效", ({ kind, value, assertEffect }) => {
    const skill = { name: `${kind}-gate-probe`, kind, value, star: 2 };
    const active = skillBattle(skill, 2);
    const belowGate = skillBattle(skill, 1);
    const noSkill = skillBattle(null, 1);

    expect(JSON.stringify(belowGate)).toBe(JSON.stringify(noSkill));
    assertEffect(active, belowGate);
  });
});

const hookSeeds = [0, 1, 2, 42, 65_537, 0xffffffff];

describe("hook back-line targeting", () => {
  it.each(hookSeeds)("seed %i: 三前排不会挡住唯一后排", (seed) => {
    const result = simulateBattle(
      seed,
      [
        {
          id: "hook-user",
          key: "hook-user",
          name: "钩手",
          hp: 2_000,
          atk: 50,
          def: 0,
          spd: 200,
          lane: "front",
          star: 1,
          skill: { name: "铁钩", kind: "hook", value: 1, star: 1 },
        },
      ],
      [
        { id: "front-a", key: "front", name: "前排甲", hp: 1_000, atk: 1, def: 0, spd: 20, lane: "front" },
        { id: "front-b", key: "front", name: "前排乙", hp: 1_000, atk: 1, def: 0, spd: 20, lane: "front" },
        { id: "front-c", key: "front", name: "前排丙", hp: 1_000, atk: 1, def: 0, spd: 20, lane: "front" },
        { id: "back", key: "back", name: "唯一后排", hp: 1_000, atk: 1, def: 0, spd: 20, lane: "back" },
      ],
    );

    expect(battleLane(result, "back")).toBe("front");
    expect(battleHp(result, "back")).toBeLessThan(1_000);
  });
});

function hero(id, heroKey, assignedBuildingId = null) {
  return { id, heroKey, star: 1, xp: 0, assignedBuildingId, injuredUntil: 0 };
}

describe("hero mutation reference contracts", () => {
  it("委任替换同时更新新英雄、建筑、被替换英雄三向引用", () => {
    const placed = placeBuilding(createStore().get(), "house", 0, 0, 0);
    const buildingId = placed.buildings[0].id;
    const state = {
      ...placed,
      buildings: placed.buildings.map((building) => ({ ...building, occupantHeroId: "h-sam" })),
      heroes: [hero("h-sam", "sam", buildingId), hero("h-mia", "mia")],
    };

    const assigned = assignHero(state, "h-mia", buildingId);

    expect(assigned.heroes.find(({ id }) => id === "h-mia")?.assignedBuildingId).toBe(buildingId);
    expect(assigned.buildings.find(({ id }) => id === buildingId)?.occupantHeroId).toBe("h-mia");
    expect(assigned.heroes.find(({ id }) => id === "h-sam")?.assignedBuildingId).toBeNull();
  });

  it("recruit 失败时返回原引用", () => {
    const state = { ...createStore().get(), heroes: [hero("h-sam", "sam")] };
    expect(recruit(state, "sam")).toBe(state);
  });

  it("assignHero 失败时返回原引用", () => {
    const state = createStore().get();
    expect(assignHero(state, "missing-hero", "missing-building")).toBe(state);
  });

  it("starUp 失败时返回原引用", () => {
    const base = createStore().get();
    const state = {
      ...base,
      heroes: [hero("h-sam", "sam")],
      resources: { ...base.resources, shard: 0 },
    };
    expect(starUp(state, "h-sam")).toBe(state);
  });
});
