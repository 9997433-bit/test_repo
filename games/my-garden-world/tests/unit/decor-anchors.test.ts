import { beforeEach, describe, expect, it } from "vitest";
import { DECORATIONS } from "../../src/data/decorations";
import { onGameEvent, type GameEvent } from "../../src/engine/events";
import { loadState, resetSaveScheduler, saveState } from "../../src/engine/save";
import { createInitialState, type GameState } from "../../src/engine/state";
import { anchorSlot, placedSlot, decorSlot } from "../../src/scene/decor-art";
import {
  ANCHOR_IDS,
  ANCHOR_NAMES,
  anchorOf,
  decorAt,
  freeAnchors,
  placeAt,
  placeDecor,
  preferredAnchor,
  removeDecor,
  resolveAnchors,
  resolvePlacedDecor,
  stowDecor,
} from "../../src/systems/decorate";

function rich(): GameState {
  const state = createInitialState(1_000);
  state.level = 20;
  state.fragments = 1_000;
  state.coins = 10_000;
  return state;
}

function toasts(run: () => void): string[] {
  const seen: string[] = [];
  const off = onGameEvent((e: GameEvent) => {
    if (e.type === "toast") seen.push(e.text);
  });
  run();
  off();
  return seen;
}

beforeEach(() => {
  resetSaveScheduler();
  localStorage.clear();
});

