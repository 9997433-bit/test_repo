import { describe, expect, it } from "vitest";
import { classifyDrop } from "./merge.js";
import { createGame } from "../core/game.js";

const dao = (level = 1) => ({ kind: "unit", id: "dao", glyph: "刀", level });
const gong = (level = 1) => ({ kind: "unit", id: "gong", glyph: "弓", level });
const glyph = (g) => ({ kind: "glyph", glyph: g, level: 1 });
const shovel = () => ({ kind: "shovel", glyph: "铲", level: 1 });
const token = () => ({ kind: "token", id: "shenbing", glyph: "符", level: 1 });
const hero = () => ({ kind: "hero", id: "zhaoyun", glyph: "赵云", level: 5, cooldown: 0, atkBonus: 0 });

/** 「赵」「飞」凑不成任何武将，摆一起也不会当场觉醒，正好用来试换位。 */
const LONE_A = glyph("赵");
const LONE_B = glyph("飞");

/** 两侧共用的落子矩阵：source / target 组合覆盖判定树的每条分支。 */
const CASES = [
  ["空手", null, dao(), "invalid", "empty-source"],
  ["铲子", shovel(), dao(), "invalid", "shovel-needs-locked-cell"],
  ["神兵符落空格", token(), null, "invalid", "token-needs-target"],
  ["神兵符喂兵", token(), dao(2), "token", "shenbing"],
  ["神兵符喂满级兵", token(), dao(5), "invalid", "token-target-not-upgradable"],
  ["神兵符喂单字", token(), glyph("赵"), "invalid", "token-target-not-upgradable"],
  ["同兵同级", dao(1), dao(1), "merge", "same-id-same-level"],
  ["落空格", dao(1), null, "place", "empty-cell"],
  ["同兵不同级", dao(1), dao(2), "swap", "level-mismatch"],
  ["同兵满级", dao(5), dao(5), "swap", "max-level"],
  ["异兵", dao(1), gong(1), "swap", "different-piece"],
  ["单字挪位", LONE_A, LONE_B, "swap", "different-piece"],
  ["兵压武将", dao(1), hero(), "swap", "different-piece"],
  ["认不出的来源", { kind: "什么" }, dao(1), "invalid", "unknown-kind"],
  ["目标是道具", dao(1), shovel(), "invalid", "target-is-card"],
];

describe("classifyDrop", () => {
  it.each(CASES)("%s → %s", (_name, source, target, action, reason) => {
    expect(classifyDrop(source, target)).toEqual({ action, reason });
  });

  it("缺省与显式 board 来源逐字一致（旧调用方不受影响）", () => {
    for (const [, source, target] of CASES) {
      const base = classifyDrop(source, target);
      expect(classifyDrop(source, target, {})).toEqual(base);
      expect(classifyDrop(source, target, undefined)).toEqual(base);
      expect(classifyDrop(source, target, { from: "board" })).toEqual(base);
      expect(classifyDrop(source, target, { from: "胡写" })).toEqual(base);
    }
  });

  it("手牌来源只在「本该换位」处改判，其余分支照旧", () => {
    for (const [, source, target] of CASES) {
      const board = classifyDrop(source, target);
      const hand = classifyDrop(source, target, { from: "hand" });
      if (board.action === "swap") {
        expect(hand).toEqual({ action: "invalid", reason: "hand-card-needs-empty-or-merge" });
      } else {
        expect(hand).toEqual(board);
      }
    }
  });
});

function freshGame(seed) {
  const api = createGame({ seed });
  api.start();
  const side = api.state.sides.player;
  for (const cell of side.cells) cell.unit = null;
  return { api, side };
}

const clone = (v) => (v == null ? null : { ...v });

const KNOWN_KINDS = ["unit", "glyph", "hero", "shovel", "token"];
/** 真实牌局里出得来的棋子；`rollRecruit` 只造这五类。 */
const isRealPiece = (p) => p == null || KNOWN_KINDS.includes(p.kind);

