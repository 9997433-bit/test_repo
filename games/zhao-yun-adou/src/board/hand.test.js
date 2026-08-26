import { describe, expect, it } from "vitest";
import * as handApi from "./hand.js";
import {
  HAND_LIMIT,
  addCard,
  canAddCard,
  findCardIndex,
  handSize,
  handSpace,
  insertCard,
  isHandFull,
  isPlaceableCard,
  isValidCard,
  isValidHandIndex,
  moveCard,
  peekCard,
  removeCard,
} from "./hand.js";
import { createGame } from "../core/game.js";

const dao = (level = 1) => ({ kind: "unit", id: "dao", glyph: "刀", level });
const glyph = (g) => ({ kind: "glyph", glyph: g, level: 1 });
const shovel = () => ({ kind: "shovel", glyph: "铲", level: 1 });
const token = () => ({ kind: "token", id: "shenbing", glyph: "符", level: 1 });
const hero = () => ({ kind: "hero", id: "zhaoyun", glyph: "赵云", level: 5 });

/** 开一局并把馒头拉满，免得征兵被费用闸门挡住。 */
function richGame(seed) {
  const api = createGame({ seed });
  api.start();
  const side = api.state.sides.player;
  side.mantou = 1e6;
  return { api, side };
}

const emptyCellIndex = (side) => side.cells.find((c) => c.unlocked && !c.unit).index;

describe("hand 导出面", () => {
  it("导出集合保持稳定（core 接入前不得增删签名）", () => {
    expect(Object.keys(handApi).sort()).toEqual(
      [
        "HAND_LIMIT",
        "addCard",
        "canAddCard",
        "findCardIndex",
        "handSize",
        "handSpace",
        "insertCard",
        "isHandFull",
        "isPlaceableCard",
        "isValidCard",
        "isValidHandIndex",
        "moveCard",
        "peekCard",
        "removeCard",
      ].sort(),
    );
    expect(HAND_LIMIT).toBe(5);
  });
});

describe("hand 谓词", () => {
  it("四种牌合法，武将与非对象都不是牌", () => {
    for (const card of [dao(), glyph("赵"), shovel(), token()]) {
      expect(isValidCard(card)).toBe(true);
    }
    for (const junk of [hero(), null, undefined, {}, "dao", 3, { kind: "unknown" }]) {
      expect(isValidCard(junk)).toBe(false);
    }
  });

  it("isPlaceableCard 只问「占不占格」，与「是不是手牌」无关", () => {
    expect(isPlaceableCard(dao())).toBe(true);
    expect(isPlaceableCard(glyph("云"))).toBe(true);
    expect(isPlaceableCard(hero())).toBe(true);
    expect(isPlaceableCard(shovel())).toBe(false);
    expect(isPlaceableCard(token())).toBe(false);
  });

  it("容量三件套对非数组也给安全值", () => {
    expect(handSize(null)).toBe(0);
    expect(handSpace(null)).toBe(HAND_LIMIT);
    expect(isHandFull(null)).toBe(false);
    const hand = [dao(), dao()];
    expect(handSize(hand)).toBe(2);
    expect(handSpace(hand)).toBe(3);
    expect(isHandFull(hand)).toBe(false);
  });

  it("手牌下标只认真实存在的位置", () => {
    const hand = [dao()];
    expect(isValidHandIndex(hand, 0)).toBe(true);
    for (const bad of [-1, 1, 0.5, "0", null]) expect(isValidHandIndex(hand, bad)).toBe(false);
    expect(isValidHandIndex(null, 0)).toBe(false);
  });
});

