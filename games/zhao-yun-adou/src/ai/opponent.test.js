import { describe, expect, it } from "vitest";
import { seatValue, stepAi } from "./opponent.js";
import { createGame } from "../core/game.js";
import { coverageRatio } from "../combat/geometry.js";

const STEP = 0.3; // 大于 STEP_INTERVAL(0.28)，一次调用必定出手

/** 只留指定几格可用，其余锁死清空：把 AI 逼到我们想观察的那个选择上。 */
function stage(seed, unlocked, hand = [], mantou = 0) {
  const g = createGame({ seed });
  g.start();
  const side = g.state.sides.ai;
  for (const cell of side.cells) {
    cell.unlocked = unlocked.includes(cell.index);
    cell.unit = null;
  }
  side.hand = hand;
  side.mantou = mantou;
  side.enemies = [];
  side.spawnQueue = [];
  side._acc = 0;
  return { g, side };
}

const unitCard = (id, glyph) => ({ kind: "unit", id, glyph, level: 1 });

describe("seatValue（覆盖窗口换算的座位价值）", () => {
  it("是 0~1 的归一化分数，罩得越多分越高", () => {
    for (let i = 0; i < 20; i++) {
      for (const range of [1, 2, 3]) {
        const v = seatValue(i, range);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
    // 射程越远，同一格罩住的路只多不少。
    for (let i = 0; i < 20; i++) {
      expect(seatValue(i, 2)).toBeGreaterThanOrEqual(seatValue(i, 1) - 1e-9);
      expect(seatValue(i, 3)).toBeGreaterThanOrEqual(seatValue(i, 2) - 1e-9);
    }
  });

  it("能把 cellDistToPath 一视同仁的格子区分开", () => {
    // 5 / 9 / 19 在旧的 cellDistToPath 里同为 0，实际覆盖天差地别。
    expect(seatValue(5, 1)).toBeGreaterThan(seatValue(19, 1) * 2);
    expect(coverageRatio(5, 1)).toBeGreaterThan(coverageRatio(19, 1));
  });

  it("守终点的格子比只守开头的格子更值钱", () => {
    // 15 罩住的路比 1 还短，但那是阿斗跟前最后一道拦截，权重更高。
    expect(coverageRatio(15, 1)).toBeLessThan(coverageRatio(1, 1));
    expect(seatValue(15, 1)).toBeGreaterThan(seatValue(1, 1));
  });
});

describe("stepAi 布阵", () => {
  it("保持 (api, dt) 签名与 0.28s 节流", () => {
    const { g, side } = stage(7, [11, 12], [unitCard("dao", "刀")]);
    stepAi(g, 0.1);
    expect(side.cells.every((c) => !c.unit)).toBe(true);
    stepAi(g, 0.1);
    stepAi(g, 0.1);
    expect(side.cells.some((c) => c.unit)).toBe(true);
  });

  it("把兵放在覆盖更好的格子上，而不是死角", () => {
    const good = 12;
    const dead = 19;
    expect(seatValue(good, 2)).toBeGreaterThan(seatValue(dead, 2));
    const { g, side } = stage(11, [good, dead], [unitCard("gong", "弓")]);
    stepAi(g, STEP);
    expect(side.cells[good].unit?.id).toBe("gong");
    expect(side.cells[dead].unit).toBeNull();
  });

  it("沉睡的姓名残卷被寄存到最不值钱的格子", () => {
    const good = 11;
    const dead = 19;
    // 手牌堆到寄存阈值，且棋盘上没有可强化的兵：这一步只剩「把残卷放哪」。
    const token = { kind: "token", id: "shenbing", glyph: "符", level: 1 };
    const hand = [token, token, token, { kind: "glyph", glyph: "赵", level: 1 }];
    const { g, side } = stage(13, [good, dead], hand);
    stepAi(g, STEP);
    expect(side.cells[dead].unit?.kind).toBe("glyph");
    expect(side.cells[good].unit).toBeNull();
  });

  it("铲子开在能架起火力的锁格上", () => {
    // 候选锁格都只贴着一格已开垦地，差别只在覆盖：12 罩满全程，19 是死角。
    const { g, side } = stage(17, [11, 14], [{ kind: "shovel", glyph: "铲", level: 1 }]);
    stepAi(g, STEP);
    const opened = side.cells.filter((c) => c.unlocked).map((c) => c.index);
    expect(opened).toContain(12);
    expect(opened).not.toContain(19);
    expect(opened).not.toContain(9);
  });

  it("把兵从死角挪进更好的空位，且不会来回蹦", () => {
    const { g, side } = stage(19, [12, 19]);
    side.cells[19].unit = unitCard("gong", "弓");
    stepAi(g, STEP);
    expect(side.cells[12].unit?.id).toBe("gong");
    expect(side.cells[19].unit).toBeNull();
    // 换过去之后不该再换回来。
    stepAi(g, STEP);
    stepAi(g, STEP);
    expect(side.cells[12].unit?.id).toBe("gong");
  });
});
