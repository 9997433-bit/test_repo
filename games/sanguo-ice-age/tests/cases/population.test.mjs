import { suite, test, assert, assertEq } from "../harness.mjs";
import { TICKS_PER_DAY, MORALE } from "../../js/config.js";
import { createInitialState, popCap } from "../../js/sim/state.js";
import { tickPopulation } from "../../js/sim/population.js";

suite("population：民心与人口", () => {
  test("严寒消耗民心，温暖恢复民心", () => {
    const s = createInitialState(41);
    s.temperature = -10;
    const before = s.morale;
    for (let i = 0; i < TICKS_PER_DAY; i++) tickPopulation(s, []);
    assert(s.morale < before, "冰冻应降民心");

    const w = createInitialState(42);
    w.temperature = 10;
    w.morale = 50;
    for (let i = 0; i < TICKS_PER_DAY; i++) tickPopulation(w, []);
    assert(w.morale > 50, "舒适应回民心");
  });

  test("医馆减缓严寒民心流失", () => {
    const bare = createInitialState(43);
    const cured = createInitialState(43);
    cured.buildings.clinic = 5;
    for (const s of [bare, cured]) {
      s.temperature = -10;
      for (let i = 0; i < TICKS_PER_DAY; i++) tickPopulation(s, []);
    }
    assert(cured.morale > bare.morale);
  });

  test("严寒流失人口并记录事件；城墙在寒潮时减损", () => {
    const bare = createInitialState(44);
    const walled = createInitialState(44);
    walled.buildings.wall = 8;
    for (const s of [bare, walled]) {
      s.population = 100;
      s.temperature = -20;
      s.blizzard.active = true;
      for (let i = 0; i < TICKS_PER_DAY * 3; i++) tickPopulation(s, []);
    }
    assert(bare.population < 100, "应有人冻毙");
    assert(walled.population > bare.population, "城墙应减少损失");
  });

  test("民心崩溃引发出逃", () => {
    const s = createInitialState(45);
    s.population = 100;
    s.morale = MORALE.collapseAt - 5;
    s.temperature = 3; // 不冷不饿，只因民心
    for (let i = 0; i < TICKS_PER_DAY * 2; i++) tickPopulation(s, []);
    assert(s.population < 100, "民心崩溃应出逃");
  });

  test("温饱且民心高时人口向上限增长", () => {
    const s = createInitialState(46);
    s.temperature = 10;
    s.morale = 90;
    s.buildings.house = 3;
    for (let i = 0; i < TICKS_PER_DAY * 30; i++) tickPopulation(s, []);
    assert(s.population > 12, "人口应增长");
    assert(s.population <= popCap(s), "不超上限");
  });

  test("人口归零触发终局", () => {
    const s = createInitialState(47);
    s.population = 1;
    s.temperature = -30;
    s.starving = true;
    s.morale = 0;
    const events = [];
    for (let i = 0; i < TICKS_PER_DAY * 200 && !s.gameOver; i++) {
      tickPopulation(s, events);
    }
    assert(s.gameOver, "应触发终局");
    assert(events.some((e) => e.type === "game-over"));
    assertEq(s.population, 0);
  });
});