/**
 * 与 core/game.js 对拍。
 *
 * `place`（手牌 → 棋格）与 `merge`（棋格 → 棋格）各自手写了同一棵判定树。
 * 这里让 classifyDrop 先预言，再看引擎实际怎么做，证明改读 action 是等价替换。
 */
describe("classifyDrop 与 core/game.js 对拍", () => {
  it.each(CASES)("merge()：%s", (_name, source, target) => {
    // 棋盘上永远不会摆着神兵符：那条分支引擎另有处置，不在对拍范围。
    if (source?.kind === "token" || target?.kind === "token") return;
    if (source?.kind === "shovel" || target?.kind === "shovel") return;
    // 认不出来的棋子两边不同调，单独一条用例记账。
    if (!isRealPiece(source) || !isRealPiece(target)) return;

    const { api, side } = freshGame(101);
    const from = side.cells[6];
    const to = side.cells[7];
    from.unit = clone(source);
    to.unit = clone(target);
    const before = { from: clone(from.unit), to: clone(to.unit) };

    const { action } = classifyDrop(from.unit, to.unit);
    const ok = api.merge("player", from.index, to.index);

    expect(ok).toBe(action !== "invalid");
    if (action === "invalid") {
      expect(from.unit).toEqual(before.from);
      expect(to.unit).toEqual(before.to);
    } else if (action === "merge") {
      expect(from.unit).toBe(null);
      expect(to.unit.level).toBe(before.to.level + 1);
    } else if (action === "place") {
      expect(from.unit).toBe(null);
      expect(to.unit).toEqual(before.from);
    } else if (action === "swap") {
      expect(from.unit).toEqual(before.to);
      expect(to.unit).toEqual(before.from);
    }
  });

  it.each(CASES)("place()：%s", (_name, source, target) => {
    // 武将不是手牌，铲子走 useShovel，都不经 place。
    if (source == null || source.kind === "hero" || source.kind === "shovel") return;
    if (!isRealPiece(source) || !isRealPiece(target)) return;

    const { api, side } = freshGame(202);
    const cell = side.cells[7];
    cell.unit = clone(target);
    side.hand = [clone(source)];
    const before = clone(cell.unit);

    const { action } = classifyDrop(side.hand[0], cell.unit, { from: "hand" });
    const ok = api.place("player", 0, cell.index);

    expect(ok).toBe(action !== "invalid");
    if (action === "invalid") {
      expect(cell.unit).toEqual(before);
      expect(side.hand).toHaveLength(1);
      return;
    }
    expect(side.hand).toHaveLength(0);
    if (action === "merge") expect(cell.unit.level).toBe(before.level + 1);
    else if (action === "token") expect(cell.unit.level).toBe(before.level + 1);
    else if (action === "place") expect(cell.unit).toMatchObject({ kind: source.kind });
  });

  /**
   * 唯一的不同调：`kind` 认不出来的怪棋子，classifyDrop 一律拒收，而引擎照单全收
   * （`place` 直接落格、`merge` 直接换位）。真实牌局造不出这种牌，所以现状无害；
   * 这条用例把差异钉住 —— 接入 classifyDrop 就是把它收紧，届时改这里即可。
   */
  it("怪棋子：classifyDrop 比 game 严（接入即收紧）", () => {
    const junk = { kind: "什么", glyph: "?" };

    const placing = freshGame(303);
    placing.side.hand = [{ ...junk }];
    const cell = placing.side.cells[7];
    expect(classifyDrop(placing.side.hand[0], null, { from: "hand" })).toEqual({
      action: "invalid",
      reason: "unknown-kind",
    });
    expect(placing.api.place("player", 0, cell.index)).toBe(true);
    expect(cell.unit).toMatchObject({ kind: "什么" });

    const merging = freshGame(404);
    const from = merging.side.cells[6];
    const to = merging.side.cells[7];
    from.unit = { ...junk };
    to.unit = dao(1);
    expect(classifyDrop(from.unit, to.unit).action).toBe("invalid");
    expect(merging.api.merge("player", from.index, to.index)).toBe(true);
    expect(to.unit).toMatchObject({ kind: "什么" });
  });
});
