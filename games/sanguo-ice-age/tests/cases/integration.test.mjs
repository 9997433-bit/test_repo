import { suite, test, assert, assertEq } from "../harness.mjs";
import { TICKS_PER_DAY } from "../../js/config.js";
import { createInitialState } from "../../js/sim/state.js";
import { runTicks, tickGame } from "../../js/sim/tick.js";
import { upgrade } from "../../js/sim/buildings.js";

suite("integration：整局流转", () => {
  test("开局 5 天：白手起家不至于崩盘", () => {
    const s = createInitialState(71);
    upgrade(s, "hunter");
    upgrade(s, "lumber");
    runTicks(s, TICKS_PER_DAY * 5);
    assert(!s.gameOver, "前 5 天不应灭亡");
    assert(s.population > 8, `人口不应雪崩（${s.population.toFixed(1)}）`);
    assertEq(s.day, 6);
  });

  test("放置不管到第 10 天：燃料耗尽 + 寒潮 → 局势恶化", () => {
    const s = createInitialState(72);
    s.resources.wood = 30; // 燃料很快烧完
    runTicks(s, TICKS_PER_DAY * 10);
    assert(s.fuel.starved, "木材烧完火炉应熄灭");
    assert(s.morale < 70, "民心应恶化");
  });

  test("行军令每天恢复 1，上限 5", () => {
    const s = createInitialState(73);
    s.marches = 0;
    runTicks(s, TICKS_PER_DAY * 3);
    assertEq(s.marches, 3);
    runTicks(s, TICKS_PER_DAY * 10);
    assertEq(s.marches, 5);
  });

  test("使节馆每 2 天馈赠物资", () => {
    const s = createInitialState(74);
    s.buildings.envoy = 2;
    s.resources.wood = 3000;
    s.resources.food = 3000;
    let gifts = 0;
    runTicks(s, TICKS_PER_DAY * 8, (events) => {
      gifts += events.filter((e) => e.type === "quest-done" ? false : e.type === "envoy-gift").length;
    });
    assert(gifts >= 3, `8 天应至少 3 次馈赠（实际 ${gifts}）`);
  });

  test("事件流：新的一天事件按日推进", () => {
    const s = createInitialState(75);
    let days = 0;
    for (let i = 0; i < TICKS_PER_DAY * 4; i++) {
      const events = tickGame(s);
      days += events.filter((e) => e.type === "new-day").length;
    }
    assertEq(days, 4);
  });

  test("终局后 tick 不再推进", () => {
    const s = createInitialState(76);
    s.gameOver = true;
    const t = s.tick;
    tickGame(s);
    assertEq(s.tick, t);
  });
});