describe("hand 增删", () => {
  it("加满 HAND_LIMIT 后拒收，且不改动手牌", () => {
    const hand = [];
    for (let i = 0; i < HAND_LIMIT; i++) expect(addCard(hand, dao())).toBe(true);
    expect(canAddCard(hand, dao())).toBe(false);
    expect(addCard(hand, dao())).toBe(false);
    expect(hand).toHaveLength(HAND_LIMIT);
    expect(handSpace(hand)).toBe(0);
  });

  it("非法牌一律不入手", () => {
    const hand = [];
    for (const junk of [null, {}, hero(), "dao"]) expect(addCard(hand, junk)).toBe(false);
    expect(hand).toHaveLength(0);
  });

  it("insertCard 把越界下标夹到两端", () => {
    const hand = [dao(1), dao(2)];
    expect(insertCard(hand, -5, glyph("赵"))).toBe(true);
    expect(hand[0].kind).toBe("glyph");
    expect(insertCard(hand, 99, glyph("云"))).toBe(true);
    expect(hand[hand.length - 1].glyph).toBe("云");
  });

  it("peek 不动手牌，remove 抽走并返回那张牌", () => {
    const hand = [dao(1), glyph("赵"), token()];
    expect(peekCard(hand, 1)).toBe(hand[1]);
    expect(peekCard(hand, 9)).toBe(null);
    expect(hand).toHaveLength(3);

    const taken = hand[1];
    expect(removeCard(hand, 1)).toBe(taken);
    expect(hand).toHaveLength(2);
    expect(removeCard(hand, 9)).toBe(null);
    expect(hand).toHaveLength(2);
  });

  it("moveCard 换位，原地与越界都算没动", () => {
    const hand = [dao(1), dao(2), dao(3)];
    expect(moveCard(hand, 0, 2)).toBe(true);
    expect(hand.map((c) => c.level)).toEqual([2, 3, 1]);
    expect(moveCard(hand, 1, 1)).toBe(false);
    expect(moveCard(hand, 0, 9)).toBe(false);
    expect(hand.map((c) => c.level)).toEqual([2, 3, 1]);
  });

  it("findCardIndex 找第一张，找不到给 -1", () => {
    const hand = [dao(), shovel(), token()];
    expect(findCardIndex(hand, (c) => c.kind === "token")).toBe(2);
    expect(findCardIndex(hand, (c) => c.kind === "hero")).toBe(-1);
    expect(findCardIndex(hand, null)).toBe(-1);
  });
});

/**
 * 与 core/game.js 对拍。
 *
 * `game.js` 目前仍手写 `side.hand.push/splice`，本节逐条比对两边的判定与结果，
 * 证明改用本模块是等价替换（见 hand.js 顶部的接入清单）。
 */
describe("hand 与 core/game.js 对拍", () => {
  it("isHandFull 与 recruit 的满手闸门同拍", () => {
    const { api, side } = richGame(21);
    for (let i = 0; i < HAND_LIMIT + 3; i++) {
      const full = isHandFull(side.hand);
      const before = handSize(side.hand);
      const res = api.recruit("player");
      if (full) {
        expect(res).toEqual({ error: "hand-full" });
        expect(handSize(side.hand)).toBe(before);
      } else {
        expect(res.card).toBeTruthy();
        expect(handSize(side.hand)).toBe(before + 1);
      }
    }
    expect(handSpace(side.hand)).toBe(0);
  });

  it("recruit 掉出来的每张牌都是 isValidCard", () => {
    const { api, side } = richGame(1337);
    let seen = 0;
    for (let round = 0; round < 12; round++) {
      while (!isHandFull(side.hand)) {
        const res = api.recruit("player");
        expect(isValidCard(res.card)).toBe(true);
        seen += 1;
      }
      side.hand.length = 0;
    }
    expect(seen).toBeGreaterThanOrEqual(HAND_LIMIT * 12);
  });

  it("removeCard 在镜像数组上复现 place 的出牌效果", () => {
    const { api, side } = richGame(5);
    while (findCardIndex(side.hand, isPlaceableCard) < 0) api.recruit("player");
    const index = findCardIndex(side.hand, isPlaceableCard);
    const card = peekCard(side.hand, index);
    const mirror = side.hand.slice();

    expect(api.place("player", index, emptyCellIndex(side))).toBe(true);

    expect(removeCard(mirror, index)).toBe(card);
    expect(mirror).toEqual(side.hand);
  });

  it("isPlaceableCard 说不占格的牌，place 到空格就一定失败", () => {
    const { api, side } = richGame(9);
    side.hand = [shovel(), token()];
    const target = emptyCellIndex(side);
    for (let i = 0; i < side.hand.length; i++) {
      expect(isPlaceableCard(side.hand[i])).toBe(false);
      expect(api.place("player", i, target)).toBe(false);
    }
    expect(handSize(side.hand)).toBe(2);
  });

  it("越界手牌下标：isValidHandIndex 与 place 一起说不", () => {
    const { api, side } = richGame(77);
    side.hand = [dao()];
    const target = emptyCellIndex(side);
    for (const bad of [-1, 1, 7]) {
      expect(isValidHandIndex(side.hand, bad)).toBe(false);
      expect(api.place("player", bad, target)).toBe(false);
    }
    expect(handSize(side.hand)).toBe(1);
  });
});