describe("陈设锚位：八个位置的落座与补位", () => {
  it("八个锚位各有名字、各有一处舞台落点，互不重叠", () => {
    expect(ANCHOR_IDS).toHaveLength(8);
    expect(new Set(ANCHOR_IDS).size).toBe(8);
    const spots = new Set<string>();
    for (const anchor of ANCHOR_IDS) {
      const slot = anchorSlot(anchor);
      expect(ANCHOR_NAMES[anchor]).toBeTruthy();
      expect(slot.x).toBeGreaterThanOrEqual(0);
      expect(slot.x).toBeLessThanOrEqual(100);
      expect(slot.y).toBeGreaterThanOrEqual(0);
      expect(slot.y).toBeLessThanOrEqual(100);
      spots.add(`${slot.x},${slot.y}`);
    }
    expect(spots.size).toBe(8);
  });

  it("旧存档没有落位表也照样入园：按偏好锚位自动落座，同位相争者顺位补空", () => {
    const state = rich();
    state.placedDecor = ["lantern", "chimes", "pond"];

    expect(state.decorAnchors).toBeUndefined();
    expect(resolveAnchors(state)).toEqual([
      { id: "lantern", anchor: "eave" },
      // 风铃也偏爱檐下，被纱灯占了就顺位补第一个空位
      { id: "chimes", anchor: "gate" },
      { id: "pond", anchor: "pondside" },
    ]);
    expect(preferredAnchor("chimes")).toBe("eave");
    expect(decorAt(state, "eave")).toBe("lantern");
    expect(freeAnchors(state)).toHaveLength(5);
  });

  it("超过八件的部分收进匣中，锚位空出后可再入园", () => {
    const state = rich();
    state.placedDecor = DECORATIONS.map((d) => d.id);
    expect(state.placedDecor.length).toBeGreaterThan(ANCHOR_IDS.length);

    const placed = resolveAnchors(state);
    const inGarden = placed.filter((p) => p.anchor !== null);
    const boxed = placed.filter((p) => p.anchor === null);
    expect(inGarden).toHaveLength(8);
    expect(new Set(inGarden.map((p) => p.anchor)).size).toBe(8);
    expect(boxed).toHaveLength(DECORATIONS.length - 8);
    expect(freeAnchors(state)).toEqual([]);

    const boxedId = boxed[0]!.id;
    const seatId = decorAt(state, "heart")!;
    stowDecor(state, seatId);
    expect(placeAt(state, boxedId, "heart")).toBe(true);
    expect(anchorOf(state, boxedId)).toBe("heart");
    expect(anchorOf(state, seatId)).toBeNull();
  });

  it("点空锚位是安置，点占位锚位是对调；换下在匣者不退货", () => {
    const state = rich();
    state.placedDecor = ["lantern", "pond"];

    const moved = toasts(() => expect(placeAt(state, "lantern", "heart")).toBe(true));
    expect(anchorOf(state, "lantern")).toBe("heart");
    expect(moved).toEqual(["纱灯安在园心"]);
    // 挪一件不会连累别人：锦鲤池仍在池畔
    expect(anchorOf(state, "pond")).toBe("pondside");

    const swapped = toasts(() => expect(placeAt(state, "pond", "heart")).toBe(true));
    expect(anchorOf(state, "pond")).toBe("heart");
    expect(anchorOf(state, "lantern")).toBe("pondside");
    expect(swapped).toEqual(["锦鲤池与纱灯换了位置"]);

    stowDecor(state, "lantern");
    expect(anchorOf(state, "lantern")).toBeNull();
    const replaced = toasts(() => expect(placeAt(state, "lantern", "heart")).toBe(true));
    expect(replaced).toEqual(["换下锦鲤池，收回匣中"]);
    expect(anchorOf(state, "pond")).toBeNull();
    // 换下不等于卖出：仍在自己名下
    expect(state.placedDecor).toContain("pond");
  });

  it("挡掉无效摆放：不认得的锚位、没买的陈设、原地不动", () => {
    const state = rich();
    state.placedDecor = ["lantern"];

    expect(placeAt(state, "pond", "heart")).toBe(false);
    expect(placeAt(state, "lantern", "nowhere" as never)).toBe(false);
    expect(placeAt(state, "lantern", "eave")).toBe(false);
    expect(anchorOf(state, "lantern")).toBe("eave");
    expect(stowDecor(state, "lantern")).toBe(true);
    expect(stowDecor(state, "lantern")).toBe(false);
  });

  it("购置即落座，锚位满了则先收进匣中；撤走陈设也撤掉落位记录", () => {
    const state = rich();
    const bought = toasts(() => expect(placeDecor(state, "lantern")).toBe(true));
    expect(bought).toEqual(["纱灯安在檐下"]);
    expect(anchorOf(state, "lantern")).toBe("eave");

    const again = toasts(() => expect(placeDecor(state, "lantern")).toBe(false));
    expect(again).toEqual(["匣中已有此物"]);

    state.placedDecor = DECORATIONS.filter((d) => d.id !== "moongate").map((d) => d.id);
    const full = toasts(() => expect(placeDecor(state, "moongate")).toBe(true));
    expect(full).toEqual(["园中锚位已满，月洞门先收进匣中"]);
    expect(anchorOf(state, "moongate")).toBeNull();

    placeAt(state, "lantern", "heart");
    expect(state.decorAnchors?.lantern).toBe("heart");
    removeDecor(state, "lantern");
    expect(state.decorAnchors?.lantern).toBeUndefined();
    expect(anchorOf(state, "lantern")).toBeNull();
  });

  it("落位随存档一起过夜", () => {
    const state = rich();
    state.placedDecor = ["lantern", "pond"];
    placeAt(state, "lantern", "corner-south");
    stowDecor(state, "pond");

    expect(saveState(state)).toBe(true);
    const loaded = loadState();
    expect(anchorOf(loaded, "lantern")).toBe("corner-south");
    expect(anchorOf(loaded, "pond")).toBeNull();
    expect(loaded.placedDecor).toEqual(["lantern", "pond"]);
  });

  it("落位表被改坏也不塌：认不得的值退回自动落座", () => {
    const state = rich();
    state.placedDecor = ["lantern", "pond"];
    state.decorAnchors = { lantern: "moon-crater" as never, pond: "heart" };

    expect(resolveAnchors(state)).toEqual([
      { id: "lantern", anchor: "eave" },
      { id: "pond", anchor: "heart" },
    ]);
  });

  it("落位给出画面所需的整套信息：位置来自锚位，尺寸来自陈设", () => {
    const state = rich();
    state.placedDecor = ["pavilion"];
    placeAt(state, "pavilion", "gate");

    const [item] = resolvePlacedDecor(state);
    expect(item).toMatchObject({ id: "pavilion", anchor: "gate", label: "亭 半亭", known: true });
    expect(placedSlot("pavilion", "gate")).toEqual({
      ...anchorSlot("gate"),
      w: decorSlot("pavilion").w,
    });
  });
});
