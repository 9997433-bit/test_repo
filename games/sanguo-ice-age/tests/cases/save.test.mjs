import { suite, test, assert, assertEq, assertThrows } from "../harness.mjs";
import {
  setStorage,
  createMemoryStorage,
  saveGame,
  loadGame,
  clearSave,
  exportSave,
  importSave,
  serializeState,
} from "../../js/engine/save.js";
import { createInitialState, rehydrate } from "../../js/sim/state.js";
import { runTicks } from "../../js/sim/tick.js";
import { SAVE_VERSION, TICKS_PER_DAY } from "../../js/config.js";

suite("save：存档往返", () => {
  test("save → load 状态一致（忽略瞬态字段）", () => {
    setStorage(createMemoryStorage());
    const s = createInitialState(61);
    runTicks(s, TICKS_PER_DAY * 3);
    assert(saveGame(s));
    const loaded = rehydrate(loadGame());
    assertEq(loaded.tick, s.tick);
    assertEq(loaded.day, s.day);
    assertEq(loaded.rngState, s.rngState, "RNG 状态必须还原");
    assertEq(JSON.stringify(loaded.resources), JSON.stringify(s.resources));
    assertEq(JSON.stringify(loaded.buildings), JSON.stringify(s.buildings));
  });

  test("读档后继续模拟与不间断模拟结果一致（确定性）", () => {
    setStorage(createMemoryStorage());
    const a = createInitialState(62);
    runTicks(a, 100);
    saveGame(a);
    const b = rehydrate(loadGame());
    runTicks(a, 100);
    runTicks(b, 100);
    assertEq(JSON.stringify(a.resources), JSON.stringify(b.resources));
    assertEq(a.morale, b.morale);
    assertEq(a.population, b.population);
  });

  test("瞬态字段不入档", () => {
    const s = createInitialState(63);
    s.lastBattle = { big: "blob" };
    const payload = JSON.parse(serializeState(s));
    assertEq(payload.state.lastBattle, undefined);
    assertEq(payload.state.flow, undefined);
    assertEq(payload.v, SAVE_VERSION);
  });

  test("版本不符/损坏存档被拒绝", () => {
    assertThrows(() => importSave(JSON.stringify({ v: 999, state: {} })));
    assertThrows(() => importSave("not json"));
    assertThrows(() => importSave(JSON.stringify({ v: SAVE_VERSION, state: { nothing: true } })));
  });

  test("导出/导入 JSON 往返", () => {
    const s = createInitialState(64);
    s.tokens = 7;
    const json = exportSave(s);
    const back = importSave(json);
    assertEq(back.tokens, 7);
    assertEq(back.seed, s.seed);
  });

  test("清档后 load 返回 null", () => {
    setStorage(createMemoryStorage());
    const s = createInitialState(65);
    saveGame(s);
    clearSave();
    assertEq(loadGame(), null);
  });
});
