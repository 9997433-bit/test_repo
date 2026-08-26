import { describe, expect, it } from "vitest";
import { createGame } from "../core/game.js";
import { waveSpec } from "../data/waves.js";
import {
  enemySeqOf,
  enqueueWave,
  resetEnemySeq,
  sendPressure,
  spawnEnemy,
  tickSideCombat,
} from "./sim.js";
import { collect, makeEnemy, makeSide } from "./testkit.js";

const SPEC = waveSpec(1);
const idsOf = (side) => side.enemies.map((e) => e.id);

/** 同一段脚本跑两遍应当逐字节相同 —— 这是「严格回放」的最小单元。 */
function runLane(steps = 12, dt = 0.5) {
  const side = makeSide();
  enqueueWave(side, 1);
  for (let i = 0; i < steps; i++) tickSideCombat(side, dt, collect());
  return side;
}

describe("enemy numbering lives in side state", () => {
  it("starts every side at 1 and keeps the pointer on the side", () => {
    const side = makeSide();
    expect(enemySeqOf(side)).toBe(1);
    for (let i = 0; i < 3; i++) spawnEnemy(side, SPEC, false);
    expect(idsOf(side)).toEqual([1, 2, 3]);
    expect(side.enemySeq).toBe(4);
    expect(enemySeqOf(side)).toBe(4);
  });

  it("does not write the field before the first spawn", () => {
    // core/game.js 的 createSide() 不归战斗层改，tests/state.test.js 又对刚开局的
    // side 键序列做了快照断言：排波不能顺手加字段。
    const side = makeSide();
    enqueueWave(side, 1);
    expect(Object.prototype.hasOwnProperty.call(side, "enemySeq")).toBe(false);
  });

  it("hands out the same ids when the same script runs twice", () => {
    const first = runLane();
    const second = runLane();
    expect(idsOf(first).length).toBeGreaterThan(1);
    expect(idsOf(first)).toEqual(idsOf(second));
    expect(first.enemySeq).toBe(second.enemySeq);
  });

  it("resumes numbering across a JSON round-trip without repeating an id", () => {
    const side = runLane(4);
    const before = idsOf(side);
    expect(before.length).toBeGreaterThan(0);

    const revived = JSON.parse(JSON.stringify(side));
    tickSideCombat(revived, 3, collect());
    const after = idsOf(revived);

    expect(after.slice(0, before.length)).toEqual(before);
    expect(after.length).toBeGreaterThan(before.length);
    expect(new Set(after).size).toBe(after.length);
    expect(Math.min(...after.slice(before.length))).toBeGreaterThan(Math.max(...before));
  });

  it("resumes above the highest live id when a snapshot predates the counter", () => {
    const legacy = makeSide();
    legacy.enemies.push(makeEnemy({ id: 7 }), makeEnemy({ id: 3 }));
    expect(legacy.enemySeq).toBeUndefined();
    expect(enemySeqOf(legacy)).toBe(8);
    spawnEnemy(legacy, SPEC, false);
    expect(legacy.enemies.at(-1).id).toBe(8);
  });

  it("numbers the two lanes independently", () => {
    const player = makeSide("player");
    const ai = makeSide("ai");
    spawnEnemy(player, SPEC, false);
    spawnEnemy(ai, SPEC, false);
    // 编号只在本侧内唯一；事件里一律带 side 字段，跨线不会混淆。
    expect(player.enemies[0].id).toBe(1);
    expect(ai.enemies[0].id).toBe(1);
  });

  it("draws pressure reinforcements from the receiving side's counter", () => {
    const a = makeSide("player");
    const b = makeSide("ai");
    spawnEnemy(b, SPEC, false);
    sendPressure(a, b);
    tickSideCombat(b, 0.6, collect());
    expect(b.enemies.at(-1)).toMatchObject({ id: 2, pressure: true });
    expect(a.enemySeq).toBeUndefined();
  });

  it("never burns an id on a spawn the cap refused", () => {
    const side = makeSide();
    for (let i = 0; i < 200; i++) spawnEnemy(side, SPEC, false);
    expect(side.enemies).toHaveLength(120);
    expect(enemySeqOf(side)).toBe(121);
  });

  it("can be rewound explicitly, and rejects nonsense pointers", () => {
    const side = makeSide();
    spawnEnemy(side, SPEC, false);
    resetEnemySeq(side, 100);
    spawnEnemy(side, SPEC, false);
    expect(idsOf(side)).toEqual([1, 100]);
    expect(resetEnemySeq(side, 0)).toBe(1);
    expect(resetEnemySeq(side, 2.5)).toBe(1);
  });
});

describe("whole-match replay", () => {
  const SEED = 424242;
  const STEP = 1 / 60;

  const play = (steps, game) => {
    const g = game || createGame({ seed: SEED, fixedStep: STEP });
    if (!game) g.start();
    for (let i = 0; i < steps; i++) g.tick(STEP);
    return g;
  };

  it("produces identical snapshots for two runs of the same seed", () => {
    const first = play(600).serialize({ rng: true });
    const second = play(600).serialize({ rng: true });

    expect(first.sides.player.enemies.length).toBeGreaterThan(2);
    expect(first.sides.player.enemySeq).toBeGreaterThan(1);
    expect(first).toEqual(second);
  });

  it("continues a loaded snapshot exactly where the live match would have gone", () => {
    const live = play(300);
    const snapshot = live.serialize({ rng: true });
    play(300, live);

    const resumed = createGame({ seed: 1, fixedStep: STEP });
    expect(resumed.load(snapshot)).toBe(true);
    play(300, resumed);

    expect(resumed.state.sides.player.enemies).toEqual(live.state.sides.player.enemies);
    expect(resumed.state.sides.ai.enemies).toEqual(live.state.sides.ai.enemies);
    expect(resumed.state.sides.player.enemySeq).toBe(live.state.sides.player.enemySeq);
  });
});
