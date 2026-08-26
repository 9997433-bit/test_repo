import { suite, test, assert, assertEq } from "../harness.mjs";
import { createInitialState } from "../../js/sim/state.js";
import { checkQuests, currentQuest } from "../../js/sim/quests.js";
import { QUESTS } from "../../js/data/quests.js";

suite("quests：主线任务", () => {
  test("任务定义完整且至少 15 个", () => {
    assert(QUESTS.length >= 15);
    for (const q of QUESTS) {
      assert(q.id && q.name && q.desc && typeof q.check === "function" && q.reward, `${q.id} 定义完整`);
    }
  });

  test("满足条件自动完成并发奖", () => {
    const s = createInitialState(51);
    s.resources.wood = 60; // q01: 囤 50 木
    const foodBefore = s.resources.food;
    const events = [];
    checkQuests(s, events);
    assertEq(s.questIndex, 1);
    assert(s.resources.food > foodBefore, "应发放肉食奖励");
    assert(events.some((e) => e.type === "quest-done"));
  });

  test("连锁完成：一次检查可推进多个任务", () => {
    const s = createInitialState(52);
    s.resources.wood = 100;
    s.buildings.hunter = 1;
    s.buildings.furnace = 2;
    const events = [];
    checkQuests(s, events);
    assert(s.questIndex >= 3, `应至少推进 3 个任务（实际 ${s.questIndex}）`);
  });

  test("未满足条件不推进", () => {
    const s = createInitialState(53);
    s.resources.wood = 10;
    checkQuests(s, []);
    assertEq(s.questIndex, 0);
    assertEq(currentQuest(s).id, "q01");
  });

  test("全部完成后 currentQuest 为 null", () => {
    const s = createInitialState(54);
    s.questIndex = QUESTS.length;
    assertEq(currentQuest(s), null);
    checkQuests(s, []); // 不应崩溃
  });
});
