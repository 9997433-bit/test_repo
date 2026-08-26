import { describe, expect, it } from "vitest";
import { ANCHORS, DECORATIONS } from "../../src/data/decorations";
import { migrate } from "../../src/engine/save";
import { createInitialState } from "../../src/engine/state";
import { ANCHOR_SLOTS, placedSlot, decorSlot } from "../../src/scene/decor-art";
import {
  anchorOccupant,
  applyTheme,
  autoPlace,
  firstFreeAnchor,
  placeAt,
  placeDecor,
  removeDecor,
  unplace,
} from "../../src/systems/decorate";

describe("anchor data & slots", () => {
  it("has exactly eight uniquely named anchors, each with stage coordinates", () => {
    expect(ANCHORS).toHaveLength(8);
    expect(new Set(ANCHORS.map((a) => a.id)).size).toBe(8);
    for (const a of ANCHORS) {
      const slot = ANCHOR_SLOTS[a.id];
      expect(slot).toBeDefined();
      expect(slot!.x).toBeGreaterThanOrEqual(0);
      expect(slot!.x).toBeLessThanOrEqual(100);
    }
  });

  it("placedSlot takes position from the anchor but width from the decor", () => {
    const slot = placedSlot("pond", "heart");
    expect(slot.x).toBe(ANCHOR_SLOTS.heart!.x);
    expect(slot.y).toBe(ANCHOR_SLOTS.heart!.y);
    expect(slot.w).toBe(decorSlot("pond").w);
    // 无锚 / 未知锚回退固定摆位
    expect(placedSlot("pond", null)).toEqual(decorSlot("pond"));
    expect(placedSlot("pond", "no-such-anchor")).toEqual(decorSlot("pond"));
  });
});

describe("placement operations", () => {
  it("auto-places purchases on the first free anchor and boxes overflow", () => {
    const state = createInitialState(0);
    state.level = 99;
    state.coins = 99_999;
    state.fragments = 0;
    for (const d of DECORATIONS) placeDecor(state, d.id);
    // 8 锚位满座，其余入匣
    expect(Object.keys(state.decorAnchors)).toHaveLength(8);
    expect(state.placedDecor).toHaveLength(DECORATIONS.length);
    expect(firstFreeAnchor(state)).toBeNull();
    const anchors = Object.values(state.decorAnchors);
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it("placeAt displaces the previous occupant back into the box", () => {
    const state = createInitialState(0);
    state.placedDecor = ["lantern", "chimes"];
    autoPlace(state, "lantern"); // 檐下
    autoPlace(state, "chimes"); // 门前

    const res = placeAt(state, "chimes", "eaves");
    expect(res).toEqual({ ok: true, displaced: "lantern" });
    expect(state.decorAnchors.chimes).toBe("eaves");
    expect(state.decorAnchors.lantern).toBeUndefined();
    expect(anchorOccupant(state, "eaves")).toBe("chimes");
    expect(anchorOccupant(state, "gate")).toBeNull();

    // 未购 / 未知锚一律拒绝
    expect(placeAt(state, "pond", "gate").ok).toBe(false);
    expect(placeAt(state, "chimes", "nowhere").ok).toBe(false);
  });

  it("unplace and removeDecor both clear the anchor", () => {
    const state = createInitialState(0);
    state.placedDecor = ["lantern"];
    autoPlace(state, "lantern");
    unplace(state, "lantern");
    expect(state.decorAnchors.lantern).toBeUndefined();
    expect(state.placedDecor).toContain("lantern");

    autoPlace(state, "lantern");
    removeDecor(state, "lantern");
    expect(state.placedDecor).not.toContain("lantern");
    expect(state.decorAnchors.lantern).toBeUndefined();
  });

  it("applyTheme records the theme and evicts the lowest-mood outsider when full", () => {
    const state = createInitialState(0);
    state.level = 99;
    state.coins = 99_999;
    state.fragments = 0;
    // 先摆满 8 件非墨雅陈设
    for (const id of ["lantern", "chimes", "swing", "scarecrow", "pond", "snowlion", "brazier", "bridge"]) {
      placeDecor(state, id);
    }
    expect(firstFreeAnchor(state)).toBeNull();

    applyTheme(state, "ink"); // 半亭 / 月洞门 / 青石径 / 花鸟屏风
    expect(state.decorTheme).toBe("ink");
    for (const id of ["pavilion", "moongate", "path", "screen"]) {
      expect(state.placedDecor).toContain(id);
      expect(state.decorAnchors[id]).toBeDefined();
    }
    // 被换下的是雅致最低的非主题件（纱灯 mood2 / 风铃 mood2 / 秋千 mood3 / 稻草翁 mood3）
    expect(state.decorAnchors.lantern).toBeUndefined();
    expect(state.decorAnchors.chimes).toBeUndefined();
    expect(state.placedDecor).toContain("lantern");
  });
});

describe("save migration (schema v3 anchors)", () => {
  it("assigns default anchors to v2 saves so purchases stay visible", () => {
    const migrated = migrate({
      schemaVersion: 2,
      placedDecor: ["pond", "lantern", "legacy-statue"],
    });
    expect(migrated.decorAnchors.pond).toBe("eaves");
    expect(migrated.decorAnchors.lantern).toBe("gate");
    // 老档里的未知 id 不占锚位（无图可入景）
    expect(migrated.decorAnchors["legacy-statue"]).toBeUndefined();
    expect(migrated.social).toEqual({ day: 0, friendship: {}, marks: [] });
    expect(migrated.decorTheme).toBeNull();
    expect(migrated.seenTips).toEqual([]);
  });

  it("drops unknown anchors, unowned decor and duplicate seats, then backfills", () => {
    const migrated = migrate({
      schemaVersion: 3,
      placedDecor: ["pond", "lantern", "chimes"],
      decorAnchors: {
        pond: "pond-side",
        lantern: "no-such-anchor",
        chimes: "pond-side", // 撞锚，后到者出局
        bridge: "gate", // 未购
      },
    });
    expect(migrated.decorAnchors.pond).toBe("pond-side");
    expect(migrated.decorAnchors.bridge).toBeUndefined();
    // 被清掉的两件按锚位序补默认落座
    expect(migrated.decorAnchors.lantern).toBe("eaves");
    expect(migrated.decorAnchors.chimes).toBe("gate");
  });

  it("sanitizes social state and one-time tips", () => {
    const migrated = migrate({
      schemaVersion: 3,
      social: {
        day: 3.7,
        friendship: { "a-zi": 7, "BAD ID": 5, "tea-keeper": -2 },
        marks: [{ n: "a-zi", p: 1, k: "water" }, { n: "a-zi", p: 2, k: "steal" }, "garbage"],
      },
      decorTheme: "ink",
      seenTips: ["sound", 42],
    });
    expect(migrated.social.day).toBe(3);
    expect(migrated.social.friendship).toEqual({ "a-zi": 7, "tea-keeper": 0 });
    expect(migrated.social.marks).toEqual([{ n: "a-zi", p: 1, k: "water" }]);
    expect(migrated.decorTheme).toBe("ink");
    expect(migrated.seenTips).toEqual(["sound"]);
  });
});
